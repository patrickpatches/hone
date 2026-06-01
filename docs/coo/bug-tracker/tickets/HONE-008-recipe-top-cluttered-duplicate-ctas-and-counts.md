# HONE-008 — Top of recipe screen is cluttered — duplicate Start cooking, duplicate 0/9, duplicate watch links

```
TYPE:            Bug
SEVERITY:        P2
CATEGORY:        UI
SCREEN:          Recipe-Browse
RECIPE:          
ASSIGNEE:        Engineer
EPIC:            EPIC-v7-mise
FOUND IN BUILD:  #132
FIX ATTEMPTED:   #136 (commit 328a7f0c97 — 2026-06-01)
TARGET BUILD:    #136
REPRODUCIBLE:    Always
DEVICE:          Patrick's Pixel (Android 14)
GOLDEN RULE:     none
ROOT CAUSE:      v7 Commit B2 (#132) kept the always-visible floating Start cooking pill from #126 AND added the inline rust pill from the prototype; the prototype was authored without the floating pill in mind so both now coexist. The pantry eyebrow row also carries a 0/9 badge that duplicates the huge numeral inside the card below. The bronze eyebrow ends with 'Watch the original ↗' which targets the same video as 'Watch the chef' in the ghost row.
```

**GitHub Issue:** #8 · **Filed:** 2026-05-30 · **Reporter:** Senior Engineer (backfill from on-device validation of build #132)

---

## Repro

1. Open any recipe on a phone.
2. Observe the first viewport without scrolling.

## Expected

One Start cooking CTA. One pantry count (the bronze numeral inside the card). One Watch link in the ghost row. Breathing room between groups.

## Actual

Two Start cooking CTAs (inline rust pill + floating sticky pill). Two 0/9 counters (eyebrow badge + huge bronze numeral). Two Watch links (eyebrow 'Watch the original' + ghost 'Watch the chef'). Crowded vertical rhythm.

## Engineer notes

Fix in v7 Phase 1.5: remove inline rust pill (kept floating per Patrick); drop the eyebrow 0/9 badge; drop 'Watch the original ↗' from the eyebrow (keep 'Watch the chef' in ghost row); add 6-8px breathing room between groups.

---

## FIX ATTEMPTED — Build #136 (commit `328a7f0c97`) — 2026-06-01

_Added by Bug Tester (scheduled run)._

- **Root cause:** Multiple overlapping v7 iterations left duplicate UI elements across the browse title block.
- **Code changes:**
  - Removed `Watch the original ↗` from the bronze attribution eyebrow; eyebrow now shows attribution text only.
  - Added `Watch the chef` pressable to ghost row alongside `Plan it` (gap: 20, marginTop: 20).
  - Ghost-row marginTop increased 14→20 (+6px breathing room per spec).
  - Prior commits (#134) already removed the inline Start cooking pill and the eyebrow N/M badge.
- **Result:** One Watch link (ghost row), one Start cooking CTA (sticky bottom pill), clean attribution eyebrow.
- **Per R-015:** not self-closing. Awaiting Patrick's on-device validation.
