# HONE-012 — 'intermediate' should be 'Intermediate' on the meta line

```
TYPE:            Bug
SEVERITY:        P3
CATEGORY:        Content
SCREEN:          Recipe-Browse
RECIPE:          
ASSIGNEE:        Engineer
EPIC:            EPIC-v7-mise
FOUND IN BUILD:  #132
FIX ATTEMPTED:   (blank)
TARGET BUILD:    #134
REPRODUCIBLE:    Always
DEVICE:          Patrick's Pixel (Android 14)
GOLDEN RULE:     none
ROOT CAUSE:      recipe.difficulty is rendered straight from seed data which uses lowercase ('easy', 'intermediate', 'expert'). v7 meta line shows it next to capitalised cuisine and 'Serves N' — case mismatch.
```

**GitHub Issue:** #12 · **Filed:** 2026-05-30 · **Reporter:** Senior Engineer (backfill from on-device validation of build #132)

---

## Repro

1. Open a recipe whose difficulty is 'intermediate'.
2. Look at the meta line under the tagline.

## Expected

'Intermediate · Serves 4 · Thai'.

## Actual

'intermediate · Serves 4 · Thai'.

## Engineer notes

Render-time titlecase preferred over seed-data rewrite (other surfaces may want lowercase for filters/matching). One-liner.
