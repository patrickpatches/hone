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
