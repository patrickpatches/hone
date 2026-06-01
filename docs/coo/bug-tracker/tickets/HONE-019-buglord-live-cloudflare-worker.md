# HONE-019 — Make Bug Lord LIVE: a Cloudflare Worker backend (no more copy-paste)

```
TYPE:            Task
SEVERITY:        P2
CATEGORY:        Flow
SCREEN:          Other (Bug Lord hub)
ASSIGNEE:        Engineer
EPIC:            (none)
FOUND IN BUILD:  n/a (management infrastructure)
FIX ATTEMPTED:   (blank)
TARGET BUILD:    n/a (not an app build — a separate Worker deploy)
STATUS:          OPEN — Patrick approved 2026-06-01
GOLDEN RULE:     none
ROOT CAUSE:      Bug Lord is a static page; it can't save changes without a secret embedded in it (breaks the no-secrets-in-client rule), so today every edit is copy-paste. A small Cloudflare Worker holds the credential server-side and becomes the live read/write backend.
```
**Filed:** 2026-06-01 · **Reporter:** COO (Patrick approved)

---

## Goal
Turn Bug Lord from a poster-you-read into a control-panel-you-press: Patrick's taps save for real, and the board, his phone, the COO and every worker all read the same live state — no copy-paste, always in sync.

## Build (Engineer, Claude Code lane)

**1. Cloudflare Worker** (`workers/buglord/` in the repo, deployed with `wrangler`):
- `GET /state` → returns the live board JSON (tickets[], build{}, lastUpdated). Reads from a Cloudflare **KV** namespace (`BUGLORD`, key `state`).
- `POST /update` → applies one change ({id, field, value} for a ticket, or {onPhone:N}), validates it, writes back to KV, returns the new state. Requires a write-key header.
- `GET /build` → live build truth: query GitHub Actions `eas-build.yml/runs`, return the newest run_number + status + head_sha. (Worker holds the GitHub token as a secret.)

**2. Secrets** (via `wrangler secret put`, NEVER in code or the page): `GITHUB_TOKEN` (read Actions + optional repo mirror), `WRITE_KEY` (gate on `POST /update`).

**3. Auth for writes:** Bug Lord asks Patrick for the write-key once and saves it in his browser (localStorage) — so the key is never in the page source. Reads (`/state`, `/build`) are open (nothing sensitive).

**4. Audit mirror (recommended, your call):** on each write, the Worker also commits the new `state.json` to `docs/coo/bug-tracker/state.json` so git keeps the history and the COO/worker can read the same source. Recommend KV-only vs KV+mirror with reasons.

**5. Rewrite Bug Lord** (`docs/dashboard/index.html`): on load `fetch('<worker>/state')` and `/build` and render from those instead of the inline arrays; on a dropdown change / mark-done / set-onPhone, `POST /update`. **Keep the current inline data as a fallback** so the page never blank-screens if the Worker is unreachable.

**6. Deploy & safety:** `wrangler deploy`; CORS locked to the Pages origin (`https://patrickpatches.github.io`), NOT `*`; rate-limit `/update`; no secrets committed.

## Honest limits to document
- The **Cowork sidebar artifact can't reach the Worker** (its sandbox blocks network except a few CDNs) → it stays a static mirror. The **phone/Pages Bug Lord is the live one** — which is what Patrick uses, so that's fine.
- R-015 unchanged: marking a ticket Done is still Patrick's action (now it just saves live instead of via paste).

## Needs Patrick (one-time)
A Cloudflare account (free tier covers this) + running `wrangler secret put GITHUB_TOKEN` and `WRITE_KEY`. Flag back with the exact commands when ready.

## COO TRIAGE — 2026-06-01
- **Severity P2** — high value for the management system, but it's infrastructure, not the cooking app. Sequence it **alongside**, not ahead of, recipe-locking and the testing gate (24 July).
- **Blocks:** nothing on the launch path. Unblocks: "always in sync, no copy-paste."
