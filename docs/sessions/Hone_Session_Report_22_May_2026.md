# Hone Session Report — 22 May 2026

**Role:** Product Designer
**Focus:** Colour refinement, then an iterative pantry redesign — landing on one scoped change to the current build (organised "what you have" list + stepper).

---

# Part 1 — Colour refinement (the two targets Patrick named)

`docs/prototypes/colour-refinement-v1.html` — before/after on the real screen, plain-English rationale + engineer cost per change. Refine, not redirect — colour and emphasis only.

**1. "Great swap" green pill:** `#5DB870` → `#4FBF85` (cleaner emerald). Yellow/red unchanged. *Why:* old green and the dusty sage surface are both mid-greens at similar lightness, so they blur; the brighter emerald separates them.

**2. "Cook with what you have / you'll buy":** the sage eyebrow `#4A7C59` is **3.7:1 — fails WCAG AA**. Recolour to gold (A two-tone recommended, B gold pill); title italic accent sage → gold. No layout change.

**Optional third:** step-number badge charcoal `#141414` on cream (1.1:1 → 13.8:1).

## Housekeeping flag (outside my lane)

`docs/FILE_MAP.md` has unresolved git merge-conflict markers (lines ~116–133). Flagged for COO/Engineer.

---

# Part 2 — Pantry redesign v1 (supply/demand, category icons)

`docs/prototypes/pantry-list-v1.html`. Key finding: the recipe-driven quantity aggregation Patrick wanted **already exists** in `shopping-helpers.ts` (`sources[]` + `recomputeQuantity`). v1 surfaced it as a category-grouped supply/demand list with minimal line icons; later iterated to fold the existing search bar + autocomplete back in.

---

# Part 3 — Pantry v2: two-state model + buy-units

`docs/prototypes/pantry-list-v2.html`. Patrick rejected the Need/Have/Buy dashboard and asked for buy-units. Two states (In your kitchen / To buy), filter chips replace the dashboard, Shop tab = this list filtered to "to buy". Buy-units: "2 tomatoes", "1 bunch", "2 tins"; bulk stays in grams; weight→count marked "≈". New cost named: a small buy-unit reference table.

---

# Part 4 — Pantry v2: recipe-match carousel folded in

The existing `scoreRecipeAgainstPantry` carousel (Ready to cook / "X of Y matched" / "still need" chips) folded back into v2 at the top — answer "what can I cook?" first, then "what's in my kitchen?".

---

# Part 5 — Scope pulled back: keep the build, change one box (`pantry-haves-v1.html`)

Patrick decided the full-screen v1/v2 redesigns went too far. New direction: **keep the current pantry build entirely** and make **one change** — the "what you have" pills box becomes an organised, collapsible, category-grouped list using the SVG line icons. Confirmed via four clarifying questions:

- **Content:** only what you have (direct swap for the pills box).
- **Each row:** name + amount you have + which planned recipe uses it ("Tomatoes · ×3 · for Bolognese, Shakshuka").
- **Length:** collapsible category sections.
- **Adding without typing:** a **+/− stepper** in the search-add flow (and on each row) so you set "3 tomatoes" in one go instead of typing it three times. Stays stocked until removed.

`docs/prototypes/pantry-haves-v1.html` shows: the current-build pantry with the new box; the stepper add interaction (empty + → stepper at 1 → 3); the collapse behaviour; and the kept-from-build elements (search, "recipes you can cook now" banner, match carousel) shown explicitly unchanged. Countable items get the stepper; bulk staples show a plain "Stocked".

**Engineer cost:** small. The pantry row already has an unused `quantity` field for the stepper to write to — no schema change. This supersedes v1/v2 as the build target; the buy-unit reference table becomes optional/future.

## Files touched (whole session)

- `docs/prototypes/colour-refinement-v1.html`, `pantry-list-v1.html`, `pantry-list-v2.html`, `pantry-haves-v1.html` (current build target) — all NEW.
- `docs/coo/handoffs.md` — colour handoff DELIVERED; pantry handoff opened then revised through v2 and the scoped "one change" direction.
- `docs/sessions/Hone_Session_Report_22_May_2026.md` — this report.
