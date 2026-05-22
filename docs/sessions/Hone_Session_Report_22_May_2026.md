# Hone Session Report — 22 May 2026

**Role:** Product Designer
**Focus:** Colour refinement, then a multi-part pantry redesign (smart quantities, two-state model, buy-units, category icons, recipe-match carousel).

---

# Part 1 — Colour refinement (the two targets Patrick named)

Delivered the colour-refinement before/after mockup Patrick asked for in the 2026-05-18 handoff. New file: `docs/prototypes/colour-refinement-v1.html`. Shows every proposed change current-vs-proposed on the actual screen, with a plain-English rationale and rough engineer cost for each. An upgrade of the current dark-sage look, not a fifth direction — colour and emphasis only.

**1. The "great swap" green pill.** Only the green moves: `#5DB870` → `#4FBF85` (a cleaner, brighter emerald). Yellow (`#F2CC2A`) and red (`#D4663A`) unchanged. *Why:* the old pill green and the dusty sage surface (`#4A7C59`) are both mid-greens at similar lightness, so they blur — the brighter emerald separates them by lightness.

**2. "Cook with what you have / you'll buy".** *Why, with data:* the current sage eyebrow is `#4A7C59` at **3.7:1 — fails WCAG AA** (needs 4.5:1). Recolour to gold; two treatments (A two-tone recommended, B gold pill). Title italic accent moves sage → gold. No size/layout change.

**Optional third:** step-number badge charcoal `#141414` on cream (1.1:1 → 13.8:1) — pins the shade for the engineer's already-open contrast fix.

All contrast ratios computed programmatically before choosing colours.

## Files touched (colour refinement)

- `docs/prototypes/colour-refinement-v1.html` — NEW.
- `docs/coo/handoffs.md` — marked the colour handoff DELIVERED, awaiting Patrick's pick.

## Housekeeping flag (not actioned — outside my lane)

`docs/FILE_MAP.md` has **unresolved git merge-conflict markers** (`<<<<<<< HEAD` / `=======` / `>>>>>>>`, lines ~116–133). Needs a clean resolution. Flagging for the COO/Engineer.

---

# Part 2 — Pantry list redesign v1 (smart quantities + category icons)

Patrick wants recipe-driven quantities that aggregate (one recipe needs a tomato, add a second that also needs one → it shows 2) and chose minimal line icons.

## The key finding (why this is cheap)

The aggregation already exists in `mobile/src/data/shopping-helpers.ts` — `applyMealAdd` / `applyMealRemove` / `recomputeQuantity` track each ingredient's source recipes (`sources[]`) and re-sum on every meal add/remove, handling units honestly. The pantry just doesn't surface it.

`docs/prototypes/pantry-list-v1.html` showed the pantry as supply vs demand, category-grouped, with line icons + source attribution. Later iterated to fold the existing search-first add bar + autocomplete back in (Patrick flagged it was missing).

## Files touched (pantry v1)

- `docs/prototypes/pantry-list-v1.html` — NEW (search bar added during iteration; superseded by v2).
- `docs/coo/handoffs.md` — opened a Senior Engineer handoff (pending Patrick's visual approval).

---

# Part 3 — Pantry v2: two-state model + real buy-units

Patrick reviewed v1 and pushed back on two things, both correct:

1. **Buy-units, not recipe grams.** "Tomatoes should be 1 or 2, because you buy a whole tomato at the supermarket, not 200g."
2. **The Need/Have/Buy dashboard is the wrong model.** "If we need the ingredient then it should be displayed in the pantry. Think of a smarter system."

## The smarter system (`docs/prototypes/pantry-list-v2.html`)

**Two states, not three numbers.** Every ingredient is either **In your kitchen** or **To buy** (a planned recipe needs it and you don't have it). To-buy items live in their category with the amount shown; one tap moves an item to "in your kitchen". "Need" was never a number to read — it's just *why* an item is on the list. A filter (All / To buy / In kitchen) replaces the dashboard, and the Shop tab becomes this same list filtered to "to buy".

**Buy-units.** "2 tomatoes" (≈, sold whole), "1 bunch" coriander, "1 bulb" garlic, "2 tins"; bulk (mince, flour) stays in grams. Weight→count marked "≈" — honest per golden rule 5.

## The one genuinely new build cost

A small per-ingredient **buy-unit reference table** (count / weight / pack + average weight for count conversions), ~50–60 common ingredients, recipe-unit fallback. Everything else already exists. Flagged to the Senior Engineer.

## A process note

While iterating, the sandbox file mount repeatedly desynced from the real file (serving truncated copies). I rebuilt affected files through the shell and gated every push behind an assertion that the bytes end correctly and contain the expected content, so no truncated file could ship.

---

# Part 4 — Pantry v2: recipe-match carousel folded in

Patrick: the v2 layout was missing what the current build has — the carousel of recipes you're close to cooking based on what you have — but he likes the v2 design (SVG icons, type, two-state list) and wants the carousel incorporated.

Done in `docs/prototypes/pantry-list-v2.html`. The recipe-match carousel (driven by the existing `scoreRecipeAgainstPantry`) now sits at the **top** of the screen, above the ingredient list: "Ready to cook" cards with a sage "Tap to cook" pill when fully matched, "X of Y matched" + "still need" chips when close. Restyled into v2 tokens; no new matching logic.

**Placement reasoning:** the pantry's promise is "cook with what you have", so the screen now reads top-to-bottom as one thought — *what can I cook?* (carousel) then *what's in my kitchen?* (the two-state list). The build had matches at the bottom; moving them up makes the payoff the first thing you see.

Minor token note flagged to the engineer: the "still need" chips use gold (v2's "to buy" colour) rather than the build's rust — easy to revert if Patrick prefers rust.

## Files touched (pantry v2)

- `docs/prototypes/pantry-list-v2.html` — two-state + buy-units + recipe-match carousel (current).
- `docs/prototypes/pantry-list-v1.html` — kept for history of the model change.
- `docs/coo/handoffs.md` — engineer handoff revised to the two-state + buy-unit model + carousel.
- `docs/sessions/Hone_Session_Report_22_May_2026.md` — this report.
