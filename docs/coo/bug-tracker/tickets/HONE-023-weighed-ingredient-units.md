# HONE-023 — Weighed ingredients keep their unit; stepper stops flattening 160 g to a count (GitHub Issue #13)

```
TYPE:            Bug
SEVERITY:        P1 (Serious — core shopping-list accuracy)
CATEGORY:        Data / Flow
SCREEN:          Pantry
RECIPE:          (any with weighed ingredients)
ASSIGNEE:        Engineer
EPIC:            EPIC-launch-ready
FOUND IN BUILD:  #135 (Patrick's phone)
FIX ATTEMPTED:   #<tbd> (commit <tbd>)
TARGET BUILD:    next EAS build
REPRODUCIBLE:    Always
DEVICE:          Patrick's phone (Android)
GOLDEN RULE:     #2 smart scaling
ROOT CAUSE:      The pantry "what you have" stepper treated every item as a bare
                 count — it rendered the raw number with no unit, stepped by 1,
                 and clamped to Math.min(99, …). A weighed amount (160 g) lost
                 its unit in display and collapsed to a count on the first tap.
```

**GitHub Issue:** #13 · **Filed:** 2026-06-02 · **Reporter:** Patrick via Bug Lord

---

## Repro
1. From a recipe with a weighed ingredient (e.g. 160 g), tap "Add missing to shopping list".
2. In Shop, tick the item → it mirrors into the pantry "what you have" list.
3. Pantry shows "160" (no unit); tap + or − → it jumps to a bare count and clamps to 99. Unit lost.

## Expected
Weighed items (160 g, 400 ml) keep amount + unit through display and the stepper; stepping adjusts the weighed value sensibly. Counts (1 egg, 2 tins) step by 1. Every item has a clear measure type (weight / volume / count).

---

## FIX ATTEMPTED — build #<tbd> (commit `<tbd>`) — 2026-06-02

_Senior Engineer._

**Root cause:** the pantry stepper had no notion of measure type — it assumed everything was a count.

**Fix — measure type (weight / volume / count) resolved consistently end-to-end:**
- New `src/data/measure.ts`: `inferMeasure(unit)`, `isWeighed(qty,unit)`, `stepFor(measure,qty)`, `formatQty(qty,unit)`. The measure type is **derived from the `unit` string** — which is already carried recipe → shopping list → pantry (the shop→pantry mirror and "Add missing" both copy `unit`). One shared resolver means the measure type is identical at every layer.
- `app/(tabs)/pantry.tsx`: the "what you have" stepper now branches on measure —
  - **weight/volume** (`isWeighed`): shows `formatQty` ("160 g"), `stepWeight` adjusts by a magnitude-aware increment (`stepFor`), never flattens to a count, no 99 clamp; stepping below one step removes the row (with undo).
  - **count**: unchanged +/- by 1 (eggs, tins, cloves).
  - **bulk staples** (flour/oil/spices, no measured amount): unchanged "Stocked" pill.

**Design note (flagging honestly):** I derived the measure type from the carried `unit` via one resolver rather than adding a stored `measure` column. Storing it would duplicate state that can drift from the unit; deriving at read time is the cleaner, lower-risk fix and needs no DB migration or seed re-authoring. Every item still has a well-defined measure type end-to-end. If a future ingredient needs a measure that its unit can't imply, add an optional explicit `Ingredient.measure` override — `inferMeasure` already takes it as the fallback shape.

**Verified:** unit classification unit-tested (g/kg→weight, ml/l/tbsp/cup→volume, ""/whole/tin/can/jar/clove→count); tsc clean on changed files (only the pre-existing `@react-navigation/native` baseline error remains).

Per R-015: not self-closing. Patrick validates on-device.
