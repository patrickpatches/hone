# Session 12 — Issues Backlog & PM Oversight

**Opened:** 2026-04-25
**Trigger:** Patrick tested the working APK (session 11 build) on his phone and reported a series of UX gaps and confusions. App functions, but several flows are not yet ready for outside testers.

This document is the source of truth for what's wrong, why it's wrong, what we'll do about it, and what each fix collides with. It's organised so any future session can pick up the work without rediscovering the context.

---

## How to read this doc

Each item has the same shape:

- **What's wrong** — the symptom Patrick reported
- **Root cause** — what's actually broken in the code (file + line region)
- **What world-class apps do** — the pattern we're benchmarking against
- **Recommended fix** — concrete plan, not a vibe
- **Touches** — files that change, so we can see conflicts before they happen
- **Risk / blast radius** — what could go wrong, what to test
- **Priority** — P0/P1/P2/P3

Priority key:
- **P0** — blocks giving the app to anyone else; everyone hits this
- **P1** — workflow gap that hurts daily use
- **P2** — model-level rework; needs a thinking pass before code
- **P3** — polish, small surface area

---

## Status snapshot at session 12 open

App on phone: **functional**. Core loop (browse → cook) works. Cook mode, swap sheet, shopping list, pantry matching, meal plan all render and store data. Real friction lives in:

- The **pantry tab** (search/add confusion + dirty ingredient data)
- The **add-recipe form** (rigid, asks the wrong questions)
- The **plan tab** (right place to see meals, wrong place to add them)
- The **recipe model** (servings is the wrong unit for tortillas, sourdough, anything you bake by yield)
- The **clear-filter affordance** on Kitchen (low contrast, low-priority styling)

No data corruption, no crashes, no Play-Store-blocking issue. These are all UX problems on top of a working app.

---

## P0 — Pantry: search-and-add are two boxes pretending to be one feature

### What's wrong
Two near-identical text fields stacked in the pantry header. One says "Search ingredients…", the other says "Add an ingredient…" with an Add button. Users don't know which one to type into. Patrick's words: "Search ingredients and add ingredient is confusing."

### Root cause
`mobile/app/(tabs)/pantry.tsx`, lines 314–416 — two separate inputs:
- Lines 315–350: search input (filters the list)
- Lines 352–416: add input (creates a custom pantry item)

They look almost identical (same border, same radius, same font). The only visual difference is the Add button on the right side of the second one. The mental model "this is for searching what's already there" vs "this is for adding something new" is invisible until the user fails.

### What world-class apps do
- **Apple Reminders / Google Keep:** one input. As you type, it filters the list AND offers an "Add as new" affordance at the bottom of the suggestions. One field, one action, branched by context.
- **Notion databases:** one input, with autocomplete dropdown of existing entries. New value committed via Enter only if it's not already there.
- **Things 3 / Todoist:** the gold standard — type-ahead with "Press Enter to add new" inline at the bottom of the result list.

### Recommended fix
Single ingredient input box at the top of the pantry. As the user types:
1. The pantry list filters live (current search behaviour).
2. If their query doesn't exactly match any existing pantry item (case-insensitive, plural-aware), show an "+ Add '{query}' to pantry" row pinned to the top of the list. Tap it or press Enter to add.
3. The Add button disappears entirely.

This collapses two affordances into one input with two outcomes. Mental load drops from "decide which box" to "type, then choose what's there or add new."

Bonus: combine with the deduplication fix (next item) and the "Add" row only appears for genuinely new ingredients — never for "yellow onion" when "yellow onions" already exists.

### Touches
- `mobile/app/(tabs)/pantry.tsx` — `Header` component (lines 235–419), main render
- `mobile/src/data/pantry-helpers.ts` — needs a new `findExistingMatch(query, items)` that uses `normalizeForMatch`
- HTML prototype `hone.html` — port the same fix once Expo proves out

### Risk / blast radius
Low. Self-contained UI change, no schema change. Existing keyboard-search flow continues to work; we're just adding the "Add" suggestion when no match is found.

### Test
- Type "yellow" → list filters to onions, garlic, capsicum etc.
- Type "kombu" (not in seed) → "+ Add 'kombu'" appears, Enter adds it
- Type "yellow onion" → matches existing item, no Add suggestion
- Type "yellow onions" → ALSO matches existing "yellow onion" (plural-aware)

### Priority
**P0**

---

## P0 — Pantry: duplicate ingredients ("Yellow onion" + "Yellow onions" + 50 others)

### What's wrong
The pantry has multiple rows for what is the same thing — same ingredient with different surface forms. Patrick called it out specifically: "Yellow onions and Yellow onion and many many more."

### Root cause
`mobile/src/data/pantry-helpers.ts` — `initializePantryItems()` walks every recipe's ingredients and creates a pantry row per unique cleaned name. The cleaning function (`cleanIngredientName`) strips parentheticals and prep notes but does NOT normalise:

- Singular vs plural ("onion" / "onions")
- Capitalisation drift (already handled, but worth verifying)
- Pluralised quantities ("1 onion" vs "2 onions" — fine because amount is parsed separately, but the noun stem isn't)
- Compound forms ("ghee or clarified butter" treated as a single ingredient name — see next item)

There IS a `normalizeForMatch()` function — and it's used for *matching* recipes against pantry — but it isn't used at the *seeding* step where dedup should happen.

### What world-class apps do
- **Yummly / Paprika:** ingredient databases use a curated synonym map. "scallion" = "spring onion" = "green onion" all map to one canonical ID.
- **AnyList:** lemmatisation library reduces words to their stem at insert time.
- **Google Keep shopping lists:** simpler — they suggest existing items as you type, using fuzzy match.

### Recommended fix
Three layers, in order of effort:

1. **Cheap win, ship first:** apply `normalizeForMatch()` (or a stricter `normalizeForSeed()` that strips trailing 's') as a dedup key during `initializePantryItems`. Use the longest seen surface form as the display name.
2. **Medium win:** maintain a small canonical synonym map for the ~30 most common doubles in the current 45-recipe library (scallion/spring onion, coriander/cilantro safety net even though we're AU-only, etc.).
3. **Right answer (post-launch):** every ingredient gets a stable `canonical_id` in the recipe schema. Pantry deals only in canonical IDs. Display name comes from a lookup table. This is a bigger change and probably a v1.1 thing.

Ship layer 1 + layer 2 in this round. Layer 3 goes on the post-v1 roadmap.

### Touches
- `mobile/src/data/pantry-helpers.ts` — `initializePantryItems`, new `INGREDIENT_SYNONYMS` table
- `mobile/db/database.ts` — possibly a one-off migration to merge existing duplicate rows on app launch
- HTML prototype `hone.html` — port

### Risk / blast radius
Medium. The migration needs care — if Patrick already has "Yellow onion" toggled "got it" and "Yellow onions" toggled off, what happens when they merge? Decision: OR the `have_it` flag (true if either source is true). Custom user-added items are never auto-merged.

### Test
- Fresh DB → only one "yellow onion" row (not two).
- Install over old DB with both rows present → migration merges, single row remains, `have_it` is true if either was.
- Recipes that referenced either form still match the merged row.

### Priority
**P0**

---

## P0 — Recipe data: "Ghee or clarified butter" is two ingredients in one line

### What's wrong
At least one recipe's ingredient list has lines like "Ghee or clarified butter" or "Ghee or unsalted butter" — that's an inline substitution disguised as a single ingredient name.

### Root cause
This is a **data hygiene problem**, not a code problem. In `mobile/src/data/seed-recipes.ts`, an author (probably me from a prior session) wrote the substitution into the name field instead of using the `substitutions[]` array that the schema already supports.

Patrick is right that this is wrong on multiple axes:
- The pantry now thinks "ghee or clarified butter" is one ingredient.
- The shopping list says "1 tbsp ghee or clarified butter" rather than just "1 tbsp ghee" with a swap option.
- The whole point of the `substitutions` system (Phase 5) is to handle alternatives properly. Inlining "or X" bypasses it.

### Recommended fix
Audit `seed-recipes.ts` for any ingredient name containing " or " (case-insensitive). For each hit:
1. Pick the **canonical** ingredient (the one we'd recommend by default).
2. Move the alternative into `substitutions[]` with a proper note (texture/flavour change).
3. Confirm the recipe instructions reference the canonical ingredient by name.

Add a validator step (`mobile/.validate-seed.js` already exists — extend it) so this never re-creeps in.

### Touches
- `mobile/src/data/seed-recipes.ts` — data audit and edits
- `mobile/.validate-seed.js` — add a "no 'or' in ingredient names" lint rule
- `hone.html` — same audit on the embedded recipe data

### Risk / blast radius
Low (data only, no schema or behaviour change), but tedious — needs a careful pass through all 45 recipes.

### Test
- Seed validator passes.
- Search "or" across `seed-recipes.ts` — zero hits in `name:` fields.
- Each previously-conflated ingredient now has the alternative in `substitutions[]`.

### Priority
**P0** — bundle with the other pantry fixes; same release.

---

## P0 — Add-recipe form: too rigid, asks the user the wrong questions

### What's wrong
Patrick: "It's too rigid of a system. It's an easy format for an app to convert to its standardised recipe format but not for the user who is adding the meal. Don't get them to write the difficulty assessing their own meal — that is subjective."

### Root cause
`mobile/app/(tabs)/add.tsx` is a developer-shaped form, not a user-shaped form. It maps 1:1 to the internal `Recipe` schema, which is the wrong abstraction to expose. Specific problems:

1. **Forced subjective input**: difficulty selector (Easy/Intermediate/Involved) — users can't reliably self-rate their own recipe. They will pick "Easy" because it's first and looks safe. Or whatever feels modest. Garbage data.
2. **Per-ingredient form rows with five fields each**: amount, unit, name, prep note, fixed-toggle. For a typical 12-ingredient recipe that's 60 fields. A wall.
3. **Per-step form rows**: title, content, optional stage_note, optional why_note. The stage and why notes are gold for cook mode but most home cooks have no idea what they are.
4. **No paste-from-text path**: the most common way someone adds a recipe is they have a screenshot from Instagram or a block of text from a friend. Our form forces them to manually disassemble it.

### What world-class apps do
- **Paprika:** clipboard-detect a URL → web import; otherwise free-text paste with smart parsing into structured fields.
- **Whisk:** photo-to-recipe (OCR + LLM parse), or web import, or manual.
- **Apple Notes / Notion:** free text, no structure required, formatting is up to the user.
- **Mealtime apps that get this right:** start ultra-simple. Three fields: name, ingredients (one big text area, line per ingredient, parsed), method (one big text area, paragraphs become steps).

### Human-psychology principle at stake
**Cognitive load and self-attribution.** Asking a non-expert to classify their own work (difficulty) creates anxiety and produces noisy data. Asking them to fill 60 form fields when they could paste a recipe in 5 seconds is friction theatre. The app should infer what it can and ask only what it must.

### Recommended fix (two-layer)
**Layer A — paste-and-parse mode (default):**
- One field: recipe name.
- One field: serves/yields (smart unit picker — see "Recipe yield" item below).
- One field: total time.
- **One big text area** for ingredients (one per line, free format).
- **One big text area** for method (paragraphs become steps automatically).
- Save.

The app parses the ingredient lines on save: pull amount + unit + name with a regex. If parsing fails, store the line verbatim (graceful degradation — still usable, just doesn't scale). Same for steps: split on blank lines or numbered prefixes.

**Layer B — "refine" view (optional, after first save):**
- Open the just-saved recipe and offer a "polish" sheet: review parsed ingredients, fix any that didn't parse, add prep notes, add doneness cues. Optional, never blocking.

**What we DROP from the current form:**
- Difficulty selector (we'll infer from time + step count, or just don't show it for user-added recipes).
- Per-ingredient fixed-toggle (default to "linear" for user adds; advanced flag only in refine view).
- Stage/why notes (only available in refine view, not in the create flow).

### Touches
- `mobile/app/(tabs)/add.tsx` — total rewrite of the form
- `mobile/src/data/types.ts` — possibly a new `recipe.created_via: 'paste' | 'form' | 'imported'` so we know what context produced the data
- New utility: `mobile/src/data/parse-pasted-ingredients.ts` (regex-based parser, ~80 LOC)
- New utility: `mobile/src/data/parse-pasted-method.ts`
- HTML prototype: equivalent rebuild

### Risk / blast radius
High in scope (whole screen rebuild), low in technical risk. Existing recipes in DB are unaffected because we're only changing the *create* path, not the schema.

### Test
- Paste a 12-ingredient recipe → all 12 parse cleanly.
- Paste a recipe with weird units ("a small handful of rocket") → falls back to verbatim display, still saves.
- Save with empty ingredient text → validation says "add at least one ingredient."
- Skip difficulty → recipe shows no difficulty badge (or "Home cook" / no badge at all).

### Priority
**P0** — one of the two screens external testers will most quickly judge the app on. Worth getting right before sharing.

---

## P1 — Plan tab: right place to *see* meals, wrong place to *add* them

### What's wrong
Patrick: "Plan is too confusing. Should be add your meal from Kitchen/Home and it populates in plan potentially?"

### Root cause
`mobile/app/(tabs)/plan.tsx` makes the Plan tab the **starting point** for adding a meal: tap a day → modal opens → search recipes → pick. That's three taps on a search you just left.

The natural mental model: I'm browsing recipes (Kitchen tab) → I see one I want to make Wednesday → I add it to Wednesday from there. The Plan tab should be where you *check* and *manage* the plan, not the front door for adding to it.

### What world-class apps do
- **HelloFresh / Mealime:** "Add to plan" button on every recipe card and on the recipe detail page. Day picker drops down inline.
- **Plan to Eat:** drag-from-recipe to calendar (web/iPad). On mobile they fall back to a "Plan" sheet from recipe detail.
- **Apple Calendar / Google Calendar:** classic precedent — events get added from contextual surfaces (a contact, an email), not only by opening the calendar.

### Recommended fix
1. **Add an "Add to plan" button on every RecipeCard.** Calendar icon on the card, top-right — primary placement after favorite. Opens a small day-picker sheet (this week's days, with "+ next week" if needed).
2. **Add an "Add to plan" button on the recipe detail screen.** Sticky in the action zone, alongside Cook / Favorite / Share.
3. **Keep the Plan tab's existing "tap a day → pick recipe" flow** as a secondary path — useful when planning the whole week ahead. But it stops being the only way.
4. **Plan tab visual hierarchy update:** lead with "this week's meals" when populated; show the empty-state guide ("tap any day to plan") only when empty.

### Touches
- `mobile/src/components/RecipeCard.tsx` — add calendar icon, wire up sheet
- `mobile/app/recipe/[id].tsx` — add Add-to-plan action
- `mobile/app/(tabs)/plan.tsx` — keep existing flow, soften the empty-state messaging
- New shared component: `mobile/src/components/AddToPlanSheet.tsx` (used in 3 places)
- HTML prototype: same pattern

### Risk / blast radius
Low. Adding new entry points to an existing function. Existing Plan tab flow is unchanged.

### Test
- From Kitchen tab → tap calendar icon on card → pick day → check Plan tab shows the meal.
- From recipe detail → Add to plan → pick day → confirm.
- From Plan tab → tap day → pick (existing flow still works).
- Add same recipe to two different days — both entries should exist independently.

### Priority
**P1** — ships in the same release as the pantry fixes if scope allows.

---

## P1 — Kitchen → Plan and Recipe → Plan: linked to the item above

This is the same fix as the previous item, called out separately because Patrick listed both:

> Kitchen
> * Cant add meal to plan from main window
> * cant add meal to plan from the Recipe

Both are addressed by the AddToPlanSheet implementation above. Tracked as one workstream to avoid double-counting.

**Priority:** P1 (rolled into the Plan-tab fix above).

---

## P2 — Recipe portions / leftovers / yield model

### What's wrong
Patrick: "Portions are a bit confusing — there must be a better way. Maybe how many leftovers do you want, but I'm not sure. Research this. Flour tortillas is an example of things that can't have portions per se, because you are making tortillas. What if I roll out my dough to 40g per tortilla? How many portions does one person eat of tortillas? So these types of examples and others need a rethink, because it works for some types of foods but not others. Sourdough should be 'makes one'. Some things need amounts."

### Root cause
The current schema (`mobile/src/data/types.ts`) has only `base_servings: number`. Every recipe is forced into a "serves N people" frame. That breaks for:

- **Yield-by-count:** tortillas, dumplings, samosas, cookies, bread rolls. The natural unit is the count, not the serving.
- **Yield-by-loaf:** sourdough, focaccia, banana bread. Makes one. How many people that feeds is downstream.
- **Yield-by-batch:** stocks, ferments, pickles, sauces. Makes ~1.5 L. People-served depends on what you do with it.
- **Standard servings:** main meals, soups, salads — current model works for these.

Forcing a tortilla recipe to claim "serves 4" produces nonsense scaling: doubling to "serves 8" gives you 16 tortillas when actually you wanted 24. The user's actual question is "how many tortillas do I want to make?"

The leftovers question is a related but separable feature: HelloFresh and others let users say "cook for 4 + 2 lunches tomorrow" and the recipe scales accordingly. That's value, but it depends on a yield model that's already correct.

### What world-class apps do
- **Serious Eats / NYT Cooking:** show "yields about 12 tortillas" or "makes one 9-inch loaf" — author-written, not computed.
- **King Arthur Baking:** explicit yield types. Bread recipes say "makes 1 loaf"; cookies say "makes about 36 cookies."
- **HelloFresh:** servings only, but their recipes are all main meals so the model fits. They don't try to scale baking.
- **Paprika / Whisk:** support a free-text yield ("Makes 8 burritos") that's not computable but at least honest.

### Recommended approach (research → schema → UI)
**Step 1 — research pass (no code, ~1 session):**
- Audit all 45 current recipes. Tag each with the yield type that fits. How many fall into each bucket?
- Read 5–10 recipes from Andy Cooks, Weissman, Joshua, Bourdain, etc. for each bucket — confirm we're modelling reality.
- Decide: do leftovers belong in the same model or a separate field?

**Step 2 — schema:**
```ts
type YieldType = 'servings' | 'pieces' | 'loaf' | 'batch';

interface RecipeYield {
  type: YieldType;
  amount: number;          // count: 12 tortillas, 1 loaf, 4 people
  unit?: string;           // "tortillas" / "loaf" / "L of stock"
  scales: boolean;         // false for "1 loaf" — can't have 1.5 loaves
  per_person_hint?: number; // optional — "an adult eats ~3 tortillas"
                            //  used by the leftover/scaling UI
}
```

`base_servings` becomes a deprecated alias, computed from yield where possible.

**Step 3 — leftovers feature:**
- For `type: 'servings'` recipes, show "Cook for [4] + [0] leftover meals" stepper.
- For `type: 'pieces'` recipes with a `per_person_hint`, the UI translates: "Cooking for 4 (~12 tortillas) + 2 leftover lunches (~6 tortillas) = makes 18."
- For `type: 'loaf'` and `type: 'batch'`, leftovers don't apply — just show the yield.

**Step 4 — UI on recipe detail:**
- Servings stepper becomes a "make how much?" UI that adapts to yield type.
- Tortilla recipe shows: "Makes 12. ▼ Want a different amount?" → reveals stepper.
- Sourdough shows: "Makes 1 loaf." No stepper. (Or, in v1.1, an "x2 / x3" toggle for advanced bakers — not v1.)
- Standard meal shows the existing servings stepper, plus a leftovers add-on if `per_person_hint` is set.

### Touches
- `mobile/src/data/types.ts` — `RecipeYield` interface, deprecate `base_servings`
- `mobile/src/data/seed-recipes.ts` — every recipe re-tagged (45 entries)
- `mobile/src/components/ServingsSelector.tsx` — becomes `YieldSelector.tsx`
- `mobile/app/recipe/[id].tsx` — render adapts to yield type
- `mobile/db/schema.ts` and `mobile/db/seed.ts` — column rename / migration
- HTML prototype: same migration

### Risk / blast radius
**High.** Schema migration touches every recipe, every screen that shows a recipe, and the meal-plan + shopping-list code that scales by servings. This needs a Plan and an ADR before code. Don't bundle with the P0 fixes.

### Test
- Tortilla recipe shows "Makes 12, scaled from base of 12."
- Sourdough shows "Makes 1 loaf" with no stepper.
- A standard meal recipe still scales 2 → 4 servings cleanly.
- Shopping list maths still works for all yield types.

### Priority
**P2** — important but not next release. Demands a research session and an ADR (`docs/adr/003-recipe-yield-model.md`) before implementation.

---

## P3 — Clear-filter button is hidden

### What's wrong
Patrick: "The clear filter button is in a hidden and poor location or presented poorly."

### Root cause
`mobile/app/(tabs)/index.tsx` lines 407–437 — the button is grey-on-cream, font size 11px, padding 12×6, sitting under the cuisine row. It's a footnote when it should be a control. Users who hit a zero-result state by accident don't see how to recover.

### What world-class apps do
- **Airbnb, Booking.com:** when filters are active, a count appears in the filter button itself ("3 filters active") — a pill, full-color, in the primary toolbar. Clearing is one tap and visually obvious.
- **Apple Music, Spotify:** when filtering, an X badge sits inside or next to the filter chip — same place the filter was applied.

### Recommended fix
1. **Promote the visual weight:** change from neutral pill to coloured pill (`tokens.paprika` background, cream text, font size 12, padding 14×8). Make it look like an action, not a label.
2. **Make it a chip-rail:** show one chip per active filter ("× Quick", "× Italian", "× Pasta"). Tap any chip to clear that one. Tap "Clear all" at the right.
3. **Anchor it visually:** place it directly under the Mood-chip row, not under the cuisine row. That's where the user's eye lands when they realise they want to back out.

### Touches
- `mobile/app/(tabs)/index.tsx` — `ListHeader` component
- HTML prototype: same fix

### Risk / blast radius
Trivial. Pure UI change, no logic.

### Test
- Apply Quick filter → "× Quick" chip visible.
- Apply Quick + Italian + Pasta → three chips + "Clear all".
- Tap "× Quick" → only Quick clears, others remain.
- Tap "Clear all" → all clear.

### Priority
**P3**

---

## File-system housekeeping (this session)

Done in this session:
- ✅ Today's snapshot at `docs/archive/backup-2026-04-25/` (CLAUDE.md, hone.html, index.html, 4 tab screens, recipe detail, seed-recipes, pantry-helpers, types).
- ✅ Simmer Fresh rename leftovers archived to `docs/archive/simmer-fresh-rename-leftovers/`. The old XLSX dev log and `simmer-fresh.html` are out of the project root.

Still needs Patrick's hand (Windows-side; file-system ACL prevented WSL bash from removing them):

1. **Stale Claude Code worktrees** — delete in Windows Explorer:
   - `mobile\.claude\worktrees\busy-kirch-162ad3`
   - `mobile\.claude\worktrees\festive-chatterjee-a0dc4f`
   - `mobile\.claude\worktrees\silly-williams-21445f`
   - These are leftover full-project clones from prior parallel sessions. Together they're ~9 MB and serve no purpose now.

2. **Stale validate-tmp directories** — delete in Windows Explorer:
   - `mobile\.validate-tmp`
   - `mobile\.validate-tmp-1776695510762`
   - `mobile\.validate-tmp-1776800766321`
   - These are seed-validator scratch dirs that didn't get cleaned up. ~400 KB each. Future validator runs will recreate the canonical `.validate-tmp/` if needed.

3. **Old stale lock files:** `.~lock.Simmer_Fresh_Development_Log_FY2025-26.xlsx#` at the project root — held by the file system. Will clear itself when the file system next syncs, or right-click → delete in Explorer.

After those three are gone, project root is fully clean: just CLAUDE.md, the Hone XLSX log, hone.html, index.html, mobile/, docs/, run-android.bat, .gitignore, .github/.

---

## Suggested ordering for upcoming sessions

**Next session (Session 13) — P0 cluster, ship in one release:**
1. Audit `seed-recipes.ts` for "or" in ingredient names → fix the data
2. Add `INGREDIENT_SYNONYMS` table + dedup logic in `pantry-helpers.ts`
3. Refactor pantry header into a single search-or-add input
4. Polish Clear-filter to a chip rail (small, ride along)

That's a tight focused release with one shared theme: "the pantry actually works now." Worth shipping to APK + the HTML prototype together.

**Session 14 — P1 cluster, Add-to-plan workflow:**
1. Build `AddToPlanSheet` shared component
2. Wire into RecipeCard, recipe detail, keep Plan tab existing flow
3. Test end-to-end: card → plan → shopping list

**Session 15 — P0 add-recipe rebuild:**
1. Layer A paste-and-parse form
2. Optional Layer B refine sheet on follow-up sessions
3. Validator update + tests

**Session 16+ — P2 yield model:**
1. ADR 003: recipe yield model
2. Research pass against Andy Cooks / Weissman / Ramsay sources
3. Schema migration + UI adaptation
4. Re-tag all 45 recipes

This sequencing minimises conflicts: each session touches a roughly independent slice of the code, and we don't have two big refactors in flight at the same time.

---

## Conflict matrix (high-level — which fixes touch which files)

| File | P0 pantry | P0 add-form | P1 add-to-plan | P2 yield | P3 clear-filter |
|---|---|---|---|---|---|
| `pantry.tsx` | ✓ | | | | |
| `pantry-helpers.ts` | ✓ | | | | |
| `seed-recipes.ts` | ✓ (data) | | | ✓ (re-tag) | |
| `add.tsx` | | ✓ | | | |
| `RecipeCard.tsx` | | | ✓ | | |
| `recipe/[id].tsx` | | | ✓ | ✓ | |
| `plan.tsx` | | | ✓ | | |
| `index.tsx` (Kitchen) | | | ✓ (card hook) | | ✓ |
| `types.ts` | (synonyms only) | (created_via flag) | | ✓ | |
| `db/schema.ts` | (migration) | | | ✓ | |
| `hone.html` | ✓ | ✓ | ✓ | ✓ | ✓ |

Reading: P0 pantry and P2 yield both touch `seed-recipes.ts` — sequence them so the yield migration happens AFTER the synonym dedup is in place (otherwise re-tagging fights with cleanup).

`hone.html` is touched by everything because it's the HTML prototype mirror; that's expected and intentional (per CLAUDE.md, HTML and Expo are kept feature-paired).

---

## Open questions for Patrick (next session, before code)

1. **Yield model — research first or build first?** I want to do a research session (no code) to audit our 45 recipes and confirm the four buckets (servings / pieces / loaf / batch) cover everything. Confirm this is acceptable use of a session.
2. **Add-to-plan default day:** when the user taps "Add to plan" from a recipe card, do you want it to default-select today, or open the day picker blank?
3. **Difficulty in user-added recipes:** drop the field entirely, or auto-infer from time + step count and show as faint info ("~Easy" with a tilde to convey "estimated")?
4. **Worktree + validate-tmp cleanup:** confirm you want those folders gone — once you delete them in Explorer, no recovery, but they are 100% redundant.

---

*This doc is the canonical backlog. Any future session that picks up Hone work should read this first.*
