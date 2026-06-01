# HONE-007 — Add missing to shopping list fails (or only adds some items)

```
TYPE:            Bug
SEVERITY:        P1
CATEGORY:        Flow
SCREEN:          Recipe-Browse
RECIPE:          
ASSIGNEE:        Engineer
EPIC:            EPIC-pantry-first
FOUND IN BUILD:  #132
FIX ATTEMPTED:   #134 (commit e3cb60c — 2026-05-31)
STATUS:          VALIDATED ✅ — Patrick closed GitHub Issue #7 on-device
TARGET BUILD:    #134
REPRODUCIBLE:    Always
DEVICE:          Patrick's Pixel (Android 14)
GOLDEN RULE:     none
ROOT CAUSE:      Items are written with sources:[{kind:'meal',recipe_id}] but the Shop tab's useFocusEffect runs reconcile() which strips meal-sourced items whose recipe isn't in the planned set; partial-add symptom likely from id-collision on normalizeForMatch giving INSERT-OR-REPLACE the same key for two ingredients.
```

**GitHub Issue:** #7 · **Filed:** 2026-05-30 · **Reporter:** Senior Engineer (backfill from on-device validation of build #132)

---

## Repro

1. Open any recipe (e.g. Thai Green Curry) you have NOT added to Plan.
2. Scroll to the In-your-pantry card.
3. Tap the gold 'Add missing to shopping list' button.
4. Toast flashes 'Added to shopping list'.
5. Open the Shop tab.

## Expected

All missing ingredients from the recipe appear as rows in Shop, scaled to base_servings, source kind 'meal' or 'manual'.

## Actual

Patrick reports two symptoms across recipes: (a) NONE of the items appear in Shop; (b) only SOME items appear (some are silently dropped between tap and Shop view).

## Engineer notes

Two-part bug. Reconcile() sweep explains (a). Partial-add symptom from Patrick on-device 2026-05-30 confirms a second issue likely in the upsert loop (composite id collision OR Promise.all SQLite race). Fix path: change source kind to 'manual' so reconcile leaves them; also audit the id construct