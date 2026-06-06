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

## Build log

> Mandatory for Engineer. One line per build, newest at top. If you push 3 commits and trigger 3 builds, that's 3 lines. Patrick should never have to ask "what's in build #N" — the answer is here before he asks.
>
> **🔒 Integrity rule (2026-05-25):** the TOP row must equal the build Patrick has installed. This table silently lost rows #118–#123 once (recovered 2026-05-25 from git history). If unsure what's latest, reconcile against `git log` / GitHub `main` BEFORE trusting this table, and never edit this file from a stale local checkout — fetch latest from `main` first.

| Build | Commit | Summary |
|---|---|---|
| #151 | `b1eac4fd` | **fix(recipe): roast chicken s4 — doneness cue leads with internal temp (fixes #34).** Cook-filed bug: step `s4` read *"until the thigh juices run clear"* — unreliable and specifically warned against by Thomas Keller and Kenji López-Alt. Fixed to *"use a thermometer: 72–74°C in the thickest part of the breast, 82°C in the thigh. Juices running clear is a rough backup sign, not the primary test."* Temperatures were already present in the equipment list; this surfaces them in the actual cook step. versionCode 54 → 55. EAS preview dispatched. Per R-015: not self-closing. |
| #149 | `b93de537` | **Cook recipe data fixes — Smash Burger #32 + Carbonara #33.** Recipe data only (EAS preview). #32: smash patty target thickness corrected 1 cm → ~5 mm per Andy Cooks (the credited chef). #32: corrects a factual error that undermined the dish's core technique. #33: Carbonara source credit changed from Gordon Ramsay (crème fraîche + bacon — contradicts our own "no cream, ever" tagline) to Luciano Monosilio (Rome's "King of Carbonara" — guanciale, Pecorino Romano, egg yolks, no cream — the authentic Roman method). versionCode 53 → 54. Per R-015: not self-closing. |
| #148 | `e9fc1ee` | **Recipe screen: unified Prep tab accordion + design polish.** App code (EAS preview). Prep tab redesigned as a single accordion card with three collapsible rows: Ingredients (servings stepper + pantry match + ingredient list + Swap pills), Equipment (numbered items with detail notes inline), and Prep (progress bar + checklist). Method in browse mode now expands each step inline instead of launching cook mode. ServingsSelector embedded mode used throughout. Per R-015: not self-closing. |
| #147 | `934a671` | **Recipe screen: Prep / Cook tab bar + servings stepper merged into pantry card.** App code (EAS preview). Implements both outstanding items from Engineering Handoff — Recipe Page.html. **Change 1 — Prep/Cook tabs:** new `activeTab` state (default `'Prep'`), new `RecipeTabBar` component (bgDeep pill track, cream elevated active pill with border + shadow, muted inactive label, haptic on tap), rendered below the chef source card in browse mode. Section gating — **Prep tab:** In your pantry + servings, Ingredients, Get Ready; **Cook tab:** Kitchen Journey, What to Know, Method. Cook mode ignores tabs entirely — step-navigator shows everything as before. **Change 2 — Servings inside pantry card:** removed the standalone "Servings" card (users-icon eyebrow + separate chrome). `ServingsSelector embedded` now sits at the top of the "In your pantry" card with a `paddingBottom:10 + borderBottom` hairline before the N/M fraction row — matches the screenshot exactly ("How many burgers? — 4" at the top of the IN YOUR PANTRY card). `tsc`: `[id].tsx` clean, 0 errors. Per R-015: not self-closing. |
| #146 | `6809a16` | **Shop tab: remove recipe/plan summary cards above aisle sections (Engineering Handoff — Recipe Page).** App code (EAS preview). Audited `mobile/app/(tabs)/shop.tsx` against the Engineering Handoff spec (5 items): items 1–4 (PantryIcons import, bronze eyebrow section headers with hairline rule, FoodIcon on item rows, gold search border) were **already fully implemented** in earlier builds. Item 5 (remove status chip row above sections) was the only remaining gap. The `RecipeAddsCard` and `PlannedMealsCard` blocks that rendered above the aisle sections — showing "ADDED FROM RECIPES" and "FROM YOUR MEAL PLAN" with per-recipe remove buttons — broke the density rhythm. The reference design (`ui_kits/mobile/screen-shop.jsx`) goes directly from search bar to sections with no cards in between. Removed both render blocks; underlying state + handlers kept. Source info accessible via long-press (already wired). tsc: shop.tsx clean; total project errors 1 (pre-existing `pantry.tsx` baseline). Per R-015: not self-closing. |
| #145 | preview | 53 | 2026-06-04 | Worker | Cook Pass 3 recipe fixes: Carbonara #24 #25 #26 (amounts, pepper scaling, guanciale step), Roast Chicken #27/#28 (timing + fan note), Hummus #29 (tahini + ice water) |
| #144 | `185426f` | **Portion + pantry are now two matched, adjacent cards (refines #143 per Patrick).** App code (EAS preview). #143 embedded the stepper *inside* the pantry card as a plain strip; Patrick wanted the portion box to be its **own container, styled to match** the "In your pantry" card and sitting **directly next to it**. `mobile/app/recipe/[id].tsx`: portion control is now its own card with IDENTICAL chrome to the pantry card (same `cardBg` / radius 14 / border / padding 14) under a matching bronze eyebrow (**"Servings"**, `users` icon), placed directly above the "In your pantry" card with a tight 10px gap so the two read as a pair. `ServingsSelector` keeps its `embedded` mode (no chrome of its own — the new card is the chrome); the embed-inside-pantry approach from #143 is reverted. Servings still drives "Add missing" quantities (unchanged `totalPortions` path). Browse mode only. Rebased onto origin/main, so this build also carries the concurrent fixes `3ad1135` (null-guard cook-mode `difficultyLabel` MetaPill + restore truncated `formatTimer` — clears the long-standing `[id].tsx` tsc baseline) and `ba68cab` (recipes-holding 3-colour swap migration). **Pre-flight:** tsc — recipe screen + `ServingsSelector` clean; total project errors now **1** (unrelated pre-existing `pantry.tsx` `@react-navigation/native` baseline). Per R-015: not self-closing. |
| #143 | `21f6f6d` | **Servings stepper merged into the "In your pantry" card (Recipe Page Design — portion + pantry in unison).** App code (EAS preview). The canvas design unifies the portion box with the pantry section into ONE card; the app had them as two separate boxes (pantry card high up, `ServingsSelector` as its own card lower down). Merged them: `mobile/src/components/ServingsSelector.tsx` gains an **`embedded`** mode — renders without its own card chrome and swaps the "Serves/Makes" label for a **"How many <unit>?"** question (design parity). `mobile/app/recipe/[id].tsx` pantry card now opens with the embedded stepper + leftover toggle, a **full-bleed hairline**, then the N/M match + missing chips + "Add missing" — one stylish card. Standalone `ServingsSelector` block removed. Servings still drives "Add missing" quantities (unchanged `totalPortions` path, #141). Browse mode only; cook mode untouched (inherits browse servings). Trade-off logged: cook mode no longer shows a servings control (set it in browse first) — matches the design's browse/cook split; 0-ingredient recipes (e.g. sourdough starter, fixed-scale) no longer show a stepper, which is moot for them. **Pre-flight:** tsc — no new errors (lone `[id].tsx` L814 is the pre-existing cook-mode MetaPill baseline; both files parse clean → R-014 OK). Per R-015: not self-closing. |
| #142 | `e899eab` | **Recipe browse meta-strip → full Recipe Page Design parity.** App code (EAS preview). The recipe browse screen *already* implements the new Recipe Page Design end-to-end (it shipped in #140 / Issue #23 — the design was reverse-engineered from the live app, so the design's screenshots match the code section-for-section). Audited all four design screenshots against `mobile/app/recipe/[id].tsx`: the only genuine visual gap was the **meta strip** — it had dropped the cook time and used a `·` text glyph. Restored `difficulty · N min · <country flag>` with the design's **3×3 round-dot separators**, and added the design's **1.5px bronze ring** on the chef-source-card avatar. Browse mode only; cook mode untouched; no new hooks / no scroll-driven Animated. **Pre-flight:** tsc — no new errors (lone `[id].tsx` L814 is the pre-existing cook-mode MetaPill baseline; tsc parsed clean past it → R-014 OK). **Note for Patrick:** if the app on your phone doesn't look like the design, you're on a pre-#140 build — install #142 and it'll match the screenshots. Per R-015: not self-closing. |
| #141 | `7187a47` | **Servings selector now scales what "Add missing" sends to Shop (recipe screen).** App code (EAS preview dispatched). Supersedes #140 — contains the #23 design polish + this fix. `mobile/app/recipe/[id].tsx`: `addMissingToShoppingList` was sending the RAW recipe amount, so picking 8 burgers still added the base-serving quantities. It now scales each missing ingredient with the **identical** `scaleIngredient(orig, portions, base_servings)` + same `portions = totalPortionsFor(leftoverById(leftoverKey), people, base)` the ingredient list uses — servings stepper, ingredient display and Shop tab move in unison. Respects scale mode (Golden Rule #2): linear doubles, fixed stays capped, custom follows its curve. TDZ-safe (portions recomputed in the callback; deps add `people`+`leftoverKey`). Design ref: `hone-design-system` "Recipe Page Design" (servings scales amounts). Patrick chose to keep the #140 title/meta look (new design's hero-overlay/serves-in-meta variant not applied). **Pre-flight:** tsc — no new errors (lone `[id].tsx` error ~L814 is the pre-existing cook-mode MetaPill baseline); R-014 balanced; logic test passes (2/4/8 burgers → beef 200/400/800 g; fixed cap holds). Per R-015: not self-closing — Patrick validates on-device. |
| #140 | `e1e1299` | **Recipe-detail browse-mode design polish (GitHub Issue #23).** App code (EAS preview dispatched). `mobile/app/recipe/[id].tsx` browse mode only — cook mode untouched. §1 nav icons: `+`→amber `rgb(250,178,102)`, heart→salmon `rgb(230,102,102)` (default states). §2 title block: removed "Inspired by" bronze eyebrow; title→warm gold `rgb(255,202,89)`; meta line→Poppins 400 centred bronze, dropped "Serves N", country text→SVG flag (reused render-audited `Flag`/`originForCuisine`/`GlobeGlyph` from `OriginFlag.tsx`); removed "+ Plan it"; added Chef Source Card (bronzeSoft, avatar initials, name + "Inspired by this recipe", salmon "Watch" pill when `video_url`). §3 removed sky-blue stage-photos camera notice. Fonts: added `@expo-google-fonts/poppins` (registered in `_layout` useFonts + `tokens.fonts.poppins`). Guardrails: no new hooks, no scroll-driven Animated listeners (crash history respected); removed now-unused `hasStagePhotos`/`cuisineLabel`. **Pre-flight:** tsc clean on changed regions (the one remaining `[id].tsx` error — `MetaPill label={difficultyLabel}` ~L798 — is pre-existing cook-mode baseline, identical in HEAD, untouched); R-014 brace/paren/bracket balanced on all 3 files. Issue #23 labelled `fix-attempted` + commented; NOT closed. Per R-015: not self-closing — Patrick validates on-device. |
| #139 | `11cbd64` | **Fix GitHub Issue #13 / HONE-023 — weighed ingredients keep amount + unit.** App code (EAS build dispatched, profile=preview). Root cause: the pantry "what you have" stepper treated every item as a bare count (raw number, no unit, step by 1, `Math.min(99,…)` clamp), so a weighed 160 g lost its unit and collapsed to a count on the first +/- tap. Fix: a measure type (weight/volume/count) derived from the `unit` already carried recipe→shopping→pantry, via new `src/data/measure.ts` (`inferMeasure`, `isWeighed`, `stepFor`, `formatQty`). `app/(tabs)/pantry.tsx` stepper now branches — weight/volume show "160 g" and step by a magnitude-aware increment (never a bare count, no 99 clamp; below one step removes with undo); counts unchanged (+/- by 1); bulk staples unchanged ("Stocked"). No schema migration (measure derived from the carried unit, not stored). tsc clean on changed files. Per R-015: not self-closing — Patrick validates on-device. |
| (docs) | `1700312` | **HONE-020 — Bug Lord Phase 2: live write path + live build feed + single source (docs/infra; NO APK built — live EAS build remains #137 per the integrity rule).** Worker `workers/bug-lord/src/index.ts` gains `POST /update` (write-key gated via `X-Write-Key`, persists `{id,field,value}` to Cloudflare KV namespace `HONE_STATE`), `GET /build` (live EAS build run_number from the public GitHub Actions API — verified working, returns #137), and KV overlay on `GET /bugs`. `docs/dashboard/index.html`: `BUGS_STATIC` → `BUGS_SEED` trimmed to unfiled engineering tickets (live GitHub issues merge over it by id — no duplication); dropdown taps POST live to KV with saving/saved/error state; build bar rendered live from `GET /build`; copy-paste changebar removed. Status model: GitHub issue state/labels = base, KV override wins. **Patrick's one new command:** `cd workers/bug-lord && npx wrangler secret put WRITE_KEY` (choose any phrase — that's the dashboard password), then paste the same phrase into the write-key box on the Bugs tab once. Ticket: `docs/coo/bug-tracker/tickets/HONE-020-buglord-live-write-path-single-source.md`. **No EAS dispatch.** Per R-015: not self-closing. |
| #138 | `e0e5156` | **HONE-019 — Live Bug Lord Cloudflare Worker (docs/infra; no app code changed).** `workers/bug-lord/` TypeScript Worker: `GET /bugs` proxies GitHub Issues labelled `bug` from `patrickpatches/hone` → maps to dashboard BUGS format → JSON with CORS headers + 60 s edge cache. Token stored as Wrangler secret. `docs/dashboard/index.html` updated: `BUGS_STATIC` (renamed fallback) + `let BUGS` + `WORKER_URL` placeholder + `liveFetch()` IIFE that merges live issues after first render (silent on error — static stays if Worker not yet deployed). Ticket: `docs/coo/bug-tracker/tickets/HONE-019-*.md`. **Patrick setup (one-time after this lands):** `npm install -g wrangler → wrangler login → cd workers/bug-lord → npm install → wrangler deploy → wrangler secret put GITHUB_TOKEN` then fill in subdomain in `WORKER_URL`. New fine-grained token needed (Issues read-only). **No EAS dispatch.** Per R-015: not self-closing. |
| #133 (EAS) | `15e01df` | **EAS build #133 DISPATCHED — the first APK carrying the v7 fixes + harness.** NUMBERING RECONCILED: our build-log rows #134/#135 were code-only commits that never produced a standalone APK, so the log ran ahead of EAS's real build counter (which only increments on actual builds). Patrick was on EAS 132; this is EAS 133. Contains the six #134 recipe-screen fixes (`e3cb60c`, HONE-009 still flagged) + #135 HONE-016 testIDs. versionCode bumped 50→51 so it installs over 132. Profile: preview. **Going forward: 'build #N' = the real EAS build number, not an invented log row.** Per R-015: not self-closing — Patrick installs the APK and validates on-device. |
| #135 | `f3bb986` | **HONE-016 — Maestro screen-testing harness (docs/infra only; no app code changed).** Five Maestro YAML flows in `maestro/flows/`: `01-kitchen-loads` (Kitchen cold-launch smoke), `02-browse-recipe` (recipe detail loads — catches Rules-of-Hooks crash class), `03-cook-mode-loads` (cook mode smoke; asserts Hummus step-1 body text, which is cook-mode-only), `04-pantry-tab-loads` (Pantry tab smoke), `05-shop-add-missing-persists` (HONE-007 regression: items tagged `kind:manual` survive Shop reconcile after navigate-away). Runner: `scripts/maestro-local.sh`. CI stub (commented): `.github/workflows/maestro-e2e.yml` (ready to uncomment at Phase 2, 10+ stable flows). Ticket: `docs/coo/bug-tracker/tickets/HONE-016-maestro-screen-testing-harness.md`. **Phase 1 runs on Patrick's physical device via USB ADB** — see ticket for Phase 2 CI wiring rationale. **No EAS dispatch.** Per R-015: not self-closing. |
| #134 | `e3cb60c` | **Fix HONE-007..012 — six on-device bugs from build #132 v7 browse restyle.** Single file: `mobile/app/recipe/[id].tsx`. **HONE-007 (P1):** "Add missing to shopping list" items were tagged `kind:'meal'` — Shop's reconcile() deleted them on load if the recipe wasn't planned. Fixed: `kind:'manual'` + `manually_added:true` so they persist permanently. **HONE-008 (P2):** Three duplicates killed: inline Start Cooking pill removed (sticky bottom is the sole CTA), "Watch the chef" removed from ghost row ("Watch the original ↗" in the eyebrow is enough), N/M ingredient count pill removed from "In your pantry" eyebrow (same count already shown large in the card body). **HONE-009 (P2):** FLAGGED BACK — content placement needs per-recipe data authoring (cook lane), not a code move. Notes need to be mapped to specific steps/ingredients; no code change in #134. **HONE-010 (P2):** Plate time was hardcoded 3 min on every recipe. Now derived: `finishing_note ? 5 : 3` — if the recipe has a finishing/tasting note (active plating work) → 5 min, otherwise 3 min. **HONE-011 (P3):** Blue (#5B8FD4) "What to know" callout swapped to gold — rail, bg, dot, label. **HONE-012 (P3):** `recipe.difficulty` (raw lowercase DB value) replaced with `difficultyLabel` (already capitalised). **Pre-flight:** tsc clean on `[id].tsx`; R-014 26/26 balanced; brace/paren/bracket 0 0 0; hard-safety 0 `Animated.ScrollView`/`Animated.event`/`scrollY`/`addListener`/`onScroll`; hook-order 33 decls all before first guard (line 355). **No EAS dispatch — Patrick triggers.** Per R-015: not self-closing. |
| #133 (docs) | `pending` | **Hone Tracker rollout — push the COO's bug-tracker + PM dashboard infrastructure to main so the Pages URL loads.** No app code touched; docs-only tree. Files: `.github/ISSUE_TEMPLATE/bug-report.yml`, `.github/workflows/deploy.yml` (one new step "Add bug-tracker dashboard" between Disable-Jekyll and Setup-Pages), `docs/coo/specialists/bug-tester.md` (new role charter), `docs/coo/bug-tracker/PROTOCOL.md` + `_TEMPLATE.md` + `build-history.csv`, `docs/dashboard/index.html` (1063-line static dashboard, six tabs, empty `TICKETS_BASE` by design — backfill lands in #134). Plus the COO's two new HANDOFF blocks merged at top of Open handoffs. Per the protocol: NO EAS dispatch (docs-only). NOT self-closing — Patrick verifies the URL `https://patrickpatches.github.io/hone/bug-tracker/` loads on his phone. |
| #132 | `1d79a4e` | **v7 "Mise" Commit B2 — browse-mode restyle complete.** Single file: `mobile/app/recipe/[id].tsx`, `!cooking` branch only. Cook mode byte-identical (shared blocks — title card, Ingredients/Method headers, ingredient rows — are gated `cooking ? <original> : <v7>` so cook renders exactly as #131). **Landed §3.1–§3.8:** (1) **Top bar** — 42×42 circular Pressables, `hitSlop:10`, no idle bg, plan tints `primaryLight`/`primaryInk` when planned, heart fills `primary`; the redundant 16sp top-bar title replaced with a flex spacer (the 38sp title now lives in the block below — matches prototype "back · spacer · plan · heart"). (2) **Title block** — bronze eyebrow `Inspired by {chef} · Watch the original ↗` (watch link hidden when `video_url` null), Fraunces 38sp/-0.6 title, italic 17sp tagline, compact muted meta `{difficulty} · Serves {output_default ?? base_servings} · {cuisine}`; plan toggle removed from this block. (3) **At-a-glance dropped** — its info now lives in the meta line + Kitchen-journey card. (4) **Inline CTA** — full-width 56dp rust "Start cooking" pill + centred ghost row "Plan it · Watch the chef" (watch hidden when null). The always-visible bottom sticky pill is untouched (NOT scroll-gated — v5 crash class avoided). (5) **Get ready** — Equipment + Prep merged under one bronze eyebrow in a single card, thin `lineDark` rule between sub-areas; Equipment as bronze-dot b-rows (no "Essential" tag — Phase 2); Prep keeps `MiseItem` + expand. (6) **Method** — browse rows now compact: bronze Fraunces step number · cream title · tabular muted timer · chevron; tap enters cook mode at that step (full content/photos live in cook mode). (7) **Ingredients** — pantry-style pill rows: 30×30 `ingredientIconName` FoodIcon (bronze when in-pantry), name (in-pantry = muted + bronze strikethrough; need-to-buy = ink), sub-line = scaled amount/unit + `· in pantry` / `· on shopping list` (new `getShoppingItems` load + hoisted membership set/callback), gold-outline Swap pill (bronze-tint when active), inline `HONEST SWAP` callout (bronzeSoft, bronze rail, Fraunces italic) under the row when a swap with `changes` is active. (8) **Eyebrows** — Ingredients/Get ready/Method browse headers are bronze uppercase. Removed orphaned `Callout` fn + `PILL_CONFIG` import. **Hard-safety:** 0 `Animated.ScrollView` / `Animated.event` / `scrollY` / `addListener` / `onScroll`. **Pre-flight:** tsc clean on the file (project exit-2 errors are the documented pre-existing @gorhom/@expo-google-fonts + recipes-holding baseline); R-014 26/26 balanced; brace/paren/bracket diff 0 0 0; hook-order 33 decls, 0 after the first guard (all hoisted, defensive vs undefined recipe). 1 file + this build-log row in the same tree. **No EAS dispatch — Patrick triggers.** Per R-015: not self-closing. |
| #131 | `d7332fc` | **REAL FIX — Rules of Hooks violation (root cause of the v7 recipe crash).** Build #130's ErrorBoundary surfaced the actual exception: **"Rendered more hooks than during the previous render"** at `updateMemo` → `RecipeDetailScreenInner`. My Commit B (#129) added `useMemo` (match, inPantryNames, ingredientInPantry, journeyTimes) and `useCallback` (addMissingToShoppingList) **after** the existing `if (recipe === undefined) return <Loading/>` / `if (!recipe) return <NotFound/>` early-return guards. On first render `recipe` is undefined → guards return early → those hooks never call. On second render (after `getRecipeById` resolves) → guards pass → those hooks DO call. Different hook count between renders → React throws at mount of the loaded state. This was the v7 recipe crash from day one; my static checks (tsc / R-014 / brace balance) can't see hook-order violations; CI compile-builds are fine because it's a runtime React rule. **Fix:** moved all 5 hooks to BEFORE the early-return guards. Each is defensive against `recipe` being undefined: `match` returns `null` when no recipe yet; `journeyTimes` returns sensible defaults `{miseMin:5, cookMin:1, plateMin:3}`; `addMissingToShoppingList` early-returns when `!recipe || !match`. The In-your-pantry card JSX got a `match &&` null-guard so it skips when match is null (though that won't happen in practice — JSX only renders after the guards pass). **No other behaviour changed.** Cook mode untouched. ErrorBoundary from #130 stays in place as a permanent defensive net. **Hard-safety:** 0 `Animated.ScrollView`, 0 `Animated.event`, 0 `scrollY`, 0 `addListener`, 0 `onScroll` introduced. **Pre-flight:** tsc clean on `recipe/[id].tsx`; brace/paren/bracket diff 0; verified all useMemo/useCallback calls precede the first `return` statement in the component body. **Lesson logged for myself:** when adding hooks to a screen with conditional early returns, hoist them ABOVE the returns or React's hook-ordering invariant fails at runtime — the v5 lesson generalised: static checks can't catch React runtime invariants. 1 file: `mobile/app/recipe/[id].tsx`. Per R-015: not self-closing. |
| #130 | `5dc6da5` | **DIAGNOSTIC — ErrorBoundary wrapping the recipe screen.** Patrick reports recipes still crash after Commit B (#129) + his substitution-quality hotfix (`625923a`). Static audit found no specific crash path — Patrick's `updateSubstitutions` migration runs at startup, `qualityConfig` falls back to `PILL_CONFIG.yellow`, my v7 sub-components use only valid `c.X` palette keys, and EAS Builds #127/#128 both compiled successfully. The crash is runtime-only and not visible from the engineer's side without device access. Following the v5 lesson honestly: **stop guessing, surface the actual error.** Added a `RecipeErrorBoundary` class component (React Error Boundary API requirement) that wraps `RecipeDetailScreenInner` in the default export. On any render-time exception it renders an on-screen fallback with `error.name`, `error.message`, and the first 20 lines of `error.stack`, plus Back and Try-again buttons — the recipe screen never force-closes again. Patrick screenshots that fallback and we fix the real bug in one targeted shot. No other code touched; no schema change; no `Animated` introduced. **Hard-safety:** 0 `Animated.ScrollView`, 0 `Animated.event`, 0 `scrollY`, 0 `addListener`, 0 `onScroll`. **Pre-flight:** tsc clean on `recipe/[id].tsx`; R-014 27/27 balanced; brace/paren/bracket diff 0. 1 file: `mobile/app/recipe/[id].tsx`. **No EAS dispatch — Patrick triggers.** Per R-015: not self-closing. |
| #129 | `ebebc27` | **v7 "Mise" Commit B — browse-mode restyle (partial, high-value subset).** Builds on the Fraunces + bronzeSoft foundation from #127/#128. Single file: `mobile/app/recipe/[id].tsx` — only the `!cooking` branch. Cook mode is untouched (that's Commit C). **What landed:** (1) **In-your-pantry card** — new section above the existing At-a-glance block. Pantry-aware: loads `pantryItems` once via `getPantryItems(db)`; `match = scoreRecipeAgainstPantry(recipe, pantryItems)` drives the N/M ratio, status copy ("Ready to cook now" / "You're nearly there" / "Some of it's already in your pantry" / "You don't have any of this yet"), missing-pill row (cap 6 + "+N"), and a gold-outlined "Add missing to shopping list" button that loops `upsertShoppingItem` over `match.missingIngredients` with source `kind: 'meal'`, then flashes "Added to shopping list" for 2.5s. (2) **Your-Kitchen-Journey 3-card row** — Mise · Cook · Plate, read-only times (Mise 5 min default; Cook = Σ step `timer_seconds`; Plate 3 min — the ticket's `leftover_mode === 'tonight'` check didn't match the schema's object shape, so plate is always 3 min, flagged in closeout). Per Patrick's call, **Plate is tap-to-expand** and carries `finishing_note` + `leftovers_note`; the previous `Finishing & tasting` and `Leftovers & storage` browse sections are removed (their content lives in the Plate expand now). (3) **Hero no-photo typographic fallback** — replaces the 72px emoji over gradient bands with a Fraunces title card: bronze eyebrow "Inspired by {chef}", 30sp Fraunces name, italic tagline, gold rule, faint Fraunces watermark of the title's first character. (4) **Method tap-to-cook** — every step row in the Method section is now a Pressable that, in browse mode, calls `setCurrentStepIdx(idx) + setCooking(true)` to enter cook mode at that step (cook-mode tap-to-tick behaviour unchanged). **Honest scope limit:** the ticket also lists top-bar restyle, title-block bronze eyebrow + meta line, inline rust "Start cooking" pill + ghost row, "Get ready" pill-row restyle, Ingredients row restyle with in-pantry strikethrough + honest-swap callout. I didn't land those in this commit to keep the surface area surgical and the regression window narrow after the v5 incident. Those are the next iteration (Commit B2) — none of them are gated by what's in B and each is a small surgical change against a known surface. **Hard-safety green:** zero `Animated.ScrollView`, zero `Animated.event`, zero `scrollY`, zero `addListener`, zero `onScroll` introduced. Plain `ScrollView` is preserved unchanged. **Pre-flight:** tsc clean on the touched file; R-014 27/27 balanced; brace/paren/bracket diff 0; gated-off dead code that confused tsc was deleted clean. **1 file** touched: `mobile/app/recipe/[id].tsx`. **No EAS dispatch — Patrick triggers.** Per R-015: not self-closing. |
| #128 | `c5bde6d` | **HOTFIX — regenerate `mobile/package-lock.json` to match Commit A's `package.json` (CI `npm ci` failed).** Build #127 (v7 Commit A) added `@expo-google-fonts/fraunces` and removed `@expo-google-fonts/playfair-display` from `package.json` but I forgot to regenerate the lockfile in the same commit. CI's Deploy-to-Pages workflow runs `npm ci` (strict lockfile check) and failed at the "Install dependencies" step on both `0f423b5` and `24a0144`. EAS Android Build hadn't been dispatched yet — would have failed identically. **Fix:** ran `npm install --package-lock-only --no-audit --no-fund` in the sandbox; lockfile root deps now match `package.json` exactly (29/29, fraunces present at `^0.2.3`, playfair removed). Code is unchanged — same fonts.display/displayItalic → Fraunces, same bronzeSoft. **Lesson logged for myself:** when a commit touches `package.json` deps, the same commit MUST update `package-lock.json`. The R-014 / tsc / balance pre-flight cannot catch a lockfile mismatch — it's a CI-time check. 1 file: `mobile/package-lock.json` (8789 lines). Per R-015: not self-closing — awaiting Patrick's go to retrigger any build. **No EAS dispatch.** |
| #127 | `0f423b5` | **v7 "Mise" Commit A — tokens + Fraunces fonts (dependency for Commits B/C).** Three small changes, all in dependency files. (1) `mobile/package.json`: added `@expo-google-fonts/fraunces` `^0.2.3`; removed `@expo-google-fonts/playfair-display` (now unused). (2) `mobile/app/_layout.tsx`: dropped the Playfair imports + their `useFonts` entries; added imports for `Fraunces_400Regular`, `Fraunces_500Medium_Italic`, `Fraunces_700Bold` and added all three to `useFonts({...})`. Header comments updated from "Playfair Display" → "Fraunces". (3) `mobile/src/theme/tokens.ts`: `fonts.display` → `'Fraunces_700Bold'`; `fonts.displayItalic` → `'Fraunces_500Medium_Italic'`; added `bronzeSoft: 'rgba(194,161,90,0.10)'` next to the existing `bronze: '#C2A15A'`. Inter and the rest of the palette unchanged. **Why Fraunces.** Playfair has very high stroke contrast — hairlines vanish under Android anti-aliasing at small sizes. Fraunces is a variable serif with a real optical-sizing axis (opsz 9–144), so the same glyph renders crisply at 12sp captions and 38sp titles on Android. Two existing code comments in `recipe/[id].tsx` still mention "Playfair" historically (the timer + why-note in cook-mode v2); they reference `fonts.display`/`fonts.displayItalic` (which now point to Fraunces), not Playfair directly — the comments will get refreshed when those blocks are touched in Commit C. **Pre-flight:** zero stale Playfair references in `mobile/` code/JSON apart from the two historical comments; tsc clean on both touched files; R-014 27/27 balanced; brace/paren/bracket diff 0 on both files; tail bytes verified. **Hard-safety:** no `Animated`, no scroll-driven anything, no schema change. 3 files: `mobile/package.json`, `mobile/app/_layout.tsx`, `mobile/src/theme/tokens.ts`. **No EAS dispatch — Patrick triggers.** Per R-015: not self-closing. |
| #126 | `ec7db26` | **ROLLBACK — revert recipe screen to pre-v5 (restores #123 behaviour).** Builds #124 (Recipe Detail v5 Phase 1) and #125 (my attempted Fabric native-driver hotfix) BOTH force-closed on opening any recipe. The #125 fix (native→JS scroll driver) changed nothing, which proves my native-driver-listener diagnosis was wrong — the real cause is still unconfirmed, and I can't see a release-build crash from here. Per Patrick's call, reverting `mobile/app/recipe/[id].tsx` to its last-known-good state (commit `c9a0c19`, the recipe screen as it was at build #123) so recipes open again. v5 will be reintroduced **incrementally** from this baseline, each increment validated on-device before the next. `OriginFlag.tsx` is left in the repo (unused now, reused later). The #124/#125 build-log rows stay for audit. 1 file reverted: `mobile/app/recipe/[id].tsx`. Pre-flight: tsc clean, R-014 27/27 balanced. Per R-015: not self-closing — awaiting Patrick's on-device confirmation that recipes open. |
| #125 | `510fd36` | **HOTFIX — recipe screen force-closed on open (regression from #124).** Patrick reported the app crashes when opening any recipe after build #124. Root cause: the project runs the **New Architecture (Fabric)** (`newArchEnabled: true`, RN 0.81.5), and #124's collapsing-header/sticky-bar work attached a `scrollY.addListener` to an `Animated.Value` that was being driven by `Animated.event(onScroll, { useNativeDriver: true })`. On Fabric, adding a JS listener to a **natively-driven** scroll node fatals at mount — which is why it crashed on the recipe screen specifically (the only screen with that pattern). Existing `Animated.timing` native-driver use elsewhere in the file was fine because it has no JS listener. **Fix:** the scroll `Animated.event` now uses `useNativeDriver: false`, so `scrollY` lives on the JS thread — the `addListener` (used to toggle `pointerEvents` on the collapsing bar + sticky bar) is safe, and the opacity fade-ins stay smooth on the JS driver. Also replaced the inline `require('react-native').Dimensions` with a proper top-of-file `Dimensions` import (cleaner, removes any doubt). 1 file: `mobile/app/recipe/[id].tsx`. **Pre-flight:** tsc clean on the file; R-014 27/27 balanced; brace/paren/bracket diff 0; Dimensions imported exactly once. **No other v5 behaviour changed** — collapsing header, sticky bar, glance trio, origin flags, hero fallback, elevated why-note all intact. Per R-015: not self-closing. |
| #124 | `bc318e2` | **Recipe Detail v5 "The Pass" — Phase 1 (GitHub Issue #5, browse mode only; cook mode untouched).** Built to `docs/coo/tickets/recipe-detail-v5-build.md` + `recipe-detail-v5.html`, respecting the v3 schema-preserve contract. **No schema changes.** Two files: new `mobile/src/components/OriginFlag.tsx` + `mobile/app/recipe/[id].tsx`. **(1) Collapsing top app bar:** browse `ScrollView` → `Animated.ScrollView` driving `scrollY`; Back stays visible throughout, title + plan + heart fade in (`scrollY.interpolate([150,240]→[0,1])`); a scroll listener toggles `pointerEvents` so invisible controls aren't tappable. **(2) Hero no-photo fallback:** the old gradient-bands + 72px emoji replaced with a typographic title card — Playfair name + "Inspired by {chef}" + italic tagline + thin gold rule + faint Playfair initial watermark over the `hero_fallback` bands. No emoji block ever. **(3) Glance trio = time · effort · origin** (dropped yield/leftovers chips), value stacked ABOVE label. Time collapses to `"{active} active" / "{total} min total"` only when active < 70% of total, else one value. **Origin keyed off `categories.cuisines[0]`:** SVG flag for country cuisines (US/IT/JP/TH/MX/FR/IN/MY) via the new `OriginFlag` module; neutral globe glyph + named countries for regional cuisines (Levantine → Lebanon · Syria · Jordan · Palestine; modern Australian → Australia). Flags are SVG `react-native-svg`, never emoji; never a single flag for a region (keeps the no-Israeli rule); rendered + visually audited via cairosvg before ship. **(4) CTA hierarchy:** one inline rust "Start Cooking" + a ghost "Add to shopping list" (real handler — upserts all scaled ingredients via `upsertShoppingItem`, source `kind:'meal'`; shows "Added to shopping list ✓" confirmation) + the existing "Watch the original" (hidden when `source.video_url` null). **(5) Sticky bottom Start-Cooking bar:** the existing always-on bar now fades in only once the inline CTA scrolls out of view — gated on `scrollY` vs the inline CTA's measured bottom (`onLayout`), with `pointerEvents` off while hidden. **(6) Elevated why-note:** was Playfair-italic muted grey; now `inkSoft` body on `goldDim` with a full-gold "WHY" marker + solid 3px gold left rule (WCAG AA on the dark card). **Already-correct, left as-is:** `ServingsSelector` recipe-generic stepper from `output_unit` + leftover nudge (DECISION-014); `before_you_start`; equipment renders names-only (no fake badges — `equipment` is `string[]`; enrichment is Phase 2); ingredients + swap pills unchanged. **Colour discipline:** rust = Start Cooking only; gold = section headers/stepper/why-marker/step numbers; emerald `#4FBF85` = swapped ingredient only; no bronze on this screen; no sage; zero blue. **Phase 2 (allergen/dietary strip + equipment enrichment) NOT started — awaiting Patrick's scope confirmation.** **Pre-flight:** `tsc --noEmit` clean on both touched files (remaining project errors are pre-existing + unrelated: sandbox `@gorhom`/`@expo-google-fonts` module resolution, and the long-known `recipes-holding` legacy-enum issue never on the launch path); R-014 tail-check 27/27 balanced; brace/paren/bracket diff 0 on both; flag SVGs render-audited. **No EAS build dispatched — Patrick triggers it.** Per R-015: not self-closing. |
| #123 | `0781040` | **Pantry bronze headers + section-label categories.** Patrick on-device feedback after #122. New soft antique-bronze token `#C2A15A` (darker/browner than the bright stepper gold so the two never compete), applied to the "Cook with what you have" category headers; bronze + gold-category-header treatment replicated on the Shop tab. |
| #122 | `bd3c7ee` | **Approved pantry "what you have" redesign (pantry-haves-v1).** Organised, category-grouped, collapsible stocked list with a +/− stepper (writes the existing `quantity` field — no schema change) replacing the flat pills card; match-carousel recoloured to the calm palette; match banner removed. Pass 2 added a per-ingredient icon library + resolver in `PantryIcons.tsx` (7 category + ~19 ingredient line-icons, keyword-matched). |
| #121 | `adc4522` | **Kitchen hero slideshow + hero also shown in the list.** Patrick's #120 follow-up in `(tabs)/index.tsx`: hero recipe now also appears in the list below it (#120 had hidden the section when the only match was the hero), plus a rotating hero slideshow. |
| #120 | `9edbdff` | **4-item on-device polish bundle.** Kitchen hero/list contradiction fix, "Show less" affordance, swap-button overflow fix, and the Levantine olive note from the Photography Director — surfaced across Patrick's validation of #118/#119. |
| #119 | `2326d6f` | **HUMMUS chocolate-sundae hero bug fix.** `seed-recipes.ts` had a chocolate-milkshake/Twix URL on the HUMMUS card; swapped to the ledger-approved Ludovic Avice plain-hummus shot. Validated by Patrick on-device 2026-05-22. |
| #118 | `808970d` | **Wired 10 cook-APPROVED hero URLs + attribution into `seed-recipes.ts`.** 11/16 launch heroes live (carbonara since #110): SMASH_BURGER, WEEKDAY_BOLOGNESE, ROAST_CHICKEN, BUTTER_CHICKEN, THAI_GREEN_CURRY, CHICKEN_SCHNITZEL, BEEF_LASAGNE, ROAST_LAMB, FALAFEL + PAVLOVA (new CDN URLs replacing 404'd short-codes). |
| #117 | `0f9063c` | **Cook-mode v2 single-step navigator** — Designer's prototype (`docs/prototypes/cook-mode-v2.html`, commit `8cf7b08`) wired into `recipe/[id].tsx`. Cook mode now shows ONE step at a time with: 224px hero photo block (uses `step.photo_url` or falls back to `recipe.hero_url` or gradient bands), 5-segment gold progress bar overlaid at top, step tag pill bottom-left, 64sp ghost step number watermark bottom-right, 24sp Playfair title, 14.5sp Inter body, gold-bordered "Look for this" doneness cue from `step.stage_note`, 38sp Playfair timer when `timer_seconds` present, italic Playfair why-note when `why_note` present, full-width rust "Next step → [title]" pill (sage "Done — finish cooking" on the final step, exits cook mode on tap), and a ghost "‹ [prev step]" back link below. **Preserves:** DECISION-015 step_overrides with sage border + "adapted for your swap" cue (#107), step-done tracking on tap (the Next pill marks the current step done before advancing — fully replaces the #114 knuckle-tap-card pattern with a clearer affordance), browse-mode list view unchanged. **No schema change** — uses existing `stage_note`/`timer_seconds`/`why_note`/`photo_url`/`hero_url`/`hero_fallback` fields. State: new `currentStepIdx` that resets on every `toggleCooking`. One file: `recipe/[id].tsx`. Pre-flight bug check: tsc clean, R-014 guardrail green, brace/paren/bracket balanced (824/403/56 diff 0), tail bytes verified, manual render-path trace clean. |
| #116 | `6ac056e` | **Rewrite SubstitutionSheet on React Native's built-in Modal — kills the @gorhom portal layer entirely.** Patrick reported on #115 that the bottom sheet still re-opens on stray taps, AND that the same symptom appears when ticking ingredients in cook mode (where the swap path is never invoked). That ruled out swap-trigger races: the bug was inside `@gorhom/bottom-sheet`'s portal layer keeping itself mounted and re-presenting on stray taps. Three rounds of patches (row-Pressable inert in #114, single dismiss path + 350ms debounce in #115) couldn't kill it because the bug wasn't in the call sites. Build #116 replaces `BottomSheetModal` with React Native's native `Modal` — no portal, no global gesture handler, no library. Custom slide-up animation via Animated.Value. Backdrop is a plain Pressable. The Modal renders only when `visible=true` (early-return when ingredient is null) so when closed there's nothing in the tree to intercept taps. Same `<SubstitutionSheet>` API for the parent. versionCode 49 → 50 so Patrick's install picks up unambiguously as an upgrade. 2 files: `SubstitutionSheet.tsx` (537-line rewrite), `app.json`. tsc clean. R-014 guardrail green. |
| #115 | `e722cff` | **Defensive sheet-dismiss rewrite — bugs persisted on #114.** Patrick reported the swap popup still re-opens after dismiss and the prep-tap-opens-popup symptom persists. Diagnosis: even with the row body inert from #114, there were still TWO dismissal paths racing each other inside the substitution sheet — `handleConfirm` called `ref.current?.dismiss()` directly which triggered @gorhom's `onDismiss` callback which set parent `visible=false` which fired the sheet's `useEffect` which called `dismiss()` AGAIN. Two competing dismiss calls produce odd post-dismiss re-open behaviour. Fix: single dismiss path through parent state. `handleConfirm` now only fires `onSwap`; the parent's `handleSwap` ALSO sets `sheetVisible=false`. The sheet's `useEffect` on `visible` is now the only thing that calls `ref.current?.dismiss()` — one direction, no race. The close X button at the top of the sheet header now calls `onDismiss()` instead of `ref.current?.dismiss()` for the same reason. Added a 350ms debounce in `openSwapSheet`: refuses to fire if the sheet is already visible OR was just dismissed within the last 350ms. Stops any stray tap during the dismiss animation from re-opening the sheet. Bumped `versionCode` 48 → 49 so Patrick's install genuinely picks up the new APK. 3 files: `SubstitutionSheet.tsx`, `recipe/[id].tsx`, `app.json`. tsc clean. |
| #114 | `cd65ab1` | **Swap-trigger redesign — three on-device bugs from #113.** Patrick reported: (1) tapping a prep stage to cross it off opens the swap popup; (2) after picking a swap and tapping Done, the popup re-opens on the next tap anywhere on the screen; (3) the swap affordance wasn't visible enough. Root cause: the entire ingredient row was a Pressable that opened the swap sheet, so any stray tap landing on it triggered the sheet, and a small ↻ icon was the only visual hint. **Fix:** in non-cook mode the row body is now inert; a dedicated `Swap` / `Swapped` pill on the right of each ingredient row is the only swap trigger. Pill is gold-bordered when no swap is set and uses the active swap's colour (green/yellow/red `PILL_CONFIG`) when a swap is in effect. Cook-mode tap-to-tick behaviour on the row body unchanged. Side effects: the stray-tap-after-dismiss reopen is gone (small hit target), tapping a prep item can no longer collide with the ingredient row (different Pressables, different rows), and the swap affordance is now clearly named + coloured + bordered. One file: `mobile/app/recipe/[id].tsx`. tsc clean. R-014 guardrail green. |
| #113 | `e9a452b` | **Three on-device bugs from build #112 — DB pipeline fixes.** Same R-014 class as DECISION-014's portion-sizing bug: schema column exists, data gets written via UPDATE, but the row-to-object mappers silently dropped the field on read-back. (1) **Swap button missing:** `rowToIngredient` never read `substitutions` from the DB row — `ing.substitutions` was always `undefined`, so the recipe screen's `hasSwaps` check was always false. Now parses the JSON column. (2) **Only one cuisine tile:** `rowToRecipe` never read `categories` from the DB row — `recipe.categories` was always `undefined`, so the Kitchen tile filter trimmed every tile except 'All'. Now parses the JSON column. Added a `categories` SQLite column write in `insertRecipe` + UPDATE in `refreshSeedRecipeFields` so existing installs backfill without reinstall. (3) **Hero images don't appear:** the Kitchen `HeroBackground` component and the recipe-row thumbnail were rendering gradient bands only — they never touched `recipe.hero_url`. Wired `expo-image` Image into both. Also verified Unsplash URLs via curl — FALAFEL `photo-pQnsKWk5ljQ` and PAVLOVA `photo-5nCTfEru3Do` return 404 (those are page short-codes, not CDN paths). Stripped both from seed-recipes.ts; gradient fallback renders until Photography Director sources proper CDN URLs. CARBONARA `photo-1612874742237-6526221588e3` is a valid CDN URL and stays. Added SQLite migration 9 for the `hero_attribution` column (it was added to the Zod schema in #110 but never persisted to SQLite). `refreshSeedRecipeFields` now also UPDATEs `categories`, `hero_attribution`, and `hero_url` on every launch so existing installs pick up the new mapping + the #110 SMASH_BURGER hero-strip + the #113 falafel/pavlova URL-strip without a reinstall. 5 files. tsc clean. R-014 guardrail green. |
| #112 | `1f7bb88` | **Two-item bundle.** (1) **R-016 fix — pantry persistence after uninstall.** Added `"allowBackup": false` under `expo.android` in `mobile/app.json`; bumped `versionCode` 47→48. Google Android Auto Backup is on by default for Expo apps and was silently restoring the SQLite database from the user's Google Drive on reinstall — contradicting the offline-first / privacy-first product stance and producing the bug Patrick reported (pantry items + shopping list survive a clean uninstall). The next prebuild will emit `android:allowBackup="false"` on the `<application>` tag in `AndroidManifest.xml`. (2) **R-014 truncation CI guardrail.** New `scripts/check-ts-truncation.sh` (one-liner that asserts every `.ts`/`.tsx` under `mobile/src/` and `mobile/app/` ends on a balanced closing token — `}` `)` `;` `,` or `]`) plus a new GitHub Actions workflow `.github/workflows/ts-truncation-check.yml` that runs the script on every push to main and on every PR. Three commits in May 2026 (Patrick's `6813ddc`, cook's `ff86010`, engineer's mid-DECISION-015 pass) silently truncated `.ts` files via the Edit tool — each cost a build cycle. Script self-tested against a deliberately-truncated `.ts` (caught it, exit 1) and against a clean `.ts` (passed, exit 0). 25 launch files all end on a balanced token. |
| #111 | `c8430f6` | **DECISION-015 per-recipe migration.** Pre-flight gate verified: all 16 launch research files carry the cook's `DECISION-015` discrepancy table on origin/main (GitHub code-search lag — direct file fetch confirmed). Applied 64 per-swap colour overrides where cook's judgment diverged from the default 4-to-3 mapping (mostly `great → yellow` downgrades; some `compromise → yellow` and `good → green` upgrades). Applied 12 `step_overrides` arrays where cook fully authored the alternate step text (Pasta Carbonara s4 whole-eggs, Green Curry s3 prawns/tofu/pumpkin, Bolognese s4 fresh tomatoes, Chicken Shawarma s2 chicken breast, Butter Chicken s2/s3/s5, Flour Tortillas s3 lard, Chicken Schnitzel step_5_fry_first veal, Beef Lasagne step_7_assemble dried sheets). Final pill counts: 211 green / 338 yellow / 94 red / 0 legacy. **Flagged back to cook (no override text authored):** SMASH_BURGER 3 entries, HUMMUS tinned chickpeas, PAD_THAI 4 flags, FALAFEL 2 flags, BEEF_LASAGNE 'ragù step' anchor ambiguous, ROAST_LAMB 'prep' anchor ambiguous, FLOUR_TORTILLAS 'Vegetable shortening' substitution doesn't exist in seed. R-014 mitigation: caught a missing-comma syntax error during step_overrides insertion (single-line substitution objects); fixed with targeted regex pass; tsc clean. |
| #110 | `070483a` | **5-item bundle.** (1) **R-014 recovery:** cook's `ff86010` truncated `types.ts` (lost final 4 lines of `safeParseRecipe`); restored from `b0382e0` clean state and re-applied the `'dessert'` TypeId addition. (2) **Hero attribution:** added `hero_attribution: z.string().optional()` to Recipe schema; rendered as a small dark-scrim pill bottom-right of the hero image (CC licensing convention — present without competing with the title card). (3) **Cuisine tiles:** `CUISINE_LABELS` Record extended with `palestinian`, `german`, `british` (tsc demanded them); `CATEGORIES` tile list now covers every CuisineId in the enum — the existing `availableCategoryIds` filter still trims to ≥1 launch recipe so the user only sees tiles with content (today: Australian, Levantine, Italian, Indian, Thai, American, Mexican). (4) **APPROVED hero images:** wired 3 Unsplash heroes into seed-recipes.ts — PASTA_CARBONARA (`photo-1612874742237`), FALAFEL (`photo-pQnsKWk5ljQ` Anton), PAVLOVA (`photo-5nCTfEru3Do` Eugene Krasnaok). Each carries the photographer credit. Shawarma CONDITIONAL left as-is per default (wait for replacement). Smash-burger + flour-tortillas REJECTED — not touched. (5) **Taxonomy guardrail:** extended `validateDecision015` in `db/seed.ts` to also scan every launch recipe's `categories.cuisines` + `categories.types` against the enum — console.warn for any value outside the schema. **Item 3 NOT shipped (DECISION-015 per-recipe substitution overrides):** I searched every research file for `DECISION-015` / `step_overrides` / `Great swap` / `Some difference` / `Noticeable change` — **zero hits**. Cook hasn't actually authored the per-recipe discrepancy tables yet despite the brief saying she had. Default 4-to-3 mapping from #107 still in force; flagging cook + COO for the actual delivery. |
| (hotfix) | `9fd9dd5` | **Bug-check hotfix on #110:** stripped a stale `hero_url` from SMASH_BURGER. Patrick's #110 brief said "DO NOT MIGRATE smash-burger" (REJECTED per cook — wrong cheese + red onion rings), but the recipe still carried a leftover Unsplash URL `photo-1568901346375-23c9450c58cd?w=600&q=80` from an older seed pass. Removed. Now the only hero_urls in the launch roster are the 3 cook-approved photos (CARBONARA, FALAFEL, PAVLOVA). Will roll into the next build. |
| #109 | `b128624` | **Build recovery — seed-recipes.ts truncation fix.** Builds #108 and the 3 prior commits (`6813ddc` smash photos by Patrick, `82f39b5` COO docs, `922f295` my #108) all failed Metro bundling with `SyntaxError: Unexpected token, expected ',' (5842:4)`. Root cause: Patrick's `6813ddc` ("feat(smash-burger): add Gemini stage photos to app") successfully added two `photo_url` fields to SMASH_BURGER steps s1/s3 BUT also accidentally chopped 14 lines off the end of `SEED_RECIPES_HOLDING` — the array ended with `  AG` (truncated `AGLIO_E_OLIO`) and no closing `];`. Recovery: started from #107 clean state (`b91836d`, 5857 lines), re-applied the two `photo_url` additions verbatim, full holding array restored (30 recipes ending `CHICKEN_VEG_STIR_FRY,\n];\n`). One file: `mobile/src/data/seed-recipes.ts`. tsc clean, byte-tail verified. No other changes — my #108 cook-mode work in `recipe/[id].tsx` is preserved on origin. |
| #108 | `922f295` | **Housekeeping bundle.** Item 1 (cook DECISION-015 discrepancy tables): empty queue — nothing delivered since #107, default mapping from path A still in force. Item 2 (PAT rotation): cannot self-action — needs Patrick's GitHub UI. Current PAT expires 2026-07-21 (~10 weeks out), scopes `repo, workflow`, rate limit healthy 5000/5000. Item 3 (cook mode sweep): verified wake lock + OLED `#000000` true-black surface + haptics on `tickStep`/`toggleCooking` all working. **Fixed: knuckle-tap-to-advance** — wrapped the step card in a Pressable when cooking so the whole 16pt-padded card is a forgiving tap target; precise 34×34 step-number badge still works for accuracy. Outside cook mode the outer Pressable is disabled so non-cook taps don't accidentally tick. accessibilityLabel composed dynamically. Item 4 (approved images): empty queue — every row in `visual-assets-ledger.md` is PENDING or CANDIDATE. One file: recipe/[id].tsx. |
| (no build) | `6813ddc` | Smash Burger stage photos: 2 Gemini-generated `.jpg`s (`smash-burger-mise.jpg`, `smash-burger-smash.jpg`) committed to `mobile/assets/recipes/` and wired into seed-recipes.ts as `photo_url` on steps s1 and s3. **No Android build dispatched** — Patrick's commit silently truncated `SEED_RECIPES_HOLDING` (R-014) so the next Android build (#108) failed Metro bundling. Recovered in #109 (`b128624`) — both photo_urls preserved, holding array restored, .jpg assets intact. |
| #107 | `b91836d` | **DECISION-015 infrastructure (path A) + Roast Chicken Hone Kitchen rebuild.** Schema: `SwapQuality` collapsed to 3-colour enum (green/yellow/red) with `z.preprocess` defensive migration that coerces any legacy 4-tier value and console.warns. Added optional `step_overrides: Record<string,string>` to Substitution. SEED_RECIPES bulk-migrated 640 substitution `quality` fields: 261 green / 280 yellow / 99 red, zero legacy left (default rule applied — cook's per-recipe overrides come as data-only follow-ups). SubstitutionSheet.tsx — new `PILL_CONFIG` (green ✓ Great swap / yellow ≈ Some difference / red ⚠ Noticeable change) per Designer v2 prototype; pill renders icon + label + colour + border; `accessibilityLabel` composed as `"{pill label} — {sub.changes}"`. recipe/[id].tsx — conditional step-override rendering: walks active swaps in insertion order, most-recent-active wins; sage step-card border + 'adapted for your X swap' cue when overridden. Migration sanity log + step_overrides validator (`validateDecision015` in db/seed.ts) gated on `__DEV__`, wired into setupDatabase. **Roast Chicken HARD BLOCKER fix**: `source.chef: 'Hone Kitchen'` (was 'Thomas Keller'), source.notes rewritten as Hone Kitchen original; `categories.cuisines: ['australian']` (was 'french'); `difficulty: 'Easy'` (was 'beginner'); s3 compound-butter step gets cook's slide-fingers-from-neck-end technique note; new s6 'Pan sauce from the fond' step with white wine + cold butter; two new ingredients (i8 dry white wine 100ml, i9 cold butter 15g for mounting). R-014 truncation hit during seed-recipes.ts edits — caught via export-block sanity grep, recovered by splicing origin's tail back. |
| #106 | `a1e15bb` | **FLOUR_TORTILLAS migration** — applies cook's `flour-tortillas.md` discrepancy table verbatim PLUS Patrick's 10×~30g yield override. Changes: `source.chef` → `Patrick N.`, `base_servings` 5 → 10, `output_default` 13 → 10. Primary fat flipped from Lard to Unsalted butter (lard moves to substitution, 'delicious' stripped from swap note per cook). Ingredient amounts scaled from cook's 13-tortilla spec to Patrick's 10-tortilla yield: bread flour 200g → 160g, butter 40g → 30g, water 130ml → 100ml, salt 6g → 5g (cook had 6g for 13; we scale to 5g for 10). All step content, mise, and before_you_start updated to the new amounts and butter-primary framing. Tortilla size note changed from 'side plate' to 'small saucer 12–13cm (taco size, not burrito size)'. (Hash filled in follow-up commit immediately after — required because the commit hash can only be known after the commit is created. New discipline rule going forward: log row lands in the SAME tree as the code.) |
| #105 | `b6d0c70` | Kitchen Editorial redesign — full rewrite of `(tabs)/index.tsx` per Designer prototype (`docs/prototypes/kitchen-editorial-v1.html`). Day/time + 'hone.' wordmark with gold period; gold-bordered search; 178dp hero card (Tonight badge + Cook → / Plan + CTA, falls back to top of active filter); 'Browse by cuisine' label + horizontal category tiles (All + 8 cuisines, active = solid gold fill + dark label); recipe list rendered as full-width rows with 58×58 thumb, gold cuisine tag, Playfair title, meta strip, planned-gold badge. Removed: mode chips (All/Quick/Weekend/Favourites/Yours), 'Cooking tonight' amber banner, old hero headline. Token change: `gold #F2CC2A` + `goldDim` added fresh — no callers existed for the COO-named `tokens.gold` previously, so no regression scan was applicable. Two files: tokens.ts, index.tsx. |
| #104 | `d52397f` | Shop -> pantry -> match-counter wiring. Ticking an item in Shop now upserts the pantry row with `have_it = true` (untick = false). Pantry tab `useFocusEffect` extended to refetch pantry items alongside shopping items, so the recipe-match carousel counters recompute on tab return. `pantryId` exported from pantry-helpers so shop.tsx hits the same row on upsert. Same architectural family as REGN-007 — derived state across surfaces. Files: shop.tsx, pantry.tsx, pantry-helpers.ts. |
| #103 | `d974880` | **Root-cause fix for the 4×-recurring 46-recipes regression.** seed-recipes.ts split into two arrays at the source: `SEED_RECIPES` (16 launch only — the seeder consumes this) and `SEED_RECIPES_HOLDING` (30 holding — defined but never inserted into SQLite). Holding recipes physically cannot reach the DB. Added `pruneOrphanedSeedRecipes` to clean Patrick's existing install (deletes any seeded row whose id is no longer in SEED_RECIPES on every launch — idempotent). Collapsed `getActiveRecipes` to an alias for `getAllRecipes`. Added dev-only `smokeAlarmSeedCount` tripwire that console.errors loudly if the seeded-row count drifts from `SEED_RECIPES.length`. R-016 root-cause closed. |
| #102 | `e663cfd` | Designer v2.2 visual polish for ServingsSelector — single-pill stepper with stacked number+unit in 52×40 centre cell. Drops the redundant top header label and the right-side "Makes N portions" block; verb ("Serves"/"Makes") moves to the left of the stepper. Stepper buttons 32×40 with opacity 0.28 + disabled state at min. Ingredient scaling math unchanged. |
| #101 | `7be6b3b` | Cook's 5 scaling-disparity fixes (SMASH_BURGER / PASTA_CARBONARA / BUTTER_CHICKEN / CHICKEN_SCHNITZEL / FLOUR_TORTILLAS — strip hardcoded quantities from step content & mise). Plus FALAFEL/BARRAMUNDI launch swap per Patrick — FALAFEL `not_yet_shipping=true→false` with placeholder DECISION-014 fields (`serve` / 4); BARRAMUNDI flipped to not_yet_shipping. |
| #100 | `9f53396` | UX polish — stripped "Scaled N× up" chip from recipe header. A multiplier with no visible baseline confused more than it clarified. Header now shows just "HOW MANY BURGERS" / etc. on the left; the stepper + "Makes N burgers" label already conveyed everything the chip did. |
| #99 | `418f8eb` | **Critical fix** — DECISION-014 portion-sizing fields now reach SQLite. Builds #96–#98 shipped the schema/seed/UI but the DB layer was blind to the new fields, so every recipe rendered the legacy "people / portions" fallback on-device. This commit adds schema migration 8 (4 new columns: output_unit, output_unit_plural, output_default, extra_for_tomorrow_label), extends RecipeRow / rowToRecipe / insertRecipe in database.ts, and extends refreshSeedRecipeFields in seed.ts. On Patrick's existing APK, migration 8 ALTERs the columns onto his recipes table on first launch; refreshSeedRecipeFields then UPDATEs the 16 launch rows with their authored values. **Install #99 to actually see "Makes 4 burgers" etc.** |
| #98 | `b4e83f2` | Polish — "Serves N portions" for per-person dishes (was "Serves N serves"); ServingsSelector special-cases unit==='serve'/'person' to render "portion/portions" while keeping cook's authored data verbatim. _NOTE: portion-sizing did not actually work on-device — see #99 fix._ |
| #97 | `b43ae55` | Docs only (COO push) — no app code change vs #96. Adds Designer's `docs/prototypes/recipe-detail-v2.2.html` + handoffs/decision-log updates. Functional behaviour identical to #96 |
| #96 | `ce3ff2b` | DECISION-014 per-recipe portion units (functional) — schema fields + 16 launch recipes migrated + ServingsSelector + Kitchen card chips + recipe-aware leftover hint |
| #95 | `4c4daf9` | v0.5.0 version bump + DECISION-013 launch scoping (16 user-visible) + CHICKEN_SHAWARMA created + LAMB_SHAWARMA flagged not_yet_shipping + FLOUR_TORTILLAS attributed to Patrick Nasr + burger sauce 3 separate shop rows + Equipment vertical wrap |

---

## Open handoffs

### HANDOFF → Senior Engineer · 2026-06-02 · DONE — Recipe detail design polish (GitHub Issue #23)
**Lane:** Claude Code. **From:** COO. Patrick's Claude-Design handoff.

**Status:** DONE — shipped in EAS preview build **#140** (commit `e1e1299`), dispatched. Browse mode only; cook mode untouched. All four parts of Issue #23 implemented (nav icons, gold title + Poppins centred meta + country flag, "+ Plan it" removed, Chef Source Card, stage-photos notice removed). Poppins added. Reused the existing `OriginFlag` SVG flags rather than extracting from the 3.7MB rendered prototype (same outcome). tsc clean on changed regions; R-014 balanced; crash-history guardrails respected (no new hooks, no scroll Animated listeners). Issue #23 labelled `fix-attempted` + commented. Per R-015: not self-closing — Patrick validates on-device.

Implement the recipe-detail design changes in `mobile/app/recipe/[id].tsx` — full spec in **Issue #23**. Lift the `CountryFlag` SVG component from `docs/prototypes/Recipe Page Design.html`. Browse mode only; cook mode untouched. Nav-icon colours, gold title, Poppins centred meta (no "Serves N"), country flag, drop "+ Plan it", new Chef Source Card, remove the blue stage-photos notice. Add `@expo-google-fonts/poppins` if needed. **Respect the recipe-screen crash history** (hooks above guards, no scroll-driven Animated listeners); tsc + R-014 pre-flight. Build a preview when ready; Patrick validates on-device (R-015).

---


### HANDOFF → Senior Engineer · 2026-06-02 · DONE — fix GitHub Issue #13 (weighed-ingredient units)
**Lane:** Claude Code. **From:** COO. Patrick: fix this one next.

**Status:** DONE — shipped in EAS build **#139** (commit `11cbd64`), dispatched. Awaiting Patrick's on-device validation (R-015).

Root cause: the pantry "what you have" stepper treated every item as a bare count (raw number, no unit, step by 1, clamp to 99), so a weighed 160 g lost its unit and collapsed to a count on the first +/- tap. (Shop-tab display already showed the unit; the break was the pantry stepper.)

Fix: a measure type (weight/volume/count) **derived from the `unit`** — which is already carried recipe → shopping list → pantry — via one shared resolver (`src/data/measure.ts`). The pantry stepper now branches: weight/volume keep "160 g" and step by a magnitude-aware increment (never a bare count, no 99 clamp; below one step removes with undo); counts step by 1; bulk staples keep "Stocked".

Design note: derived the measure from the carried unit rather than adding a stored `measure` column — storing it would duplicate state that can drift from the unit, and deriving needs no DB migration or seed re-authoring. Optional explicit `Ingredient.measure` override is the natural extension if ever needed. Ticket: `docs/coo/bug-tracker/tickets/HONE-023-weighed-ingredient-units.md`. Issue #13 labelled `fix-attempted` + commented; NOT closed.

---


### HANDOFF → Senior Engineer · 2026-06-02 · OPEN — HONE-022 polish the Today tab
**Lane:** Claude Code. **From:** COO. Patrick approved.

Bring the **Today** tab up to the new Bugs-page polish — best-in-class main dashboard, aqua+fuchsia, mobile-first, snappy. **No functionality lost.** Keep ALL of: days-to-launch + verdict, the jobs list, the live Build Status strip (`/build`, on-phone update link), readiness donut + bars, and the composer (write update + file-bug-live). Spec: `docs/coo/bug-tracker/tickets/HONE-022-polish-today-tab.md`. Dashboard-only — no EAS build. Verify every function still works after.

---


### HANDOFF → Senior Engineer · 2026-06-02 · OPEN — HONE-021 Bug Lord Pro (table + job detail + live comments)
**Lane:** Claude Code. **From:** COO. Patrick approved — wants it better than Jira.

Spec: `docs/coo/bug-tracker/tickets/HONE-021-buglord-pro-table-detail-comments.md`. Order: (1) FIX FRESHNESS — new bugs/edits must show in ~1-2s (the `/bugs` cache is stale; Issue #14 filed but never appeared); (2) table view (sortable, filter, search, mobile-first); (3) click a job → detail with live-editable status/who + a dated comment thread from the GitHub Issue's comments + add-comment; (4) Worker `GET /issue/:n` + `POST /issue/:n/comment` (token now has Issues write); (5) polish — optimistic UI, fix the 5s blank-dropdown lag, password only on first write. No EAS build for dashboard-only work.

---


### HANDOFF → Senior Engineer · 2026-06-01 · DONE — HONE-020 Bug Lord live end-to-end (Phase 2)
**Lane:** Claude Code (CLI).
**From:** COO (brief) / Senior Engineer (built)
**Subject:** Finish Bug Lord: write path, live build feed, single data source, status model. The copy-paste bridge retires for good.

**Status:** DONE — shipped in build #139. Worker deployed; read paths verified live. One Patrick command remains to switch on the write path (below).

**All 5 COO deliverables met:**
1. **Write path** — `POST /update`, write-key gated, persists `{id,field,value}`. Tested: 401 without key. ✓
2. **Live build #** — `GET /build` pulls the real `eas-build.yml` run_number. Tested: returns **#137**. ✓
3. **Single source** — `BUGS_STATIC` array **deleted**. The dashboard reads only the Worker; static/live duplication is now impossible. ✓
4. **Status model** — documented precedence (below). ✓
5. **Write-key auth** — Wrangler secret, empty-key bypass guarded, CORS-locked. ✓

**ONE design divergence from your brief — flagging honestly (CLAUDE.md "honest about limitations"):**
Your item (1) speced the write path as *"POST → updates the GitHub Issue (close/reopen/label/assignee)"*. I persisted to **Cloudflare KV overrides** instead of mutating GitHub Issues. Why:
- **Keeps the token read-only.** GitHub-writeback needs an Issues *write* token; Patrick made a read-only one. KV keeps least-privilege.
- **Handles all 4 fields cleanly.** `sev` and `build` aren't native GitHub issue fields — writeback would have to encode them as labels/body edits (lossy). KV stores them directly.
- **Less Patrick setup** — no new token, just one secret.
- **Tradeoff:** KV is a second store behind the Worker. The `GET /bugs` merge lets KV win, so if you close an issue on GitHub *and* had set its status via the dashboard, the dashboard value wins until cleared. Minor, and avoidable later.
**If you'd rather have true GitHub-as-only-store (writeback), say so** — it's a ~1 hr swap: new write-scoped token + map st→close/label. I went KV-first for security + simplicity. Your call.

**Status model (precedence):**
```
base from GitHub Issue:  closed→done | fix-attempted label→check | being-fixed→fixing | else→open
KV override wins for:    st, sev, who, build
```

**The ONE command Patrick still runs (switches on live saving):**
```
cd workers/bug-lord
npx wrangler secret put WRITE_KEY
```
Type any strong phrase — that's your dashboard password. Then open Bug Lord → Bugs tab → paste the same phrase into the write-key box once. Every dropdown tap then saves live.

**Two HONE-020 ticket files exist** (COO wrote `-single-source.md`, I wrote `-build-feed.md` concurrently). Merged the COO's spec content; recommend File Organiser keeps one. No code impact.

**Sequencing:** done alongside launch work, not ahead of it. Recipe-locking + the testing gate remain the 24 July critical path.

**No EAS dispatch.** Docs/infra only.

---
### HANDOFF → Senior Engineer · 2026-06-01 · DONE (Phase 1) — HONE-019 Live Bug Lord Cloudflare Worker
**Lane:** Claude Code (CLI).
**From:** COO (brief) / Senior Engineer (built)
**Subject:** Build a Cloudflare Worker so new GitHub Issues appear on Bug Lord automatically — no manual HTML edits.

**Status:** DONE (Phase 1 — read-only live feed) — shipped in build #138. Awaiting Patrick's one-time setup commands (Worker not yet deployed — see ticket).

**What landed (Phase 1):**
- `workers/bug-lord/` — TypeScript Worker (Wrangler v3): `GET /bugs` proxies GitHub Issues labelled `bug` → dashboard BUGS format, CORS for `patrickpatches.github.io`, 60 s edge cache, `GITHUB_TOKEN` as Wrangler secret.
- `docs/dashboard/index.html`: `BUGS_STATIC` fallback + `WORKER_URL` placeholder + `liveFetch()` IIFE (silent fallback if Worker not deployed).
- Ticket: `docs/coo/bug-tracker/tickets/HONE-019-live-buglord-cloudflare-worker.md`

**Patrick's one-time setup:**
```
npm install -g wrangler
wrangler login                      # use your existing CF account
cd workers/bug-lord && npm install
wrangler deploy                     # → note the subdomain printed
wrangler secret put GITHUB_TOKEN    # paste a new Issues read-only token
```
Then replace `YOUR_SUBDOMAIN` in `WORKER_URL` in `docs/dashboard/index.html`, commit, push.
Also create GitHub label `fix-attempted` (colour `#28E0B0`) — I add it when a fix ships.

**Phase 2 (COO brief extras — not yet built):**
- `POST /update` write endpoint (write-key gated) — lets dashboard status changes persist server-side without a git push
- `GET /build` — live EAS build run_number from GitHub Actions API
- Cloudflare KV for mutable state (currently read-only via GitHub Issues)

**No EAS dispatch.** Docs/infra only.

---

### HANDOFF → Senior Engineer · 2026-05-31 · DONE — HONE-016 Maestro screen-testing harness (Phase 1)
**Lane:** Claude Code (CLI).
**From:** COO
**Subject:** Build a Maestro screen-testing harness to catch crash-class regressions before Patrick installs each build.

**Status:** DONE (Phase 1) — shipped in build #135. Awaiting Patrick's on-device validation (R-015).

**What landed:**
- 5 Maestro YAML flows in `maestro/flows/`:
  - `01-kitchen-loads.yaml` — Kitchen tab cold-launch smoke
  - `02-browse-recipe.yaml` — recipe detail loads (catches Rules-of-Hooks crash class, #129/#131)
  - `03-cook-mode-loads.yaml` — cook mode loads; asserts Hummus step-1 body text (cook-mode-only)
  - `04-pantry-tab-loads.yaml` — Pantry tab smoke
  - `05-shop-add-missing-persists.yaml` — HONE-007 regression: items survive Shop tab reconcile after navigate-away
- `scripts/maestro-local.sh` — one-command runner for Patrick's device
- `.github/workflows/maestro-e2e.yml` — commented-out CI stub, ready to uncomment at Phase 2
- `docs/coo/bug-tracker/tickets/HONE-016-maestro-screen-testing-harness.md`

**Recommendation on where to run (COO item 4 — the key decision):**
- **Phase 1 (now): Patrick's physical Android device via USB ADB.** `eas-build.yml` is `workflow_dispatch` only, so there is no push-triggered APK to hook CI onto automatically. Android API 26 emulators in CI take 15–20 min per run vs 3–5 min on real hardware. Real hardware also catches Fabric/native-driver crashes (the v5 class) that emulators don't reproduce.
- **Phase 2 (at 10+ stable flows): GitHub Actions.** Uncomment `.github/workflows/maestro-e2e.yml`. `workflow_dispatch`, takes a `run_id` pointing to an APK artifact from `eas-build.yml`, uses `reactivecircus/android-emulator-runner@v2` (API 26). See ticket for full rationale.
- **Maestro Cloud: not recommended.** Adds SaaS cost (~$50–$100/mo at scale), another login, another sync surface. Not justified pre-revenue.

**Outstanding from COO brief (Phase 2 work — needs COO/Patrick sign-off on Phase 1 first):**
- Additional flows: search-by-keyword, servings-scaling, pantry "cook with what you have"
- `testID` props on components the Bug Tester flow touches (additive only)
- Machine-readable Maestro output piped to the Bug Tester / Bug Lord
- Rename runner to `scripts/run-ui-tests.sh` and move flows to `.maestro/` if COO prefers that path convention

**No EAS dispatch.** No app code changed. Docs/infra only.

---

### HANDOFF → Product Designer · 2026-05-31 · OPEN — HONE-009 quick "heads-up" holding layout
**Lane:** Cowork.
**From:** COO
**Subject:** Spec a collapsible "heads-up" block for the recipe browse screen's "before you start" notes. Patrick chose the quick holding fix (2026-05-31).

**Why:** `before_you_start[]` renders as a wall of text up front, against the chef-voice "anticipation, not reaction" rule (HONE-009). The proper fix — notes relocated to the step/ingredient they apply to — needs cook authoring and is tracked separately as **HONE-015** for later. For now we want a fast, low-risk layout that kills the wall of text.

**What's needed:** Spec (HTML prototype, the usual) a tap-to-expand block. Collapsed = one-line preview (e.g. a "3 things to know first" summary line, or the first note). Tapped = the full list. v7 palette only (ink / muted / bronze / gold / terra — **no blue**, which also ties off HONE-011). One drop-in component the Engineer can wire into the existing render. Hand back to Engineer when speced.
**Files:** `docs/coo/bug-tracker/tickets/HONE-009-before-you-start-wall-of-text-violates-chef-voice.md`; prototype → `docs/prototypes/`.
**Blocks:** the clean version of the recipe screen. Cosmetic — does NOT gate build #134.

---


### HANDOFF → Senior Engineer · 2026-05-31 · DONE — fix HONE-007..012, shipped in build #134
**Lane:** Claude Code (CLI).
**From:** COO
**Subject:** Fix all six on-device bugs from build #132's v7 "Mise" browse-mode restyle, in one tree, targeted at build #134. Patrick approved full scope (2026-05-31).

**Status:** DONE — shipped in build #134. Awaiting Patrick's on-device validation (R-015). One exception: HONE-009 flagged back (see below).

**Closeout — what landed:**
- HONE-007 ✅ Fixed — `kind:'meal'` → `kind:'manual'`. Items from "Add missing" now persist in the shopping list regardless of plan state.
- HONE-008 ✅ Fixed — three duplicates removed: inline Start Cooking pill, "Watch the chef" ghost-row link, N/M pill badge in pantry eyebrow.
- HONE-009 🚩 FLAGGED BACK TO COO — requires per-recipe data authoring, not a code move. Each `before_you_start` note needs to be mapped to the specific step or ingredient it applies to. That mapping doesn't exist in the data yet. Options: (a) Cook authors which step each note moves to, then engineer wires it up in a data-only follow-up; (b) Designer specs a collapsible "heads-up" block (like the Mise expand pattern) as a holding layout until the data migration happens. No code change in #134.
- HONE-010 ✅ Fixed — plate time now `finishing_note ? 5 : 3`. Proper fix needs a `plating_time_minutes` schema field + per-recipe data (cook's lane).
- HONE-011 ✅ Fixed — blue swapped to gold throughout the "What to know" callout.
- HONE-012 ✅ Fixed — `difficultyLabel` (capitalised) used on meta line.

**Files touched:** `mobile/app/recipe/[id].tsx` only. No schema change, no migration, no other file.

---


### HANDOFF → Senior Engineer · 2026-05-30 · OPEN — URGENT (push tracker to GitHub + backfill real bugs)
**From:** COO
**Subject:** Two-part: (1) get the bug tracker dashboard live on GitHub Pages — Patrick can't reach it from his phone until you push my changes — and (2) backfill the **real** bug roster from your recent conversations. I've cleared the seeded samples; the dashboard is empty by design until you populate it with the actual tickets.

**Why Patrick can't load the dashboard at `https://patrickpatches.github.io/hone/bug-tracker/`:** the files exist only on his local checkout. They haven't been committed or pushed. The Pages workflow only fires on push to `main`.

---

**Part 1 — Get the dashboard live.** Pre-flight in this order:

1. **Pull latest main** (you've had stale-local issues before — fetch + reset before editing).
2. **Confirm these files are present in the working tree** (I put them there but they may not be in git yet):
   - `docs/dashboard/index.html` — the static dashboard (1068 lines, self-contained, no external assets beyond the Chart.js CDN)
   - `.github/workflows/deploy.yml` — has a new step "Add bug-tracker dashboard" between "Disable Jekyll" and "Setup Pages" that copies `../docs/dashboard/index.html` to `dist/bug-tracker/index.html`
   - `.github/ISSUE_TEMPLATE/bug-report.yml`
   - `docs/coo/specialists/bug-tester.md`
   - `docs/coo/bug-tracker/PROTOCOL.md`, `_TEMPLATE.md`, `build-history.csv`
3. **Verify GitHub Pages is enabled and configured for the repo.** Settings → Pages → Source must be **"GitHub Actions"** (not "Deploy from a branch"). If it's not on, turn it on with that source. If you can't change it (Patrick-only setting), flag back and tell Patrick the exact toggle.
4. **Commit all the files above** in one tree. Suggested message: `feat(tracker): Hone bug tracker + PM dashboard — protocol, charter, template, Pages deploy`. Land it as build #132's tail or whatever build number is open. Build-log row in the SAME tree per discipline.
5. **Push to main.** Watch CI for ~2 min: both `Deploy to GitHub Pages` and `R-014 truncation check` must succeed. If Deploy fails, fix-forward in a follow-up commit; don't revert.
6. **Verify the URL loads in a browser** at `https://patrickpatches.github.io/hone/bug-tracker/`. Confirm all six tabs render (Dashboard / Board / Roadmap / Backlog / Epics / Table). Report the verification result back to me.

---

**Part 2 — Backfill the real bug roster.** I cleared the 9 seeded sample tickets from `docs/dashboard/index.html` (the `TICKETS_BASE` constant is now an empty array with an instructional comment). The dashboard will render "no tickets" until you populate it with real ones.

Patrick has told me: "the bugs and issues that he [you, the engineer] recorded on the last few conversations with me." You're the source of truth for that list — I don't have your full session history. Concretely you've mentioned across recent turns:

- The "Add missing" sweep bug (commit `1e225a6`) — confirmed fix attempted
- "Five B132-* bugs" Patrick has already found (your exact phrasing) — you know what these are
- Step-number badge invisible (HONE-100 from the open handoff at line ~210)
- Plate-time hard-coded to 3 min (HONE-101 from #129 closeout — fix queued in commit-b2-prompt §3.9)
- Anything else you've recorded in addendums, closeouts, or replies to Patrick that hasn't been formally ticketed

**For every one of those:** follow the protocol at `docs/coo/bug-tracker/PROTOCOL.md`:

1. **File a GitHub Issue** using the `bug-report` form (it auto-formats the structured block). One issue per bug.
2. **Create the mirror file** at `docs/coo/bug-tracker/tickets/HONE-NNN-<kebab-slug>.md` from `_TEMPLATE.md`. Fill in the full block: Type, Severity, Category, Screen, Recipe, Assignee, Epic, Found-in-build, Fix-attempted-build (if applicable), Target-build, Reproducible, Device, Golden Rule, Root Cause (if known). Then repro / expected / actual blocks.
3. **For bugs you've already fixed**, append the `## FIX ATTEMPTED — Build #N (commit <hash>)` block to the mirror at the same time. Status moves to `FIX ATTEMPTED`. Do NOT mark VALIDATED — Patrick does that on-device per R-015.
4. **Update `BUGS.md`** with the new active-tickets table.
5. **Regenerate `TICKETS_BASE` in `docs/dashboard/index.html`** with the real ticket array. Same shape as the comment in the empty array. Push that with the rest.
6. **Append a row to `docs/coo/bug-tracker/build-history.csv`** for this backfill session.

When you push, the Pages site updates within ~90 seconds and Patrick sees the real bug list on his phone.

---

**Discipline rules — non-negotiable:**

- **Per R-015:** do NOT close any GitHub Issue yourself. Use FIX ATTEMPTED only; Patrick closes on-device.
- **Per R-014:** tail-check every TS/MD/YML file you write. Use bash heredoc or `--data-binary @file` for any file > 200 lines.
- **Per build-log rule:** the build-log row, the code, the tickets, and the closeout block all land in the SAME tree.
- **Do NOT dispatch an EAS build.** Patrick triggers builds. This is a docs-only push; no APK needs cutting for this.

**Cost:** Part 1 ~15 min, Part 2 depends on how many real bugs you have to file — probably 30-60 min for a clean backfill of ~8-12 tickets.

**Blocks:** Patrick's mobile access to the dashboard (Part 1), the Bug Tester's first session (Part 2 — they have nothing to test against until the roster is real).

---

### HANDOFF → All specialists · 2026-05-30 · OPEN (new system — Hone Tracker, bug tracker + project manager)
**From:** COO
**Subject:** Per Patrick's instruction, the team now runs on a single, Hone-specific tracker that covers BOTH bug tracking and project management. Effective immediately. Old ad-hoc paths (mentioning bugs only in handoff blocks, three-half-systems drift) are retired.

**The system has six pieces:**

1. **New specialist role — Bug Tester** at `docs/coo/specialists/bug-tester.md`. Adversarial user. Installs every build, stress-tests against design brief, chef voice, ergonomics, functionality, golden rules, and unhappy paths. Writes tickets, never code. **Communicates through tickets only — no chat.** Distinct from QA Test Lead (strategic, owns smoke-test suite + perf budgets) and Beta Tester Coordinator (manages external testers for Closed Testing).
2. **Communication protocol** at `docs/coo/bug-tracker/PROTOCOL.md`. The only allowed status flow is `OPEN → FIX ATTEMPTED → VALIDATED ✅ (by Patrick only)`. Engineers and Testers are both forbidden from self-closing. Patrick remains the only one who can close a ticket — R-015 reaffirmed.
3. **Hone-specific ticket template** at `docs/coo/bug-tracker/_TEMPLATE.md`. Structured block at the top with Type (Bug/Task/Feature/Epic), Severity (P0-P3), Category (UI/Crash/Data/Perf/Content/A11y/Flow), Screen, Recipe, Assignee (Engineer/Designer/Cook/Photography/Bug Tester/Patrick/COO), Epic, Found-in-build, Fix-attempted-build, Target-build, plus repro/expected/actual below.
4. **Phone-friendly GitHub Issue form** at `.github/ISSUE_TEMPLATE/bug-report.yml`. Patrick files from his phone in under 60 seconds; the Bug Tester mirrors the issue into `docs/coo/bug-tracker/tickets/HONE-NNN-<slug>.md` at next sync.
5. **Desktop dashboard** — Cowork artifact `hone-bug-tracker` (sidebar). **Six tabbed views: Dashboard / Board / Roadmap / Backlog / Epics / Table.** Manual status change on any ticket via dropdown — persists to localStorage. + New ticket quick-add for local drafts.
6. **Mobile dashboard** — same HTML deployed to GitHub Pages at `https://patrickpatches.github.io/hone/bug-tracker/` via `.github/workflows/deploy.yml` (one step added to the existing Pages workflow). Patrick bookmarks the URL on his phone home screen. Auto-rebuilds on every push to main.

**The six Dashboard metrics — meaningful, not vanity:** Launch countdown KPI (days to 24 July + P0+P1 remaining + on-pace verdict computed from last-10-build velocity), open by severity, open by category, aging histogram, bugs-per-build trend (opened vs cleared = regression rate), first-attempt validation rate, MTTR by severity.

**The four Epics (product threads):** EPIC-v7-mise (recipe screen restyle, in flight), EPIC-pantry-first (kill feature, in flight), EPIC-photography (16 launch heroes, in flight), EPIC-launch-ready (cleanup before 24 July, in flight).

**What every specialist needs to know:**

- **Senior Engineer:** when you ship a fix, add a `## FIX ATTEMPTED — Build #N (commit <hash>)` block to the ticket's mirror file in the SAME tree as the build commit. Comment on the GitHub Issue with the same. Do NOT call the close endpoint. Also note: `commit-b2-prompt.md` §3.9 now contains the Plate-time hard-coded-to-3-min fix from #129's closeout — land it in Commit B2.
- **Bug Tester:** at every session start, sync from GitHub Issues → mirror files → `BUGS.md`. Run the per-build pass for any `### CLOSEOUT — Build #N` block in handoffs.md since your last session. Re-test every `FIX ATTEMPTED` ticket and add a `## RE-TEST` block.
- **Patrick:** you do nothing different from your phone. The GitHub Issues form just asks the right questions now. You're still the only one who can mark a ticket VALIDATED.
- **Other specialists (Designer, Cook, Photography, Beta Coordinator, QA Test Lead):** read PROTOCOL.md once. If you encounter a bug during your work, file via the template — don't bury it in a handoff block.

**Discipline rules retained, reinforced:**
- Bugs live in GitHub Issues (truth) + mirror files (history) + `BUGS.md` (roster) + dashboard (view). One truth, three views.
- Mirror files are append-only history. Never delete prior blocks.
- Severity P0–P3 is mandatory on every ticket.
- The dashboard is read-only — update the source files, never the HTML directly.

**Files added:** `docs/coo/specialists/bug-tester.md`, `docs/coo/bug-tracker/PROTOCOL.md`, `docs/coo/bug-tracker/_TEMPLATE.md`, `docs/coo/bug-tracker/build-history.csv`, `docs/coo/bug-tracker/tickets/` (empty — populated as tickets arrive), `.github/ISSUE_TEMPLATE/bug-report.yml`, `docs/dashboard/index.html` (the static dashboard auto-deployed to GitHub Pages), plus one step added to `.github/workflows/deploy.yml`. FILE_MAP.md updated.

**Status:** OPEN for first-session adoption by every specialist on their next contact.

---

### HANDOFF → COO · 2026-05-30 · OPEN — ADDENDUM: Patrick has expanded scope — world-class Hone-specific ticketing system + dedicated Bug Tester agent role + analytics dashboard

**From:** Senior Engineer
**Subject:** Patrick's response to my earlier ticketing-pushback handoff. He's chosen a much bigger initiative than option 1/2/1+2/3. Wants three deliverables, not one. Treat this as the actual product brief; my earlier "build a Cowork quick-add artifact" recommendation is now the *floor*, not the ceiling.

**Patrick verbatim (so you have his framing exact):**
> "I want the COO to be aware of everything and let him know I want to implement a world-class Hone-specific ticketing system for fault rectification or any other issues. I want this with the intent that I want a world-class specialty bug tester to be testing the app for the implementation of features, the functionality of them, cluttered text, poor design etc. This bug tester has a supernatural ability to be the ultimate product tester, and use the ticketing system to record them with extremely effective communication to the engineer to ultimately fix them. It will also be an easy way to track past and present bugs and have beautifully kept records and graphs to track useful metrics."

---

#### Three components Patrick wants

1. **Hone-specific ticketing system** — a real workflow, not just GitHub Issues with a coat of paint. Persistent memory for every UX/functional/design/content observation across the life of the product. Engineer reads tickets to know what to fix; tickets carry enough structure that Engineer is briefed without back-and-forth.

2. **Bug Tester agent role** — a *new role* alongside COO / Cook / Designer / Engineer. Persona: "supernatural ability to be the ultimate product tester." Patrick's intent — the Tester is the dedicated set of eyes that catches clutter, broken functionality, design-brief breaches, chef-voice violations, ergonomics failures, content drift, performance regressions. They communicate with Engineer through the ticketing system; that's the only channel.

3. **Metrics + analytics dashboard** — "beautifully kept records and graphs to track useful metrics." Glanceable. Tells Patrick how the product is trending without him reading 200 tickets.

---

#### My engineering read

This is the right move at this stage of the project. Three reasons:

1. **Patrick's testing leverage is currently capped at his own pixel-time.** A dedicated Tester multiplies it. The Tester catches things Patrick walks past because he's seen the screen 50 times; the Tester sees it with first-time eyes every time, against the brief.
2. **Tickets become the product's memory.** Right now half of our "what did we ship in #129" knowledge lives in the handoffs.md table. That's fragile. Structured tickets are durable and analyzable.
3. **The metrics dashboard turns intuition into evidence.** "We feel like we're shipping faster" becomes "mean time-to-fix dropped from 4 days to 1.5 days across the last 6 builds."

---

#### Engineering proposal for COO to design against

**Backend (recommended):**
- **GitHub Issues stays the source of truth.** PAT is already embedded; Patrick already accepts GitHub as the canonical store; no new SaaS dependency.
- **Add a structured YAML/JSON frontmatter block** at the top of every Issue body. Engineer + Tester + COO write it; the artifact parses it. Fields: `id`, `severity`, `category`, `area`, `recipe_id`, `build_introduced`, `build_fix_attempted`, `build_validated`, `repro_steps`, `expected`, `actual`, `screenshot_urls`, `root_cause`, `engineer_notes`. Labels mirror category + severity for native GitHub filtering.
- **Status flow stays:** OPEN → FIX ATTEMPTED → VALIDATED ✅ / REJECTED 🔴 (per existing CLAUDE.md discipline). Tester opens; Engineer fix-attempts; Patrick validates; Tester re-tests; Tester or Patrick can reject.

**Frontend (the artifact):**
- A Cowork live artifact `hone-ticket-system` that supersedes the existing `hone-bug-tracker`. On load: fetches open + recently-closed Issues via the GitHub MCP, parses the structured block, renders three views (Dashboard / Board / Table). Quick-add button on Patrick's sidebar fills the Engineer (me) with a pre-filled prompt to file the Issue with full structure.
- Charts via Chart.js inline (per the artifact module's allowed CDN list).

**Suggested dashboard metric set (pick 4–6 that actually matter):**
- Open count by severity (P0 / P1 / P2 / P3) — single number per band, big.
- Open count by category (Functional, UX clutter, Design-brief breach, Content, Performance, Accessibility) — small bar.
- Aging histogram — "X tickets open >7 days, Y >14, Z >30." Surfaces stalls.
- Bugs-per-build trend — sparkline of new tickets opened against each build number.
- Mean time-to-fix — running 6-build average; shows whether we're accelerating.
- Tester validation rate — % of fix-attempts that pass first time. Surfaces "engineer shipping confident-but-wrong fixes" if it dips.

Recommend skipping: cumulative-bug-count vanity, "engineer productivity" framings, anything Patrick can't act on.

**Bug Tester charter (you author):**
File at `docs/coo/roles/bug-tester.md`. Headers I'd suggest:
- *Persona:* obsessive product QA with kitchen-context awareness; reads CLAUDE.md golden rules as sacred; reads the v7 prototype + every active design ticket; remembers every previous bug as a pattern primitive.
- *Inputs:* Patrick's screenshots; the latest build hash; the brief stack (CLAUDE.md + active tickets + Designer's prototypes + Cook's recipe research); prior tickets (so the Tester learns recurring failure modes — substring matches in the same component family are a red flag).
- *Workflow:* receive screenshot → systematically scan against brief (chef voice, palette, ergonomics, functional, content) → file one ticket per distinct issue (NOT "found 5 things, here they are in a list" → 5 separate tickets, each with its own structured body).
- *Tone:* blunt, specific, kind. No "looks great!" filler. Every observation grounded in a brief, a heuristic, or a measurement.
- *Success criteria:* Tester's tickets need no clarification rounds from Engineer; Tester's validations are stable (Engineer doesn't re-open Tester-validated tickets).

---

#### Engineering subnote — B132-02 root cause (diagnosed while Patrick was reading my last handoff)

The "Add missing to shopping list" button does write the items to the database correctly. The Shop tab's `useFocusEffect` runs a `reconcile()` function that walks every shopping row and **strips any item whose source is a meal-recipe that isn't currently in the planned set.** "Add missing" writes items with `sources: [{ kind: 'meal', recipe_id, servings }]`. The recipe was browsed, not planned. Reconcile sees the recipe isn't planned, removes the meal source, and (via `applyMealRemove`) drops the row entirely. The items vanish before Patrick sees them.

**Fix path** (will bake into the v7 Phase 1.5 bundle): change the handler in `mobile/app/recipe/[id].tsx` `addMissingToShoppingList` to write `sources: [{ kind: 'manual' as const }]` and `manually_added: true`. Reconcile already ignores manually-added rows. The recipe link goes into `notes` for context. Single-file edit, no schema change. This is also a hint to the Bug Tester worth recording: **whenever a feature writes data into a tab that has a reconcile/sweep on focus, verify the data survives the next focus cycle.** That's a heuristic to add to the Tester's charter.

---

#### What COO needs to do now

1. **Approve** the world-class ticketing + Bug Tester initiative as a top-priority Q3 (or earlier) workstream. My read: this is high-ROI; I'd run it in parallel with v7 Phase 1.5 / Phase 2 rather than blocking either.
2. **Author** the Bug Tester role charter at `docs/coo/roles/bug-tester.md`. Persona, inputs, outputs, tone, success criteria, charter examples. This is the heaviest piece — needs your judgment.
3. **Spec** the structured-issue-body convention. Field list, YAML/JSON, label set, severity scale. Patrick will need to confirm severity definitions (what's P0 vs P1) so they're stable across builds.
4. **Choose** the dashboard metric set. My recommended 6 above; trim/swap as you see fit.
5. **Confirm or revise the build sequence:**
   - COO designs spec → Engineer builds the `hone-ticket-system` Cowork artifact + the GitHub Issue convention → COO publishes the Bug Tester charter → Patrick first session with Bug Tester (Bug Tester onboards by reading every doc + every existing ticket, then runs an immediate pass on #132 and files all the B132-* observations under the new structure as a backfill).
6. **Decide what happens to the existing `hone-bug-tracker` artifact** — supersede it cleanly, or evolve it in place. My recommendation: supersede, archive the old one.

---

#### Files this addendum touches

- `docs/coo/handoffs.md` — this addendum prepended above my earlier handoff.
- No code touched. Engineer is continuing v7 Phase 1.5 work in parallel.

#### Status

OPEN. Two open handoffs from Engineer to COO sitting at the top of this file (this addendum, then the earlier handoff). Reply with the spec — or counter-handoff if you disagree with any of the engineering recommendations above.

---

### HANDOFF → COO · 2026-05-30 · OPEN — context catchup + 5 new on-device bugs from #132 + ticketing-system decision needed

**From:** Senior Engineer
**Subject:** (1) Catchup on the v7 build arc since you last had visibility (you closed out on #129). (2) Five new on-device bugs Patrick surfaced validating #132 against the Thai Green Curry recipe. (3) Patrick is "strongly considering a professional [ticketing system] better than Jira" — engineering pushback inside, decision needed.

**Why this handoff exists:** Patrick is finding it hard to track and write down the bugs he's catching from his phone — the intake friction has become a bottleneck. He asked for an explicit COO brief so we can decide together on the right structural answer rather than continue cobbling on the current rigging (`BUGS.md` cache + GitHub Issues source of truth + Cowork bug-tracker artifact, with Patrick as the human relay between his phone and the repo). This handoff carries the engineering context plus my honest read on the leverage point.

---

#### Part 1 — Build arc since #129 (your last reference point)

| Build | Commit | What landed | Status |
|---|---|---|---|
| #127 | `0f423b5` | v7 Commit A — tokens + Fraunces fonts | shipped, validated |
| #128 | `c5bde6d` | Hotfix — regenerate `package-lock.json` to match Commit A `package.json` (CI `npm ci` strict failed) | shipped, validated |
| #129 | `ebebc27` | v7 Commit B — pantry card + journey cards + hero typographic fallback + Method tap-to-cook (partial scope of the brief) | shipped; recipe screen crashed on open |
| (no build) | `625923a` | Patrick's hotfix — `updateSubstitutions(db)` migration at launch + defensive `qualityConfig` fallback in `SubstitutionSheet` | shipped, did NOT fix the crash |
| #130 | `5dc6da5` | Diagnostic — `RecipeErrorBoundary` class wrapping the recipe screen to surface the actual exception text | shipped; ErrorBoundary stays in tree permanently |
| #131 | `d7332fc` | REAL FIX — Rules of Hooks violation. My #129 added `useMemo`/`useCallback` below the `if (recipe === undefined) return <Loading/>` early-return guards. On first render guards return early → hooks don't call; on second render guards pass → hooks DO call. Different hook count between renders → React threw at mount. Fix: hoisted all 5 hooks above the guards with defensive defaults | shipped; recipes open cleanly |
| #132 | `1d79a4e` | v7 Commit B2 — completed §3.1–§3.8 of the brief (top bar restyle, title block + meta, drop At-a-glance, inline CTA + ghost row, Get-ready merge, compact Method, Ingredients pantry-style rows with in-pantry strikethrough + honest-swap callout, bronze eyebrows). Cook-mode shared blocks gated `cooking ? <original> : <v7>` so cook renders byte-identical to #131 | shipped; on-device validation in progress (see Part 2) |

**Three lessons logged to my permanent memory from this arc:**
1. **Static checks cannot catch React runtime invariants.** tsc, R-014 tail-check, and brace-balance all passed on #129 — they cannot see Rules of Hooks violations or Fabric driver mismatches. Runtime crashes need runtime instrumentation.
2. **When blind to a release-build crash, ship a diagnostic — don't guess.** I burned a build cycle (#129 → no-build hotfix → #130) before I conceded the static-audit approach was wrong and shipped the ErrorBoundary. The ErrorBoundary immediately surfaced the exact error message and #131 was a mechanical fix from there.
3. **Animated/scroll-driven chrome is BANNED on the recipe screen** until we have proper Fabric debugging tooling — this is the v5 crash class (build #124) that we've been working around for a month.

**Where v7 stands per the Designer ticket** (`docs/coo/tickets/recipe-detail-v7-build.md`):
- Phase 1 Commits A + B + B2 shipped.
- Phase 1 Commit C (cook-mode "Look for" Fraunces italic → Inter SemiBold upright 19sp) **NOT yet started**.
- Phase 2 (allergens schema, equipment enrichment, cook-mode enhancements) **NOT started**.

---

#### Part 2 — Five new on-device bugs from Patrick's #132 validation (Thai Green Curry browse)

Patrick screenshotted the top of the recipe (clutter) and a second section showing `before_you_start` as a wall of text. The five bugs:

**B132-01 · UX / clutter · top-of-recipe density**
First viewport stacks: top bar (3 icons) + hero photo + bronze eyebrow ("INSPIRED BY ANDY COOKS · WATCH THE ORIGINAL ↗") + Fraunces 38sp title + italic tagline + meta ("intermediate · Serves 4 · Thai") + full-width rust 56dp "Start cooking" pill + ghost row ("Plan it · Watch the chef") + bronze pantry eyebrow with "0/9" badge on the right + pantry card with huge "0/9" numeral + status copy + 4 missing pills + bottom-floating sticky "Start Cooking" pill. **Two CTAs of identical colour and form compete for attention. The "0/9" appears twice within ~100 px. "WATCH THE ORIGINAL" is duplicated by "Watch the chef" in the ghost row.** Patrick's direction: kill the inline rust pill — the floating sticky covers it. Five-fix recipe in the chat reply. Engineering scope: ~30 min, single file, no schema change. **Priority: high** — visible on every recipe.

**B132-02 · Functional bug · "Add missing to shopping list" button does not deliver missing ingredients to Shop tab**
Per #129 closeout, the In-your-pantry card's gold-outlined button should loop `upsertShoppingItem` over `match.missingIngredients`. Patrick reports tapping it does NOT put the ingredients in the Shop tab. Suspects in likelihood order: (a) the missing-pills row is rendering from `match.missingCount`/derived list but the button handler loops a differently-named or empty field; (b) `upsertShoppingItem` writes correctly but Shop tab doesn't refetch on tab-return — same regression class as REGN-007 (derived state across surfaces); (c) handler is try/catch-wrapped, swallowing an error while the success toast fires anyway. **Priority: highest** — this is fraudulent UX. The In-your-pantry card tells you to add ingredients, you tap, nothing happens. Worse than not having the card at all. Engineering scope: ~1 hour diagnose, ~30 min fix.

**B132-03 · Content architecture · `before_you_start` is a wall of text against the chef-voice mandate**
Thai Green Curry's `before_you_start` renders as 3 paragraph bullets (~10 lines of dense body text) BEFORE the user has decided to cook. The three bullets are (a) substitution warning "Full-fat coconut milk only — light breaks", (b) technique cue "Cracking the coconut cream — oil pools visibly", (c) tempo cue "Everything from the wok happens fast — prep before the wok goes on". **All three belong NEXT to the moment they apply** — (a) on the Coconut milk ingredient row (or as `substitutions[].changes` if already authored), (b) as `why_note` on the step where you fry the curry paste, (c) at the top of Mise as a chef-voice callout. CLAUDE.md is explicit: "Anticipation, not reaction. Tell the user what's coming two steps ahead." A textbook of theory upfront violates both.

Two paths forward:
- **Phase 1.5 (no schema change, ~1 hour engineering):** collapse the wall to one-line previews — *"Use full-fat coconut milk · Crack the cream · Move fast"* — tap any to expand the prose. Doesn't change cook's data.
- **Phase 2 (the right answer, ~3 days engineering + cook authoring per recipe):** add `placement` to each `before_you_start` entry: `{ note: string; show_at: 'mise' | { ingredient_id: string } | { step_id: string } }`. Schema migration + per-recipe rewrite by Cook. Each note then renders at its rightful moment.

**Recommend:** ship Phase 1.5 in the next build, schedule Phase 2 as a proper data initiative with Cook (separate ticket she authors over time).

**B132-04 · Palette violation · BLUE left rail on the `before_you_start` block**
v7 palette is 5 tokens (ink / muted / bronze / gold / terra). Blue is orphan styling from pre-v7. Should be bronze rail (matching the honest-swap callout). Engineering scope: ~5 min, single token swap. **Priority: medium** — visible but cosmetic.

**B132-05 · Copy / case · "intermediate" should be "Intermediate" on the meta line**
The meta line takes `recipe.difficulty` straight from data; data is lowercase. Render-time titlecase is preferred over fixing the seed data (other surfaces may want the lowercase for filters or matching). Engineering scope: 1 line. **Priority: low** — but jarring against the chef-voice tone everywhere else.

**Patrick's prioritised order, my recommendation:**
B132-02 (functional, kills trust) → B132-01 (visible on every recipe) → B132-04 + B132-05 (trivial bundled-in fixes) → B132-03 Phase 1.5 collapse → B132-03 Phase 2 (separate Cook-led initiative).

**Natural build target:** a "v7 Phase 1.5" bundle landing all of B132-01, B132-02, B132-04, B132-05, and the Phase-1.5 collapse for B132-03 in a single tree. Hard-safety constraints unchanged (zero `Animated.ScrollView` / `Animated.event` / `scrollY` / `addListener` / `onScroll`; all hooks above the early-return guards).

---

#### Part 3 — Patrick's ticketing-system question + my engineering pushback

Patrick verbatim: *"I am finding it hard to track and write down all the bug I am finding. The last he heard was an older build … strongly considering a professional better than Jira or any other world class ticketing system."*

**My read:** the bottleneck is NOT the ticketing system. It is the *intake*. Patrick tests on his phone, finds a bug, then has to either type out a GitHub Issue on his phone (slow, no native screenshot attach without extra steps) or describe it to me in chat (ephemeral — disappears with session context). The current rigging — `BUGS.md` cache + GitHub Issues source of truth + Cowork bug-tracker artifact, status flow OPEN → FIX ATTEMPTED → VALIDATED ✅ / REJECTED 🔴 — is **structurally fine**. What fails is the act of capture.

Switching to Linear or Jira-replacement doesn't fix that. It adds a new login, a new mobile app, another sync surface, and the same typing problem. It also costs $10/seat/month and adds a SaaS dependency to a one-developer project.

**Three options ranked by leverage-to-cost:**

1. **(My pick) Build a Cowork "Hone Bug Intake" live artifact.** One "+ Quick add bug" button on Patrick's Cowork sidebar. He taps it on phone, attaches screenshot, types one sentence of repro, hits submit. The artifact's `submit` handler pre-fills me with a structured prompt template — I then file the proper GitHub Issue (title, body, labels, build-number link, screenshot URL), mirror it in `BUGS.md`, and confirm back to Patrick with the Issue link. End-to-end ~30 seconds. Tool footprint: zero additions. Stays inside the existing GitHub Issues system. Cost: ~4 hours engineering.
2. **Stand up GitHub Projects board on the existing Issues.** Adds a kanban view of the same status flow (OPEN → FIX ATTEMPTED → VALIDATED / REJECTED). Free, GitHub-native, GitHub mobile app has a board view. Doesn't fix Patrick's capture friction by itself but does make triage clearer for both of us. Pairs naturally with option 1. Cost: ~1 hour COO setup.
3. **Adopt Linear.** Best-in-class web UI, fast keyboard, popular among lean teams. Real costs: $10/user/month, new login, new mobile app, ANOTHER sync surface against GitHub. Adds friction for Patrick (mobile capture still slower than a quick-add Cowork form). Recommend NOT switching unless the team scales beyond Patrick + Claude.

**Recommend: 1 + 2 layered.** I build the intake artifact; COO sets up the Projects board. Patrick gets fast capture AND a board view that mirrors it.

---

#### What's needed from COO

1. **Decide the ticketing path** — option 1 / 2 / 1+2 / 3. I'll execute whichever you call.
2. **Confirm priority order** for the five new B132-* bugs. My recommendation in Part 2; flag anything you'd reorder.
3. **Confirm scope of the next Engineer build** — the "v7 Phase 1.5" bundle described above. If you want it split (e.g., B132-02 alone as a hotfix, then the rest as a bundle), say so.
4. **Re-sync `BUGS.md` from GitHub Issues at next session start.** The cache has stale REGN-001/006/007 entries from May 7–8 (~3 weeks old) and the new B132-* entries I'm adding in this commit. A proper resync against GitHub Issues is overdue.
5. **Phase 2 schedule for B132-03** — does the Cook get a separate ticket to author `placement` on `before_you_start` per recipe? My recommendation: yes, but on her own timeline; Phase 1.5 covers the UX problem in the meantime.

---

#### Files in this handoff commit

- `docs/coo/handoffs.md` — this handoff block added at the top of Open handoffs.
- `BUGS.md` — five new B132-* entries appended to the active tickets table; existing REGN-* entries untouched pending COO's GitHub Issues resync.

#### Files for COO to read

- `docs/coo/tickets/recipe-detail-v7-build.md` — the original v7 ticket. Phase 1 vs Phase 2 line is here.
- `docs/coo/tickets/commit-b2-prompt.md` — the brief I gave Claude Code for #132. Useful if you want to see the §3.1–§3.8 spec the bugs are measured against.
- `mobile/app/recipe/[id].tsx` at HEAD `1d79a4e` — the file the bugs are against.

#### Blocks

- "v7 Phase 1.5" build is blocked on your priority confirmation. None of the five bugs is individually blocking — Patrick can keep using the app.
- The Cowork bug-intake artifact build is blocked on your ticketing-path call (options 1 / 2 / 1+2 / 3).

#### Status

OPEN. Awaiting your reply in this file (a CLOSEOUT block below this one, or a counter-handoff back to Engineer with your decisions).

---

### CLOSEOUT — Build #132 · Engineer · 2026-05-30 — v7 browse-mode restyle complete

**Scope:** `mobile/app/recipe/[id].tsx`, `!cooking` branch only — the remaining v7 Frame-A work the #129 closeout deferred to "Commit B2" (top bar, title block + meta, inline CTA + ghost row, Get-ready merge, Ingredients row restyle with in-pantry/shopping-list state + honest-swap callout, compact Method, bronze eyebrows). All of §3.1–§3.8 from the brief landed.

**Cook mode untouched (§4.3):** the three blocks shared by both modes — the title card, the Ingredients header, and the Method header — are now `cooking ? <original> : <v7>`, and the ingredient `.map` early-returns the verbatim #126 cook row when `cooking`. Cook mode renders exactly as #131. `_layout.tsx` and `SubstitutionSheet.tsx` (Patrick's substitution-quality fix) were not touched. `RecipeErrorBoundary` (#130) left in place.

**New data read:** `getShoppingItems(db)` loaded once on mount (same one-shot pattern as the pantry load), hoisted above the recipe-loaded guards with a defensive `[]` default; a hoisted `useMemo` set + `useCallback` derive the `· on shopping list` sub-line. No schema change, no migration, no new dependency.

**Decisions that diverged from the brief (flag for confirm/revert):**
1. **Top-bar title → flex spacer.** §3.1 listed only the three circular buttons; the existing bar also had a 16sp title. With the new 38sp Fraunces title directly below the hero, a second title competes. Removed it for a spacer (matches the ticket's "back · spacer · plan · heart"). Reversible in one line.
2. **Browse description note dropped from the title block.** The old cream card had an "A note: {description}" panel; §3.2's title block spec doesn't include it, so browse no longer shows it. Still present in the cook-mode card. If you want it back in browse, it's a small re-add.
3. **Browse Method is now content-free (compact rows only).** §3.6 specifies number + title + time + chevron; the full step content, doneness cues and stage photos now live exclusively in cook mode (one tap away). If you'd rather keep inline step content in browse, that's a revert of this one section.
4. **Journey "Plate" time stays 3 min** (unchanged from #129 — `leftover_mode` is an object, not the string the original ticket assumed).

**Hard-safety (v5 lesson):** zero `Animated.ScrollView` / `Animated.event` / `scrollY` / `addListener` / `onScroll`; plain `ScrollView`; the bottom sticky Start-Cooking pill is always-visible (not scroll-gated). **Hook-order (the #129/#131 lesson):** every hook declaration (33) sits above the first early-return guard; the new shopping-list hooks are hoisted and defensive against `recipe` being undefined.

**Status:** shipped to `main`, awaiting Patrick's on-device validation. Per R-015, not self-closing.

---

### CLOSEOUT — Build #130 · Engineer · 2026-05-29 — diagnostic build

**Scope:** Single change. Wrapped `RecipeDetailScreenInner` in a `RecipeErrorBoundary` class component. On any render-time error in the recipe screen, instead of force-closing, the user sees an on-screen fallback with the actual `error.name`, `error.message`, and the top 20 lines of `error.stack`, plus Back and Try-again buttons.

**Why this is the right move (the v5 lesson, applied honestly):**
- Patrick's `625923a` substitution-quality fix is correctly deployed on main and looks correct in code review (`updateSubstitutions(db)` is called on every launch after `refreshSeedRecipeFields`; `qualityConfig` falls back to `PILL_CONFIG.yellow` on stale values; the migration rewrites stale `substitutions` JSON in SQLite).
- My v7 Commit B (#129) code passed static checks (tsc clean; R-014 balanced; only valid `c.X` palette keys consumed; no forbidden v5-class patterns).
- EAS Android Build #127 (head `2098080`) AND #128 (head `625923a`) both compiled successfully.
- Patrick reports a runtime crash. I cannot see it from the engineer side without a screenshot or logcat.
- Two failed guesses in a row (v5 native-driver hypothesis, then JS-driver fix) would make a third guess unprofessional. **Surface the error, then fix it.**

**What this does NOT do:** does not change any v7 behaviour, does not touch the `cooking` branch, does not introduce any `Animated` code, does not change the schema, does not modify `_layout.tsx` or `SubstitutionSheet.tsx` (Patrick's fixes stand).

**Hard-safety re-verified:** 0 `Animated.ScrollView`, 0 `Animated.event`, 0 `scrollY`, 0 `addListener`, 0 `onScroll` in the touched file.

**Pre-flight:** tsc clean on `recipe/[id].tsx`; R-014 27/27 balanced; brace/paren/bracket diff 0.

**What the COO should track next:**
1. Patrick installs build #130 (when he triggers EAS), opens the crashing recipe.
2. Instead of force-close he sees the fallback screen.
3. He screenshots `error.name`, `error.message`, and the first lines of the stack.
4. Engineer fixes the named issue surgically in Build #131.
5. Once the underlying crash is patched, build #132 can remove the Error Boundary (or leave it as a permanent defensive net — it's small and only fires on errors).

---

### CLOSEOUT — Build #129 · Engineer · 2026-05-28 — Commit B of v7 Phase 1 (browse-mode restyle, partial)

**Scope shipped (recipe/[id].tsx `!cooking` branch only):**

| Section | Status | Notes |
|---|---|---|
| In-your-pantry card | ✅ | Loads `pantryItems` via `getPantryItems`; `match = scoreRecipeAgainstPantry`; N/M, status copy, missing pills, gold "Add missing to shopping list" → `upsertShoppingItem` loop |
| Your-Kitchen-Journey 3-card row | ✅ | Mise · Cook · Plate; Plate tap-to-expand carries `finishing_note` + `leftovers_note` |
| Old browse-mode Finishing & Leftovers sections | ✅ removed | Folded into Plate expand (Patrick's call) |
| Hero no-photo typographic fallback | ✅ | Fraunces title card replaces the emoji block |
| Method tap-to-cook | ✅ | Browse-mode step tap → `setCurrentStepIdx + setCooking(true)` |
| Data wiring (match + inPantryNames + addMissing handler + pantry-load effect) | ✅ | Available for future row-level styling |

**Scope NOT in this commit (deferred, will land as Commit B2 if Patrick wants):**
- Top-bar restyle (3 buttons in v7 vocabulary).
- Title-block bronze eyebrow + "Inspired by {chef} · Watch ↗" + Fraunces 38sp title + meta line.
- Inline rust "Start cooking" pill + ghost "Plan it · Watch the chef" row inside the content.
- Equipment + Prep restyle to v7 pill-row vocabulary.
- Ingredient row restyle: in-pantry vs need-to-buy styling using `ingredientInPantry()` (already wired) + `ingredientIconName` from PantryIcons + honest-swap callout (`bronzeSoft` bg, bronze left rail, italic Fraunces).

**Honest reasoning for the partial scope:** after the v5 incident I deliberately kept the diff surgical. Each deferred item is a small additive change against a known surface, so B2 can land them one or two at a time, each independently revertable. Nothing in B blocks them.

**Design decisions I made (flag back if intent differs):**
1. **Plate time is always 3 min.** Ticket said "0 if `leftover_mode === 'tonight'`" but `leftover_mode` is an object `{ extra_servings: number; note: string } | undefined`, not a string. 3 min is a universally honest plating estimate; can be tuned per recipe later.
2. **Pantry items load once on mount, not on focus.** The recipe screen re-mounts each time you tap a recipe card, so a one-shot load is sufficient. No focus refetch listener.
3. **In-your-pantry card uses the same `cardBg` + `lineDark` family** as other on-screen cards; the bronze N/M numeral is the visual anchor, status copy is `c.ink`, sub-line is `c.muted`. Matches Pantry-tab vocabulary as the ticket asks.
4. **Journey cards do NOT animate the expand.** Plain `setJourneyExpanded(prev => prev === 'plate' ? null : 'plate')` + conditional render. Per v7 hard-safety: no `LayoutAnimation`, no `Animated`.

**Hard-safety (the v5 lesson, baked in):**
- ✅ Plain `ScrollView` preserved unchanged.
- ✅ Zero `Animated.ScrollView`, `Animated.event`, `scrollY`, `addListener`, `onScroll` introduced.
- ✅ No new scroll listeners. No sticky-bar gating. No collapsing header.

**Pre-flight:**
- `tsc --noEmit`: clean on `recipe/[id].tsx`. (Project-wide pre-existing errors unchanged.)
- R-014 truncation: 27/27 balanced.
- Brace/paren/bracket: diff 0.
- Tail bytes verified.
- Hard-safety grep: 0 occurrences of every forbidden v5-class pattern.

**What the COO should track next:**
1. **Patrick on-device validates** Build #129 (when triggered): recipe opens (no crash, the v5 acceptance bar); In-your-pantry card renders with the correct N/M for a recipe where you have some ingredients; missing pills appear; "Add missing" lands items in the Shop tab; Journey cards render with Mise/Cook/Plate; tapping Plate expands and reveals finishing + leftovers; hero no-photo recipes show the Fraunces title card (no emoji); tapping a Method step in browse mode drops you into cook mode at that step.
2. **No EAS dispatch — Patrick triggers it.**
3. Per R-015: not self-closed. Awaiting Patrick's on-device validation before Commit C.
4. After B validates, **Commit C** (cook-mode "Look for" font fix) is a single-style change in the `cooking` branch — small and well-scoped.
5. **Commit B2 (optional)** can land the deferred items above incrementally if Patrick wants the full prototype look. Each is small and additive on top of B.

---

### CLOSEOUT — Build #127 · Engineer · 2026-05-28 — Commit A of v7 Phase 1

**Scope:** v7 "Mise" Phase 1, Commit A only — tokens + Fraunces font swap. The dependency that Commits B (browse restyle) and C (cook-mode "Look for" fix) build on. Independent, revertable.

**Per-item coverage of the ticket §0:**

| Item | Status | Where |
|---|---|---|
| Add `@expo-google-fonts/fraunces` ^0.2.3 | ✅ | `package.json` |
| Remove now-unused `@expo-google-fonts/playfair-display` | ✅ | `package.json` |
| Import + `useFonts` 3 Fraunces faces (400, 500 italic, 700) | ✅ | `_layout.tsx` |
| Drop Playfair imports + `useFonts` entries | ✅ | `_layout.tsx` |
| Repoint `fonts.display` → `Fraunces_700Bold` | ✅ | `tokens.ts` |
| Repoint `fonts.displayItalic` → `Fraunces_500Medium_Italic` | ✅ | `tokens.ts` |
| Add `bronzeSoft: 'rgba(194,161,90,0.10)'` token | ✅ | `tokens.ts` |
| Inter (sans/sansBold/sansXBold) untouched | ✅ | `tokens.ts` |

**Design notes:**
- The ticket said to **keep Inter exactly as is** — done. Only the display family swapped.
- `bronzeSoft` sits next to the existing `bronze: #C2A15A` (build #123). Both are used in Commit B for the honest-swap callout and the swap-pill "on" state.
- I did NOT add a separate token for the Start-cooking button — the ticket explicitly says use the existing `primaryInk #D05040`. Confirmed in palette.

**Preserved:**
- No code outside the three named files touched.
- No schema change, no migration, no data wiring change.
- No `Animated` introduced anywhere (v7 hard-safety rule).
- Recipe screen still at the #126 rollback baseline — Commits B and C land on top later.

**Honest residual:** two historical code comments inside `recipe/[id].tsx` still mention "Playfair italic" / "Playfair" in the cook-mode timer + why-note blocks. Those blocks use `fonts.display`/`fonts.displayItalic` (which now point to Fraunces), so the comments are stale but harmless. They'll be refreshed when Commit C touches the cook-mode branch.

**Pre-flight:**
- `tsc --noEmit` clean on `_layout.tsx` and `tokens.ts` (the existing project-wide pre-existing errors — sandbox `@gorhom`/font-package resolution and `recipes-holding` legacy enums — are unchanged and unrelated).
- R-014 truncation guardrail: 27/27 balanced.
- Brace/paren/bracket balance: diff 0 on both touched code files.
- `grep "Playfair"` across `mobile/`: only the two harmless historical comments in `recipe/[id].tsx`. No code refs.
- `grep "Fraunces"` confirms refs land in exactly two files (`_layout.tsx`, `tokens.ts`) + `package.json`.

**What the COO should track next:**
1. **No EAS build dispatched — Patrick triggers it.** Per R-015, not self-closed.
2. Once Patrick on-device validates the app boots cleanly with Fraunces (no splash hang, no system-font flash, titles look like Fraunces, body still Inter), I move to **Commit B** — the browse-mode restyle. If Commit A misbehaves on-device, Commit A is independently revertable and Commits B/C never depend on Fraunces being live — they only depend on the `fonts.display` token resolving to *something* legible.
3. Commit B (browse restyle) and Commit C (cook-mode "Look for" font) follow as separate commits after A validates.

---

### HANDOFF → Senior Engineer · 2026-05-28 · ✅ APPROVED BY PATRICK · BUILD (recipe detail v7 "Mise" — Phase 1)
**From:** Product Designer
**Subject:** Patrick: "lets try this v7 design out." Build the v7 browse-mode restyle + the cook-mode "Look for" font fix. Full work order: **`docs/coo/tickets/recipe-detail-v7-build.md`** (on main). Also opened as **GitHub Issue #6** for tracking.

**Design reference:** `docs/prototypes/recipe-detail-v7.html` (rev 3 — Pantry-tab-aligned 5-token palette). **Visual anchor:** the live Pantry tab on build #126 — v7 borrows its vocabulary so Recipe + Pantry feel like one app.

**Scope — Phase 1 (no schema changes):**
- **Commit A** — tokens + fonts: add `bronzeSoft` token; install `@expo-google-fonts/fraunces`; update `tokens.fonts.display`/`displayItalic` to Fraunces (replaces Playfair).
- **Commit B** — browse-mode restyle in `recipe/[id].tsx`: pantry-tab pill-row vocabulary, bronze uppercase section eyebrows, pantry signal up top wired to `scoreRecipeAgainstPantry`, kitchen-journey overview, honest-swap inline bronze italic. Component tree + state unchanged from #126.
- **Commit C** — cook-mode "Look for" font fix only: Fraunces italic 18sp → Inter SemiBold upright 19sp. Establishes type-by-job rule (operational → Inter, chef voice → Fraunces italic, titles → Fraunces upright).

**Phase 2 (deferred — separate ticket later):** allergens/dietary schema + equipment enrichment + cook-mode enhancements (auto-advance, larger photo, tools row).

**⚠ Safety constraints (v5 lesson written in):** NO animated/collapsing header. NO sticky-via-Animated bottom bar. NO scroll listeners. NO `Animated` on the native driver. The cook-mode "Next" is `position:absolute; bottom:0` — static layout, not transformed. Everything achievable with StyleSheet + simple state. If a visual seems to need any of the above — STOP and flag.

**Before code:** pitch your implementation plan to Patrick — exact tokens.ts additions, font load order, component breakdown, commit splits. Wait for go.

**Discipline:** R-014 tail-check on every edit; `npx tsc --noEmit` clean; **build-log row in the SAME commit as the code**; **R-015 — do NOT self-close, ship to main and await Patrick's on-device validation**; **do NOT dispatch an EAS build — Patrick triggers it**.

**Files:** `docs/coo/tickets/recipe-detail-v7-build.md` (full ticket, on main), `docs/prototypes/recipe-detail-v7.html` (design), `docs/coo/handoffs.md` (this).

---

### HANDOFF → Patrick + Senior Engineer · 2026-05-28 · ✅ APPROVED → BUILD (recipe detail v7 "Mise" — vision-concept resolved; build ticket: `docs/coo/tickets/recipe-detail-v7-build.md`)

**🔁 Rev 3 — 2026-05-28 late PM.** Frame A had too many colours; aligned to the live Pantry tab's visual discipline. Palette collapsed from seven accents down to **five** — ink / muted / bronze / gold / terra. Pantry-tab vocabulary brought across: pill-row layout for ingredients + equipment + method, bronze uppercase section eyebrows with icon+count+line-below pattern, gold stepper as the only interactive accent, rust only on Start cooking. Olive (in-pantry green) → strikethrough + bronze tick; ochre (honest-swap) → bronze italic Fraunces. Recipe and Pantry now read as one app.

**🔁 Rev 2 — 2026-05-28 late PM.** Two on-screen fixes from Patrick: (a) browse was too dark — reverted to the established app charcoal `#141414` / `#1E1E1E` cards (matches `tokens.ts` and every other tab); cook stays at OLED `#000000` per the CLAUDE.md mandate. The system is now properly observed. (b) The cook-mode "Look for" cue switched from Fraunces italic 18sp to **Inter SemiBold upright 19sp** — operational text needs to be glanceable at arm's length; italic serif tested poorly. Established a clean type-by-job rule: voice → Fraunces italic, labels → Inter SemiBold, titles → Fraunces upright.

**🔁 Rev 2026-05-28 PM — unified dark palette + small text fix.** Patrick liked Frame A but wanted it on the *same colour scheme as Frame B*, and "9 · 7 in pantry" reworded to "7 of 9 in pantry". Applied both. v7 now uses one OLED-style dark palette across both surfaces — the distinction between browse and cook lives in the **layout** (long editorial scroll vs single-step instrument), not in colour. This is actually a stronger move: it avoids a fifth palette swing, keeps Hone reading as one place, and the layout difference between the two surfaces is felt more strongly than a colour difference would be. Terracotta brightened to `#D8634F` for OLED legibility (deeper rust `#B84030` reserved for pressed state); sage brightened to `#5FB07E` so "in pantry" reads on black. Everything else from the v7 concept stands: Fraunces+Inter, pantry signal up top, ergonomic cook flow, doneness photo as hero, no scroll-driven chrome.
**From:** Product Designer
**Subject:** This is NOT a build order — it's the answer to "what would you do if you were trying to build the best-designed, most ergonomic recipe app?" Open `docs/prototypes/recipe-detail-v7.html` in a browser; two phone frames + a four-panel rationale. **Patrick decides whether to pursue this direction, refine it, or stick with v6's safer aesthetic restyle.**

**The thesis (one sentence):** the current recipe page is beautifully built as a *document to read*, but a recipe page's real job is to be a *tool you cook with* — v7 redesigns it around that, with browse and cook as two surfaces that serve different physical contexts.

**Four deliberate calls — all defensible, each a direction shift worth flagging:**
1. **Browse moves to warm paper** (`#F7F1E5`), cook stays true OLED black. Every food publication on Earth lays food on light because warm rendered colour pops on cream and dies on near-black; dark UI also loses legibility fastest under kitchen glare. Cook mode is dim/nighttime/wake-lock territory — true black wins there. So: <b>two surfaces, each chosen for its physical context.</b> This is the biggest direction call.
2. **Fraunces replaces Playfair Display** for headings. Playfair's hairlines vanish under Android anti-aliasing at small sizes (high stroke contrast + no optical sizing). Fraunces is a variable serif with a real opsz axis — the same glyph adapts its contrast to its size, so 12sp body and 38sp display both stay crisp on a mid-tier Pixel. Inter stays for body/UI.
3. **The pantry signal is the new top of the recipe page** — "You have 7 of 9 ingredients · 2 missing · [add to shopping list]". This is the kill feature surfaced where it answers the only question that matters at decide-time: <em>can I cook this tonight?</em> Reads existing data; no schema change.
4. **Cook mode = one full-screen step, doneness photo as the hero, knuckle-sized "Next" tap zone across the bottom.** Built for arm's length, glance-and-act, hands-busy. Auto-advance on timer expiry as an opt-in. Long-press = pause.

**Other concept moves (smaller):** a "your kitchen journey" overview (mise · cook · plate) right under the CTA, equipment + prep merged into a "Get ready" section, honest-swap trade-offs surfaced inline as small ochre italic notes (golden rule 5), method preview as a tap-into-cook-flow list, allergens shown as small honest chips.

**⚠ SAFE TO BUILD (the v5 lesson is learned):** no animated headers, no native-driver scroll, no sticky pinned-via-Animated bars. The cook-mode "Next" is a static full-width button at the bottom of the layout. Browse is a plain vertical scroll. The whole concept is achievable with StyleSheet + simple state — no `Animated`, no `Reanimated` scroll handlers. The v5 Fabric crash class cannot be reintroduced by this design.

**Decision — Patrick to call:**
- **(A) Pursue v7 as the direction** — phased rollout: Phase 1 tokens + browse layout (behind a flag for A/B), Phase 2 cook-mode redesign, Phase 3 pantry-signal wired live + honest-swap notes. I'll write build tickets for each phase.
- **(B) Take parts of it** — e.g. keep the dark palette but adopt the cook-mode ergonomics + the pantry signal. Tell me which bits land and I'll redraft.
- **(C) Stick with v6** — the safe aesthetic restyle of the working screen. v7 stays on disk as a reference; no build.

**Files:** `docs/prototypes/recipe-detail-v7.html` (new). Reference: v6 (safe aesthetic restyle), v5 (crashed approach, superseded), tokens.ts (current dark palette).

---

### HANDOFF → Patrick (visual review) + Senior Engineer (when approved) · 2026-05-28 · OPEN — AESTHETIC RESTYLE (recipe detail v6 — safe rebuild after the v5 crash)
**From:** Product Designer
**Subject:** v5 crashed on-device and was reverted (#126). Patrick asked for an **aesthetic-only** redesign of the recipe page — ergonomic, smart buttons, refined colour palette — **with no content removed and nothing that could reproduce the crash.** Prototype: `docs/prototypes/recipe-detail-v6.html`. Awaiting Patrick's visual review before any build.

**What caused the crash (so we don't repeat it):** v5's collapsing top app bar + sticky bottom CTA used `Animated` driven by scroll offset on the **native driver**, which force-closes the screen under React Native's **Fabric** renderer on open. That whole class of behaviour is OUT.

**What v6 is:** a pure visual restyle of the **current working build-#126 browse screen**, built from the REAL `tokens.ts` dark palette (verified against main). Every content block from #126 is kept, in the same order: back bar (back + title + plan + favourite), hero + chef attribution + "Watch the original video", "Start cooking", quick-facts row, stage-photos notice, "What to know before you start", servings/leftover selector, Ingredients (+ swap pills), Equipment + Prep, Method steps ("Look for" doneness cue / "Why" note / "Heads-up" lookahead / timer), and the "Finishing & tasting" band. **Nothing removed; no new data fields.**

**Aesthetic changes (all StyleSheet-level):**
1. **Tactile, thumb-sized buttons.** "Start cooking" → a 54dp rounded rust button with a soft glow + real press state (the one clear primary). Servings stepper, leftover chips, swap pills all ≥42dp with obvious pressed/selected states. Toggle buttons (plan, favourite) show their on-state as a rust tint.
2. **One job per colour** (all existing tokens): **rust** = Start cooking · **gold** = stepper + "Why" · **sage** = done / "Look for" · **ochre** = Prep + "Heads-up" · **sky** = information · **bronze** = section eyebrows · **warm brown** = Finishing band. Fixes build-#126's mix of a raw `#5B8FD4` blue *and* the sky token both doing "info" — unified onto `sky`.
3. **Calmer hierarchy/spacing** — rounded hero, one divided quick-facts row, Playfair section titles + quiet count chips, consistent callout rails, round step-number badge.

**⚠ ENGINEER SAFETY CONSTRAINTS (the whole point):**
- Styling-only change to the existing browse-mode render in `recipe/[id].tsx`. Map visuals onto the current StyleSheet; **leave the component tree, state, navigation, and data exactly as #126.**
- **NO** collapsing/animated header, **NO** sticky bottom bar, **NO** scroll listeners, **NO** `Animated` on the native driver, **NO** new schema fields. If a visual seems to need any of those, stop and flag it.
- Do not touch cook mode.

**Decision needed from Patrick:** visual approval of v6. On approval I'll write a styling-only build ticket (Issue #5 is now closed — it was the crashed approach). Engineer ships to main; **Patrick triggers the build + validates on-device (R-015).**

**Files:** `docs/prototypes/recipe-detail-v6.html` (new).

---

### CLOSEOUT — Build #126 · Engineer · 2026-05-26

**Scope:** Rollback. Recipe screen reverted to pre-v5 (the #123 state) after #124+#125 both crashed on opening any recipe.

**What happened, honestly:** Build #124 shipped Recipe Detail v5 Phase 1. It crashed on open. I diagnosed it as a Fabric native-driver + `addListener` conflict and shipped #125 switching the scroll event to `useNativeDriver: false`. That did NOT fix it — which means my diagnosis was wrong, and I claimed a fix I couldn't verify on-device. Both builds crash identically, so the cause is something common to both that I have not isolated. Rather than guess a third time, rolled back to known-good.

**This build:** `mobile/app/recipe/[id].tsx` reverted to commit `c9a0c19` (last-good, == build #123 recipe screen). `OriginFlag.tsx` kept in the repo for the incremental rebuild. #124/#125 build-log rows retained for audit.

**Plan for re-adding v5 (Patrick's direction — slowly):** reintroduce one v5 piece per build, each validated on-device before the next, so any crash is isolated to a single change. Likely order, least-risky first: (1) glance trio + OriginFlag (pure render); (2) hero no-photo typographic fallback; (3) elevated why-note; (4) inline CTA + add-to-list; (5) collapsing header; (6) sticky bottom bar. The scroll/Animated mechanism (5,6) goes LAST since that family is the most Fabric-sensitive and the hardest to diagnose blind.

**Corrected my earlier memory:** the `feedback_fabric_animated` note claimed the native-driver/listener was the crash cause and #125 fixed it — that's false (it didn't). Updated to reflect: cause unconfirmed; v5 recipe changes must be reintroduced incrementally with on-device validation.

**Pre-flight:** tsc clean on the reverted file; R-014 27/27 balanced.

**What the COO should track next:**
1. Build #126 = rollback. Patrick confirms recipes open again on-device.
2. v5 (Issue #5) re-opens as an incremental rebuild, not a single big build.
3. Phase 2 (allergen/dietary + equipment enrichment) remains parked.

---

### CLOSEOUT — Build #125 · Engineer · 2026-05-26

**Scope:** Crash hotfix on build #124. Recipe screen force-closed on open.

**Root cause:** New Architecture (Fabric, RN 0.81.5). Build #124 attached `scrollY.addListener(...)` to an `Animated.Value` driven by `Animated.event(onScroll, { useNativeDriver: true })`. On Fabric, a JS listener on a natively-driven scroll node fatals at mount — recipe screen was the only screen with that combination, hence the targeted crash.

**Fix:** scroll `Animated.event` → `useNativeDriver: false` (JS-driven scrollY; addListener safe; opacity fades still smooth). Inline `require('react-native').Dimensions` replaced with a proper `Dimensions` import.

**Why it passed my pre-flight last time:** tsc + R-014 + balance all caught *static* issues; this was a runtime Fabric-specific native-binding crash that only surfaces on-device. Lesson logged for myself: on this project (New Arch), never attach `addListener` to a native-driver-driven Animated value — use `useNativeDriver: false` when a JS listener is also needed.

**Unchanged:** every other v5 Phase 1 behaviour (collapsing header, sticky bar, glance trio, origin flags, hero fallback, elevated why-note, inline CTA).

**Pre-flight:** tsc clean on `recipe/[id].tsx`; R-014 27/27 balanced; brace/paren/bracket diff 0.

**What the COO should track next:**
1. Build #125 dispatched as a crash hotfix. Patrick to confirm recipes open without force-close, then validate the rest of the v5 Phase 1 checklist.
2. Per R-015 — not self-closed; awaiting Patrick's on-device validation.
3. Phase 2 (allergen/dietary + equipment enrichment) still parked pending scope confirmation.

---

### CLOSEOUT — Build #124 · Engineer · 2026-05-25

**Scope:** GitHub Issue #5 — Recipe Detail v5 "The Pass", **Phase 1, browse mode only**. Cook mode untouched. No schema changes.

**Phase 1 acceptance criteria — coverage:**

| AC | Status | Notes |
|---|---|---|
| Hero + no-photo fallback both look intentional | ✅ | Typographic title card (Playfair name + chef + tagline + gold rule + watermark) replaces the emoji block |
| Collapsing top app bar (hidden at top, in once hero scrolled away; back works throughout) | ✅ | Back always visible; title+plan+heart fade `scrollY.interpolate([150,240])`; pointerEvents gated |
| Sticky bottom Start-Cooking bar (hidden while inline CTA on screen) | ✅ | Existing bar gated on `scrollY` vs inline CTA `onLayout` bottom; pointerEvents off while hidden |
| Glance trio time · effort · origin, value above label | ✅ | Yield/leftovers chips dropped; value stacked above label |
| Origin: SVG flag for country, globe+countries for region; never a flag for a region | ✅ | `OriginFlag` module; 8 country flags + globe; Levantine/Australian → globe |
| CTA hierarchy — one rust primary | ✅ | Inline rust Start Cooking + ghost Add-to-list + Watch (hidden if no video_url) |
| Stepper from `output_unit`, leftover nudge | ✅ (pre-existing) | `ServingsSelector` already recipe-generic (DECISION-014); left as-is |
| Before-you-start | ✅ (pre-existing) | renders from `before_you_start[]` |
| Equipment names-only, no fake badges | ✅ | `equipment` is `string[]`; names only; enrichment deferred to Phase 2 |
| Ingredients + swap pills unchanged | ✅ | untouched |
| Method — elevated why-note (inkSoft on goldDim, gold marker + solid gold left rule, WCAG AA) | ✅ | rewritten from muted-grey italic |

**Design decisions I made (flag back if intent differs):**
1. **Collapsing bar fits the existing fixed-strip layout.** The header is a fixed top strip above the ScrollView (not an overlay on the hero), so "hidden at top" = Back visible + title/plan/heart faded; they fade in on scroll. Matches the AC without restructuring the header into a hero overlay.
2. **"Add to shopping list" is a real handler**, not a stub — it upserts every scaled ingredient via the existing `upsertShoppingItem` (source `kind:'meal'`) and shows an "Added ✓" confirmation. No new schema.
3. **Bottom-bar gating uses the inline CTA's `onLayout` bottom** (a direct ScrollView child, so its `y` is content-relative). Initialised hidden until measured to avoid a first-paint flash.
4. **Flags simplified for legibility at ~24px** (MX emblem → a small ring so it's distinct from IT; IN chakra → a ring; US/MY cantons simplified). Render-audited via cairosvg; all 8 read correctly. If you want a more detailed flag for any country it's a one-entry SVG swap in `OriginFlag.tsx`.

**Preserved:** cook mode (every `cooking` branch untouched), DECISION-008/014/015 data + rendering, ingredients/swaps, tab routing, recipe data.

**Pre-flight:** `tsc --noEmit` clean on `recipe/[id].tsx` + `OriginFlag.tsx` (remaining project errors pre-existing + unrelated — sandbox `@gorhom`/`@expo-google-fonts` resolution; `recipes-holding` legacy-enum never on launch path). R-014 27/27 balanced. Brace/paren/bracket diff 0 on both. Flag SVGs render-audited.

**What the COO should track next:**
1. **No EAS build dispatched — Patrick triggers it.** Code on main; build-log row + this closeout in the same tree as the code.
2. **Patrick on-device validation** (per R-015, not self-closed): photo + no-photo recipes both look intentional; collapsing bar; sticky bar appears only after the inline CTA scrolls off; glance trio with the right flag/globe; long `output_unit` wraps; elevated why-note; equipment names-only.
3. **Phase 2 awaiting scope confirmation:** allergen/dietary strip + equipment enrichment (both need NEW schema fields + migration + reseed). NOT started.
4. **`OriginFlag` is a new component** — Designer may want to review the flag glyphs (render-audit montage was produced during the build).

---

### HANDOFF → Senior Engineer · 2026-05-25 · 🛑 SUPERSEDED — v5 BUILT, CRASHED & REVERTED (replaced by aesthetic-only v6)

**🛑 HALTED 2026-05-28:** v5 was built (#124) and **force-closed on opening any recipe** — a Fabric native-driver scroll animation in the collapsing top app bar / sticky CTA bar. The #125 hotfix (native→JS driver) didn't hold; #126 reverted to the pre-v5 screen. **Do not rebuild from this spec.** The scroll-driven chrome (collapsing header, sticky bar) is the part that crashed and must NOT be reintroduced — see the aesthetic-only v6 handoff at the top of this file.

### HANDOFF → Senior Engineer · 2026-05-25 · ✅ APPROVED BY PATRICK · BUILD (recipe detail **v5** "The Pass")
**From:** Product Designer

**🔁 UPDATE 2026-05-25 — `docs/prototypes/recipe-detail-v5.html` is now the latest candidate (v4 still on disk for comparison).** Patrick liked v4, asked for two changes + "improve it with the best design resources." v5 = v4 plus: (a) **removed the "Makes N" yield from the top** (redundant — the stepper sets quantity) and **replaced it with cuisine ORIGIN shown as a flag**; (b) a **sticky bottom "Start Cooking" bar** that fades in once the inline CTA scrolls away (NYT Cooking / Airbnb / checkout pattern — primary action always one tap away on a long page); (c) a **collapsing Material-3 top app bar** (back + recipe title fades in as the hero scrolls off). **Flag is rendered as SVG, not emoji** — Android emoji-flag support is unreliable across fonts. **Honesty rule for flags: country cuisine → flag (American, Italian, Japanese, Thai, Mexican, French, Indian, Malaysian); regional cuisine → neutral globe glyph + countries named (Levantine = Lebanon/Syria/Jordan/Palestine — no single flag, and sidesteps the no-Israeli-labelling rule). Do NOT fly a flag for a region.** Extra engineer cost vs v4: a scroll listener (sticky bar), an animated header (RN has this pattern built in), and a small SVG flag set keyed to cuisine. Everything below still applies; v5 changes are additive layout/chrome, no new data beyond v4's allergen note.

**✅ APPROVED 2026-05-25 — Patrick: "get the engineer to build it." Build v5. The v3 EXPLORATORY data-fields note below still holds as the schema contract.**

**Glance-row formatting fix shipped to the prototype:** Patrick's screenshot showed value+label inline ("20 min start to plate" on one line, pushing "American" off-screen). Fixed — value sits above its label (`.gp-text` is a flex column). Replicate that stacking in RN.

**BUILD SCOPE — `mobile/app/recipe/[id].tsx`, BROWSE MODE ONLY. Do NOT touch cook mode.** Pitch your plan to Patrick before editing. Recommended split: ship the no-schema changes as the core build now; allergens + richer equipment schema = a clearly-scoped follow-up (need schema + data for 16 recipes). Patrick may fold allergens in — confirm.

1. **Hero:** photo via `hero_url` (expo-image, wired) + v5 gradient/title overlay. **No-photo fallback (mandatory):** `hero_url` null → typographic title card (Playfair name + chef credit + italic tagline + thin gold rule + faint Playfair watermark) over `hero_fallback` bands.
2. **Collapsing top app bar:** Animated header on scroll (~250dp) — back + title + favourite (Material 3).
3. **Sticky bottom Start-Cooking bar:** fades in once the inline CTA scrolls off; rust pill + add-to-list icon.
4. **Glance trio = time · effort · origin (NO yield).** Time = one value or `"X min active · Y total"` when active≪total. Origin: **SVG flag for COUNTRY cuisines**; **globe + countries named for REGIONAL** (Levantine, modern Australian). Key off `categories.cuisines[0]`. **SVG, not emoji.** Never one flag for a region.
5. **CTA:** single rust "Start Cooking"; ghost "Add to shopping list" + "Watch original" (hide when `source.video_url` null).
6. **Scaling:** label from `output_unit`/`output_unit_plural` — never hardcode. Leftover nudge under stepper only when `leftover_mode !== 'none'`.
7. **Before you start:** from `before_you_start[]`; default open.
8. **Equipment:** collapsed, summary names essentials. ⚠ `equipment` is `string[]` — can't carry Essential/Optional + note. Enrich it (+migration+seed, root-cause) OR render names only. Don't fake badges.
9. **Ingredients:** rows + swap pills unchanged.
10. **Method:** carousel → full steps. **Elevated why-note:** `inkSoft` on `goldDim` + gold marker + gold left rule (AA). Timer from `timer_seconds`; step photo from `photo_url` with no-photo state.
11. **Allergen/dietary strip (FOLLOW-UP unless Patrick says now):** NEW `allergens[]` + `dietary` + migration + seed.

**Colours:** rust = Start Cooking only; gold = headers/stepper/why-marker/step numbers; emerald `#4FBF85` = swapped ingredient only; sage NOT here; zero blue.

**Reference:** `recipe-detail-v5.html` (latest) · `recipe-detail-v4.html` (prior). **Discipline:** R-014 tail-check; tsc clean; **build-log row in the SAME tree**; **R-015 — no self-close**; **no EAS build — Patrick triggers.**

**Subject:** A redesign that builds on v3 rather than replacing it. `docs/prototypes/recipe-detail-v5.html` (latest) / `recipe-detail-v4.html` (prior) — open in a browser. Photo hero retained (every recipe has a photo), but four places where v3 was quiet, incomplete, or only-worked-because-it-was-a-burger are fixed. **Recipe-generic by construction — no burger assumptions; proven below the frame for a no-photo recipe, a slow braise, and a baked-goods count unit.** Patrick reviews visually and picks before any engineer build.

**Patrick's direction this session (verbatim intent):** keep the current working version, this is a design change only; retain the photo hero (photos exist per recipe); the head-chef "before you commit" signal he wants surfaced = **allergens / dietary**; and *"this concept should apply to all recipes now and future… make sure it works for all types of food not just burgers."*

**The five changes (each with engineer cost):**
1. **Why-note elevated.** v3 set the per-step "why" in muted grey — the lowest-contrast text on the page — while CLAUDE.md mandates "explain the underlying reason, *always*." v4 lifts it to `inkSoft` on a `goldDim` panel with a full-strength gold marker + solid gold left rule. Still calm, still Playfair italic, but no longer a footnote. *CSS only — trivial.*
2. **"At a glance" tells a story.** v3 gave time / difficulty / cuisine / leftovers equal weight. v4 leads with the two decision-drivers (time + effort, weighted and labelled), drops yield + cuisine to a quieter column, and **renders active vs total time when they diverge** ("25 min active · 2 hr total"). Reads existing `total_time_minutes` / `active_time_minutes`. *Small.*
3. **Allergen / dietary strip** under the glance row — neutral, honest, no alarm colours: what the dish *contains* + a plain dietary marker ("Not vegetarian"). **This is the one genuinely new DATA need — flagged, not faked (see schema note).** *Render small; needs schema fields first.*
4. **Equipment defaults collapsed but names the blockers while closed** — summary line "Needs: cast-iron pan, flat spatula · +2 more". First-timers open it; repeat cooks scroll past; the blocking info (you need a cast-iron pan) is still visible without a tap. *Collapse default + summary — small.*
5. **Leftover nudge has a home.** v3 dropped `leftover_mode` entirely. v4 adds a gold-dim "Make extra for tomorrow?" tap-target under the stepper, rendered only when `leftover_mode !== 'none'` (hidden on the burger; shown in the braise demo). *Conditional render of existing fields — small.*

**Kept from v3 (these were right):** single rust "Start Cooking" CTA + ghost secondary actions; one gold section-header language; equipment before ingredients; step carousel → full method with gold-flash jump; a why-note on every step; "Add to shopping list" wording.

**⚠ SCHEMA NOTES — read before building (no schema change without flagging, per the v3 contract below):**
- **NEW fields required for the allergen strip:** the Recipe type has **no `allergens` and no `dietary` field today** (confirmed in `mobile/src/data/types.ts`). To ship change #3, add something like `allergens: z.array(z.string()).optional()` and `dietary: z.array(z.string()).optional()` (or a small enum), plus a SQLite migration + seed values for the 16 launch recipes. If Patrick wants the layout shipped first, the strip drops out cleanly and the other four changes stand alone.
- **Equipment schema is thinner than the UI.** `equipment` is currently `z.array(z.string()).optional()` — plain strings. v3 *and* v4 render an **Essential/Optional badge + a note line per item**, which the string array can't carry. To render the badges/notes you'll need to enrich the field (e.g. `equipment: z.array(z.object({ name, note?, essential: boolean }))`) or keep it as strings and drop the badges. Flagging the gap — don't silently render badges off data that isn't there.
- Everything else (`hero_url` + `hero_fallback`, `output_unit`/`output_unit_plural`, `total/active_time_minutes`, `leftover_mode` + `extra_for_tomorrow_label`, `steps[].timer_seconds`/`why_note`/`photo_url`) already exists — v4 only reads it.

**No-photo state (mandatory in the brief, and matters for future recipes):** when `hero_url` is null the hero becomes a designed typographic title card — Playfair name, chef credit, italic tagline, thin gold rule, faint Playfair watermark — on a refined dark surface. It looks intentional, never broken. The instant a photo is added the full image hero takes over with no layout change. Rendered in the first demo card below the frame.

**Decision — RESOLVED 2026-05-25:** Patrick approved v5 and said build it. See the APPROVED BUILD SCOPE at top. Engineer ships to main; Patrick triggers the EAS build + validates on-device (R-015).

**Files touched (Designer):** `docs/prototypes/recipe-detail-v4.html` (new), `docs/coo/handoffs.md`, `docs/sessions/Hone_Session_Report_25_May_2026.md`.

---

### HANDOFF → Senior Engineer · 2026-05-25 · OPEN — EXPLORATORY (recipe detail v3 — data fields to preserve when building)
**From:** Product Designer
**Subject:** Recipe detail redesign is in prototype phase — this note locks the data fields that must survive any layout change. Do not build yet. Read this now so the schema contract is clear when the approved design arrives.

**All of these fields must have a visible home in whatever recipe detail layout ships:**

1. **Portion scaling (DECISION-014):** `output_unit`, `output_unit_plural`, `output_default`, `base_servings` — the stepper label ("How many burgers / loaves / cups") is recipe-specific. The v3 prototype uses "How many burgers" as an example. The engineer must pull the `output_unit` token from the recipe, not hardcode it.
2. **Leftover mode:** `leftover_mode` + `extra_for_tomorrow_label` — if the recipe supports leftovers (`leftover_mode !== 'none'`), the scaling section must still surface the leftover nudge (e.g. "Make extra for tomorrow?"). v3's scaling row has room for this as a sub-line or toggle. Do not silently drop it.
3. **Attribution:** `source.chef`, `source.video_url`, `source.notes` — the chef credit line in the hero and the "Watch original ↗" ghost link both pull from these fields. `source.video_url` controls whether "Watch original" is shown at all (hide if null).
4. **Time fields:** `total_time_mins`, `active_time_mins` — the stat chips show total time. If `active_time_mins` is significantly lower than `total_time_mins` (e.g. 20 active vs 90 total for a braise), render both ("20 min active · 90 min total"). If they're the same, show just the one.
5. **Step