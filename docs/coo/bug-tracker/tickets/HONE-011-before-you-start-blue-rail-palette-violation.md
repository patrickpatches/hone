# HONE-011 — What to know callout uses blue left rail — v7 palette violation

```
TYPE:            Bug
SEVERITY:        P3
CATEGORY:        UI
SCREEN:          Recipe-Browse
RECIPE:          
ASSIGNEE:        Engineer
EPIC:            EPIC-v7-mise
FOUND IN BUILD:  #132
FIX ATTEMPTED:   #134 (commit e3cb60c — 2026-05-31)
STATUS:          VALIDATED ✅ — Patrick closed GitHub Issue #11 on-device
TARGET BUILD:    #134
REPRODUCIBLE:    Always
DEVICE:          Patrick's Pixel (Android 14)
GOLDEN RULE:     none
ROOT CAUSE:      Orphan styling from pre-v7. The v7 palette is ink/muted/bronze/gold/terra — blue is not in the system.
```

**GitHub Issue:** #11 · **Filed:** 2026-05-30 · **Reporter:** Senior Engineer (backfill from on-device validation of build #132)

---

## Repro

1. Open any recipe with before_you_start content.
2. Look at the vertical bar on the left of the What-to-know callout.

## Expected

Bronze left rail matching the honest-swap callout token discipline.

## Actual

Blue left rail.

## Engineer notes

5-min single-token swap — ap