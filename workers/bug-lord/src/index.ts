/**
 * hone-buglord — Cloudflare Worker  (HONE-020 — Phase 2)
 *
 * Endpoints:
 *   GET  /bugs    — GitHub Issues + KV overrides → BUGS array JSON
 *   POST /update  — write-key gated; persists {id,field,value} to KV
 *   GET  /build   — latest EAS build number from public GitHub Actions API
 *   GET  /        — health check
 *
 * Status model:
 *   GitHub issue state/labels drive the base status:
 *     closed                  → done
 *     label 'fix-attempted'   → check
 *     label 'being-fixed'     → fixing
 *     else                    → open
 *   KV overrides win for any of: st, sev, who, build.
 *   This lets the dashboard taps save for real without a git push.
 *
 * Secrets (wrangler secret put):
 *   GITHUB_TOKEN   fine-grained, Issues read-only
 *   WRITE_KEY      any string Patrick chooses; dashboard sends in X-Write-Key
 *
 * KV namespace:
 *   HONE_STATE  — id 33fab36582ed42bf93329fa5517bca24
 *   Keys:  bug:{id}   → JSON {st,sev,who,build}
 */

export interface Env {
  GITHUB_TOKEN: string;
  WRITE_KEY: string;
  HONE_STATE: KVNamespace;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface GHLabel { name: string }
interface GHIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: GHLabel[];
  assignees: { login: string }[];
  updated_at?: string;
  html_url?: string;
}
interface GHComment { user?: { login: string }; created_at: string; body: string | null }
interface HoneBug { id: string; sev: string; t: string; d: string; who: string; build: string; st: string; num?: number; upd?: string }
type KVOverride = Partial<Pick<HoneBug, 'st' | 'sev' | 'who' | 'build'>>;

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

function issueToHoneBug(issue: GHIssue): HoneBug {
  const body = issue.body ?? '';
  const labels = issue.labels.map(l => l.name);
  const st = issue.state === 'closed' ? 'done'
    : labels.includes('fix-attempted') ? 'check'
    : labels.includes('being-fixed') ? 'fixing'
    : 'open';
  const id = (issue.title.match(/HONE-(\d+)/i)?.[0] ?? `#${issue.number}`).toUpperCase();
  const who = issue.assignees[0]?.login ?? 'Patrick';
  const actualSec = (body.match(/##\s+Actual\s*\n+([\s\S]*?)(?=\n##|$)/i)?.[1] ?? '').trim().split('\n')[0] ?? '';
  const firstLine = body.split('\n').find(l => {
    const t = l.trim();
    return t.length > 10 && !t.startsWith('#') && !/^[A-Z_]+\s*:/.test(t);
  }) ?? '';
  const d = parseActual(body) || actualSec || firstLine || cleanTitle(issue.title);
  return { id, sev: parseSeverity(body, issue.title), t: cleanTitle(issue.title), d, who, build: parseBuild(body), st, num: issue.number, upd: issue.updated_at };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);

    // ── GET /bugs ──────────────────────────────────────────────────────────────
    // Fetches GitHub Issues + overlays KV overrides → authoritative BUGS array.
    if (request.method === 'GET' && url.pathname === '/bugs') {
      const ghRes = await ghFetch(
        'https://api.github.com/repos/patrickpatches/hone/issues?state=all&labels=bug&per_page=100&sort=created&direction=asc',
        env,
      ).catch(e => { throw new Error('GitHub fetch failed: ' + e) });

      if (!ghRes.ok) {
        return json({ error: 'GitHub API error', status: ghRes.status }, 502);
      }

      const issues: GHIssue[] = await ghRes.json();

      // Overlay KV overrides for each bug
      const bugs = await Promise.all(issues.map(async issue => {
        const base = issueToHoneBug(issue);
        const override = await env.HONE_STATE.get(`bug:${base.id}`, 'json').catch(() => null) as KVOverride | null;
        return override ? { ...base, ...override, id: base.id, t: base.t, d: base.d } : base;
      }));

      // no-store: every read is live (GitHub + KV). A bug board must always
      // show current state; the GitHub fetch (~200-400ms) is fast enough that
      // edge caching isn't worth the staleness. (HONE-020 item 3.)
      return json(bugs, 200, { 'Cache-Control': 'no-store' });
    }

    // ── POST /update ───────────────────────────────────────────────────────────
    // Write-key gated. Body: { id, field, value }
    // Persists a single field override to KV. Returns updated state.
    if (request.method === 'POST' && url.pathname === '/update') {
      // Reject if the secret isn't configured, or the header doesn't match.
      // Guarding against an unset/empty WRITE_KEY prevents an empty header
      // from ever authenticating.
      const provided = request.headers.get('X-Write-Key');
      if (!env.WRITE_KEY || !provided || provided !== env.WRITE_KEY) {
        return json({ error: 'Unauthorized — set X-Write-Key header' }, 401);
      }

      let body: { id?: string; field?: string; value?: string };
      try {
        body = await request.json() as typeof body;
      } catch {
        return json({ error: 'Invalid JSON body' }, 400);
      }

      const { id, field, value } = body;
      if (!id || !field || value === undefined) {
        return json({ error: 'Required: id, field, value' }, 400);
      }
      const allowed = ['st', 'sev', 'who', 'build'];
      if (!allowed.includes(field)) {
        return json({ error: `field must be one of: ${allowed.join(', ')}` }, 400);
      }

      const existing = await env.HONE_STATE.get(`bug:${id}`, 'json').catch(() => null) as Record<string,string> | null ?? {};
      const next = { ...existing, [field]: value };
      await env.HONE_STATE.put(`bug:${id}`, JSON.stringify(next));

      return json({ ok: true, id, updated: next });
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

      const ghRes = await fetch('https://api.github.com/repos/patrickpatches/hone/issues', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'HoneBugLord/1.0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body: issueBody, labels: ['bug', 'needs-triage'] }),
      }).catch(() => null);

      if (!ghRes) return json({ error: 'Could not reach GitHub' }, 502);
      if (ghRes.status === 403 || ghRes.status === 404) {
        return json({
          error: "The Worker's GitHub token can't create issues. Upgrade the hone-buglord token to Issues: Read AND write, then it works.",
          status: ghRes.status,
        }, 403);
      }
      if (!ghRes.ok) {
        const t = await ghRes.text().catch(() => '');
        return json({ error: 'GitHub rejected the issue', status: ghRes.status, detail: t.slice(0, 200) }, 502);
      }

      const created = await ghRes.json() as { number: number; html_url: string };
      const id = (title.match(/HONE-(\d+)/i)?.[0]?.toUpperCase()) ?? `#${created.number}`;
      const who = (b.who ?? '').trim();
      if (who && who !== 'Patrick') {
        await env.HONE_STATE.put(`bug:${id}`, JSON.stringify({ who })).catch(() => {});
      }

      return json({ ok: true, number: created.number, url: created.html_url, id });
    }

    // ── GET /issue/:n ──────────────────────────────────────────────────────────
    // Detail view: the issue (merged with KV override) + its comment thread.
    const detailMatch = url.pathname.match(/^\/issue\/(\d+)$/);
    if (request.method === 'GET' && detailMatch) {
      const n = detailMatch[1];
      const [iRes, cRes] = await Promise.all([
        ghFetch(`https://api.github.com/repos/patrickpatches/hone/issues/${n}`, env),
        ghFetch(`https://api.github.com/repos/patrickpatches/hone/issues/${n}/comments?per_page=100`, env),
      ]).catch(() => [null, null] as [Response | null, Response | null]);

      if (!iRes || !iRes.ok) {
        return json({ error: 'Issue not found', status: iRes?.status ?? 502 }, iRes?.status === 404 ? 404 : 502);
      }
      const issue = await iRes.json() as GHIssue;
      const comments: GHComment[] = cRes && cRes.ok ? await cRes.json() : [];

      const base = issueToHoneBug(issue);
      const override = await env.HONE_STATE.get(`bug:${base.id}`, 'json').catch(() => null) as KVOverride | null;
      const merged = override ? { ...base, ...override, id: base.id, t: base.t, d: base.d } : base;

      return json({
        ...merged,
        num: issue.number,
        url: issue.html_url ?? `https://github.com/patrickpatches/hone/issues/${n}`,
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
        `https://api.github.com/repos/patrickpatches/hone/issues/${n}/comments`,
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
        'https://api.github.com/repos/patrickpatches/hone/actions/workflows/eas-build.yml/runs?per_page=1&status=completed',
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

    // ── GET / (health) ─────────────────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/') {
      return json({ ok: true, endpoints: ['GET /bugs', 'POST /update', 'POST /issue', 'GET /issue/:n', 'POST /issue/:n/comment', 'GET /build'] });
    }

    return new Response('Not found', { status: 404, headers: CORS });
  },
};
