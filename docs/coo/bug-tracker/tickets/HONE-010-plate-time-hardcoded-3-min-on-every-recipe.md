# HONE-010 — Plate time always shows 3 min on every recipe — each plating is unique

```
TYPE:            Bug
SEVERITY:        P2
CATEGORY:        Data
SCREEN:          Recipe-Browse
RECIPE:          
ASSIGNEE:        Engineer
EPIC:            EPIC-v7-mise
FOUND IN BUILD:  #129
FIX ATTEMPTED:   #134 (commit e3cb60c — 2026-05-31)
STATUS:          VALIDATED ✅ — Patrick closed GitHub Issue #10 on-device
TARGET BUILD:    #134
REPRODUCIBLE:    Always
DEVICE:          Patrick's Pixel (Android 14)
GOLDEN RULE:     none
ROOT CAUSE:      #129's Journey-card miscoded the leftover_mode check — schema is an object {extra_servings, note} not a string 'tonight'. Hard-coded plateMin=3 for every recipe as a temporary value.
```

**GitHub Issue:** #10 · **Filed:** 2026-05-30 · **Reporter:** Senior Engineer (backfill from on-device validation of build #132)

---

## Repro

1. Open any recipe.
2. Look at the Plate card in the Your-Kitchen-Journey row.

## Expected

Recipe-specific plating estimate. Smash Burger ~2 min, Beef Lasagne ~6 min, Pavlova ~10 min for the cream + fruit layering.

## Actual

Always reads 'Plate · 3 min' regardless of recipe.

## Engineer notes

Patrick's exact phrasing: 'each plating is unique'. Options: derive from leftover_mode