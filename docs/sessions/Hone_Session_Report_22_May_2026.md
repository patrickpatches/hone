# Hone Session Report — 22 May 2026

**Role:** Product Designer
**Focus:** Colour refinement, then a two-part pantry redesign (smart quantities, two-state model, category icons).

---

# Part 1 — Colour refinement (the two targets Patrick named)

Delivered the colour-refinement before/after mockup Patrick asked for in the 2026-05-18 handoff. New file: `docs/prototypes/colour-refinement-v1.html`. Shows every proposed change current-vs-proposed on the actual screen, with a plain-English rationale and rough engineer cost for each. An upgrade of the current dark-sage look, not a fifth direction — colour and emphasis only.

**1. The "great swap" green pill.** Only the green moves: `#5DB870` → `#4FBF85` (a cleaner, brighter emerald). Yellow (`#F2CC2A`) and red (`#D4663A`) unchanged. *Why:* the old pill green and the dusty sage surface (`#4A7C59`) are both mid-greens at similar lightness, so they blur — the brighter emerald separates them by lightness.

**2. "Cook with what you have / you'll buy".** *Why, with data:* the current sage eyebrow is `#4A7C59` at **3.7:1 — fails WCAG AA** (needs 4.5:1). Recolour to gold; two treatments (A two-tone recommended, B gold pill). Title italic accent moves sage → gold. No size/layout change.

**Optional third:** step-number badge charcoal `#141414` on cream (1.1:1 → 13.8:1) — pins the shade for the engineer's already-open contrast fix.

All contrast ratios computed programmatically before choosing colours. HTML structurally verified.

## Files touched (colour refinement)

- `docs/prototypes/colour-refinement-v1.html` — NEW.
- `docs/coo/handoffs.md` — marked the colour handoff DELIVERED, awaiting Patrick's pick.

## Housekeeping flag (not actioned — outside my lane)

`docs/FILE_MAP.md` has **unresolved git merge-conflict markers** (`<<<<<<< HEAD` / `=======` / `>>>>>>>`, lines ~116–133). Needs a clean resolution. Flagging for the COO/Engineer.

---

# Part 2 — Pantry list redesign v1 (smart quantities + category icons)

Patrick asked for the same "improve the design" treatment on the pantry. He doesn't want to hand-type quantities — he wants **recipe-driven quantities that aggregate** (one recipe needs a tomato, add a second that also needs one → it shows 2). He chose **minimal line icons**.

## The key finding (why this is cheap)

The aggregation Patrick described **already exists** in `mobile/src/data/shopping-helpers.ts` — `applyMealAdd` / `applyMealRemove` / `recomputeQuantity` track each ingredient's source recipes (`sources[]`) and re-sum the scaled quantity on every meal add/remove, handling units honestly. The pantry just doesn't surface it.

`docs/prototypes/pantry-list-v1.html` showed the pantry as supply vs demand, category-grouped, with 7 hand-drawn line icons and source attribution. Later iterated to fold the existing search-first add bar + autocomplete back in (Patrick flagged it was missing).

## Files touched (pantry v1)

- `docs/prototypes/pantry-list-v1.html` — NEW (later iterated to add the search bar, then superseded by v2).
- `docs/coo/handoffs.md` — opened a Senior Engineer handoff (pending Patrick's visual approval).

---

# Part 3 — Pantry v2: two-state model + real buy-units

Patrick reviewed v1 and pushed back on two things, both correct:

1. **Quantities should be in buy-units, not recipe grams.** "Tomatoes should be 1 or 2, because you buy a whole tomato at the supermarket, not 200g."
2. **The Need/Have/Buy three-number dashboard is the wrong model.** "If we need the ingredient then it should be displayed in the pantry. Think of a smarter system."

## The smarter system (`docs/prototypes/pantry-list-v2.html`)

**Two states, not three numbers.** Every ingredient is either **In your kitchen** (you've got it) or **To buy** (a planned recipe needs it and you don't have it). The to-buy items live right in their category with the amount shown; one tap moves an item to "in your kitchen". "Need" was never a number to read — it's just *why* an item is on the list. A filter (All / To buy / In kitchen) replaces the dashboard, and the Shop tab becomes this same list filtered to "to buy" — one source of truth, two views.

**Buy-units.** Quantities display as the user shops: "2 tomatoes" (≈, produce sold whole), "1 bunch" coriander, "1 bulb" garlic, "2 tins" canned tomatoes; bulk items (mince, flour, cheese) stay in grams. Weight→count conversions are marked "≈" because sizes vary — honest per golden rule 5.

## The one genuinely new build cost (named honestly)

A small per-ingredient **buy-unit reference table** (count / weight / pack, plus an average weight for count conversions), ~50–60 common ingredients seeded, recipe-unit fallback for the rest. Everything else (have/buy state, source-tracked aggregation) already exists. Flagged to the Senior Engineer.

## A process note

While iterating v1's search bar, the sandbox file mount desynced from the real file (it served a truncated copy). I rebuilt that file through the shell and gated every push behind an assertion that the bytes end in `</html>` and contain the expected content, so no truncated file could ship. v2 was written fresh and synced cleanly.

## Files touched (pantry v2)

- `docs/prototypes/pantry-list-v2.html` — NEW (current).
- `docs/coo/handoffs.md` — engineer handoff revised to the two-state + buy-unit model.
- `docs/sessions/Hone_Session_Report_22_May_2026.md` — this report.
