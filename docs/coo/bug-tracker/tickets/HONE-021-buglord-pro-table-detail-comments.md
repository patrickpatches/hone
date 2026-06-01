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
