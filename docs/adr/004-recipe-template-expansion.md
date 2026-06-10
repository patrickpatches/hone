# ADR-002 — Recipe template expansion (DECISION-009)

**Date:** 2026-05-04  
**Status:** Accepted  
**Deciders:** Patrick Nasr (CEO), Claude (engineering)

---

## Context

The initial Recipe schema (ADR-001 / Phase 2, 2026-04-22) covered the minimal fields
needed to render and validate seed recipes: title, ingredients, steps, source, categories.

As the cookbook grows toward a full "head chef" experience, the schema was missing:

1. **Timing granularity** — `time_min` is a single blunt number. Users can't see
   "30 min total, but only 10 min of actual work." That distinction matters: a 3-hour
   braise is less daunting when you know you're hands-on for 20 minutes.

2. **Equipment warnings** — no way to surface "you need a mortar and pestle for this"
   before the user commits. Forces a mid-cook discovery moment.

3. **Mise en place list** — the professional workflow is: read the recipe, set up your
   station, *then* cook. The schema had no field for the pre-flight setup list.

4. **Pre-cook heads-up** — no structured field for time-sensitive prep warnings
   ("start this the night before", "meat must be room temp before searing").

5. **Closing notes** — no field for the chef's finishing touch or leftover guidance.

6. **Difficulty naming inconsistency** — existing `DifficultyLevel` used `'Easy'`,
   `'Intermediate'`, `'Involved'` (title-case, inconsistent with the rest of the
   schema's JSON conventions). The three values also didn't follow a consistent
   naming axis (Easy and Intermediate are skill-based; Involved is effort-based).

---

## Decision

### New fields (all additive — existing recipes compile unchanged)

```typescript
// Timing
total_time_minutes: z.number().int().positive().optional()
active_time_minutes: z.number().int().positive().optional()

// Equipment + setup
equipment: z.array(z.string()).default([])
before_you_start: z.array(z.string()).max(3).default([])
mise_en_place: z.array(z.string()).default([])

// Finishing
finishing_note: z.string().optional()
leftovers_note: z.string().optional()
```

### Existing field: DifficultyLevel normalised

`DifficultyLevel` renamed from `['Easy', 'Intermediate', 'Involved']` to
`['beginner', 'intermediate', 'advanced']`.

**Why:** lowercase snake_case consistent with every other enum in the schema
(`'linear'`, `'fixed'`, `'levantine'`, `'good_swap'`). The old values were
title-case artefacts from an earlier draft. `'Involved'` was also an outlier —
it measures effort, not skill. `'advanced'` is skill-based and maps cleanly.

All 45 seed-recipe `difficulty` values updated in the same commit.

### time_min kept

The existing `time_min` field is NOT removed. It remains as a backwards-compatible
single-number fallback during migration. Once all authored recipes have
`total_time_minutes` populated, a future ADR will formally deprecate `time_min`.

---

## Consequences

**Positive:**
- Recipe detail screen can show "10 min active · 45 min total" — more honest UX.
- Equipment list enables a pre-cook checklist before the user starts.
- `before_you_start` catches the "oh, I needed to marinate this overnight" problem.
- Mise en place list supports the app's "calm head chef" voice.
- `finishing_note` / `leftovers_note` give the chef's sign-off without crowding steps.
- Difficulty values are consistent with every other enum in the schema.

**Neutral:**
- 45 seed-recipe difficulty values renamed in one commit — mechanical, low-risk.
- `time_min` is now technically redundant but kept for safety. Tech debt, tracked.

**Negative / risks:**
- Any external code that references `'Easy'` / `'Intermediate'` / `'Involved'` will
  get a TypeScript error at compile time — **by design**. This is the compiler
  catching the migration for us.
- `before_you_start` max-3 constraint enforces discipline but requires care when
  authoring recipes with complex pre-prep (split across multiple bullets).

---

## Not in scope (this round)

- Recipe detail UI rendering of the new fields (future ADR)
- Deprecation of `time_min` (future ADR once all recipes have `total_time_minutes`)
- `difficulty` display in cards or filters (future sprint)
