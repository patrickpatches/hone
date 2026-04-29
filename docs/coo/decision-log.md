# Decision Log

> Business decisions for Hone. Distinct from `docs/adr/` which records technical architecture decisions. Newest at top.

## Format

```
## DECISION-NNN · YYYY-MM-DD · [Title]
**Decider:** Patrick / COO / [specialist]
**Context:** Why this decision needed to be made
**Options considered:** What we looked at
**Decision:** What we picked
**Rationale:** Why we picked it
**Consequences:** What this means downstream — both intended and side effects
**Revisit when:** A trigger that should make us reconsider
```

---

## DECISION-004 · 2026-04-29 · Expand launch library from 10 to 17 priority recipes
**Status:** ✅ APPROVED by Patrick 29 April 2026
**Decider:** Patrick
**Context:** COO recommended 10 launch recipes. Patrick reviewed the popularity tier list from `docs/coo/launch-recipe-research.md` and elected to ship all 17 recipes from the data-derived list as the v1.0 priority launch library. Carbonara only (creamy chicken pasta deferred). Both pan-fried fish AND fish & chips ship as separate recipes.
**Decision:** v1.0 launch library = 17 priority recipes from popularity research, of which 10 receive full stage-by-stage photography (showcase) and 7 receive hero shot + "Photos soon" badge. All existing recipes in seed library continue to ship per DECISION-003.
**Rationale:** Patrick's instinct: a recipe app launching in Australia should have all the major Australian household dishes. A 10-recipe library reads thin; 17 reads like a real cookbook of what Australians actually cook. The showcase-vs-hero split preserves the differentiator (stage photos as the visible competitive advantage) without forcing every recipe to wait for full photography.
**Consequences:**
- 6 new recipes to add to seed library: schnitzel, stir-fry, lasagne, roast lamb, fish & chips, falafel. Senior Engineer + Culinary Verifier work, ~1–2 sessions.
- Photography expands from 5 weekends to 6–7 weekends (5 for showcase, 1–2 for hero shots of all non-showcase recipes including the existing library).
- Audit scope grows from 28 to ~34 recipes.
- 24 July launch date still achievable but margins compress. Any milestone slip = launch slip.
**Revisit when:** A milestone slips by more than one week, OR Patrick wants to add or cut a recipe from the 17.

---

## DECISION-003 · 2026-04-29 · Recipes 11–28 already in app — what happens at launch
**Status:** ✅ APPROVED by Patrick 29 April 2026 — Option 2 (hero shot + "Photos soon" badge)
**Badge text update:** Product Designer shortened "Stage photos coming soon" → "Photos soon" (less internal-feeling, fits the chip space). Implementation spec in `docs/prototypes/recipe-card-states.html`.
**Decider:** Patrick decides, COO recommends
**Context:** App currently contains 28 seeded recipes. Launch plan focuses on 10 fully-photographed launch recipes. Question: what happens to the other 18 recipes that won't have full stage-by-stage photography by 24 July?
**Options considered:**
1. **Strip them from v1.** Ship with only 10 recipes. Simplest, but library feels thin.
2. **Ship them with hero shots only, badged "Stage photos coming soon".** Honest per Rule 5, library stays full, differentiator is preserved on the showcase 10.
3. **Ship them with no photo indicator.** Rule 4 violation — diluting the visual differentiator.
**Recommendation:** Option 2. Library reads full, showcase 10 carry the differentiator, badge keeps us honest. Post-launch we add stage shots one recipe at a time and remove the badge as each is upgraded.
**Consequences if Option 2 chosen:** Photography Director needs to plan a hero shot for each non-launch recipe (18 quick shots, ~1 weekend). Product Designer needs a "Stage photos coming soon" badge component. Recipe sort defaults to showing the 10 launch recipes first.

---

## DECISION-002 · 2026-04-29 · Defer Rule 3 (user-added recipes) to v1.1
**Status:** ✅ APPROVED by Patrick 29 April 2026
**Decider:** COO recommends, Patrick approves
**Context:** Rule 3 says users can add and edit their own recipes. Implementation requires recipe form, ingredient parser, image upload, validation, possibly cloud sync, possibly moderation. 3–4 sessions of engineering work plus test surface.
**Options considered:**
1. Ship Rule 3 in v1 as currently scoped
2. Ship a stripped-down version (text-only recipes, no images) in v1
3. Defer entirely to v1.1 (recommended)
**Decision (recommended):** Option 3 — defer to v1.1, target ~September 2026.
**Rationale:** The kill feature is the seeded chef-inspired library with stage photos. Ship that perfectly. User-added recipes is a feature surface where rough edges (parser bugs, missing fields) hurt the perceived quality of the entire app. After launch we'll have real users telling us what they actually want to add, and we can build it once with the right shape rather than guessing.
**Consequences:** v1 launches with seed-only library. Onboarding messaging adjusts. Marketing copy doesn't promise user-added recipes at launch. v1.1 backlog gains the user-added flow as its lead feature, which gives v1.1 a marketable hook.
**Revisit when:** Patrick says no, or beta testers report user-added recipes as a top-3 missing feature.

---

## DECISION-001 · 2026-04-29 · Recommend launch date push from June to 24 July 2026
**Status:** ✅ APPROVED by Patrick 29 April 2026 — "24 July works for me unless we need more time."
**Decider:** COO recommends, Patrick approves
**Context:** Original target was June 2026 (per `docs/patrick-action-list.md` last updated 19 April 2026). Now that engineering velocity is clear, and the bottlenecks are revealed as photography time, Google Play gates, and beta-driven polish — June is achievable only by sacrificing quality.
**Options considered:**
1. Hold June date, cut scope aggressively
2. Push to late July with a polish cycle (recommended)
3. Push to August or September for two polish cycles
**Decision (recommended):** Option 2 — 24 July 2026 public launch.
**Rationale:** Photography requires 4–5 weekends with re-shoots. Closed Testing requires 14 consecutive days minimum. Polish cycle after beta is where products become world-class. June compresses all three; 24 July gives breathing room without inviting scope creep.
**Consequences:** All downstream milestones shift. Internal Alpha 22 May, Closed Testing 5 June, graduation 19 June, Production submission 10 July, public launch 24 July. Roadmap and patrick-action-list need updating.
**Revisit when:** Patrick says no or wants to change the target. Also revisit if a Closed Testing milestone slips by more than a week.
