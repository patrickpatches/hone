# HONE-015 — Move 'before you start' notes to where they apply (the proper fix for HONE-009)

```
TYPE:            Task
SEVERITY:        P3
CATEGORY:        Content
SCREEN:          Recipe-Browse
RECIPE:          
ASSIGNEE:        Cook → Engineer
EPIC:            (none)
FOUND IN BUILD:  n/a (quality follow-up)
FIX ATTEMPTED:   (blank)
TARGET BUILD:    (before launch — backlog)
REPRODUCIBLE:    n/a
DEVICE:          n/a
GOLDEN RULE:     #5 honest-limits (chef voice: anticipation, not reaction)
ROOT CAUSE:      The chef-voice rule wants notes at the moment they apply (swap warning on the ingredient, technique on the step's why-note, tempo at the top of Mise). Which note maps to which step/ingredient is the Cook's culinary judgement, not a code move — so it can't be done by the Engineer alone.
```

**GitHub Issue:** — · **Filed:** 2026-05-31 · **Reporter:** COO

---

## What this is

The proper version of [[HONE-009]]. HONE-009's quick fix collapses the wall of text into a tap-to-expand block — good enough for now. This ticket is the real thing: each "before you start" note moves to the exact place in the recipe where it matters.

## What's needed

1. **Cook:** for each of the 16 launch recipes, map every `before_you_start` note to where it belongs — an ingredient row, a step's `why_note`, or the top of Mise.
2. **Engineer:** wire the mapping so notes render in place; retire the up-front block (or leave only a genuine top-of-cook tempo line).

## COO TRIAGE — 2026-05-31

- **Severity:** P3. The user-facing pain is already handled by HONE-009's quick fix. This is the quality upgrade.
- **Sequencing:** after the Cook finishes locking the 16 recipes — don't let it compete with that launch-critical job. Aim to land before the closed-testing gate, or accept it as a fast-follow after launch.
- **Blocks:** nothing. Explicitly tracked here so "later" doesn't quietly become "never" (CLAUDE.md).
