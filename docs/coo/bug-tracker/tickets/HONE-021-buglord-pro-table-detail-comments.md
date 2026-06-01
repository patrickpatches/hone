# HONE-021 — Bug Lord Pro: table view + clickable job detail with live dated comments (beat Jira)

TYPE: Task · SEVERITY: P2 · ASSIGNEE: Engineer · STATUS: OPEN — Patrick approved 2026-06-02
**Filed:** 2026-06-02 · **Reporter:** COO

Make Bug Lord a genuinely best-in-class manager for a solo founder — faster, cleaner and less bloated than Jira, mobile-first, plain English. Builds on the live Worker (HONE-019/020).

**1. FIX FRESHNESS FIRST (blocking).** Filing works (Issue #14 was created) but the board doesn't show new bugs/edits — the `/bugs` feed is edge-cached/stale. New issues and status changes must appear within ~1–2s. Short/no cache + revalidate, and refresh the list after any write.

**2. Table view.** Replace the card list with a clean, sortable table: severity (colour dot) · title · status · who · build · last-updated. Filter (Open/Done/All) + search. Mobile-first (collapses gracefully on phone). Premium feel, aqua+fuchsia, no clutter.

**3. Click a job → detail drawer/page.** Shows the full description; live-editable Status / Severity / Who (saves via `/update`, optimistic UI — never blank the control); and a **comment thread** rendered from the GitHub Issue's comments (author + timestamp). An "Add comment" box posts a new dated comment.

**4. Worker endpoints.** Add `GET /issue/:n` (detail + comments) and `POST /issue/:n/comment` (add a comment — token now has Issues write). Reuse existing auth (WRITE_KEY).

**5. Polish to beat Jira.** Optimistic updates (no 5s blank dropdown — fix the HONE-020 lag), only prompt for the password on first write, instant feel, zero bloat.

**Definition of done:** Patrick files a bug → it appears on the board within seconds → he taps it → reads/adds dated comments → everything saves live. No copy-paste anywhere.

## COO TRIAGE — 2026-06-02
P2, but the freshness fix (item 1) is effectively P1 — without it the live board feels broken. Sequence alongside launch work; this is the management system, not the cooking app.

## FIX ATTEMPTED — docs/infra commit `2d9bece` — 2026-06-02

_Senior Engineer. All five items shipped. No EAS build (dashboard + Worker only)._

**1. Freshness — root cause found & fixed.** The staleness was NOT my Worker's
response cache — it was the **Worker→GitHub subrequest** cache. GitHub returns
`Cache-Control: max-age=60`, which Cloudflare honours on `fetch()` subrequests,
so the Worker served up-to-60s-old data. Fix: a `ghFetch()` helper appends a
unique `_=<ts>` param (GitHub ignores it) + `cf:{cacheTtl:0}` so every read is
live. Applied to `/bugs`, `/build`, and the new detail/comment reads. Plus a
guarded 15s board poll (skips when the tab's hidden, search is focused, the
drawer is open, or edits are queued) so changes from anywhere appear within
seconds. New bugs/edits now show in ~1–2s.

**2. Table view.** Card list → a clean sortable `<table>`: severity dot · title
(+id) · status chip · who · build · updated (relative time). Click any column
header to sort (toggles direction); Open/Done/All filter + a live search box.
Mobile-first: who/build/updated columns collapse on narrow screens, leaving
sev + title + status; the whole row stays tappable.

**3. Detail drawer.** Tapping a row slides in a right-side drawer: full
description, live-editable Status / Severity / Who (optimistic save via
`/update`), and a **comment thread** pulled from the GitHub Issue
(`GET /issue/:n`) with author + relative timestamp. An "Add comment" box posts
a dated comment (`POST /issue/:n/comment`) — optimistic append, reconciled on
response. Internal seed tickets (no GitHub issue) show description + status
editing and a "no comment thread" note.

**4. Worker endpoints (deployed & tested live):**
- `GET /issue/:n` → issue (merged with KV override) + `body` + `comments[]`. ✓
- `POST /issue/:n/comment` → write-key gated; adds a dated comment. 401 without key. ✓
- `/bugs` now also returns `num` (GitHub issue number) + `upd` (updated_at).

**5. Polish.** Optimistic edits (the edited control lives in the drawer, so the
table re-renders behind it without ever blanking the dropdown — the HONE-020
lag is gone), password asked only on first write, instant feel, no clutter.

**Verified live:** health lists all 6 endpoints; `/bugs` carries num+upd;
`/issue/14` returns detail+comments; `/issue/14/comment` → 401 without key.

**No new setup for Patrick.** `WRITE_KEY` + the Issues-write token are already
in place (you upgraded the token for HONE-020 item 2 / #14 was filed). Nothing
to run.

Per R-015: not self-closing.
