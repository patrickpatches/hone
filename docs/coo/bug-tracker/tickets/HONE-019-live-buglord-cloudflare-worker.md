# HONE-019 — Bug Lord dashboard is read-only; new GitHub Issues don't appear without a manual HTML edit

```
TYPE:            Task
SEVERITY:        P3
CATEGORY:        Infra
SCREEN:          Other (Bug Lord dashboard)
RECIPE:          —
ASSIGNEE:        Engineer
EPIC:            EPIC-launch-ready
FOUND IN BUILD:  n/a
FIX ATTEMPTED:   #138 (commit <tbd>)
TARGET BUILD:    n/a  (tooling change — no APK)
REPRODUCIBLE:    Always
DEVICE:          Patrick's phone (GitHub Pages)
GOLDEN RULE:     none
ROOT CAUSE:      Dashboard BUGS array is hardcoded JS. When Patrick files a new
                 GitHub Issue from his phone, nothing reads it. Engineer must
                 manually edit index.html and push to show the new ticket.
```

**GitHub Issue:** (not filed — Engineer-initiated task) · **Filed:** 2026-06-01 · **Reporter:** Senior Engineer

---

## Repro

1. Patrick files a bug from his phone via the GitHub Issue form.
2. Patrick opens `patrickpatches.github.io/hone/bug-tracker/`.
3. The new bug is not on the dashboard. It only appears after an Engineer
   manually edits `docs/dashboard/index.html` and pushes.

## Expected

New GitHub Issues labelled `bug` appear on the Bug Lord dashboard within
60 seconds of being filed. No manual HTML edit required.

## Actual

Dashboard is static. Every new ticket requires a manual `index.html` edit.

---

## COO TRIAGE — 2026-06-01

_Added by Senior Engineer (self-assigned)._

- **Severity:** P3 — dashboard is a tooling convenience, not launch-blocking.
- **Sequencing:** build alongside the live Worker; ships in build #138 (docs/infra — no APK).
- **Blocks:** Bug Tester workflow (they file issues; currently those issues are invisible on the dashboard until manually backfilled).

---

## FIX ATTEMPTED — Build #138 (commit `<tbd>`) — 2026-06-01

_Added by Senior Engineer._

**Root cause:** hardcoded `BUGS` JS array in `docs/dashboard/index.html`.

**What was built:**

`workers/bug-lord/` — Cloudflare Worker (TypeScript, Wrangler v3):
- `GET /bugs` — fetches all GitHub Issues labelled `bug` from `patrickpatches/hone`,
  maps them to the dashboard bug format, returns JSON with CORS headers.
- `GET /` — health check (`{"ok":true}`).
- GitHub token stored as Wrangler secret (never in source).
- 60 s Cloudflare edge cache.
- CORS allows `https://patrickpatches.github.io` only.

`docs/dashboard/index.html` changes:
- `BUGS` array renamed to `BUGS_STATIC` (permanent fallback for HONE-007..016
  not yet on GitHub Issues).
- `let BUGS = BUGS_STATIC.slice()` starts from static data immediately.
- `WORKER_URL` constant — Patrick fills in his CF subdomain post-deploy.
- IIFE `liveFetch()` runs after first `renderBugs()` call: fetches the Worker,
  merges live issues with static-only legacy items, re-renders. Silent on error.

**GitHub label convention (new):**
- `fix-attempted` label → dashboard shows "Fixed — build & check"
- `being-fixed` label → dashboard shows "Being fixed"
- Issue closed → dashboard shows "Done ✓"
- No special label → "Open"

**Why this won't regress:**
- `WORKER_URL` contains `YOUR_SUBDOMAIN` placeholder until Patrick deploys; the
  live-fetch IIFE checks for the placeholder and exits early — dashboard still
  renders from `BUGS_STATIC` unchanged.
- If the Worker is down or returns an error, `liveFetch()` catches silently and
  `BUGS_STATIC` stays displayed.

**Patrick's setup steps (one-time, after this lands on main):**

```bash
npm install -g wrangler          # install Wrangler CLI
wrangler login                   # authenticate (opens browser)
cd workers/bug-lord
npm install
wrangler deploy                  # → note the URL it prints
wrangler secret put GITHUB_TOKEN # paste a new Issues-read-only token when prompted
```

Then open `docs/dashboard/index.html`, find `YOUR_SUBDOMAIN`, replace with the
subdomain from `wrangler deploy`, commit, push.

**New GitHub token scope required (fine-grained, Issues read-only):**
- Repository: `patrickpatches/hone`
- Permissions: Issues → Read-only
- Expiry: 1 year
- Where to create: github.com → Settings → Developer Settings → Fine-grained tokens

Per R-015: not self-closing. Awaiting Patrick's on-device validation.
