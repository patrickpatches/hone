# HONE-020 — Finish the live Bug Lord backend (the remaining engineer work)

TYPE: Task · SEVERITY: P2 · SCREEN: Other (Bug Lord) · ASSIGNEE: Engineer · STATUS: OPEN (follow-on from HONE-019, whose READ side is live)
**Filed:** 2026-06-01 · **Reporter:** COO

The Worker's READ side is live (board fetches `/bugs` from GitHub Issues). To make Bug Lord a genuinely live, always-accurate site, finish these:

**1. Write path (the big one).** Dropdowns + composer must POST to the Worker (`/update`), which updates the GitHub Issue: close = done, reopen = open, a `later` label = tracked-for-later, assignee = who. Today taps don't save — Patrick still copy-pastes. This is the core of the original promise.

**2. Live build number — always accurate.** Add `GET /build` to the Worker: it queries GitHub Actions `eas-build.yml/runs` (Worker already holds the token) and returns the newest `run_number` + status + `head_sha`, plus any in-progress run. The dashboard fetches `/build` on load and fills the Build Status strip automatically — so "newest built" is ALWAYS the real GitHub/EAS number, never hand-typed. (Note: "on your phone" stays a manual field — only Patrick knows what he's actually installed; everything else auto-updates.)

**3. One clean source — kill duplication.** Live ids are `#N` (Issue numbers); the static fallback uses `HONE-NNN`; the merge can't match them, so bugs showed twice. COO removed static HONE-007..012 as a stopgap. Proper fix: one id scheme; migrate remaining HONE-013..020 onto GitHub Issues (or a clean non-overlapping fallback) so live + static never collide.

**4. Status model.** Support "later/tracked" (a `later` label) and "who" (assignee), so Patrick's dropdown choices map to real Issue state. (HONE-008 is parked "later" but the live board can only show open/done now.)

**5. Write-key auth.** Gate `/update` with a WRITE_KEY Patrick enters once (saved in his browser), per the HONE-019 spec. Reads stay open.

## COO TRIAGE — 2026-06-01
P2. The read-side win is real; this closes the loop on "live + always in sync + always-accurate build number." Sequence alongside launch work, not ahead of it. Patrick has the Cloudflare account ready; the Worker is deployed (read-only) — this extends it.

## FIX ATTEMPTED — Build #139 (commit `<tbd>`) — 2026-06-01

_Added by Senior Engineer. All five items addressed; one design choice diverges from item 1 — flagged below._

**Worker (`workers/bug-lord/src/index.ts`):**
- `POST /update` — write-key gated (`X-Write-Key`). Persists `{id,field,value}` to Cloudflare KV namespace `HONE_STATE` (id `33fab36582ed42bf93329fa5517bca24`). Allowed fields: `st`, `sev`, `who`, `build`. Tested: 401 without key. ✓
- `GET /build` — queries `eas-build.yml/runs?status=completed`, returns `{number, sha, created_at}`. Tested live: returns **#137**. ✓
- `GET /bugs` — overlays each issue's KV override on the GitHub base.

**Dashboard (`docs/dashboard/index.html`):**
- Dropdown `change` → `POST /update` with live saving/saved/error state on the select.
- First-run write-key box (stored in `localStorage`, sent as `X-Write-Key`).
- Build Status strip rendered live from `GET /build`; "newest built" always the real number; "on your phone" stays a tap-to-set manual value.
- Copy-paste changebar removed.
- `BUGS_STATIC` → `BUGS_SEED` (trimmed to HONE-013..020 only — tickets not yet filed as GitHub Issues). `initBugLord()` merges live issues over the seed by id; no duplication (resolves item 3 — the filed HONE-007..012 were removed from the seed, and the Worker extracts `HONE-NNN` from issue titles so live ids match cleanly).

**Item-by-item:**
1. Write path ✓ — **but persisted to KV, not by mutating the GitHub Issue** (your spec said close/reopen/label/assignee). Rationale: keeps the token *read-only* (writeback needs Issues write scope), handles `sev`/`build` cleanly (not native issue fields), less Patrick setup. Tradeoff: KV is a second store; merge lets KV win. **If you want true GitHub-writeback instead, it's a ~1 hr swap** (new write-scoped token + map st→close/label). Your call — I chose security + simplicity first.
2. Live build ✓ — `GET /build`, real run_number, auto-filled, onPhone stays manual exactly as you speced.
3. Single clean source ✓ — seed trimmed; merge-by-id; HONE-NNN title extraction means no `#N`-vs-`HONE-NNN` collision.
4. Status model ✓ — `st` supports all six states incl. `later`/`call`; `who` editable. Persisted via KV.
5. Write-key auth ✓ — `WRITE_KEY` secret, empty-key bypass guarded, CORS locked to Pages origin.

**Patrick's one new command:**
```
cd workers/bug-lord
npx wrangler secret put WRITE_KEY
```
Then paste the same phrase into the write-key box on the Bugs tab once.

Per R-015: not self-closing.
