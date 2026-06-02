# HONE-022 — Polish the Today tab to match Bug Lord Pro (no functionality lost)

TYPE: Task · SEVERITY: P3 · ASSIGNEE: Engineer · STATUS: OPEN — Patrick approved 2026-06-02
**Filed:** 2026-06-02 · **Reporter:** COO

Bring the **Today** tab up to the polish of the new Bugs page so it's a best-in-class main dashboard. Cleaner hierarchy, premium aqua+fuchsia feel, mobile-first, fast. **Do NOT remove or break any existing function.**

**Must keep (verify each still works after):**
- Days-to-launch countdown + on-track verdict.
- "On you right now" jobs list.
- Live **Build Status** strip — newest built (live from `/build`), building-now, on-your-phone with the "update" link, behind/up-to-date message.
- Launch-readiness donut + the breakdown bars.
- The composer (write update / **file a bug live** + send-to).

**Polish goals:** tighten spacing and type scale, consistent cards/borders with the Bugs table, clear visual priority (countdown + jobs first), no clutter, snappy. Keep it lighter than Jira — calm, glanceable.

**Definition of done:** Today looks and feels as polished as the Bugs page; every function above still works on Patrick's phone.

## COO TRIAGE — 2026-06-02
P3 cosmetic — the daily-driver screen, so worth it, but no functional risk allowed. Dashboard-only; no EAS build.

## FIX ATTEMPTED — docs/infra commit `eba08dc` — 2026-06-02

_Senior Engineer. **CSS-only** pass — zero JS touched, no element IDs/classes renamed, so every function is intact by construction. No EAS build._

**What changed (style only):**
- **Countdown card** — gradient top hairline, larger 64px number, uppercase "days until launch" eyebrow, tighter rhythm; verdict dot now has a soft glow.
- **"On you right now"** — heading is now a clean uppercase eyebrow (matches the Bugs page); job rows tightened (type scale + line-height).
- **Build Status strip** — premium card radius, uppercase head, cells get a subtle hover; identical content/markup so the live `/build` render (newest built · building now · on-your-phone + update link · behind/up-to-date message) is untouched.
- **Readiness** — bars animate width (`.fill` transition); donut + bars stack cleanly on very narrow phones (≤430px).
- **Consistency** — unified card radii/borders with the Bugs table; subtle `.card` border transition for snappiness.

**Function kept & verified (all still work — IDs unchanged):**
- Days-to-launch countdown + verdict ✓
- "On you right now" jobs list ✓
- Live Build Status strip incl. the on-phone "update" link ✓
- Readiness donut + breakdown bars ✓
- Composer: write update / file-a-bug-live + send-to ✓

Verified on the deployed Pages site after push. Per R-015: not self-closing.
