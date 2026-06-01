# HONE-020 — Finish the live Bug Lord backend: write-path + single source

TYPE: Task · SEVERITY: P2 · SCREEN: Other (Bug Lord) · ASSIGNEE: Engineer · STATUS: OPEN (follow-on from HONE-019)
**Filed:** 2026-06-01 · **Reporter:** COO

The Worker's READ side is live (board fetches /bugs from GitHub Issues). To make Bug Lord truly always-in-sync with no copy-paste, finish:

1. **Write path** — dropdowns + composer POST to the Worker (/update), which updates the GitHub Issue (close=done, label for later, assignee for who). Today taps don't save; Patrick still copy-pastes. This is the core of the original promise.
2. **Single source / kill duplication** — live ids are `#N` (Issue numbers), static fallback uses `HONE-NNN`; the merge can't match them, so items showed twice. COO removed static HONE-007..012 as a stopgap. Proper fix: one id scheme; migrate remaining HONE-013..019 onto Issues (or a clean non-overlapping fallback).
3. **Status model** — support "later/tracked" (a `later` label) and "who" (assignee), so dropdown choices map to real Issue state. (HONE-008 is parked "later" but the live board only shows open/done now.)
4. **Write-key auth** — gate /update with the WRITE_KEY Patrick enters once (localStorage), per the HONE-019 spec.

## COO TRIAGE — 2026-06-01
P2. Read-side win is real; this closes the loop. Sequence alongside launch work, not ahead. When it lands, the copy-paste bridge retires and "always in sync" is genuinely true.
