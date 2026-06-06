/**
 * tuckerspice-tracker — Cloudflare Worker  (single source = GitHub Issues)
 * (renamed from hone-buglord — Issue #50, back-office rebrand to Tucker & Spice)
 *
 * Endpoints:
 *   GET  /bugs                — all `bug` issues → BUGS array JSON
 *   POST /update              — write-key gated; persists st/sev/who to the
 *                               GitHub issue itself (state + labels)
 *   POST /issue               — write-key gated; creates a new GitHub issue
 *   GET  /issue/:n            — issue detail + comment thread
 *   POST /issue/:n/comment    — write-key gated; add a dated comment
 *   GET  /build               — latest EAS build number (GitHub Actions API)
 *   GET  /                    — health check
 *
 * Single source of truth = GitHub Issues. Status / severity / who are encoded
 * on the issue itself, so reads are strongly read-after-write consistent — no
 * KV, no client overlay, no revert-on-refresh.
 *   st  : closed → done | label st:<x> (fixing/check/call/later)
 *         | legacy fix-attempted→check / being-fixed→fixing | else open
 *   sev : label sev:<X> | else parsed from the issue body
 *   who : label who:<X> | else assignee | else Patrick
 *
 * Secrets (wrangler secret put):
 *   GITHUB_TOKEN   fine-grained, Issues read AND write
 *   WRITE_KEY      any string Patrick chooses; dashboard sends in X-Write-Key
 */

export interface Env {
  GITHUB_TOKEN: string;
  WRITE_KEY: string;
  /** owner/repo this tracker reads/writes — set in wrangler.toml [vars] so the
   *  repo rename is a one-line flip with no code change. */
  REPO?: string;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface GHLabel { name: string }
interface GHMilestone { number: number; title: string; due_on: string | null; state: string; open_issues?: number; closed_issues?: number }
interface GHIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: GHLabel[];
  assignees: { login: string }[];
  milestone?: GHMilestone | null;
  updated_at?: string;
  html_url?: string;
}
interface GHComment { user?: { login: string }; created_at: string; body: string | null }
// epic = big Goal (from `epic:` label); ms = sprint title + due date (GitHub Milestone)
interface HoneBug { id: string; sev: string; t: string; d: string; who: string; build: string; st: string; num?: number; upd?: string; epic?: string; ms?: string; msNum?: number; msDue?: string | null }

// Cache-busted GitHub fetch. GitHub returns Cache-Control: max-age=60, which
// Cloudflare honours on subrequests — so a plain re-fetch can be up to 60s
// stale. A unique `_` param (GitHub ignores it) + cf.cacheTtl:0 forces a live
// read every time. This is the HONE-021 item-1 freshness fix.
function ghFetch(rawUrl: string, env: Env, init: RequestInit = {}): Promise<Response> {
  const sep = rawUrl.includes('?') ? '&' : '?';
  const url = `${rawUrl}${sep}_=${Date.now()}`;
  return fetch(url, {
    ...init,
    cf: { cacheTtl: 0, cacheEverything: false },
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'HoneBugLord/1.0',
      ...(init.headers ?? {}),
    },
  } as RequestInit);
}

// ── CORS ──────────────────────────────────────────────────────────────────────

const ORIGIN = 'https://patrickpatches.github.io';
const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Write-Key',
};

function json(data: unknown, status = 200, extra: Record<string,string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', ...extra },
  });
}

// ── Parsers ───────────────────────────────────────────────────────────────────

function section(body: string, heading: string): string {
  const re = new RegExp(
    '###\\s+' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\n([\\s\\S]*?)(?=\\n###|$)',
    'i',
  );
  return body.match(re)?.[1]?.trim() ?? '';
}

function parseSeverity(body: string, title = ''): string {
  const p = (n: string) =>
    n === '0' ? 'Show-stopper' : n === '1' ? 'Serious' : n === '2' ? 'Annoying' : 'Tidy-up';
  const raw = section(body, 'How bad is it?');
  if (raw.startsWith('P0')) return 'Show-stopper';
  if (raw.startsWith('P1')) return 'Serious';
  if (raw.startsWith('P2')) return 'Annoying';
  if (raw.startsWith('P3')) return 'Tidy-up';
  const sm = body.match(/SEVERITY\s*:\s*P([0-3])/i);
  if (sm) return p(sm[1]);
  const tm = (title + ' ' + body).match(/\[P([0-3])\]/i);
  if (tm) return p(tm[1]);
  return 'Tidy-up';
}

function parseBuild(body: string): string {
  const raw = section(body, 'Build number');
  if (!raw || raw === "I don't know" || raw === '_No response_') return '?';
  return raw.startsWith('#') ? raw : `#${raw}`;
}

function parseActual(body: string): string {
  return section(body, 'What actually happened?').split('\n').find(l => l.trim()) ?? '';
}

function cleanTitle(title: string): string {
  return title.replace(/^\[BUG\]\s*/i, '').replace(/^HONE-\d+\s*[-–:]\s*/i, '').trim();
}

// GitHub Issues are the single source of truth (HONE-025). Status / severity /
// who are persisted as the issue's state + labels, so reads are strongly
// read-after-write consistent (no KV lag, no client overlay):
//   st   : closed → done | label st:<x> | legacy fix-attempted→check /
//          being-fixed→fixing | else open
//   sev  : label sev:<X> | else parsed from the issue body | else Tidy-up
//   who  : label who:<X> | else first assignee | else Patrick
function issueToHoneBug(issue: GHIssue): HoneBug {
  const body = issue.body ?? '';
  const labels = issue.labels.map(l => l.name);
  const stLabel = labels.find(n => n.startsWith('st:'));
  const st = issue.state === 'closed' ? 'done'
    : stLabel ? stLabel.slice(3)
    : labels.includes('fix-attempted') ? 'check'
    : labels.includes('being-fixed') ? 'fixing'
    : 'open';
  const sevLabel = labels.find(n => n.startsWith('sev:'));
  const sev = sevLabel ? sevLabel.slice(4) : parseSeverity(body, issue.title);
  const whoLabel = labels.find(n => n.startsWith('who:'));
  const who = whoLabel ? whoLabel.slice(4) : (issue.assignees[0]?.login ?? 'Patrick');
  // epic = the big Goal this job serves (label `epic: <name>`); milestone = the
  // sprint it's slotted into (GitHub Milestone, with an optional due date).
  const epicLabel = labels.find(n => n.startsWith('epic:'));
  const epic = epicLabel ? epicLabel.slice(5).trim() : '';
  const id = (issue.title.match(/HONE-(\d+)/i)?.[0] ?? `#${issue.number}`).toUpperCase();
  const actualSec = (body.match(/##\s+Actual\s*\n+([\s\S]*?)(?=\n##|$)/i)?.[1] ?? '').trim().split('\n')[0] ?? '';
  const firstLine = body.split('\n').find(l => {
    const t = l.trim();
    return t.length > 10 && !t.startsWith('#') && !/^[A-Z_]+\s*:/.test(t);
  }) ?? '';
  const d = parseActual(body) || actualSec || firstLine || cleanTitle(issue.title);
  return {
    id, sev, t: cleanTitle(issue.title), d, who, build: parseBuild(body), st,
    num: issue.number, upd: issue.updated_at,
    epic,
    ms: issue.milestone?.title ?? '',
    msNum: issue.milestone?.number,
    msDue: issue.milestone?.due_on ?? null,
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    // owner/repo — from the REPO var (wrangler.toml). Rename = flip one var.
    const REPO = env.REPO || 'patrickpatches/hone';

    // ── GET /bugs ──────────────────────────────────────────────────────────────
    // GitHub Issues are the single source of truth. st/sev/who come straight
    // from each issue's state + labels (read-after-write consistent), so no KV
    // overlay and no client-side patching is needed.
    if (request.method === 'GET' && url.pathname === '/bugs') {
      const ghRes = await ghFetch(
        `https://api.github.com/repos/${REPO}/issues?state=all&labels=bug&per_page=100&sort=created&direction=asc`,
        env,
      ).catch(e => { throw new Error('GitHub fetch failed: ' + e) });

      if (!ghRes.ok) {
        return json({ error: 'GitHub API error', status: ghRes.status }, 502);
      }

      const issues: GHIssue[] = await ghRes.json();
      const bugs = issues.map(issueToHoneBug);
      return json(bugs, 200, { 'Cache-Control': 'no-store' });
    }

    // ── POST /update ───────────────────────────────────────────────────────────
    // Write-key gated. Body: { num, field, value } where num is the GitHub issue
    // number. Persists st/sev/who to the GitHub Issue itself (state + labels) —
    // strongly consistent, so a refresh never reverts.
    //   st  : 'done' → close; 'open' → reopen + clear st labels;
    //         else → reopen + set st:<value> label
    //   sev : set sev:<value> label
    //   who : set who:<value> label
    if (request.method === 'POST' && url.pathname === '/update') {
      const provided = request.headers.get('X-Write-Key');
      if (!env.WRITE_KEY || !provided || provided !== env.WRITE_KEY) {
        return json({ error: 'Unauthorized — set X-Write-Key header' }, 401);
      }

      let body: { num?: number; id?: string; field?: string; value?: string };
      try {
        body = await request.json() as typeof body;
      } catch {
        return json({ error: 'Invalid JSON body' }, 400);
      }

      const { num, field, value } = body;
      if (!num || !field || value === undefined) {
        return json({ error: 'Required: num (issue number), field, value' }, 400);
      }
      if (!['st', 'sev', 'who'].includes(field)) {
        return json({ error: 'field must be st, sev or who' }, 400);
      }

      // Read current labels so we replace only the namespace we're changing.
      const cur = await ghFetch(`https://api.github.com/repos/${REPO}/issues/${num}`, env).catch(() => null);
      if (!cur || !cur.ok) return json({ error: 'Issue not found', status: cur?.status ?? 502 }, cur?.status === 404 ? 404 : 502);
      const issue = await cur.json() as GHIssue;
      let labels = issue.labels.map(l => l.name);

      const patch: { labels: string[]; state?: 'open' | 'closed' } = { labels };

      if (field === 'st') {
        // strip any prior status encoding
        labels = labels.filter(n => !n.startsWith('st:') && n !== 'fix-attempted' && n !== 'being-fixed');
        if (value === 'done') { patch.state = 'closed'; }
        else { patch.state = 'open'; if (value !== 'open') labels.push(`st:${value}`); }
        patch.labels = labels;
      } else {
        const ns = `${field}:`;
        patch.labels = labels.filter(n => !n.startsWith(ns)).concat(`${ns}${value}`);
      }

      const pr = await ghFetch(`https://api.github.com/repos/${REPO}/issues/${num}`, env, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
      }).catch(() => null);

      if (!pr) return json({ error: 'Could not reach GitHub' }, 502);
      if (pr.status === 403 || pr.status === 404) return json({ error: "Token can't edit this issue (needs Issues write).", status: pr.status }, 403);
      if (!pr.ok) { const t = await pr.text().catch(() => ''); return json({ error: 'GitHub rejected the update', status: pr.status, detail: t.slice(0, 200) }, 502); }

      return json({ ok: true, num, field, value });
    }

    // ── POST /issue ────────────────────────────────────────────────────────────
    // Write-key gated. Creates a real GitHub Issue (label `bug`) so the
    // composer files live — copy-paste retires. Body the dashboard parser
    // understands is built from {title, description, severity, screen, build}.
    // Requires the GITHUB_TOKEN to have Issues: WRITE (read-only returns 403).
    // After creating, stores a `who` KV override so the chosen role shows.
    if (request.method === 'POST' && url.pathname === '/issue') {
      const provided = request.headers.get('X-Write-Key');
      if (!env.WRITE_KEY || !provided || provided !== env.WRITE_KEY) {
        return json({ error: 'Unauthorized — set X-Write-Key header' }, 401);
      }

      let b: { title?: string; description?: string; severity?: string; screen?: string; build?: string; who?: string };
      try {
        b = await request.json() as typeof b;
      } catch {
        return json({ error: 'Invalid JSON body' }, 400);
      }

      const title = (b.title ?? '').trim();
      if (!title) return json({ error: 'title required' }, 400);
      const desc = (b.description ?? '').trim();
      const sevP = /^P[0-3]$/.test(b.severity ?? '') ? b.severity! : 'P3';
      const screen = (b.screen ?? '').trim() || "Other / I'm not sure";
      const buildNo = (b.build ?? '').trim() || "I don't know";

      // Structured body mirrors the bug-report.yml template so /bugs parses it.
      const issueBody = [
        '### Build number', buildNo, '',
        '### Which screen?', screen, '',
        '### What actually happened?', desc || title, '',
        '### How bad is it?', `${sevP} — filed from Bug Lord`,
      ].join('\n');

      // who is carried as a who:<role> label (GitHub is the single source).
      const who = (b.who ?? '').trim();
      const labels = ['bug', 'needs-triage'];
      if (who && who !== 'Patrick') labels.push(`who:${who}`);

      const ghRes = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'HoneBugLord/1.0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body: issueBody, labels }),
      }).catch(() => null);

      if (!ghRes) return json({ error: 'Could not reach GitHub' }, 502);
      if (ghRes.status === 403 || ghRes.status === 404) {
        return json({
          error: "The Worker's GitHub token can't create issues. Upgrade the tuckerspice-tracker token to Issues: Read AND write, then it works.",
          status: ghRes.status,
        }, 403);
      }
      if (!ghRes.ok) {
        const t = await ghRes.text().catch(() => '');
        return json({ error: 'GitHub rejected the issue', status: ghRes.status, detail: t.slice(0, 200) }, 502);
      }

      const created = await ghRes.json() as { number: number; html_url: string };
      const id = (title.match(/HONE-(\d+)/i)?.[0]?.toUpperCase()) ?? `#${created.number}`;
      return json({ ok: true, number: created.number, url: created.html_url, id });
    }

    // ── GET /issue/:n ──────────────────────────────────────────────────────────
    // Detail view: the issue (merged with KV override) + its comment thread.
    const detailMatch = url.pathname.match(/^\/issue\/(\d+)$/);
    if (request.method === 'GET' && detailMatch) {
      const n = detailMatch[1];
      const [iRes, cRes] = await Promise.all([
        ghFetch(`https://api.github.com/repos/${REPO}/issues/${n}`, env),
        ghFetch(`https://api.github.com/repos/${REPO}/issues/${n}/comments?per_page=100`, env),
      ]).catch(() => [null, null] as [Response | null, Response | null]);

      if (!iRes || !iRes.ok) {
        return json({ error: 'Issue not found', status: iRes?.status ?? 502 }, iRes?.status === 404 ? 404 : 502);
      }
      const issue = await iRes.json() as GHIssue;
      const comments: GHComment[] = cRes && cRes.ok ? await cRes.json() : [];

      const merged = issueToHoneBug(issue);

      return json({
        ...merged,
        num: issue.number,
        url: issue.html_url ?? `https://github.com/${REPO}/issues/${n}`,
        body: issue.body ?? '',
        comments: comments.map(c => ({
          author: c.user?.login ?? 'unknown',
          created_at: c.created_at,
          body: c.body ?? '',
        })),
      }, 200, { 'Cache-Control': 'no-store' });
    }

    // ── POST /issue/:n/comment ───────────────────────────────────────────────────
    // Write-key gated. Adds a dated comment to the GitHub Issue thread.
    const commentMatch = url.pathname.match(/^\/issue\/(\d+)\/comment$/);
    if (request.method === 'POST' && commentMatch) {
      const provided = request.headers.get('X-Write-Key');
      if (!env.WRITE_KEY || !provided || provided !== env.WRITE_KEY) {
        return json({ error: 'Unauthorized — set X-Write-Key header' }, 401);
      }
      let b: { body?: string };
      try { b = await request.json() as typeof b; } catch { return json({ error: 'Invalid JSON body' }, 400); }
      const text = (b.body ?? '').trim();
      if (!text) return json({ error: 'body required' }, 400);

      const n = commentMatch[1];
      const ghRes = await ghFetch(
        `https://api.github.com/repos/${REPO}/issues/${n}/comments`,
        env,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text }) },
      ).catch(() => null);

      if (!ghRes) return json({ error: 'Could not reach GitHub' }, 502);
      if (ghRes.status === 403 || ghRes.status === 404) {
        return json({ error: "The Worker's token can't comment. It needs Issues: write.", status: ghRes.status }, 403);
      }
      if (!ghRes.ok) {
        const t = await ghRes.text().catch(() => '');
        return json({ error: 'GitHub rejected the comment', status: ghRes.status, detail: t.slice(0, 200) }, 502);
      }
      const c = await ghRes.json() as GHComment;
      return json({ ok: true, comment: { author: c.user?.login ?? 'you', created_at: c.created_at, body: c.body ?? text } });
    }

    // ── GET /build ─────────────────────────────────────────────────────────────
    // Returns the latest completed EAS build number from the public GitHub
    // Actions API (no auth needed for public repos).
    if (request.method === 'GET' && url.pathname === '/build') {
      const res = await ghFetch(
        `https://api.github.com/repos/${REPO}/actions/workflows/eas-build.yml/runs?per_page=1&status=completed`,
        env,
      ).catch(() => null);

      if (!res || !res.ok) {
        return json({ error: 'Could not reach GitHub Actions API', number: null }, 200);
      }

      const data = await res.json() as { workflow_runs?: { run_number: number; head_sha: string; created_at: string }[] };
      const run = data.workflow_runs?.[0] ?? null;
      return json({
        number: run?.run_number ?? null,
        sha: run?.head_sha?.slice(0, 7) ?? null,
        created_at: run?.created_at ?? null,
      }, 200, { 'Cache-Control': 'no-store' });
    }

    // ── GET /milestones ──────────────────────────────────────────────────────
    // Sprints. Returns open milestones (sorted by nearest due date first) with
    // their title, due date, and open/closed issue counts — powers the
    // "This week" view + the sprint picker. Read-only, no auth.
    if (request.method === 'GET' && url.pathname === '/milestones') {
      const res = await ghFetch(
        `https://api.github.com/repos/${REPO}/milestones?state=open&sort=due_on&direction=asc&per_page=50`,
        env,
      ).catch(() => null);

      if (!res || !res.ok) {
        return json({ error: 'Could not reach GitHub milestones API', milestones: [] }, 200);
      }
      const list = await res.json() as GHMilestone[];
      const milestones = list.map(m => ({
        number: m.number,
        title: m.title,
        due_on: m.due_on,
        open: m.open_issues ?? 0,
        closed: m.closed_issues ?? 0,
      }));
      return json(milestones, 200, { 'Cache-Control': 'no-store' });
    }

    // ── GET / (health) ─────────────────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/') {
      return json({ ok: true, endpoints: ['GET /bugs', 'POST /update', 'POST /issue', 'GET /issue/:n', 'POST /issue/:n/comment', 'GET /build', 'GET /milestones'] });
    }

    return new Response('Not found', { status: 404, headers: CORS });
  },
};
