# HONE-009 — What to know before you start is a wall of text — violates anticipation-not-reaction

```
TYPE:            Bug
SEVERITY:        P2
CATEGORY:        Content
SCREEN:          Recipe-Browse
RECIPE:          THAI_GREEN_CURRY
ASSIGNEE:        Designer → Engineer
EPIC:            EPIC-v7-mise
FOUND IN BUILD:  #132
FIX ATTEMPTED:   (blank)
TARGET BUILD:    #134
REPRODUCIBLE:    Always
DEVICE:          Patrick's Pixel (Android 14)
GOLDEN RULE:     none
ROOT CAUSE:      before_you_start[] renders as full paragraphs upfront. The chef-voice mandate is 'anticipation, not reaction' — notes belong at the moment they apply (substitution warning on the ingredient row, technique on the step's why_note, tempo at the top of Mise).
```

**GitHub Issue:** #9 · **Filed:** 2026-05-30 · **Reporter:** Senior Engineer (backfill from on-device validation of build #132)

---

## Repro

1. Open Thai Green Curry.
2. Scroll past Journey cards.
3. Observe the 'What to know before you start' block.

## Expected

Each note appears at the moment it applies — substitution on the ingredient row, technique on the step, tempo at top of Mise. Browse view skimmable; cook view carries the teaching.

## Actual

Three long paragraphs (~10 lines body text) shown before the user has decided to cook. Reads like a textbook.

## Engineer notes

Phase 1.5 fix (~1 hour): collapse the wall to one-line previews ('Use full-fat coconut milk · Crack the cream · Move fast'); tap to expand prose. Phase 2 (separate Cook-led initiative): add `placement` field per before_you_start entry so each note renders inline at the right surface.

---

## COO DECISION — 2026-05-31

_Added by COO. Patrick's call._

Quick holding fix now; proper fix deferred and tracked as **HONE-015**.

- **Now (this ticket):** Designer specs a collapsible tap-to-expand "heads-up" block (one-line preview → full list), v7 palette only. Engineer wires it. Kills the wall of text without pulling the Cook off recipe-locking. Does not gate build #134.
- **Later ([[HONE-015]]):** Cook authors which note belongs on which step/ingredient; Engineer relocates them so each note appears at the moment it applies — the true chef-voice fix.
