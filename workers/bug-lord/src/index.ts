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
}
interface HoneBug { id: string; sev: string; t: string; d: string; who: string; build: string; st: string }
type KVOverride = Partial<Pick<HoneBug, 'st' | 'sev' | 'who' | 'build'>>;

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
  return { id, sev: parseSeverity(body, issue.title), t: cleanTitle(issue.title), d, who, build: parseBuild(body), st };
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
      const ghRes = await fetch(
        'https://api.github.com/repos/patrickpatches/hone/issues?state=all&labels=bug&per_page=100&sort=created&direction=asc',
        { headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'User-Agent': 'HoneBugLord/1.0' } },
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

      return json(bugs, 200, { 'Cache-Control': 'public, s-maxage=30, max-age=30' });
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

    // ── GET /build ─────────────────────────────────────────────────────────────
    // Returns the latest completed EAS build number from the public GitHub
    // Actions API (no auth needed for public repos).
    if (request.method === 'GET' && url.pathname === '/build') {
      const res = await fetch(
        'https://api.github.com/repos/patrickpatches/hone/actions/workflows/eas-build.yml/runs?per_page=1&status=completed',
        { headers: { 'User-Agent': 'HoneBugLord/1.0' } },
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
      }, 200, { 'Cache-Control': 'public, s-maxage=120, max-age=120' });
    }

    // ── GET / (health) ─────────────────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/') {
      return json({ ok: true, endpoints: ['GET /bugs', 'POST /update', 'GET /build'] });
    }

    return new Response('Not found', { status: 404, headers: CORS });
  },
};
