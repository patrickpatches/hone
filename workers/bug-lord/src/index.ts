/**
 * hone-buglord — Cloudflare Worker
 *
 * Single endpoint: GET /bugs
 *
 * Fetches all GitHub Issues labelled "bug" from patrickpatches/hone,
 * maps them to the Bug Lord dashboard format, and returns JSON with
 * CORS headers so the static dashboard at patrickpatches.github.io
 * can read them from the browser without exposing the GitHub token.
 *
 * Status is driven by:
 *   - issue.state === 'closed'         → st: 'done'
 *   - label 'fix-attempted' on issue   → st: 'check'  (Fixed — build & check)
 *   - label 'being-fixed' on issue     → st: 'fixing'
 *   - else                             → st: 'open'
 *
 * Severity comes from the "### How bad is it?" section of the issue body,
 * which is auto-populated by the bug-report.yml issue template.
 *
 * Deploy: wrangler deploy
 * Secret: wrangler secret put GITHUB_TOKEN
 *         (fine-grained token, Issues read-only on patrickpatches/hone)
 */

export interface Env {
  GITHUB_TOKEN: string;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface GHLabel {
  name: string;
}

interface GHIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: GHLabel[];
  assignees: { login: string }[];
}

interface HoneBug {
  id: string;
  sev: string;
  t: string;
  d: string;
  who: string;
  build: string;
  st: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALLOWED_ORIGIN = 'https://patrickpatches.github.io';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Extract the content under a GitHub form section heading.
 * Headings are written by the issue template as "### <label>".
 */
function section(body: string, heading: string): string {
  const re = new RegExp(
    '###\\s+' + heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\n([\\s\\S]*?)(?=\\n###|$)',
    'i',
  );
  return body.match(re)?.[1]?.trim() ?? '';
}

/** P0 → Show-stopper, P1 → Serious, P2 → Annoying, P3 → Tidy-up */
function parseSeverity(body: string): string {
  const raw = section(body, 'How bad is it?');
  if (raw.startsWith('P0')) return 'Show-stopper';
  if (raw.startsWith('P1')) return 'Serious';
  if (raw.startsWith('P2')) return 'Annoying';
  return 'Tidy-up';
}

/** Returns "#N" or "?" */
function parseBuild(body: string): string {
  const raw = section(body, 'Build number');
  if (!raw || raw === "I don't know" || raw === '_No response_') return '?';
  return raw.startsWith('#') ? raw : `#${raw}`;
}

/** First non-empty line of the "What actually happened?" section. */
function parseActual(body: string): string {
  const raw = section(body, 'What actually happened?');
  return raw.split('\n').find((l) => l.trim().length > 0) ?? '';
}

/** Clean the title for display — strip [BUG] and HONE-NNN prefixes. */
function cleanTitle(title: string): string {
  return title
    .replace(/^\[BUG\]\s*/i, '')
    .replace(/^HONE-\d+\s*[-–:]\s*/i, '')
    .trim();
}

/**
 * Map a single GitHub Issue to the Bug Lord BUGS-array format.
 * The "id" is HONE-NNN if the title contains it; otherwise #<number>.
 */
function issueToHoneBug(issue: GHIssue): HoneBug {
  const body = issue.body ?? '';
  const labelNames = issue.labels.map((l) => l.name);

  const st: string =
    issue.state === 'closed'
      ? 'done'
      : labelNames.includes('fix-attempted')
      ? 'check'
      : labelNames.includes('being-fixed')
      ? 'fixing'
      : 'open';

  const honeIdMatch = issue.title.match(/HONE-(\d+)/i);
  const id = honeIdMatch ? honeIdMatch[0].toUpperCase() : `#${issue.number}`;

  const who =
    issue.assignees.length > 0 ? issue.assignees[0].login : 'Patrick';

  const d = parseActual(body) || cleanTitle(issue.title);

  return {
    id,
    sev: parseSeverity(body),
    t: cleanTitle(issue.title),
    d,
    who,
    build: parseBuild(body),
    st,
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // ── GET /bugs ──────────────────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/bugs') {
      const apiUrl =
        'https://api.github.com/repos/patrickpatches/hone/issues' +
        '?state=all&labels=bug&per_page=100&sort=created&direction=asc';

      let ghResponse: Response;
      try {
        ghResponse = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'HoneBugLord/1.0',
          },
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Failed to reach GitHub API', detail: String(err) }),
          { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        );
      }

      if (!ghResponse.ok) {
        const text = await ghResponse.text().catch(() => '');
        return new Response(
          JSON.stringify({ error: 'GitHub API error', status: ghResponse.status, detail: text }),
          { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        );
      }

      const issues: GHIssue[] = await ghResponse.json();
      const bugs: HoneBug[] = issues.map(issueToHoneBug);

      return new Response(JSON.stringify(bugs), {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          // 60 s Cloudflare edge cache — fresh enough for a bug dashboard
          'Cache-Control': 'public, s-maxage=60, max-age=60',
        },
      });
    }

    // ── GET / (health check) ───────────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(
        JSON.stringify({ ok: true, endpoints: ['/bugs'] }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    return new Response('Not found', { status: 404, headers: CORS_HEADERS });
  },
};
