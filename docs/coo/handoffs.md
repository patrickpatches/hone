# Handoffs

> The cross-chat baton-pass log. Every specialist reads this at session start and writes to it at session end.

## Format

Each handoff is a block. Newest at the top.

```
### HANDOFF → [Receiving specialist] · YYYY-MM-DD · [STATUS]
**From:** [Originating specialist]
**Subject:** One-line description
**Why:** Why this handoff exists
**What's done:** What the originating specialist completed
**What's needed:** What the receiving specialist should do
**Files touched:** Paths to anything they need to read
**Blocks:** What downstream work is blocked until this completes
```

Statuses: **OPEN** (waiting for receiver), **IN PROGRESS** (receiver started), **DONE** (receiver completed and confirmed).

When a handoff is DONE, leave it in the file for one week so it's auditable, then move it to `archive/handoffs-YYYY-MM.md` at the end of the month.

---

## Open handoffs

### HANDOFF → Senior Engineer · 2026-04-29 · OPEN (multi-task — sequence in this order)
**From:** Patrick (via COO)
**Subject:** Three priority tasks — bundle rename, substitution UI, add 6 new recipes
**Why:** Patrick made multiple decisions on 29 April that all queue up to Senior Engineer. Sequenced because each unblocks downstream work.
**What's done:** Patrick approvals + Product Designer specs.
**What's needed (in this order):**

1. **Rename bundle ID** `com.patricknasr.simmerfresh` → `com.patricknasr.hone` in `mobile/app.json` and `mobile/package.json`. Verify clean APK build. Write ADR (`docs/adr/NNN-bundle-id-rename.md`). Tell Patrick the Play Console steps for the next AAB upload (new app entry under new package name auto-creates).

2. **Implement Substitution UI + recipe-card photo-badge states** per Product Designer's specs at `docs/prototypes/substitution-sheet.html` and `docs/prototypes/recipe-card-states.html`. Use `@gorhom/bottom-sheet` (`BottomSheetModal`) for the SubstitutionSheet component. Derive `hasStagePhotos` from `steps.every(s => !!s.photo_url)` — no schema change needed. Badge text "Photos soon" (not "Stage photos coming soon"). See the handoff block in those HTML files for full spec.

3. **Add 6 new recipes** to `mobile/src/data/seed-recipes.ts` per DECISION-004:
   - Chicken schnitzel (Australian pub classic)
   - Easy chicken & vegetable stir-fry (generic Australian weeknight)
   - Beef lasagne (Australian household staple)
   - Roast lamb with rosemary & garlic (Sunday roast)
   - Fish & chips (Australian Friday classic)
   - Falafel (Levantine)
   Each must follow the standard schema (chef-attributed if possible — coordinate with Culinary Verifier on sources — substitutions populated, `whole_food_verified: true` where appropriate, Australian English, metric units, dual-axis categories). Block on Culinary Verifier to provide authoritative sources before populating chef attribution.

**Files touched:** `mobile/app.json`, `mobile/package.json`, `mobile/app/recipe/[id].tsx`, `mobile/src/components/SubstitutionSheet.tsx` (new), `mobile/src/components/RecipeCard.tsx` (or equivalent), `mobile/src/data/seed-recipes.ts`, `docs/adr/`
**Blocks:** All future AAB uploads (#1), v1 feature completeness (#2), photography of new showcase recipes (#3)

### HANDOFF → Patrick · 2026-04-29 · OPEN
**From:** COO
**Subject:** Confirm or amend launch date target
**Why:** Recommending push to 24 July 2026 from June. Reasoning in `docs/coo/launch-plan.md`.
**What's done:** New schedule drafted with milestones.
**What's needed:** Patrick says yes / amend / push back further.
**Files touched:** `docs/coo/launch-plan.md`, `docs/roadmap.md` (still to update)
**Blocks:** Roadmap update, all downstream sequencing

_(Substitution UI handoff superseded by the consolidated Senior Engineer multi-task handoff above.)_

### HANDOFF → Product Designer · 2026-04-29 · DONE
**From:** COO
**Subject:** Design the Substitution bottom-sheet + "Stage photos coming soon" badge
**Why:** Engineer needs visual specs before building. Must respect terracotta/olive/gold tokens and Playfair/Source Sans 3 type scale. Per DECISION-003, the badge is needed for ~18 non-launch recipes.
**What's done:** Both specs delivered 29 Apr 2026.
- `docs/prototypes/substitution-sheet.html` — interactive bottom-sheet prototype. Full flow: ingredient tap → sheet open → substitution select → confirm. All quality pill states (perfect_swap / great_swap / good_swap / compromise), hard_to_find notice, all spacing/token annotations, engineering handoff block.
- `docs/prototypes/recipe-card-states.html` — recipe card 3 states, recipe detail with/without stage photos, step placeholder, full spec tables. Badge is a dark-scrim pill ("Photos soon") bottom-right of card image — opposite corner from the existing difficulty badge. No collision.
**Key design decisions:**
- Badge text: "Photos soon" (not "Stage photos coming soon" — shorter, less internal-feeling)
- Derive `hasStagePhotos` from `steps.every(s => !!s.photo_url)` — no new schema field needed
- Dark scrim on badge (not sky/blue) so it reads on any photo colour
- Stage notice appears once in recipe detail (not repeated per step)
**Files touched:** `docs/prototypes/substitution-sheet.html`, `docs/prototypes/recipe-card-states.html`

---

_(Designer-to-engineer handoff folded into the consolidated Senior Engineer multi-task handoff above. Specs remain at the prototype paths for engineer reference.)_

### HANDOFF → Photography Director · 2026-04-29 · OPEN (URGENT — first shoot 3-4 May)
**From:** COO
**Subject:** Build shot lists for showcase 10 + hero-only for everything else
**Why:** Photography is the longest pole. Per DECISION-004, scope is now ~34 recipes — 10 showcase (full stage shots) + ~24 hero-only.
**What's done:** Brief at `docs/coo/specialists/photography-director.md`. Recipe library locked per DECISION-004.
**What's needed:**
1. **Showcase shot list** at `docs/coo/photography/shot-list-showcase.md` for the 10 showcase recipes (hero + ~6 stage shots each = ~60 shots). The 10 are: Roast Chicken, Spaghetti Bolognese, Spaghetti Carbonara, Butter Chicken, Thai Green Curry, Chicken Schnitzel, Smash Burger, Pan-Fried Fish (barramundi), Pavlova, Chicken Shawarma.
2. **Hero-only shot list** at `docs/coo/photography/shot-list-hero-only.md` for ~24 recipes — 7 from priority list (stir-fry, lasagne, roast lamb, fish & chips, hummus, pad thai, falafel) plus all existing seed recipes not in the showcase 10. One hero shot each, batchable in 1–2 dedicated weekends.
3. **Pre-flight checklist** Patrick uses every shoot weekend. One-page printable.
4. **Post-processing preset** documented (white balance, contrast, sharpening — so reshoots match).
5. **Schedule recommendation** — propose which 2 showcase recipes to shoot each weekend, ordered by which are easiest to get right first (build Patrick's confidence) and which need most attention.
**Coordination:** New showcase recipe (chicken schnitzel) needs to be in the seed library before its shoot weekend — coordinate with Senior Engineer on timing.
**Files touched:** `docs/coo/photography/shot-list-showcase.md`, `docs/coo/photography/shot-list-hero-only.md`, `docs/coo/photography/preflight-checklist.md`, `docs/coo/photography/post-processing-preset.md`
**Blocks:** First photo weekend (3-4 May 2026)

### HANDOFF → Culinary & Cultural Verifier · 2026-04-29 · OPEN (URGENT)
**From:** COO
**Subject:** Audit existing recipes + provide source recipes for 6 NEW additions
**Why:** v1.0 launch library expanded per DECISION-004. Now ~34 recipes need audit, AND 6 new recipes need authoritative sources before Senior Engineer can populate them.
**What's done:** Brief at `docs/coo/specialists/culinary-verifier.md`. Recipe library locked per DECISION-004.
**What's needed:**

1. **Provide source recipes for the 6 new dishes** that Senior Engineer needs to populate. For each, deliver: a chef-attributed source URL (or "traditional" framing if no chef is right), the ingredient list, the steps, plausible substitutions list, the cuisine and type categories, and Australian English check. Output to `docs/coo/culinary-research/<recipe-slug>.md`. The 6:
   - Chicken schnitzel (consider Adam Liaw or another modern AU chef)
   - Easy chicken & vegetable stir-fry (Bill Granger, RecipeTinEats Nagi, or "traditional Australian weeknight")
   - Beef lasagne (consider Marcella Hazan classic or modern AU)
   - Roast lamb with rosemary & garlic (consider Maggie Beer or "Sunday roast traditional")
   - Fish & chips (likely "Australian Friday traditional")
   - Falafel (Levantine — credit cuisine + region; specific chef optional)

2. **Audit pass** on all priority 17 recipes per the format in your brief. Output to `docs/coo/culinary-audit.md`. Required before launch.

3. **Audit pass** on remaining seed library recipes (musakhan, mujadara, kafta, fattoush, lamb shawarma, char kway teow, ramen, katsu, etc.) — same format. Especially check: no Israeli labels for Levantine; no fabricated chef attributions; Australian English everywhere.

**Sequence:** Item 1 first (Senior Engineer is blocked on it). Items 2-3 can run in parallel after.
**Files touched:** `docs/coo/culinary-research/`, `docs/coo/culinary-audit.md`, `mobile/src/data/seed-recipes.ts` (read-only), `docs/prototypes/hone.html` (read-only)
**Blocks:** Senior Engineer's recipe-add task (#1 above), Photography Director's showcase shoot for chicken schnitzel

### HANDOFF → QA Test Lead · 2026-04-29 · OPEN
**From:** COO
**Subject:** Stand up the smoke-test checklist v1
**Why:** Currently `docs/SMOKE-TEST.md` exists but isn't owned. We need it to be the gate before every build.
**What's done:** Brief written in `docs/coo/specialists/qa-test-lead.md`.
**What's needed:** Take ownership of `docs/SMOKE-TEST.md`, expand to cover: cold start time, scroll jank, dropped network mid-cook, TalkBack labels, 200% text scale, low storage, malformed user input.
**Files touched:** `docs/SMOKE-TEST.md`
**Blocks:** Internal Alpha track go-live (22 May 2026 milestone)

---

## Recently completed

_(Empty — no handoffs have been completed yet under this system. This is the first session running it.)_
