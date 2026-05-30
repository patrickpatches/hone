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
| #134 (docs) | `pending` | **Real bug backfill — HONE-007 through HONE-012.** Filed 6 GitHub Issues (#7–#12) from Patrick's on-device validation of #132 + the open Plate-time bug from #129. P1:1 (Add-missing broken) + P2:3 (top clutter, before_you_start wall, Plate-time hardcoded) + P3:2 (blue rail, lowercase difficulty). Mirror files at `docs/coo/bug-tracker/tickets/`. `BUGS.md` re-baselined onto HONE-NNN. `docs/dashboard/index.html` `TICKETS_BASE` regenerated with the 6 real entries. `docs/coo/bug-tracker/build-history.csv` +1 row. Per R-015: not self-closing — Patrick refreshes the Pages URL on his phone and verifies the dashboard shows the 6 real launch-blockers. |
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
5. **Steps:** `steps[].timer_seconds` (timer chip), `steps[].why_note` (gold left-border callout), `steps[].photo_url` (step photo — show placeholder if null), `steps[].stage_note` / `stage_note` (doneness cue in cook mode — this is browse mode so not applicable here, but don't strip the field from the data object).
6. **Equipment:** the v3 prototype restored the Equipment section. This data currently lives in recipe research files, not in the typed schema. Before building the equipment section, raise a schema question: does `equipment[]` exist on the Recipe type? If not, flag it — it needs adding before this can render. Do not silently skip the section.
7. **Categories:** `categories.cuisines[0]` populates the cuisine stat chip. `categories.types[0]` could optionally render as a secondary tag if design calls for it.

**Constraint:** No schema changes in this build without flagging here first. The goal is a layout change, not a data model change.

**Files:** `mobile/app/recipe/[id].tsx` (the only file that needs touching), `mobile/src/types.ts` (read-only — check Equipment field existence).

---

### HANDOFF → Senior Engineer · 2026-05-22 · OPEN — ✅ APPROVED BY PATRICK · BUILD (pantry "what you have" → organised list + stepper)
**From:** Product Designer
**Subject:** Patrick approved `docs/prototypes/pantry-haves-v1.html` ("lets do this send to engineer"). Build it. This is the authoritative spec; the layered exploration notes below (PENDING/MODEL REVISED/REFINED/ASSEMBLED) are now history — build to *this* entry.

**Scope — ONE change to the current pantry (`mobile/app/(tabs)/pantry.tsx`):** replace the "what you have" pills card (the `havePills` flex-wrap card, ~lines 809–872) with an organised, category-grouped, collapsible list. Remove the match banner. Everything else stays: search + autocomplete, the match carousel, tabs.

**1. The list (replaces the pills card)**
- Group `have_it === true` items by their existing `PANTRY_CATEGORY`. Use `SHOPPING_SECTION_LABEL` for the header text ("Meat & Seafood", "Pantry", "Spices & Herbs", etc.) and `SHOPPING_SECTION_ORDER` for ordering. Hide categories with zero stocked items.
- Each category is a **collapsible section**: header = icon + name + count + chevron; tapping the header toggles collapse. Default expanded. Collapse state in component state for v1 (persisting to storage is a fine follow-up, not required).
- **Row** = icon · name · sub-line · trailing control.
  - Sub-line: `for {planned recipe names}` — the recipes currently in the plan that use this ingredient (truncate to 1 line, "+N" overflow). Derive by matching the ingredient against planned-meal recipes via `normalizeForMatch` (same matcher the shopping/`sources[]` path uses). If no planned recipe uses it, show nothing.
  - Trailing control: the **+/− stepper** for countable items; a neutral **"Stocked"** pill for bulk-by-weight items.

**2. The +/− stepper (the interaction Patrick wanted)**
- Writes to the pantry row's existing **`quantity`** field (`PantryItem.quantity`, currently always null) — **no schema change.**
- In the **search-add** flow: an un-stocked result shows a gold `+` add button; tapping it sets `have_it=true`, `quantity=1`, and the row swaps to the stepper. `+`/`−` adjust quantity. `−` at 1 → removes (`have_it=false`). This is the "don't make me type tomato three times" fix.
- On the **list row**: the same stepper adjusts `quantity`; `−` at 1 removes the item (consider a brief undo toast — reuse the existing pattern).
- **Countable vs bulk** (one judgment call — confirm with me if unsure): produce, proteins, dairy & eggs, and pack items (tins/bunches) get the stepper; pure bulk staples you'd never count (flour, oil, salt, sugar, rice, stock) show the "Stocked" pill instead. A small curated "uncounted" set is fine for v1; default to the stepper when unsure.

**3. Remove the match banner** — the "{N} recipes you can cook now / See all" View (~lines 874–939). The carousel already conveys this; the banner was redundant. **Keep the match carousel and `scoreRecipeAgainstPantry` exactly as-is.**

**4. Colours — calm palette, each colour one job (this is the part Patrick cares most about):**
- Category + ingredient **icons → `tokens.inkSoft` (#C4B8A8)** — neutral. NOT sage, NOT gold. Icons are wayfinding, not status.
- **Stepper** = the one gold accent: bg `goldDim`, border `rgba(242,204,42,0.42)`, glyphs `tokens.gold`, count `tokens.ink`.
- **"Stocked" pill**: text `inkSoft`/`ink2`, bg `surface2`/`cream`, border `lineDark`.
- **Carousel "Ready to cook" pill stays GREEN** (`tokens.sage`) — this is the one meaningful green, a genuine go-signal. Do not neutralise it.
- **Carousel "still need" chips: change rust → neutral** (text `inkSoft`/`ink2`, border `lineDark`, keep the `+`). Small change to `ChipAdd`. This keeps the screen to cream + one gold + one green.
- Optional/your call: the pantry search border is currently rust-tinted; the prototype softens it to a neutral line for coherence. Fine to leave as the build has it.

**5. States & edge cases**
- Empty pantry → honest empty state: "Nothing stocked yet — search above to add what you have." (Point to the next action, no mascot.)
- Long sub-line → 1 line + "+N".
- Stepper `−` to 0 removes the row.
- Accessibility: stepper buttons need `accessibilityLabel` ("Add one {name}" / "Remove one {name}") and a 44dp touch target via `hitSlop` (visual pill is ~25px). Category header = `accessibilityRole="button"`, label "{Category}, {N} items, expanded/collapsed". WCAG AA on all text (inkSoft on dark passes; verify the stepper count).

**6. What NOT to touch:** search + autocomplete, the carousel's matching logic, recipe data, tab routing.

**Reference:** `docs/prototypes/pantry-haves-v1.html` (commit on main). Build-log row + R-014 tail-check per your standing brief. **Per R-015: do not self-close — shipped, then await Patrick's on-device validation.** No build dispatched by Designer (build-trigger stays with Patrick).

---

### HANDOFF → Senior Engineer · 2026-05-22 · SUPERSEDED by the APPROVED build handoff above (pantry list redesign — category groups, line icons, recipe-driven quantities)
**From:** Product Designer
**Subject:** Patrick wants the pantry to stop being a flat pill list and become an organised, category-grouped shelf with clean icons and smart quantities. Current prototype: **`docs/prototypes/pantry-list-v2.html`** (v1 superseded — see "model revised" note below). **Do not build yet** — Patrick reviews and approves visually first (decision rights: Designer recommends, Patrick approves).

**The key finding (saves most of the work):** the "add up to 2" logic Patrick is asking for **already exists** in `mobile/src/data/shopping-helpers.ts`. `applyMealAdd` / `applyMealRemove` / `recomputeQuantity` already track each ingredient's source recipes (`sources[]`) and re-sum the scaled quantity on every meal add/remove. It also already handles units honestly — `sameSlot` merges only matching units (or when one side is null) and deliberately does **not** convert grams↔cups. So the aggregation maths is done. We are surfacing it, not inventing it.

**What's actually new (the design proposes, engineer scopes):**
1. **Group the pantry by `PANTRY_CATEGORY`** (Produce / Meat & Seafood / Dairy & Eggs / Pantry / Spices & Herbs / Sauces / Frozen) instead of one flat pill wrap. Categories + `categorizeIngredient()` already exist in `pantry-helpers.ts`.
2. **Minimal line SVG icons** per category (7 drawn in the prototype, single 1.6px stroke, `currentColor` so they tint grey/emerald with row state) — replacing the current `CATEGORY_EMOJI`.
3. **Per-row source attribution** ("from Bolognese + Shakshuka") read from the existing `sources[]` on the shopping item.

**MODEL REVISED 2026-05-22 (Patrick feedback on v1 → v2):**
- **Two states, not three numbers.** Patrick rejected the Need/Have/Buy summary dashboard ("if we need the ingredient it should just show in the pantry"). v2 drops the 3-stat strip. Every ingredient is in ONE of two states: **In your kitchen** (`have_it = true`) or **To buy** (needed by a planned recipe AND `have_it = false`). Each row renders one status; a filter control (All / To buy / In kitchen) replaces the dashboard. The Shop tab becomes this same list filtered to "to buy" — same data, two views.
- **Buy-units, not recipe grams.** Quantities display in the unit the user actually buys: "2 tomatoes" not "200 g", "1 bunch" coriander, "1 bulb" garlic, "2 tins" canned tomatoes; bulk items (mince, flour, cheese) stay in grams. **This needs a NEW small reference table: per-ingredient buy-unit = count | weight | pack, plus an average weight for count conversions.** ~50–60 common ingredients seeded; everything else falls back to the recipe unit. This is the one genuinely new bit of data + logic — flagging it as the main build cost.
- **Recipe-match carousel kept (Patrick: it was missing from v1/v2-initial).** The existing `scoreRecipeAgainstPantry` carousel (Ready to cook / "X of Y matched" / "still need" chips, incl. derivation matches like "egg yolks from your eggs") is folded back in at the **top** of the screen — above the ingredient list — because the pantry's promise is "cook with what you have", so the answer comes first. No new matching logic; restyled into v2 tokens. Card "still need" chips use gold (the v2 "to buy" colour) instead of the build's rust — minor token alignment, flag if you'd rather keep rust.

**LATEST DIRECTION 2026-05-22 — `docs/prototypes/pantry-haves-v1.html` (this is now the one to build toward).** Patrick pulled scope back: **keep the current pantry build entirely** (search, "recipes you can cook now" banner, match carousel all unchanged) and make **ONE change** — replace the "what you have" pills box with an organised, **collapsible**, category-grouped list using the new SVG line icons. Each stocked row shows **name + amount you have + which planned recipe uses it** ("Tomatoes · ×3 · for Bolognese, Shakshuka"). **New interaction: a +/− stepper** in the search-add flow (and on each list row) so you set "3 tomatoes" without typing it three times — writes to the pantry row's existing `quantity` field (currently null; no schema change). Countable items show the stepper; bulk staples (flour, oil, salt) show a plain "Stocked" (you don't count those). Stays stocked until removed (Patrick's pick). This SUPERSEDES the full-screen v1/v2 redesigns as the build target — those remain as exploration. The buy-unit reference table is now optional/future, not required for this scoped change.

**REFINED 2026-05-22 (Patrick: colour clash + drop banner) — same file `pantry-haves-v1.html`:** (1) **Removed the "N recipes you can cook now" summary banner** — redundant with the carousel. (2) **Calmer palette:** category + ingredient SVG icons are now **neutral warm-cream `#C4B8A8`**, NOT green or gold — icons are wayfinding, not status. **Gold is the single accent**, used only on the +/− stepper. **Green is off this screen** (in a "what you have" list every row is owned, so a green icon per row signals nothing; sage stays reserved for genuine "done" states like cook mode). Search border also softened from rust-tint to a neutral line on this screen. No locked-token changes — just stops painting icons with accent colours.

**ASSEMBLED 2026-05-22 (Patrick: "show the recipes in a carousel like the current build. lets try all that") — `pantry-haves-v1.html` now shows the full screen:** organised collapsible list → **recipe-match carousel below** (current-build order), driven by the existing `scoreRecipeAgainstPantry`. Carousel restyled to the calm palette: **green returns for one job only — the "Ready to cook" pill** (a genuine go-signal, the one place green is meaningful); "still need" chips are **neutral** (moved off rust so they add no colour); icons stay neutral cream; gold stays on the stepper. Banner stays removed (carousel is the canonical match surface). Final colour map on this screen: cream surfaces/text/icons · gold = the stepper you tap · green = a recipe ready to cook. This is the current build target.

**Honesty constraint (golden rule 5):** weight→count conversions are approximations and must be marked "≈" (tomatoes vary in size). Bulk-by-weight items stay in grams. Never invent a precise count we can't stand behind. (The existing shopping engine already refuses grams↔cups conversions — same spirit.)

**Colours/idioms used:** current dark-sage tokens; the refined emerald `#4FBF85` (from `colour-refinement-v1.html`) for the positive "have" state; gold for the "need" accent; rust reserved for the primary CTA only. Consistent with the colour-refinement handoff above.

**Files touched (Designer):** `docs/prototypes/pantry-list-v1.html`, `docs/prototypes/pantry-list-v2.html` (v2 is current; v1 kept for history of the model change).

**Blocks:** nothing yet — exploratory. Once Patrick approves the look, Designer + Engineer agree (a) the buy-unit reference table, and (b) the "to buy" filter feeding the Shop tab, before any build.

---

### HANDOFF → Senior Engineer · 2026-05-18 · OPEN (step-number contrast fix + build-log gap + hummus confirm)
**From:** Patrick (via COO)
**Subject:** Three items: fix the invisible step number in the recipe Method list, backfill the build log for #118–#121, and confirm the hummus hero fix landed.

**1. Step-number badge is invisible in the recipe Method list (non-cook mode).** Patrick's screenshot of Beef Lasagne shows the step "1" badge as a cream circle with a near-invisible cream/white number inside it — light-on-light contrast failure. The number must read clearly. Fix: dark number (use `tokens.ink` / charcoal) on the cream circle, OR invert to a dark circle with light number — whichever matches the Designer's intent for the Method list. This is the browse-mode step list, NOT cook mode (cook mode's ghost watermark is intentional and stays). Coordinate the exact shade with Designer if unsure, but the contrast fix itself is straightforward. WCAG AA minimum.

**2. Build log gap — backfill #118, #119, #120, #121.** The build log in this file stops at #117. Patrick is on #121. Four builds shipped without log entries. Backfill all four now with commit hash + one-line summary each. The build-log rule is mandatory per your standing brief — every build gets a row the moment it's pushed. This is the second time it's slipped; please hold the discipline.

**3. ✅ Hummus hero — RESOLVED.** Patrick confirmed on-device 2026-05-22 that the chocolate-milkshake image is gone and the correct hummus hero renders. No action needed; handoff below is marked DONE. (Left here only so the build that carried the fix gets its build-log row in item 2's backfill.)

**Per R-014/R-015/build-log discipline.** Don't claim done — shipped, awaiting Patrick on-device validation. Build log row for whatever build carries the step-number fix.

**Files touched:** `mobile/app/recipe/[id].tsx` (step badge), `seed-recipes.ts` (hummus hero if not already fixed), `docs/coo/handoffs.md` (build log backfill).

**Cost:** ~20 min total — all three are small.

---

### HANDOFF → Product Designer · 2026-05-18 · DELIVERED 2026-05-22 — awaiting Patrick's pick (colour upgrade — two named targets, refine don't redirect)
**From:** Patrick (via COO)
**Subject:** Patrick wants a colour upgrade that elevates the current feel of the app. Two specific things bother him. This is an upgrade of what exists, NOT a fifth direction change.

**✅ DELIVERED 2026-05-22 (Product Designer):** Before/after mockups built at `docs/prototypes/colour-refinement-v1.html`. Open it in a browser — every change is shown current-vs-proposed on the real screen, with a one-line plain-English rationale and rough engineer cost each. Summary:

- **Target 1 — green pills.** Only the green moves: "Great swap" #5DB870 → **#4FBF85** (a cleaner, brighter emerald). Diagnosis: the old green and the dusty sage surface are both mid-greens at similar lightness, so they blur — the new emerald separates by lightness so the signal reads as deliberate. Three-state logic, icons (✓/≈/⚠), labels, and the yellow + red colours all unchanged. Sage (done/checked) untouched.
- **Target 2 — "Cook with what you have / you'll buy".** Diagnosis backed by data: the current sage eyebrow is **#4A7C59 @ 3.7:1 — fails WCAG AA** (needs 4.5:1), which is literally why it reads flat, and it's the same green Patrick flagged. Proposed: recolour to gold — two treatments shown (A, recommended: two-tone, "what you have/buy" in gold; B: contained gold pill). Header title italic accent also moves sage → gold so the header reads as one warm unit. No size or layout change.
- **Optional 3rd — step-number badge.** Documents the exact shade for the engineer's already-open contrast fix: charcoal **#141414** number on the cream circle (1.1:1 → 13.8:1). Browse-mode only; cook-mode ghost watermark untouched.

**Decision needed from Patrick (visual approval — Designer recommends, Patrick approves per operating-rhythm decision rights):** (1) confirm the new pill green, (2) pick eyebrow treatment A or B. Once Patrick picks, Designer writes the engineer build handoff with final tokens. No engineer build dispatched yet — this is exploratory by design.

**Patrick's words, verbatim:** "I'm not after a complete change but one that upgrades the current feel of the app as im finding some of the green font and pills arent the best choice. also the 'cook with what you buy' and 'cook with what you have' text doesnt pop."

**Critical framing — read before designing:** The palette has changed four times (cream/Playfair → terracotta → dark dramatic → sage). Each change rippled through every screen at real engineer cost. Patrick wants an *upgrade of the current feel*, not a fifth direction. Refine what exists, do not replace it.

**The two named targets (do these first — everything else is secondary):**

1. **The green font and pills "aren't the best choice."** This is the green used on substitution pills and green-coloured text. Patrick finds the current green wrong against the sage-and-gold app. Propose a better green — or reconsider whether green is even the right colour for the "great swap" state given the app already leans sage-green. Show the green/yellow/red substitution pill set re-coloured so green reads as a clear, pleasing "good" without clashing with the sage surfaces. Keep the three-state meaning (good / some difference / noticeable change) — only the colours change, not the logic.

2. **"Cook with what you have" and "Cook with what you buy" don't pop.** These are the two pantry-mode entry strings. Patrick wants them to stand out — right now they read flat. Propose a treatment that makes them pop: stronger colour, weight, a gold accent, a contained pill/card, whatever lifts them off the background. They are the gateway to the kill feature (pantry-first cooking), so they earning visual prominence is on-brief.

**Then, if useful, 1-2 more small refinements** of the same flavour: tighten any other low-contrast text (the step-number badge is a known one — light-on-light), nudge the gold accent if `#F2CC2A` reads garish anywhere, warm/cool a surface tone for depth. Optional, not required.

**How to deliver:**
- Show each change as a before/after mockup in `docs/prototypes/colour-refinement-v1.html` — same canonical screen rendered current vs proposed, so Patrick can eyeball the difference. The two named targets each get their own before/after.
- One-line plain-English rationale per change: what shifts, what stays, rough engineer cost. No jargon — Patrick is not a programmer.

**Constraint:** No new fonts. No layout changes. No new direction. Colour and emphasis only. If you find yourself proposing a whole new look, stop — that's out of scope.

**Files touched:** `docs/prototypes/colour-refinement-v1.html` (new).

**Cost:** ~half a session.

**Blocks:** Nothing — exploratory. Patrick reviews mockups and decides which to apply before any engineer build.

---

### HANDOFF → Senior Engineer · 2026-05-18 · DONE (HUMMUS hero — chocolate-milkshake image fixed, Patrick validated on-device 2026-05-22)
**From:** Photography Director
**Subject:** Build #117 ships a chocolate milkshake in a mason jar with whipped cream + Twix bar as the HUMMUS hero. Patrick caught it on-device 2026-05-18. Root cause: `seed-recipes.ts` line 924 has `hero_url: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&q=80'` — that Unsplash photo is not hummus. The COO's 2026-05-15 hero-migration handoff specified `photo-1637949385162-e416fb15b2ce` for HUMMUS (Ludovic Avice, plain hummus shot, cook-approved) but the engineer's migration wrote the wrong photo ID into the seed.

**What I verified (2026-05-18):**
- Curled the currently-shipping URL → returned a 600×875 JPEG of a chocolate milkshake/sundae in a mason jar with whipped cream, chocolate drizzle, cocoa dust, and a Twix bar. Confirmed visually. **This is what Patrick sees on the HUMMUS recipe card.**
- Curled the already-approved Ludovic Avice URL `https://images.unsplash.com/photo-1637949385162-e416fb15b2ce?w=600&q=80` → returned a 600×409 JPEG of beautiful traditional hummus: top-down, deep swirl pattern, whole chickpeas, parsley sprig, olive oil pool, paprika dust, on dark slate. HTTP 200, imgix CDN. Same response shape as the working CARBONARA URL. **This is what should have shipped.**

**What's needed (engineer, data-only commit, mirrors the FALAFEL/PAVLOVA pattern from the other 2026-05-18 handoff):**

```ts
// HUMMUS constant — seed-recipes.ts line 924
hero_url: 'https://images.unsplash.com/photo-1637949385162-e416fb15b2ce?w=1200&q=80',
hero_attribution: 'Photo: Ludovic Avice / Unsplash',
```

Extend `refreshSeedRecipeFields` so the UPDATE reaches existing installs without reinstall (the same path #113 used for the other heroes).

**R-014 reminder:** `tail -c 200 mobile/src/data/seed-recipes.ts` after the edit. Confirm the closing `];` is intact and the FALAFEL + PAVLOVA + SMASH_BURGER + CARBONARA hero rows are unchanged. The R-014 truncation pattern has bitten the team four times — keep eyes on this. (The ledger itself hit R-014 truncation during my session today; recovered via bash heredoc and verified clean.)

**Stage 2 (Patrick, not engineer — in own time):** the Ludovic Avice photo is plain hummus with no pomegranate. Patrick's stated preference is hummus wa rummaan — pomegranate arils piled on top, traditional Levantine plating. The proper hero will be AI-generated from `docs/coo/photography/image-briefs/hummus.md` (DALL-E 3 / Imagen 3 / Gemini — Patrick's tool of choice). Once Patrick generates a CANDIDATE and cook signs off APPROVED, engineer migrates over the interim Ludovic Avice URL. Stock libraries do not have a usable pomegranate-on-top traditional Levantine plating shot — searched Unsplash and Pexels exhaustively 2026-05-18. AI is the right tool here per DECISION-014 and Patrick's 2026-05-18 workflow directive.

**Files touched (by Photography Director, this session):**
- `docs/coo/photography/image-briefs/hummus.md` — NEW. Full AI prompt + rejection criteria + cook validation checklist for the pomegranate-on-top hero. Also flags a recipe-coherence question for Cook: add pomegranate+parsley as a third authored garnish substitution (the cook's research file already has two — sumac+pine-nuts and smoked-paprika+toasted-sesame), so the hero composition matches the recipe data.
- `docs/coo/visual-assets-ledger.md` — Hummus section now has 4 rows (original REJECTED, Ludovic Avice APPROVED interim, chocolate-sundae REJECTED, AI hero PENDING) + engineer integration callout + the chocolate-sundae bug callout. Ledger statistics and hero summary updated. File rewritten end-to-end via bash heredoc after R-014 hit the Write tool mid-session — final tail check clean.

**Blocks:** HUMMUS recipe card on Kitchen page renders a chocolate milkshake to every user on build #117. This is the single most jarring visual bug currently in the app. Not a launch blocker (launch is weeks away), but absolutely a fix-this-build-cycle bug.

**Per R-015:** Photography Director does not self-close. Mark DONE once shipped + Patrick validates on-device.

**✅ CLOSED 2026-05-22:** Patrick confirmed on-device the HUMMUS hero now renders correctly (chocolate-milkshake image gone). Interim Ludovic Avice plain-hummus shot is live. Stage 2 (pomegranate-on-top AI hero from `image-briefs/hummus.md`) remains a separate, lower-priority item for Patrick's own time — not blocking.

---

### HANDOFF → Senior Engineer · 2026-05-18 · OPEN (FALAFEL + PAVLOVA hero URLs re-sourced — CDN paths verified, ready for re-integration)
**From:** Photography Director
**Subject:** The two hero URLs build #113 stripped (FALAFEL `photo-pQnsKWk5ljQ`, PAVLOVA `photo-5nCTfEru3Do`) were slug-format short codes, not CDN paths — that's why they 404'd. The correct numeric-CDN URLs for the **same two images Cook already approved on 2026-05-14** were recovered into the ledger on 2026-05-15 and verified live today.

**What I verified (2026-05-18):**
- `https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?w=600&q=80` → HTTP 200, imgix CDN (FALAFEL)
- `https://images.unsplash.com/photo-1634324040880-63dbf9a4e5ac?w=600&q=80` → HTTP 200, imgix CDN (PAVLOVA)

**What's needed (engineer, data-only commit — bundle with the HUMMUS fix above):**

```ts
// FALAFEL
hero_url: 'https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?w=1200&q=80',
hero_attribution: 'Photo: Anton / Unsplash',

// PAVLOVA
hero_url: 'https://images.unsplash.com/photo-1634324040880-63dbf9a4e5ac?w=1200&q=80',
hero_attribution: 'Photo: Eugene Krasnaok / Unsplash',
```

(Full context in the earlier handoff — kept here as a reminder so the engineer can bundle all three URL fixes into one commit.)

---

### HANDOFF → COO + Product Designer · 2026-05-18 · IN PROGRESS (build #117 — cook-mode-v2 shipped)
**From:** Senior Engineer
**Subject:** Designer's cook-mode-v2 handoff is implemented in `mobile/app/recipe/[id].tsx` and dispatched as build #117 (commit `0f9063c`). Per R-015 — shipped to main, awaiting Patrick on-device validation. Not self-closing.

**Spec coverage (every item from the handoff):**
1. ✅ 224px hero photo block at top of cook-mode step view — uses `step.photo_url` when present, falls back to `recipe.hero_url`, then `hero_fallback` gradient bands. Top + bottom fades overlay the photo.
2. ✅ 64sp Playfair ghost step number watermark — `rgba(245,242,236,0.08)`, positioned bottom-right inside the photo container.
3. ✅ Doneness cue card — wired to `step.stage_note` rather than adding a new `step.doneness_cue` field. Same concept (Designer's brief explicitly allowed this — *"may need schema addition — check if it exists or use a `why_note` variant"*). No migration needed; cook already writes "look for this" content into `stage_note`. Gold left border, gold-dim background, all per spec.
4. ✅ 38sp Playfair timer + thin progress line — renders only when `step.timer_seconds > 0`.
5. ✅ Full-width rust "Next step → [next.title]" pill — sage "Done — finish cooking" on the final step. Final-step tap exits cook mode (sets `cooking=false`, resets `currentStepIdx=0`).
6. ✅ Ghost back link below pill — 12sp Inter at 42% alpha, only shown when there's a previous step.

**Design decisions I made (flag for Designer if any need revisiting):**
- **Single-step navigator vs. scrollable list:** the prototype shows ONE step per screen; I implemented it as a navigator with `currentStepIdx` state. Browse mode keeps the existing scrollable list view unchanged.
- **Where step-done state goes:** the Next pill marks the current step done BEFORE advancing. The previous knuckle-tap-the-card pattern (build #114) is gone in cook mode — replaced by the larger, clearer Next pill. Same intent, more obvious affordance.
- **Final-step behaviour:** tapping the sage "Done" pill on the final step exits cook mode entirely. If you'd prefer it to stay on the final step with a celebratory state instead, that's a small follow-up.
- **Progress segment fill at the current step:** 55% per the prototype's static illustration. Real timer-based fill would be a follow-up if you want it.

**Preserved from earlier builds:**
- DECISION-015 step_overrides resolution and the "≈ adapted for your [name] swap" cue with sage border — fully intact for any step where the active swap has authored an override.
- All callouts that were on the cook step (`why_note` italic) — restyled to Playfair italic per the prototype.
- Browse-mode method list — exactly as it was. Only the cook-mode branch changed.

**Pre-flight bug check (per Patrick's directive — done BEFORE push):**
- `npx tsc --noEmit` clean.
- R-014 truncation guardrail green (25 files balanced).
- Brace/paren/bracket counts: 824/824, 403/403, 56/56 (diff 0).
- Tail bytes verified; file ends `}\n`.
- Manual trace of the `{cooking ? IIFE : list}` ternary end-to-end.

**What the COO should track:**
- Patrick validates build #117 cook-mode on-device. Walk in the build-log row.
- If validation passes, this and the Designer's open handoff close.
- If anything reads off, engineer ships a fix as #118.

**Files touched (1 code + 1 docs):** `mobile/app/recipe/[id].tsx`, `docs/coo/handoffs.md`.

**Status:** shipped to main, awaiting Patrick on-device validation per R-015. Not self-closing.

---

### HANDOFF → Senior Engineer · 2026-05-18 · IN PROGRESS (engineer shipped build #117 — awaiting Patrick on-device validation)
**From:** Product Designer
**Subject:** Cook mode step screen — visual redesign (cook-mode-v2)
**Why:** The existing cook mode was functional but visually generic. Patrick asked for a world-class aesthetic upgrade beyond photo content. The v2 design addresses five specific weaknesses: no photo visible during cooking (violates Golden Rule #4), body text failing WCAG AA contrast, step number consuming screen real estate, unreadable timer, and overcomplicated navigation.
**What's done:** Full redesign prototype at `docs/prototypes/cook-mode-v2.html` (commit `8cf7b085`). Three phone frames showing Pasta Carbonara steps — step with timer running, step with doneness cue + why note, final step completion state.

Key design decisions (all spec'd in the prototype):
- `--bg: #000000` — true OLED black for cook mode (distinct from browse mode's `#0F1A14`)
- Photo block: 224px full-width at top, gradient fade to black (`linear-gradient(to bottom, transparent 40%, #000 100%)`). Progress segments overlaid on photo in gold.
- Step number: 64sp Playfair Display at 8% opacity — ghost watermark inside photo, identifies step without taking real estate
- Step title: 24sp Playfair Display below photo
- Body text: 14.5sp Inter at `rgba(245,242,236,0.88)` — verified WCAG AA on `#000000`
- Doneness cue card: `border-left: 3px solid var(--gold)` + `rgba(242,204,42,0.06)` background
- Timer: 38sp Playfair number + 1px thin progress line. Renders only when `timer_seconds > 0` for the step.
- "Why" note: Playfair italic at ink4 opacity. Renders only when `why_note` field is present.
- Navigation: single full-width rust pill "Next step → [next step title]" + small ghost "← Back" link. One primary action, one escape.
- Final step: sage green pill + sage-tinted cue card instead of rust. Colour signals completion vs. continuation.

**What's needed:**
1. Wire the 224px `photo_url` image block into the cook mode step view (`recipe/[id].tsx` cook mode branch). The gradient overlay and progress segments sit absolutely positioned over the image.
2. Replace the existing step-number treatment with the 64sp ghost watermark (positioned absolute inside the photo container, `bottom: 12px; left: 16px; opacity: 0.08`).
3. Implement the doneness cue card: read from `step.doneness_cue` field (may need schema addition — check if it exists or use a `why_note` variant). Gold left border, dim gold background.
4. Replace current timer display with 38sp Playfair number + thin progress line.
5. Implement "Next step" pill: full-width, rust background, shows truncated next step title (max ~30 chars). On final step: sage background, label "Done — plate and serve" (or appropriate completion verb from the step title).
6. Ghost back link: 14sp Inter, `rgba(245,242,236,0.42)`, centred below the pill.

**Files touched:**
- `docs/prototypes/cook-mode-v2.html` — complete visual spec (view all states here)

**Blocks:** Cook mode visual quality before any photography pass on stage photos. The photo block must be implemented before step photos do anything visible.

---

### HANDOFF → Photography Director + COO · 2026-05-16 · OPEN (FALAFEL + PAVLOVA hero URLs were 404 — sourcing replacements)
**From:** Senior Engineer
**Subject:** The Unsplash URLs cook approved for FALAFEL (`photo-pQnsKWk5ljQ`) and PAVLOVA (`photo-5nCTfEru3Do`) return 404 on the CDN. They look like Unsplash page short-codes, not the `images.unsplash.com/photo-{numeric_id}-{hash}` CDN path that the app's `<Image>` component needs. CARBONARA (`photo-1612874742237-6526221588e3`) is the correct CDN format and resolves 200.

**What I shipped in #113:**
- Stripped the broken FALAFEL + PAVLOVA `hero_url` fields from seed-recipes.ts.
- Stripped their `hero_attribution` lines so the credit pill doesn't orphan.
- Both render the gradient-bands + emoji fallback until proper URLs land.
- CARBONARA hero stays — it works on Patrick's device after this build.

**What's needed:**
1. Photography Director re-sources Falafel + Pavlova hero candidates. The URL must be the direct CDN path: `https://images.unsplash.com/photo-{NUMERIC-ID}-{HASH}?...`. The page short code (`unsplash.com/photos/pQnsKWk5ljQ`) is not the CDN URL — open the photo on Unsplash and use the "Download" or right-click image src.
2. Cook re-signs off on the new candidates.
3. Engineer migrates as a data-only commit.

**Status:** shipped to main, awaiting Patrick on-device validation per R-015. Not self-closing.

---

### HANDOFF → Patrick · 2026-05-16 · OPEN (build #113 validation walk)
**From:** Senior Engineer
**Subject:** Build #113 fixes three bugs Patrick caught on #112. Validation steps below.

**What to check after installing #113:**
1. **Swap button works.** Open any recipe with substitutions (Pasta Carbonara, Butter Chicken, Smash Burger…). Tap any ingredient name in the list. A bottom sheet should open with green/yellow/red swap options. Tap a swap → step text adapts where cook authored an override.
2. **Cuisine tiles show real options.** Open Kitchen. The horizontal row under "Browse by cuisine" should show 7 tiles: All, Australian, Levantine, Italian, Indian, Thai, American, Mexican (in some order — derived from the 16 launch recipes). Tapping each filters the recipe list to that cuisine. Tapping again returns to All.
3. **Carbonara hero image.** Open Pasta Carbonara — the Kitchen hero card (if Carbonara is featured) and the recipe detail screen should show a real photo of carbonara, with "Photo: Unsplash" in tiny text at the bottom-right of the image.
4. **Falafel + Pavlova render gracefully.** Both should show the gradient-bands fallback + emoji — no broken image icon, no white square. Real photos coming in the next photography pass once URLs are re-sourced.

**Per R-015:** shipped to main, awaiting Patrick on-device validation. Not self-closing.

---

### HANDOFF → Engineer · 2026-05-15 · OPEN (hero photo_url integration — all 16 launch recipes)
**From:** COO (Photography Director)
**Subject:** All 16 launch recipe heroes are now APPROVED. Engineer to wire the correct photo_url into each recipe constant in seed-recipes.ts and trigger a build.
**Why:** The cook accuracy pass is complete. 8 recipes had their original images rejected (dead URLs, wrong content) and replacement photos have been sourced from Unsplash and approved by Patrick (verbal, 2026-05-15). The app currently shows stale or missing hero images for those 8 recipes.

**Exact photo_url values to set (format: `https://images.unsplash.com/photo-[ID]?w=600&q=80`):**

| Recipe constant | photo_url to set |
|---|---|
| `SMASH_BURGER` | `https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=600&q=80` |
| `WEEKDAY_BOLOGNESE` | `https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=600&q=80` |
| `PASTA_CARBONARA` | already set — `photo-1612874742237` ✅ no change |
| `ROAST_CHICKEN` | `https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=600&q=80` |
| `BUTTER_CHICKEN` | `https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80` |
| `THAI_GREEN_CURRY` | `https://images.unsplash.com/photo-1716959669858-11d415bdead6?w=600&q=80` |
| `CHICKEN_SCHNITZEL` | `https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=600&q=80` |
| `BEEF_LASAGNE` | `https://images.unsplash.com/photo-1709429790175-b02bb1b19207?w=600&q=80` |
| `ROAST_LAMB` | `https://images.unsplash.com/photo-1625604087024-7fb428fc4626?w=600&q=80` |
| `FISH_AND_CHIPS` | `https://images.unsplash.com/photo-1611599538235-128e54f1250f?w=600&q=80` |
| `FALAFEL` | already set — `photo-pQnsKWk5ljQ` ✅ no change |
| `PAVLOVA` | already set — `photo-5nCTfEru3Do` ✅ no change |
| `CHICKEN_SHAWARMA` | `https://images.unsplash.com/photo-1583060095186-852adde6b819?w=600&q=80` |
| `HUMMUS` | `https://images.unsplash.com/photo-1637949385162-e416fb15b2ce?w=600&q=80` |
| `PAD_THAI` | `https://images.unsplash.com/photo-1637806930600-37fa8892069d?w=600&q=80` |
| `FLOUR_TORTILLAS` | `https://images.unsplash.com/photo-1693193433392-da83457dff20?w=600&q=80` |

**Where to put the photo_url:** Each recipe constant has a top-level `photo_url` field (or `hero_url` — check the existing CARBONARA/FALAFEL/PAVLOVA entries for the exact field name in use). Set it on the recipe object, not on individual steps.

**Attribution:** Each approved image carries an Unsplash License (free for commercial use with attribution). The `hero_attribution` field (added in build #110) should be set where we have a photographer name:
- `photo-1607013251379` → `"Photo: Eiliv Aceron / Unsplash"`
- `photo-1625604087024` → `"Photo: James Kern / Unsplash"`
- `photo-1599921841143` → `"Photo: Mark König / Unsplash"`
- `photo-1603894584373` → `"Photo: Raman / Unsplash"`
- `photo-1622973536968` → `"Photo: Homescreenify / Unsplash"`
- All others: `"Photo: Unsplash"` (photographer not recorded)

**Files to touch:**
- `mobile/src/data/seed-recipes.ts` — set photo_url on 13 recipe constants (3 already set, as noted above)

**What this unblocks:** A build where every recipe in the Kitchen tab has a hero image. No more grey placeholders.

**Blocks:** Nothing else is waiting on this — it's the last open visual item before launch.

---

### HANDOFF → Cook · 2026-05-15 · DONE (DECISION-014 — hero accuracy validation, all 16 launch recipes)
**From:** Photography Director (COO)
**Subject:** 13 hero images are sitting at CANDIDATE status in the ledger. Cook must inspect each one and either sign it off as APPROVED or REJECT it with a specific reason. Until this is done the engineer cannot migrate the photos into the app and build #111's placeholder gap stays open.
**Why:** Every hero was sourced against the visual description only. Real-image searches return near-misses — wrong cheese colour, wrong tortilla size, raw chicken instead of charred, generic roast instead of lamb specifically. Cook is the only person who can confirm culinary accuracy.

**How to validate each photo:**
1. Open the URL in a browser (or paste into the Safari/Chrome address bar).
2. Compare against the checklist below — one specific question per recipe.
3. Go to `docs/coo/visual-assets-ledger.md` and fill in the "Cook signoff" column with:
   - ✅ APPROVED YYYY-MM-DD Cook — [one-line note on what you confirmed]
   - ❌ REJECTED YYYY-MM-DD Cook — [specific reason: what's wrong]
4. Change the Status cell from CANDIDATE to APPROVED or REJECTED.

**The 13 photos to validate (open each URL in a browser):**

| Recipe | URL to open | The one question |
|---|---|---|
| Smash Burger (replacement) | https://images.unsplash.com/photo-1678110707493-8d05425137ac?w=600&q=80 | Is the patty thin and smashed flat with a lacy crust? No red onion rings, no lettuce/tomato? Cheese looks like cheddar (orange-yellow melt), not yellow processed American? |
| Weekday Bolognese | https://images.unsplash.com/photo-1622973536968-3ead9e780960?w=600&q=80 | Spaghetti with a glossy rich meat sauce? No cream visible, not lasagne? |
| Roast Chicken | https://images.unsplash.com/photo-1598103442097-8b74394b95c8?w=600&q=80 | Whole chicken, deep golden-brown skin, not sauced or covered? |
| Butter Chicken | https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80 | Rich orange-red curry sauce, not pale yellow or green? |
| Thai Green Curry | https://images.unsplash.com/photo-1668665772043-bdd32e348998?w=600&q=80 | Green curry — visibly green from coconut milk + paste? Not yellow or red curry? |
| Chicken Schnitzel | https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=600&q=80 | Thin golden crumbed schnitzel? Not a thick parmigiana or a crumbed rissole? |
| Beef Lasagne | https://images.unsplash.com/photo-1633436374784-7f9502eb348a?w=600&q=80 | Classic layered lasagne with visible pasta layers and meat sauce? Not a wrap or baked pasta dish? |
| Roast Lamb with Rosemary & Garlic | https://images.unsplash.com/photo-1625604087024-7fb428fc4626?w=600&q=80 | Is this clearly a lamb leg or shoulder (not chops, not a rack, not a whole animal)? Deep mahogany crust? Rosemary visible? |
| Fish & Chips | https://images.unsplash.com/photo-kmQw0_2A9xQ?w=600&q=80 | Golden battered fish fillet + chunky chips? Beer-batter style (pale gold, not fine breadcrumb coating)? |
| Chicken Shawarma (replacement) | https://images.unsplash.com/photo-1561620141-343a829938de?w=600&q=80 | Does this look Levantine — not a Greek gyro or Turkish doner? Cooked meat (not raw)? |
| Hummus | https://images.unsplash.com/photo-14X4iiiF3t4?w=600&q=80 | Smooth pale hummus with olive oil pool + paprika? Not falafel or a dip plate with many items? |
| Pad Thai | https://images.unsplash.com/photo-_wBJ0cvKhIE?w=600&q=80 | Rice noodles, egg ribbons, peanuts, bean sprouts? Not a stir-fry or noodle soup? |
| Flour Tortillas (replacement) | https://images.unsplash.com/photo-1693193433392-da83457dff20?w=600&q=80 | Small taco-size flour tortillas (~12 cm)? No branding visible? Flour (white/cream), not corn (yellow)? |

**Already APPROVED — no action needed:**
- Pasta Carbonara ✅, Falafel ✅, Pavlova ✅

**Files to update:**
- `docs/coo/visual-assets-ledger.md` — Cook signoff column + Status column for each recipe's hero row

**What this unblocks:**
- Engineer can run the hero migration into seed-recipes.ts (one line per recipe) and trigger a build that finally fills all placeholder gaps in the Kitchen tab.

**Blocks:** Hero migration into seed-recipes.ts for all 13 recipes. Build that resolves the build #111 placeholder gap.

---

### HANDOFF → Patrick · 2026-05-14 · OPEN (build #112 — uninstall-reinstall validation required to close R-016)
**From:** Senior Engineer
**Subject:** Build #112 contains the `allowBackup: false` fix. Patrick must run the uninstall + clean reinstall test before R-016 can close.

**Validation procedure on Patrick's device:**
1. Open the current build (#111). Add a few pantry items, tick some shopping list items.
2. Uninstall the app (long-press → uninstall, or Settings → Apps → Hone → Uninstall).
3. **Clear cache and data first** (Settings → Apps → Hone → Storage → Clear all data) — belt and braces; uninstall should do it but Android sometimes lies.
4. Reboot the phone if you're feeling thorough.
5. Install build #112 fresh from the GitHub Actions artifact.
6. Open Pantry tab — expect **empty** (no pre-restored items).
7. Open Shop tab — expect **empty** (no pre-restored items).

**If pantry/shop come back populated:** R-016 is NOT closed. Likely root causes:
- Google Drive backup restore happened despite `allowBackup: false` (would need a `dataExtractionRules` XML file too).
- `versionCode` 47 → 48 wasn't picked up by Play Console's "restore from backup" path.
- Some other persistence layer (e.g. cloud-sync MCP, OAuth token cache) that survives uninstall.

**If pantry/shop are empty as expected:** R-016 closed. The CI truncation guardrail from this same build will catch the next R-014 incident before it lands on main.

**Status:** shipped to main, awaiting Patrick on-device validation. Not self-closing per R-015.

---

### HANDOFF → Cook + COO · 2026-05-14 · OPEN (DECISION-015 migration gaps — 8 entries cook needs to clarify)
**From:** Senior Engineer
**Subject:** Build #111 migrated the per-recipe DECISION-015 work but eight entries need cook clarification before they can ship. Default mapping holds for these until cook provides the missing detail.

**Missing override text (cook flagged in discrepancy table but didn't author the alternate step content):**
1. **SMASH_BURGER** — 3 entries flagged for step_overrides: Wagyu, American cheese, Bread & butter pickles. No authored override text.
2. **HUMMUS** — Tinned chickpeas → s2 flagged. No authored text.
3. **PAD_THAI** — 4 entries with step_override = s1/s3/s4 flags. No authored override text section in the research file.
4. **FALAFEL** — 2 entries with step_override = s1 flags (50/50 chickpeas+fava, dried fava beans only). No authored text.

**Ambiguous step anchors (need cook to specify which step ID):**
5. **BEEF_LASAGNE** — "Tomato puree (paste) → ragù step" — step IDs are `step_1_soffritto`, `step_2_brown_mince`, `step_3_milk`, `step_4_wine`, `step_5_simmer`. The override text talks about frying the paste before liquid (so probably step_2_brown_mince or step_4_wine). Cook to pick.
6. **ROAST_LAMB** — "Boneless lamb shoulder → prep" — step IDs are `step_1_temper`, `step_2_score`, `step_3_season`, `step_4_tray`. Cook to pick which "prep" step applies.

**Substitution doesn't exist in seed:**
7. **FLOUR_TORTILLAS** — cook's table includes a "Vegetable shortening" substitution which is not in the FLOUR_TORTILLAS const's substitutions array. Either cook adds it (with a `changes` line) or the table entry should be removed.

**What's needed:**
- Cook adds the missing override text + clarifies step anchors in each research file.
- COO confirms the additions are on main.
- Engineer ships a small data-only follow-up (build #112 or later) that covers these.

**Status of build #111:** **shipped to main, awaiting Patrick on-device validation** per R-015. 64 colour overrides + 12 step_overrides applied. 8 gaps flagged here.

---

### HANDOFF → COO + Cook · 2026-05-14 · OPEN URGENT (item 3 of build #110 — DECISION-015 per-recipe tables not yet authored)
**From:** Senior Engineer
**Subject:** Build #110 brief claimed cook had "completed DECISION-015 substitution colour mapping for all 16 launch recipes" with discrepancy tables in every `docs/coo/culinary-research/<recipe>.md`. **Empirically false.** I searched origin/main for `DECISION-015`, `step_overrides`, `Great swap`, `Some difference`, and `Noticeable change` across every research file — every search returns zero hits. The cook has not yet committed the per-recipe discrepancy tables.

**Item 3 not shipped in #110.** Default 4-to-3 quality mapping from build #107 is still in force across all 16 launch recipes — that's functionally correct, just generic. When cook actually delivers, the per-recipe colour overrides + `step_overrides` will come in as small data-only commits.

**What I need:**
- Cook to author the discrepancy tables in each `<recipe>.md`. Format from the open handoff dated 2026-05-10: `| Recipe const | Substitution | Old quality | New colour | step_overrides needed | Notes |`.
- COO to verify the tables are actually present in origin before claiming "ready" in the next build brief. The phrase "verified by COO against the repo" appeared in the #110 brief; that verification didn't match the repo state.

**Items 1, 2, 4, 5 all shipped in #110 (commit `pending`).** Cumulative state after this build: see the build log row above for full detail.

**Status:** **shipped to main, awaiting Patrick on-device validation** per R-015. Not self-closing.

---

### HANDOFF → COO + Cook · 2026-05-14 · OPEN (R-014 truncation hit cook's `ff86010` types.ts commit)
**From:** Senior Engineer
**Subject:** Cook's `ff86010` ("feat(taxonomy): add 'dessert' TypeId; Pavlova types baking→dessert") added `'dessert'` to TypeId successfully but silently truncated the last 4 lines of `types.ts` — net `-4 +1` even though the intent was `+1` only. Recovered in #110 by splicing `b0382e0`'s clean tail back in and re-applying the `'dessert'` insertion verbatim.

This is the same R-014 pattern that hit Patrick's `6813ddc` smash-burger commit. Two truncation incidents from non-engineer commits in two days. The repo-side guardrail (CI step that asserts every `.ts` file ends with a balanced final brace + newline) would close this gap permanently. Flagging for the next housekeeping cycle.

---

### HANDOFF → Photography Director · 2026-05-14 · OPEN URGENT (DECISION-014 — source CC-licensed hero images for all 16 launch recipes from Unsplash/Pexels)
**From:** Patrick (via COO)
**Subject:** Source one CC-licensed real-photo hero per launch recipe. Real photos only for heroes — faster, free, looks authentic. Not AI.
**Why:** AI heroes carry commercial licensing ambiguity and look noticeably synthetic at launch scale. Real CC photography from Unsplash/Pexels is Unsplash License / Pexels License — both commercially OK, no attribution required (though we credit anyway per our standard). One solid session to fill all 16 hero slots.
**What's needed:**
1. Search Unsplash then Pexels (in that order) for each recipe slug. Accuracy over aesthetics — the photo must match *our* recipe, not a generic version.
2. Key accuracy constraints from Patrick:
   - **Carbonara** — golden egg-coated sauce, NOT white/cream. Any cream sauce photo is a reject.
   - **Smash Burger** — thin patty, lacy crust, smashed flat. NOT a thick pub-style burger.
   - **Pavlova** — meringue base with fresh fruit + cream, Australian/NZ style. NOT genoise or layer cake.
   - **Shawarma** — Levantine (Lebanese/Syrian) presentation. NOT donair, NOT gyro.
   - **Flour Tortillas** — small taco-size 12–13cm. NOT burrito size.
3. For each recipe: record full Unsplash/Pexels URL, photo ID, photographer name, and licence in `docs/coo/visual-assets-ledger.md`.
4. Mark status `CANDIDATE` — cook validates accuracy per recipe before `APPROVED`.
5. If no suitable Unsplash/Pexels photo exists for a recipe, flag it explicitly — Photography Director will then generate via AI.
**Output:** All 16 hero rows in `docs/coo/visual-assets-ledger.md` filled with CANDIDATE URLs. Engineer reads the ledger to pull `photo_url` into `seed-recipes.ts` hero fields.
**Files touched:** `docs/coo/visual-assets-ledger.md`
**Blocks:** Launch. Hero images are the most visible recipe asset — every recipe card shows the hero.

---

### HANDOFF → Photography Director · 2026-05-13 · OPEN URGENT (16 launch recipe hero images — Unsplash/Pexels batch sourcing)
**From:** Patrick (via COO)
**Subject:** Source one CC-licensed hero image for each of the 16 launch recipes from Unsplash or Pexels. Real photos, not AI. Cook validates accuracy. Engineer migrates URLs into seed-recipes.ts. Goal: every recipe card on the Kitchen page shows a real food image, not the gradient placeholder.

**Why now:** Patrick is on build #109. Kitchen page recipe cards still render placeholders/gradients on most recipes — placeholders shouldn't ship to launch. AI-generated stage shots remain a longer pipeline (image briefs, prompt iteration, cook validation per stage). For hero shots specifically, well-curated real photos from Unsplash / Pexels are faster, free, and look authentic.

**What's needed:**

1. **Source one hero image per recipe** from Unsplash (`unsplash.com`) or Pexels (`pexels.com`). Both are commercial-use OK with attribution. The 16 recipes:
   1. Roast Chicken (Hone Kitchen original — dry-brine + compound butter + spatchcock visual cue if findable, else any well-shot roast chicken)
   2. Spaghetti Bolognese
   3. Spaghetti Carbonara — **must be golden egg-coated sauce, NOT cream-based**. Pancetta/guanciale crisped, pecorino dust. Reject any white-sauce variant.
   4. Butter Chicken
   5. Smash Burger — thin patty with lacy crust, NOT a thick pub burger
   6. Thai Green Curry
   7. Chicken Schnitzel
   8. Beef Lasagne
   9. Roast Lamb with Rosemary & Garlic
   10. Fish & Chips (Australian / British style, beer batter)
   11. Pan-Fried Fish (Barramundi if it's still in the launch 16, else Falafel — confirm with cook which stuck)
   12. Pavlova (Australian / NZ style — meringue base, fresh fruit + cream)
   13. Chicken Shawarma (Levantine — NOT donair, NOT gyro)
   14. Hummus
   15. Pad Thai
   16. Flour Tortillas — Patrick's recipe, small taco-size (12–13cm), buttery soft, NOT burrito-size

2. **For each image, capture:** Unsplash/Pexels URL, photographer name and profile, license type. Goal is ~16 rows added to `docs/coo/visual-assets-ledger.md`.

3. **Send candidates to the cook for accuracy validation** — she signs off or rejects per recipe with specific notes. Common rejection criteria: wrong cuisine variant (cream carbonara, thick smash burger, gyro shawarma); over-stylised "Pinterest food" shots that don't match an Australian home cook's reality; uncanny-valley-looking food photography (rare on Unsplash but check).

4. **After cook signoff, handoff URLs to engineer** for migration into `seed-recipes.ts` via the existing `photo_url` field on each Recipe. Attribution credit needs a small display element on the recipe card or detail screen — engineer's call where best to surface, but the photographer credit must be visible somewhere per Unsplash/Pexels licensing requirements.

**Sequence:** All 16 in one batch. This is one-session work for you given Unsplash search tooling. Cook validates in one session. Engineer migrates in 30 min. Could be on Patrick's phone within 24 hours.

**Cost:** ~1 session Photography Director + ~1 session Cook validation + ~30 min Engineer migration. Cheap, real-photo win.

**R-014 mitigation:** when updating ledger / seed file, `tail -c 200` after each save.

**Files touched:** `docs/coo/visual-assets-ledger.md`, eventual handoff to engineer with URLs for `mobile/src/data/seed-recipes.ts` migration.

**Blocks:** Kitchen page visual story for launch. Placeholders are not a launch-acceptable state.

---

### COO NOTE → Senior Engineer · 2026-05-14 · FYI (multi-category authorship complete — tiles can migrate now)
**From:** COO
Multi-category audit for all 16 launch recipes is done and committed (`b0382e0`). Every recipe now has `categories.cuisines[]` and `categories.types[]` in `seed-recipes.ts`. CuisineId enum extended with `palestinian`, `filipino`, `chinese`, `german`, `british`. Two open design questions before you build the filter UI: (1) Pavlova is currently `types: ['baking']` — `'dessert'` is semantically better for a filter tile but would require adding `'dessert'` to the TypeId enum; (2) occasion tags like `'weeknight'`/`'weekend'` are not in the current schema — adding them means extending TypeId or adding a third `occasions[]` axis. COO recommendation: add `'dessert'` now (it's a clean gap), defer occasion tags post-launch. Await Patrick's call before touching the enum.

---

### HANDOFF → Senior Engineer · 2026-05-13 · OPEN URGENT (Kitchen category tiles not displaying — investigate + fix)
**From:** Patrick (via COO)
**Subject:** On build #109, the cuisine category tiles on the Kitchen page aren't displaying for filtering. Investigate root cause; fix the tile-list logic OR populate the missing category data on recipes — whichever is the actual issue.

**Why:** The Kitchen Editorial redesign (build #105) added category tiles per Designer's spec — "Browse by cuisine" row showing All + Levantine, Indian, Japanese, Italian, Malaysian, Thai, French, Australian. Patrick reports they aren't appearing on-device. Two possible causes:

1. **Tile-hide logic is too aggressive.** The redesign had "Tiles hide if no recipe in the active roster carries that cuisine." If the launch 16 recipes don't have `categories.cuisines` populated correctly in seed data, most tiles hide. Possibly ALL tiles hide if the cuisine field is missing entirely on most recipes.

2. **Designer's category list doesn't match the actual launch 16 cuisines.** The list has Japanese / Malaysian / French — but those cuisines have zero launch recipes (the Japanese, Malaysian, French recipes are all in `SEED_RECIPES_HOLDING`, not visible). Meanwhile American (Smash Burger) and Mexican (Flour Tortillas) ARE in the launch 16 but those cuisines aren't in the Designer's list — so those tiles would never show.

**What's needed:**

1. **Diagnose first.** Check on-device console logs for any category-related warnings. Then check `seed-recipes.ts` — for each of the 16 launch recipes, is `categories.cuisines` populated? With what values? Report back before touching code.

2. **Fix the tile list.** Update the Kitchen Editorial component (`(tabs)/index.tsx`) to derive the tile list from cuisines that actually exist in the launch library, OR update the Designer's static list to match. Either approach works — decide which is cleaner. The intent: every cuisine that has at least one launch recipe shows as a tile. Cuisines with zero launch recipes don't show.

3. **Coordinate with cook.** Cook is doing parallel work to walk every launch recipe's `categories.cuisines` and `categories.types` per the separate cook handoff below. As her per-recipe discrepancy tables ship, you migrate the new category data into `seed-recipes.ts`. Each migration may unlock more tile visibility.

**Validation gate per R-015:**
- `npx tsc --noEmit` clean
- `tail -c 200` of every modified file confirms clean EOF
- On-device: open Kitchen page → cuisine tiles render for every cuisine that has at least 1 launch recipe → tapping a tile filters correctly → tapping again deselects to "All"
- Build log entry for the build that ships this

**Files touched:** `mobile/app/(tabs)/index.tsx` (tile list logic), `mobile/src/data/seed-recipes.ts` (category data migration as cook ships per-recipe).

**Cost:** ~30 min diagnosis + ~1 hour fix.

**Blocks:** Kitchen page filtering. Currently users can't browse by cuisine.

---

### HANDOFF → Culinary Verifier · 2026-05-13 · OPEN URGENT (multi-category authorship for 16 launch recipes — cuisines + types)
**From:** Patrick (via COO)
**Subject:** Walk every launch recipe and assign honest categories — multiple cuisines and multiple types where appropriate. Chef knowledge owns this, not engineer guesses.

**Why:** Patrick noticed on build #109 that cuisine filtering tiles aren't showing on the Kitchen page. Part of the cause is that the launch recipes' `categories.cuisines` data is either missing or thin. His instinct (correct): cook decides which cuisines AND types each recipe belongs in, with multi-category support honestly used where it applies. A smash burger is American AND a burger AND weeknight. Pavlova is Australian (or Australian/NZ contested) AND a dessert AND weekend. Lasagne is Italian AND pasta AND a baking project. Honest taxonomy beats forced single-category.

**What's needed:**

1. **Walk every recipe in the 16-launch list** (you have research files for all of them). For each, decide:
   - **`categories.cuisines: string[]`** — one or more cuisines. Examples:
     - Roast Chicken: `['australian']` (Hone Kitchen original — per the new attribution)
     - Carbonara: `['italian']`
     - Butter Chicken: `['indian']`
     - Smash Burger: `['american']` (and maybe `['australian']` if it's framed as a modern Aussie pub thing — your call)
     - Hummus: `['levantine', 'palestinian']` or whichever sub-region you stand behind — multi-region honest credit per Golden Rule 1
     - Pavlova: `['australian']` (or `['australian', 'new_zealand']` if you want to acknowledge the contested origin; your judgment)
     - Tortillas: `['mexican']` (Patrick's recipe but the dish is Mexican)
   - **`categories.types: string[]`** — one or more meal/dish types. Examples: `['burger']`, `['pasta', 'weeknight']`, `['curry']`, `['roast', 'weekend']`, `['baking', 'dessert']`, `['salad', 'vegetarian']`, `['street_food']`.

2. **Document in a discrepancy table at the top of each research file** — same pattern as the tortilla and roast-chicken fixes. List exactly what the engineer needs to change in `seed-recipes.ts` per recipe. Format:

   | Recipe const | Field | Current value | New value | Notes |

3. **Pre-flight checklist before declaring per-recipe ready:**
   - Cuisines are honestly attributed per cultural rules (Levantine = region not nation-state; no Israeli labels)
   - Types are useful for filtering (don't add types nobody would filter on, but do add the genuinely useful ones — "weeknight" / "weekend" / "vegetarian" / "dessert" are obvious)
   - Multi-category only where genuinely true — don't pad
   - Australian English throughout
   - Discrepancy table is complete and unambiguous for the engineer

4. **R-014 mitigation:** `tail -c 200 <file>` after each save.

**Sequence:** Start with whichever recipe is least clear in your view (probably Smash Burger or Pavlova — contested or multi-category cases) so the engineer has a clear test case for the multi-category rendering. Then walk the rest at your pace.

**Cost:** ~1.5 sessions for all 16. Categories are usually a quick judgment per recipe.

**Coordination:** Engineer is in parallel debugging why the existing tiles don't show. As you ship per-recipe discrepancy tables, engineer migrates the category data and the tiles populate progressively.

**Files touched:** `docs/coo/culinary-research/<recipe>.md` for each of the 16 launch recipes — adding/extending the discrepancy table at the top with category assignments.

**Blocks:** Kitchen page filtering quality. Without honest multi-category, users can't browse by anything useful.

---

### HANDOFF → Patrick + COO · 2026-05-13 · OPEN URGENT (R-014 hit by your 6813ddc commit — pattern to flag in future)
**From:** Senior Engineer
**Subject:** Builds #108 (and the 3 commits before it) all failed Metro bundling. Root cause was your own commit `6813ddc` ("feat(smash-burger): add Gemini stage photos to app") which silently truncated 14 lines off the end of `SEED_RECIPES_HOLDING` while adding two `photo_url` fields. Build #109 recovers.

**The exact diff Patrick's commit produced:**
- ✅ Added `photo_url` on SMASH_BURGER s1 → `smash-burger-mise.jpg`
- ✅ Added `photo_url` on SMASH_BURGER s3 → `smash-burger-smash.jpg`
- ❌ Deleted `AGLIO_E_OLIO, MUJADARA, SHEET_PAN_HARISSA_CHICKEN, EGG_FRIED_RICE, LAMB_SHAWARMA, NASI_LEMAK, BEEF_RENDANG, CURRY_LAKSA, CHAR_KWAY_TEOW, SAAG_PANEER, CHICKEN_KATSU, TOM_YUM, BARRAMUNDI, CHICKEN_VEG_STIR_FRY` from `SEED_RECIPES_HOLDING` — array ended with `AG` (prefix of `AGLIO_E_OLIO`) and no closing `];` or final newline.

That's exactly the R-014 truncation pattern — write tool returns success, file looks fine in the editor, but the byte stream is cut off mid-identifier. Patrick's commit message even hinted at it (`+3 -17` net loss with intent to only +3).

**The fix shipped in #109 (`a1c1...` — this commit):**
1. Took the clean state from `b91836d` (last successful build, 5857 lines, 539591 bytes).
2. Re-applied both photo_url additions verbatim from your 6813ddc diff.
3. Pushed as single commit with build-log row in same tree.
4. tsc clean. Tail byte-verified: `…CHICKEN_VEG_STIR_FRY,\n];\n`. 30 holding recipes intact. 16 launch recipes intact.

**My #108 cook-mode work is NOT lost** — the knuckle-tap-to-advance change in `recipe/[id].tsx` is in commit `922f295` on main and survives because it was a different file from the truncated one. Once #109 builds successfully, you'll get the cumulative state: #107 DECISION-015 + #108 knuckle-tap + #109's two photo_urls.

**Process gap to close (suggest COO action):**
1. Any tool that edits `seed-recipes.ts` should run `tail -c 200` and confirm the file ends with `];\n` before commit. Patrick's commit was made via the file tools and the truncation wasn't caught.
2. Cowork-side: if Patrick is editing seed-recipes.ts directly through the desktop Cowork mode, the file-write path should have the same `tail -c 200` guardrail before any push.
3. Engineer-side: I now run `tail -c 200` after every seed-recipes.ts edit; this commit verifies. The pattern persists despite per-edit verification because OTHER actors (Patrick's own commits, COO commits) can introduce it. The repo-side guardrail (CI step that grep-asserts `];\n` tail) would close this gap permanently — flag for the next housekeeping cycle.

**On-device validation walk after #109 finishes:**
1. Open Kitchen → still exactly 16 cards (DECISION-013 prune + smoke alarm still works).
2. Open SMASH_BURGER. Step s1 ("Ball and season") and Step s3 ("Smash hard and hold") should show their Gemini stage photos rendered inline.
3. Cook mode knuckle-tap-to-advance still works from #108.

**Status:** **shipped #109, awaiting Patrick on-device validation** per R-015. Not self-closing.

---

### HANDOFF → Patrick · 2026-05-12 · OPEN URGENT (Item 2 of build #108 — PAT rotation needs your GitHub UI action)
**From:** Senior Engineer
**Subject:** Build #108 went out with items 1, 3, 4 actioned. Item 2 (PAT rotation per DECISION-010 follow-up) requires your hands on the GitHub UI — I literally cannot generate a token under your account.

**Current PAT state (probed from sandbox just now):**
- User: `patrickpatches`
- Scopes: `repo, workflow`
- Expires: **2026-07-21 10:35:11 UTC** (~10 weeks from today)
- Rate limit: 5000/5000 healthy

**What I need you to do:**
1. Go to <https://github.com/settings/tokens?type=beta> and generate a new **fine-grained** PAT.
2. Repo access: only this repo (`patrickpatches/hone`).
3. Permissions: `Contents: read & write`, `Workflows: read & write`, `Actions: read & write` (the workflow_dispatch we use for EAS builds needs this), `Metadata: read` (required). Nothing else.
4. Expiry: pick whatever you're comfortable with (30/60/90 days is the right scale). Set a calendar reminder for ~5 days before expiry.
5. Copy the token value once — GitHub only shows it once.
6. Paste it into chat here OR set it directly in `.git/config` on your Windows box: edit the URL in `[remote "origin"]` from `https://OLD_TOKEN@github.com/patrickpatches/hone.git` to `https://NEW_TOKEN@github.com/patrickpatches/hone.git`.
7. Once I have the new token in `.git/config`, I'll test-push a no-op commit (e.g. a docs touch) to verify it works.
8. After verified, you revoke the old token at <https://github.com/settings/tokens> (find the entry expiring 2026-07-21).

**Why now if it doesn't expire for 10 weeks:** DECISION-010 follow-up explicitly schedules rotation at this milestone (not at expiry). Catches any breakage on a quiet day instead of mid-incident.

**Engineer-side prep:** the current PAT lives only in `.git/config` and is used by the Contents API push flow in this session. No CI secrets to rotate. Once the new PAT is in place, all my push tooling uses it transparently.

**Status:** **shipped #108 without item 2**, awaiting your PAT-rotation action.

---

### HANDOFF → COO · 2026-05-12 · DONE ✅ (DECISION-015 blocker — cook's Smash Burger discrepancy table not in the research file)
**Closed by Engineer 2026-05-12 — Path A approved and shipped in build #107. Default migration applied across all 16 recipes. Cook's per-recipe overrides land as data-only commits as she ships them.**
**From:** Senior Engineer
**Subject:** Patrick cleared me to start DECISION-015 with Smash Burger as the test case. I'm holding the data-migration step because the cook's per-recipe discrepancy table is **not** in `docs/coo/culinary-research/smash-burger.md` despite the COO handoff implying it's ready.

**What I checked:**
- Grepped `smash-burger.md` for `DECISION-015`, `step_overrides`, `Old quality`, `New colour/color`, `green/yellow/red`, `perfect_swap/great_swap/good_swap/compromise`.
- Only quality-related hit: the audit entry line *"Substitutions: PASS — lean beef correctly flagged 'compromise'. Cheddar cheese correctly flagged 'compromise' (inferior melt)."* That's a 4-tier confirmation, not the new 3-colour mapping.
- No `step_overrides` authored, no `quality` column re-mapped per the new enum.

**Per the consolidated engineer handoff:** *"Apply only changes the cook explicitly lists — don't invent quality assignments she hasn't made."* So I can't fall back to the default mapping silently for the test recipe.

**What I'm going to do unless you say otherwise — Path A:**

Ship the **infrastructure** now in one commit:
1. Schema additions in `types.ts`: `quality: z.enum(["green","yellow","red"])` + optional `step_overrides: z.record(z.string(), z.string())`.
2. Data migration **driven by the default rule only** (perfect/great → green, good → yellow, compromise → red) applied across all 16 launch recipes' existing substitutions. No invented overrides. No step_overrides anywhere.
3. SubstitutionSheet.tsx — full v2 pill rendering per Designer's `docs/prototypes/substitution-sheet-v2.html`.
4. `recipe/[id].tsx` — conditional step rendering wired (no-op in practice because no recipe has step_overrides yet — but the code path is live, the "adapted for your swap" cue is rendered when the data exists).
5. Migration sanity log + step_overrides guardrail (console.warn for bad step ids).
6. Build log row in the same push.

Smash Burger becomes the test for **rendering** (pills + swap-active state + the negative case that no step shows "adapted" because no overrides exist yet). When cook ships her actual discrepancy table for Smash Burger, I do a tiny data-only commit overriding specific swap colours and adding any step_overrides she authors. Same pattern for the remaining 15.

**What I need from the COO:**
1. **Confirm path A is OK** — or override with path B (keep holding until cook's table lands in `smash-burger.md`). Patrick has expressed a preference for moving; I'm flagging to keep the audit trail straight.
2. **Route the discrepancy-table authorship task back to cook.** The COO handoff to her dated 2026-05-10 OPEN URGENT lays out the format. She needs to add the table to `smash-burger.md` (and the other 15 in batches). Without it the data migration can't happen per the "don't invent" rule.
3. **Acknowledge** that the cumulative state shipping in the next build will have all existing substitutions auto-mapped to the new enum via the default rule. Cook's per-swap overrides land as separate data-only commits as she ships them.

**Files touched if you say go on path A (next commit):** `mobile/src/data/types.ts`, `mobile/src/data/seed-recipes.ts`, `mobile/src/components/SubstitutionSheet.tsx`, `mobile/app/recipe/[id].tsx`. Bundled with the build log row per the new discipline rule.

**Status:** **holding for COO direction.** No code written yet.

---

### HANDOFF → Senior Engineer · 2026-05-12 · OPEN URGENT (Roast Chicken — attribution fix + full recipe rewrite)
**From:** COO (via Culinary Verifier)
**Subject:** Roast Chicken has been declared a Hone Kitchen original. Attribution must change from Thomas Keller before ship. Full recipe rewrite with compound butter + spatchcock method also ready to migrate.
**Why:** Patrick officially declared this a Hone Kitchen original this session. The current `source.chef: 'Thomas Keller'` with Bouchon notes cannot ship — incorrect attribution is a Golden Rule violation. Separately, the culinary research file has been fully rewritten with a stronger technique (dry brine + compound butter under skin + spatchcock primary method + pan sauce) that beats the Keller approach for home cooks.
**What's done:** `docs/coo/culinary-research/roast-chicken.md` fully rewritten — Hone Kitchen original, 10-section DECISION-009 template, DECISION-015 substitution colours, discrepancy table at top, pre-flight checklist complete.
**What's needed:**
1. Apply all items in the discrepancy table (top of `roast-chicken.md`) to `seed-recipes.ts`. Priority order:
   - `source.chef` → `'Hone Kitchen'` ← **do this first, hard blocker**
   - `source.notes` → `"Hone Kitchen original — dry-brine, compound butter under skin, spatchcock method."`
   - `categories.cuisines` → `['australian']`
   - `title` → `'Roast Chicken'`
   - `difficulty` → `'intermediate'`
   - Add new ingredients: fresh tarragon (i4a), eschallot, dry white wine, chicken stock (low-sodium), cold butter (mounting) — pan sauce optional ingredients
   - Add step s6 (pan sauce) using step content from research file
   - Update step s3 content (compound butter technique)
2. All substitutions need DECISION-015 colour field (`quality_colour: 'green' | 'yellow' | 'red'`) per the colour mapping in the research file
3. No build required for docs changes — but attribution fix should land in next build
**Files touched:**
- `docs/coo/culinary-research/roast-chicken.md` (source of truth for this migration)
**Blocks:** Launch. Thomas Keller attribution cannot ship.

### HANDOFF → Culinary Verifier · 2026-05-10 · OPEN URGENT (DECISION-015 — substitution quality colours + step_overrides authoring)
**From:** Patrick (via COO)
**Subject:** Walk every launch recipe; collapse the 4-tier substitution quality to 3 colours (green/yellow/red); author `step_overrides` only where the swap genuinely changes technique.
**Why:** Per DECISION-015, substitutions get a simpler visual model (3 colours) and a new optional `step_overrides` field. Cook owns the chef judgment on both — colour and override authorship. Engineer wires the rendering after you ship. The step_overrides field is the closing of the "substitution honesty" gap: a user picking a swap should not then read step text that contradicts their choice.

**What's needed:**

1. **Re-map every substitution's quality tier on the 16 launch recipes** from the legacy 4-tier (`perfect_swap` / `great_swap` / `good_swap` / `compromise`) to the new 3-colour system:
   - **Green** — works as well or near-as-well as the original. No real compromise. (e.g. bacon for pancetta in carbonara — different cure, renders the same way)
   - **Yellow** — noticeable difference, honest tradeoff. (e.g. Greek yogurt for cream in butter chicken — tangier, lighter)
   - **Red** — works in a pinch, dish genuinely changes. (e.g. vegan butter for ghee in butter chicken — depth gone)
   Default migration: `perfect_swap` / `great_swap` → green; `good_swap` → yellow; `compromise` → red. **Override the default per-swap where your chef judgment differs.** Trust your palate over the mapping.

2. **Author `step_overrides` only where the swap actually changes technique.** Most swaps won't need this. Add only where the user would be misled by default step text. Examples likely to need overrides:
   - Butter chicken: yogurt swap for cream — "temper the yogurt first, off-heat" alternate
   - Carbonara: whole eggs for yolks-only — emulsion ratio differs
   - Tortillas: butter for lard — melt point affects fat-into-flour stage
   - Smash burger: any non-beef-mince swap — fat/texture differ
   - Where steps already reference ingredients by role/name without specifics, no override needed.

3. **Discrepancy table at the top of each research file you update** — same pattern as your tortilla file. List exactly what the engineer needs to change in `seed-recipes.ts`. Format:
   | Recipe const | Substitution | Old quality | New colour | step_overrides needed | Notes |
   This is the engineer-action-required document. The 8 May tortilla regression happened because the migration list wasn't surfaced — don't let it happen again.

4. **Pre-flight checklist before declaring per-recipe work ready:**
   - All substitutions re-coloured. Default mapping followed unless overridden, with justification.
   - `step_overrides` only present where technique genuinely changes — not for flavour-only or cosmetic differences.
   - Alternate text follows cookbook voice: doneness cues, second-person present-tense, no "simply" / "just," Australian English.
   - Retired-fields grep clean (`grep -i "whole_food"` returns zero hits per standing rule).
   - Discrepancy table for engineer is complete and unambiguous.

5. **R-014 mitigation (mandatory):** if you're updating large research files, after each save run `tail -c 200 <file>` to confirm clean EOF. The truncation pattern bit us 5 times in one engineer session — don't trust write-success silently.

**Files touched:** `docs/coo/culinary-research/<recipe>.md` for each of the 16 launch recipes you actually update.

**Sequence:** Smash Burger first as the test case. After Patrick reviews, walk the remaining 15.

**Cost:** ~2 sessions for full library walk. Don't do all 16 in one — sustained across sittings.

**Blocks:** Engineer's schema migration. Cook ships per-recipe; engineer migrates per-recipe in batches.

---

### HANDOFF → Product Designer · 2026-05-10 · DONE ✅ (DECISION-015 — green/yellow/red pill spec + "adapted for your swap" treatment)
**Closed by Product Designer 2026-05-12 — `docs/prototypes/substitution-sheet-v2.html` delivered. Engineer handoff issued above.**

### HANDOFF → Senior Engineer · 2026-05-12 · OPEN (DECISION-015 — implement substitution sheet v2 pill system + adapted step cue)
**From:** Product Designer
**Subject:** Wire in the new 3-colour substitution pill system and "adapted for your swap" step cue per the v2 spec
**Why:** DECISION-015 collapses the 4-tier quality model to green/yellow/red. The Culinary Verifier is authoring the new colour values and step_overrides; this handoff covers the rendering side.

**What's needed:**
1. **Pill component** — replace existing quality badge with `SubstitutionPill` using `PILL_CONFIG` (green/yellow/red). Every pill renders icon + label + colour. Never colour alone. Full spec in prototype.
2. **Ingredient row swapped state** — when a swap is active: border + bg tint in swap colour, "↩ swapped" text + icon. Spec in prototype.
3. **Adapted step cue** — when `step_overrides` contains an entry for the active swap + current step: render override content, show sage `≈ adapted for your [name] swap` cue below, sage border on card.
4. **Accessibility labels** — `accessibilityLabel` on each pill = `"{quality prefix} — {substitution.change_description}"`.

**Files touched:** `mobile/src/components/SubstitutionSheet.tsx` (or equivalent), `mobile/app/recipe/[id].tsx` (step rendering)

**Prototype + token values:** `docs/prototypes/substitution-sheet-v2.html`

**Blocks:** Culinary Verifier authoring (parallel — implement rendering first, data lands after).

---
**From:** Patrick (via COO)
**Subject:** Spec the visual treatment for the new 3-colour substitution pills + the "adapted for your swap" cue on step text when a swap with step_overrides is active.
**Why:** Per DECISION-015, substitution quality moves from 4 tiers to 3 colours. The substitution sheet exists; pill styling needs updating. When a swap with `step_overrides` is active, the user needs to know a step has been adapted for their swap — a small but important honesty cue.

**What's needed:**

1. **Update or extend the substitution sheet prototype** (build on `docs/prototypes/substitution-sheet.html` or create `substitution-sheet-v2.html`) showing:
   - **Green pill:** solid, on-brand sage accent (pick a green that reads cleanly on v0.7 dark surface). Optional ✓ icon for accessibility.
   - **Yellow pill:** `tokens.gold` #F2CC2A or muted version. Optional ~ icon.
   - **Red pill:** desaturated rust/red — "warning" not "stop", not Christmas-red. Optional ⚠ icon.
   - **Accessibility: never colour-alone.** Every pill has icon AND short text inline so colour-blind users get it too.

2. **"Adapted for your swap" cue on step text** — when a step's content is rendered from `step_overrides`, the step needs a small visual indicator. Suggest a 1-line caption like *"adapted for your [swap name] choice"* in muted text. Not loud — honest.

3. **Constraint:** v0.7 dark sage tokens locked. No visual direction change. Pill colours integrate with existing palette; "adapted" treatment doesn't introduce a new layout pattern.

4. **Output:** updated/new HTML prototype with three colour pills, adapted-step cue shown in context, written rationale, engineer-handoff block.

**Files touched:** `docs/prototypes/substitution-sheet-v2.html` (new or update existing).

**Cost:** ~half a session.

**Coordination:** Cook is walking 16 recipes assigning colours in parallel. You don't need to wait — your work is visual treatment, independent of specific recipe assignments.

**Blocks:** Engineer's UI updates for substitution pill rendering (needs your spec to match v0.7 palette).

---

### HANDOFF → Senior Engineer · 2026-05-10 · DONE ✅ (DECISION-015 — schema + conditional step rendering)
**Closed by Engineer 2026-05-12 — shipped in build #107. Schema: SwapQuality enum (green/yellow/red) + step_overrides optional field. All 16 launch recipes migrated via default rule. SubstitutionSheet.tsx v2 pill system (icon + label + colour). Conditional step rendering live in recipe/[id].tsx. Cook's per-recipe overrides land as data-only commits as she ships discrepancy tables.**
**From:** Patrick (via COO)
**Subject:** Add `quality` enum (green/yellow/red) and optional `step_overrides` to substitution schema. Wire the new pill colours per Designer's v2 prototype. Render alternate step content when an active swap has overrides for that step.

**Per R-014 / R-015 / build-log discipline (READ BEFORE STARTING):**
- All file writes over 200 lines use the GitHub API path (`curl --data-binary @file`), not the Edit tool. R-014 is red — five truncations in one engineer session was the trigger.
- After every modified file: `npx tsc --noEmit`, `tail -c 200`, last-bytes visual verification. No exceptions.
- Don't claim "done" — declare "shipped, awaiting Patrick on-device validation." R-015.
- Build log entry written the moment you push. No skips.
- Silent-failure guardrail: console.warn if `step_overrides` references a step id that doesn't exist on the recipe. Don't let a bad mapping silently fall back to default — surface it.

**What's needed:**

1. **Schema additions to substitution object** in `mobile/src/data/types.ts`:
   ```ts
   quality: z.enum(["green", "yellow", "red"])
   step_overrides: z.record(z.string(), z.string()).optional()
   ```
   Migrate existing four-tier fields. Default mapping: perfect/great → green, good → yellow, compromise → red. **Cook may override per-swap — read her discrepancy tables in `docs/coo/culinary-research/<recipe>.md` rather than assuming.**

2. **Migrate the 16 launch recipes' substitutions** in `seed-recipes.ts`. Pull from cook's per-recipe discrepancy tables. **Apply only changes the cook explicitly lists** — don't invent quality assignments she hasn't made.

3. **Update `SubstitutionSheet.tsx`** to render new pill colours per Designer's v2 prototype. Colour + icon, accessibility-compliant.

4. **Conditional step rendering** in `mobile/app/recipe/[id].tsx`:
   - For each step, check if any active swap has `step_overrides[step.id]`.
   - If yes, render that alternate text instead of `step.content`.
   - Show the "adapted for your swap" cue per Designer's spec.
   - Multiple active swaps with overlapping overrides → most recent swap wins. Document the rule in code comments.

5. **Migration sanity log on app launch:** count substitutions with `quality = green/yellow/red` vs legacy values. If any legacy values remain after migration, console.log loudly so the regression is visible.

6. **Validation gate before declaring shipped:**
   - `npx tsc --noEmit` clean
   - `tail -c 200` of every modified large file confirms clean EOF
   - On-device: open Smash Burger (cook's first recipe) → tap an ingredient with substitutions → pills render green/yellow/red with icons → tap a swap with `step_overrides` → step text changes to alternate, "adapted" cue appears → tap revert → step text returns to default
   - Build log entry written the moment you push

**Files touched:** `mobile/src/data/types.ts`, `mobile/src/data/seed-recipes.ts`, `mobile/src/components/SubstitutionSheet.tsx`, `mobile/app/recipe/[id].tsx`.

**Sequence:** Wait for cook's first recipe (Smash Burger) discrepancy table. Implement schema + pill rendering on that recipe, validate on-device, then batch remaining 15.

**Cost:** ~1 session schema + pill + initial conditional render. Plus ~half-session to migrate the remaining 15 as cook ships them.

**Blocks:** v0.6.x polish milestone. Closes the substitution-honesty arc Cook's been driving since Rule 5.

---

### HANDOFF → Culinary & Cultural Verifier · 2026-05-11 · OPEN (Roast Chicken image accuracy validation — brief ready, images pending)
**From:** Photography Director
**Subject:** Roast Chicken image brief complete (4 prompts). Key validation: skin must be deep golden-brown (not pale, not shiny), untrussed bird, no sauce poured over. Also flag: attribution discrepancy between cook's research ("Hone Kitchen") and seed data ("Thomas Keller") — COO needs to resolve.
**Why:** The most common roast chicken photography failure is a pale or shiny bird that looks underdone. The doneness cue is the skin colour — it must read as "deep golden-brown, clearly done" or the image undermines the recipe.
**What's done:** `docs/coo/photography/image-briefs/roast-chicken.md` — 4 prompts (hero, dry-brined raw, butter-under-skin technique, golden-out-of-oven). Cook validation checklist included. Existing hero URL `photo-1598103442097-8b74394b95c8` marked as CANDIDATE — Patrick inspects visually first.
**What's needed:** Same pipeline as Smash Burger. Patrick generates → cook validates per checklist → Photography Director updates ledger.
**Files touched:** `docs/coo/photography/image-briefs/roast-chicken.md`, `docs/coo/visual-assets-ledger.md`
**Blocks:** Engineer integration of Roast Chicken images.
**Bonus flag for COO:** Roast Chicken attribution discrepancy — seed-recipes.ts says Thomas Keller (*Bouchon*). Culinary research file says "Hone Kitchen." These must be aligned before ship.

---

### HANDOFF → Culinary & Cultural Verifier · 2026-05-11 · OPEN (Carbonara image accuracy validation — brief ready, images pending)
**From:** Photography Director
**Subject:** Carbonara image brief is complete (4 prompts written). Once Patrick generates images, send to cook for accuracy validation — specifically: sauce colour (golden, NOT white), guanciale appearance (cubes, not strips), combine step (off heat, sauce forming not scrambled).
**Why:** The most common carbonara photography error is showing cream sauce. The cook's "no cream, ever" tagline is meaningless if the image shows a white sauce. This is a Golden Rule 5 violation if it slips through.
**What's done:** `docs/coo/photography/image-briefs/carbonara.md` — 4 prompts with detailed accuracy requirements, rejection criteria, and per-image cook validation checklist.
**What's needed:**
1. Patrick generates images from the 4 prompts.
2. **Existing hero URL check first:** `photo-1612874742237-6526221588e3` — Patrick views this URL and checks against the hero checklist. If it passes: approved. If not: use the AI-generated hero.
3. Cook runs the validation checklist in the brief for each candidate.
4. Photography Director updates the ledger on approval or iterates on rejection.
**Files touched:** `docs/coo/photography/image-briefs/carbonara.md`, `docs/coo/visual-assets-ledger.md`
**Blocks:** Engineer integration of Carbonara images.

---

### HANDOFF → Culinary & Cultural Verifier · 2026-05-11 · OPEN (Smash Burger image accuracy validation)
**From:** Photography Director
**Subject:** 2 of 6 Smash Burger images generated by Patrick (Gemini) and now LIVE in the app. Cook signoff needed before these can be marked INTEGRATED.
**Why:** DECISION-014 — cook accuracy validation is the gate. Images are in the app but carry CANDIDATE status until cook confirms they match the recipe.
**What's done:**
- `docs/coo/photography/image-briefs/smash-burger.md` — full working brief, 6 prompts, cook validation checklist.
- **step-s1-mise** (`mobile/assets/recipes/smash-burger-mise.jpg`) — overhead mise en place: brioche bun, two beef balls, American cheese, pickles, onion, shredded iceberg lettuce, condiments, baking paper. Wired into step s1 `photo_url`. Status: CANDIDATE.
- **step-s3-smash** (`mobile/assets/recipes/smash-burger-smash.jpg`) — cast iron on induction, spatula pressing through baking paper, steam rising. Wired into step s3 `photo_url`. Status: CANDIDATE.
- 4 remaining stages (hero, step-s4-crust, step-s4-cheese, step-s5-bun) still PENDING — prompts ready in the brief.
**What's needed:**
1. Cook opens each image and checks against the validation checklist in `image-briefs/smash-burger.md`.
2. **step-s1-mise checklist:** single patty worth of beef (two balls for 2 servings base), no double-patty stack, iceberg lettuce visible and shredded (not whole leaves), brioche bun not sesame, baking paper square present, no extras not in the recipe (no tomato, no egg).
3. **step-s3-smash checklist:** cast iron pan, baking paper between spatula and patty, spatula pressing straight down (not angled), aggressive steam visible, induction or gas hob (no electric coil), no gloves or theatrical staging.
4. Cook returns APPROVED or REJECTED with specific reason. Photography Director updates ledger.
5. Patrick still needs to generate the remaining 4 images using prompts in the brief.
**Files touched:** `docs/coo/photography/image-briefs/smash-burger.md`, `docs/coo/visual-assets-ledger.md`, `mobile/assets/recipes/`
**Blocks:** Moving step-s1-mise and step-s3-smash to INTEGRATED status in ledger. Remaining 4 images pending generation.

---

### HANDOFF → Photography Director · 2026-05-10 · IN PROGRESS (DECISION-014 — source AI / stock images for 16 launch recipes)
**Progress update 2026-05-12:** 3 of 16 recipe image briefs complete. Smash Burger: 2 Gemini images (mise + smash action) generated by Patrick, committed to `mobile/assets/recipes/`, and wired into seed-recipes.ts — awaiting cook signoff to move CANDIDATE → APPROVED. Carbonara and Roast Chicken: prompts written, images not yet generated. Remaining 13 recipe briefs not yet started. Visual-assets-ledger.md live as master provenance tracker.
**From:** Patrick (via COO)
**Subject:** Per DECISION-014, AI and CC-licensed stock images are now permitted as temporary placeholders. Source hero + stage images for all 16 launch recipes. Accuracy is the gate.
**Why:** Patrick can't shoot real photography for an indeterminate stretch. The launch can't wait. He has formally rescinded the AI/stock ban (DECISION-014). Your role expands to include AI generation and CC stock curation alongside the long-term goal of real photography. Real photos eventually replace these recipe by recipe post-launch.

**Scope — 16 launch recipes:** Roast Chicken, Spaghetti Bolognese, Spaghetti Carbonara, Butter Chicken, Smash Burger, Thai Green Curry, Chicken Schnitzel, Beef Lasagne, Roast Lamb with Rosemary & Garlic, Fish & Chips, Pan-Fried Fish (Barramundi or Falafel — confirm with cook which stuck), Pavlova, Chicken Shawarma, Hummus, Pad Thai, Flour Tortillas (Patrick's recipe).

**Per recipe deliver:**
- **1 hero image** — finished dish, plated, character matches the recipe (rustic vs polished, dark vs light surface, cuisine-appropriate garnish).
- **Stage images for visual-worthy steps** — typically 3–6 per recipe. NOT every step — only ones where the user benefits from seeing what's happening (e.g., "onion translucent and stopped squeaking," "sauce coats the back of a spoon," "smash burger crust formed before flip"). Use the cook's doneness cues in `docs/coo/culinary-research/<recipe>.md` to decide which stages get an image.

**~7–8 images per recipe × 16 = ~120 images.**

**Deep-research requirement (Patrick's non-negotiable):**

Before generating or curating any image:
1. **Read the cook's research file end-to-end.** Her doneness cues, technique notes, and failure modes tell you what the right visual state actually looks like.
2. **Pull authoritative chef references** from credible sources (Andy Cooks, ATK, Yotam Ottolenghi, J. Kenji López-Alt, the named chefs in the cook's brief — Marco Pierre White, Adam Liaw, Reem Kassis, etc.). These inform your understanding — **do NOT generate copies of any chef's photographed work**, that's copyright theft. Reference, then generate from your own understanding informed by the references.
3. **Write prompts with technical detail.** Vague prompts get generic results. Example: *"Spaghetti carbonara, silky pale-yellow sauce coating the pasta, crisped guanciale pieces visible, freshly grated pecorino dust on top, fork twirling a small portion, dark slate surface, soft side light, shot from 30° angle."*
4. **Generate multiple variants.** Iterate until accuracy is right.
5. **Run accuracy validation past the cook.** Send candidates per recipe; she signs off on which are technically correct or rejects with specific notes ("the sauce is too cream-heavy — that's the American version, not the Roman one, re-prompt"). Cook's eye is the bar.
6. **Maintain library coherence.** Every image should feel like part of the same cookbook — same lighting language, same surface family (dark slate / dark wood for most; light cream for breads if it suits), same camera-angle vocabulary. A Pinterest-scrap-heap library reads as cheap.

**Tools (use the right one for each dish):**
- **AI:** Imagen 3, DALL-E 3, Flux, or Midjourney V6. Commercial-use rights: DALL-E 3 allows commercial use, Midjourney requires paid sub, Imagen 3 via paid tier, Flux is open-source. Pick best output per dish.
- **CC stock:** Unsplash, Pexels, Wikimedia Commons. Attribution required per license — captured in ledger.
- **Avoid:** free/cheap services, DALL-E 2 — output quality is what separates "premium app" from "content farm."

**Asset ledger:** Create `docs/coo/visual-assets-ledger.md`. One row per image:
- Recipe slug · Stage (hero / step N) · Source (AI tool OR stock site + photographer) · Prompt summary or URL · License · Commercial use OK · Cook accuracy signoff date · Patrick replacement date (blank until he shoots own)

**Engineer integration:** Once cook signs off, engineer reads the ledger and migrates images into `seed-recipes.ts` via existing `photo_url` field on Recipe and step objects. May need new optional `image_source` field for on-device credit display.

**Sequencing:**
1. Start with **Smash Burger** — well-documented, fast feedback loop. Patrick reviews.
2. If Smash Burger lands cleanly, do **Spaghetti Carbonara** + **Roast Chicken** — high-frequency recipes, users see them first.
3. Then the remaining 13 at your pace.
4. **Don't try all 16 in one session** — sustained workstream over a week or so.

**Cost:** ~1 session per 2–3 recipes for the deep-research + generate + cook-validation loop. So roughly 6–8 sessions across a week to complete all 16.

**Blocks:** v1.0 launch visual story. Without this work, launch ships on gradient placeholders.

**Files touched:** `docs/coo/visual-assets-ledger.md` (new), `docs/coo/photography/` (working notes), eventual handoff to Engineer with image files/URLs for `seed-recipes.ts` integration.

---

### HANDOFF → COO · 2026-05-10 · IN PROGRESS (build #105 — Kitchen Editorial redesign + gold accent introduced)
**From:** Senior Engineer
**Subject:** Build #105 dispatched on commit `b6d0c70`. Per R-015 — shipped, awaiting Patrick on-device validation. Not self-closing.

**Token change note for the audit trail:**
The COO handoff specified migrating `tokens.gold` from `#C9A84C` to `#F2CC2A`. The codebase did **not** have a `gold` token previously — closest neighbours were `ochre` (`#C07038`, mise en place zone) and `amber` (`#1E1408` dark amber tint). No callers of `tokens.gold` existed anywhere in the mobile tree. So this commit **adds the token fresh** rather than migrating one. There is nothing to regression-scan because there were no prior callers.

```
gold:    '#F2CC2A',
goldDim: 'rgba(242,204,42,0.15)',
```

**Implementation per Designer spec:**
1. Header — day-of-week + period (`dayTimeLabel(new Date())`) above 'hone.' wordmark in Playfair 30sp; period rendered with `tokens.gold`. Avatar circle (32dp) on the right with the user initial 'P'.
2. Search — surface bg, `borderWidth: 1.5, borderColor: tokens.gold`, ingredient search behaviour preserved.
3. Hero card — 178dp, full-width, 20px radius. Picks the first planned recipe → `Tonight` gold badge + `Cook →` rust CTA. Otherwise picks the top of the active filter → cuisine name badge + `Plan +` CTA. Gradient overlay over the recipe's `hero_fallback` bands (no expo-image dependency in the hero so it always renders).
4. Category tiles — `Browse by cuisine` label, then horizontal scroll of 9 tiles (All + Levantine, Indian, Japanese, Italian, Malaysian, Thai, French, Australian — Designer-locked order). Tiles hide if no recipe in the active roster carries that cuisine. Active tile: solid gold fill + dark label. 62dp width.
5. Recipe rows — `(tabs)/index.tsx` now renders rows instead of cards. 58×58 thumbnail (gradient bands + emoji), gold cuisine tag (uppercase 9sp), Playfair title 14sp 700, meta strip (chef · time · difficulty in muted ink), Planned badge in gold-dim, chevron right.

**Removed (intentional):**
- Mode chips (All / Quick / Weekend / Favourites / Yours). Editorial spec is cuisine-only filtering. If you want quick/weekend/favourites back as a separate surface, that's a follow-up.
- 'Cooking tonight' amber banner — superseded by the hero card's 'Tonight' badge.
- Old 'What are you cooking tonight?' hero text — replaced by wordmark + day/time line.

**Visual regression scan:**
- Searched for `tokens.gold` callers across `mobile/`: zero. The new token has no upstream legacy.
- `ochre`, `amber`, `primary`, `sage` callers untouched — those tokens did not change colour.
- The Editorial direction does not yet apply to other tabs (Pantry, Shop, Plan, recipe detail). Those screens will continue rendering with their existing palette. If Patrick wants the gold accent rolled into the recipe detail eyebrow or anywhere else, that's a separate pass.

**Colour clashes to flag:** none observed in static review. The new gold reads cleanly on `tokens.cream` (card surface) and against `tokens.bg` (screen). The dark text on solid gold (`#0F1A14` literal in the active tile and goldDim badges via `tokens.gold` text) gives high contrast for the active state. Will verify on-device.

**On-device validation Patrick should walk:**
1. Open Kitchen → header reads day + time + 'hone.' with a gold period; avatar 'P' top right.
2. Search bar has a thin gold border.
3. Hero card: if a recipe is planned, hero is that recipe with 'Tonight' gold badge and 'Cook →' rust pill. If nothing is planned, hero is the top of the All filter with cuisine name as badge and 'Plan +' rust pill.
4. Tap a category tile (e.g. Italian) → it fills with solid gold; the recipe rows below filter to that cuisine. Tap All to clear.
5. Recipe rows are tight 58×58-thumb + cuisine-tag + title + meta. Ingredient search still narrows the list.
6. Tap any row or the hero → recipe detail opens as before.

**Files touched (2):** `mobile/src/theme/tokens.ts`, `mobile/app/(tabs)/index.tsx`.

**Status:** **shipped, awaiting Patrick on-device validation** per R-015. Not self-closing.

---

### HANDOFF → COO · 2026-05-10 · IN PROGRESS (build #104 — shop tick mirrors to pantry, carousel match counter updates)
**From:** Senior Engineer
**Subject:** Build #104 dispatched on commit `d52397f`. Per R-015 — shipped, awaiting Patrick on-device validation. Not self-closing.

**Diagnosis matched the COO hypothesis exactly:**
1. `handleToggleInCart` in `shop.tsx` only toggled `in_cart` on the shopping row — no side-effect into pantry.
2. Pantry tab's `useFocusEffect` re-fetched shopping items but not pantry items, so even if the DB were updated, the carousel stayed stale on tab return.
3. Match counters are derived from `pantryItems` state correctly — they just never saw the new ingredient.

**Fix (3 files, 1 commit):**
- `mobile/app/(tabs)/shop.tsx` — `handleToggleInCart` now also `upsertPantryItem(db, { ..., have_it: willBeInCart })`. Tick adds to pantry; untick clears `have_it` (we set false rather than delete so quantity/unit/category set elsewhere isn't clobbered, and so the pantry catalog stays whole for `initializePantryItems`' purposes).
- `mobile/src/data/pantry-helpers.ts` — `pantryId` exported (was file-private). shop.tsx needs to compute the same id so an existing pantry row is hit on UPSERT instead of a duplicate created.
- `mobile/app/(tabs)/pantry.tsx` — `useFocusEffect` now `Promise.all`s `getShoppingItems` + `getPantryItems`. Carousel match counters recompute via the existing `useMemo` on `pantryItems`.

**On-device validation Patrick should walk:**
1. Open a recipe with missing ingredients (e.g. Smash Burger when pantry is empty).
2. Tap a chip on the recipe to add the ingredient to the shopping list.
3. Go to Shop tab. Tick the item.
4. Return to Pantry tab. The recipe-match counter on the carousel for that recipe should now show that ingredient as matched, and the count should be one higher than before.
5. Go back to Shop tab. Untick the item.
6. Return to Pantry tab. The counter should drop back.

**Files touched:** 3 — `mobile/app/(tabs)/shop.tsx`, `mobile/app/(tabs)/pantry.tsx`, `mobile/src/data/pantry-helpers.ts`.

**Status:** **shipped, awaiting Patrick on-device validation** per R-015. Not self-closing.

---

### HANDOFF → COO · 2026-05-10 · IN PROGRESS (build #103 — R-016 root-cause fix + 3 prior items cumulative)
**From:** Senior Engineer
**Subject:** Build #103 dispatched on commit `d974880`. R-016 (the 4×-recurring "46 recipes coming back") root-caused and architecturally fixed. Per R-015 — shipped, awaiting Patrick on-device validation. Not self-closing.

**Root cause of the regression:**

The `not_yet_shipping` flag lived only in memory on each Recipe const. It was in the Zod schema and on each in-memory recipe, but **never persisted to SQLite** — no column, no INSERT, no rowToRecipe mapping, no UPDATE in `refreshSeedRecipeFields`. Every launch the DB read returned all 46 recipes with `r.not_yet_shipping === undefined`, the JS-side filter `!r.not_yet_shipping` evaluated `true` for every row, Kitchen showed all 46. Earlier "fixes" all touched the in-memory seed array — the data never reached SQLite.

**Architectural fix instead of another patch:**

1. `seed-recipes.ts` split at the source. `SEED_RECIPES` is exactly 16 launch recipes — the only array the seeder consumes. `SEED_RECIPES_HOLDING` holds the 30 (defined, never inserted). To promote one later: move its name from HOLDING into SEED_RECIPES.
2. `pruneOrphanedSeedRecipes(db)` runs every launch in `setupDatabase`. Deletes any seeded row whose id is no longer in `SEED_RECIPES`. Cleans up Patrick's existing install where the 30 holding rows still sit in SQLite from earlier seeds. ON DELETE CASCADE handles meal_plan / favorites / ingredient_swaps.
3. `getActiveRecipes` collapsed to an alias for `getAllRecipes` — the old filter was always a no-op at runtime. Kept the name so the 2 callers (Kitchen, Pantry) don't need to be touched.
4. `smokeAlarmSeedCount(db)` dev-only tripwire. After seed/sync/refresh/prune, if seeded-row count != `SEED_RECIPES.length`, `console.error` with the offending ids. Production APK silent.

**Cumulative state in build #103:**
- Item 1 (chip removal) — already in #100 (`9f53396`)
- Item 2 (Designer v2.2 polish) — already in #102 (`e663cfd`)
- Item 3 (Cook's 5 fixes) — already in #101 (`7be6b3b`)
- Item 4 (R-016 root-cause fix) — **this commit** (`d974880`, build #103)

Patrick should install build #103 — it's cumulative HEAD of main.

**On-device validation:**
1. Open Kitchen → exactly 16 cards. Force-close, reopen → still 16. **The "creep back" is gone.**
2. Open Pantry → "What I have" matching only considers the 16.
3. Deep-link to Smash Burger / Carbonara / Roast Chicken / Hummus / Flour Tortillas / Falafel still works.
4. Sanity: any meal-plan entries you set on a holding recipe (very unlikely since they were never browseable) will be cascade-deleted by the prune. Verify on-device.

**Files touched (4):** `mobile/src/data/seed-recipes.ts`, `mobile/db/seed.ts`, `mobile/db/database.ts`, `mobile/app/_layout.tsx`.

**Status:** **shipped, awaiting Patrick on-device validation** per R-015. Not self-closing.

---

### HANDOFF → Senior Engineer · 2026-05-10 · OPEN (Kitchen screen redesign — Editorial direction)
**From:** Product Designer
**Subject:** Redesign the Kitchen browse screen to the locked Editorial direction
**Why:** Patrick approved the Editorial layout, category tile design, gold search border, and updated gold token. This replaces the current Kitchen screen layout entirely.

**What's done:**
- Full prototype at `docs/prototypes/kitchen-editorial-v1.html` — two states (All / Levantine filtered), bottom nav, all components
- Colourway exploration at `docs/prototypes/kitchen-colourways.html` (reference only — dark sage direction confirmed)

**Locked design decisions:**

1. **Gold token updated** — `#F2CC2A` replaces `#C9A84C` throughout. Update `tokens.ts` first; everything downstream inherits it.

2. **Wordmark header** — Replace current screen title with:
   - Small day/time context line above: derive from `new Date()`, format as `{dayName} {morning/afternoon/evening}`
   - `hone.` in Playfair Display 900, lowercase, 30sp. The period is `#F2CC2A`.
   - User avatar (initial) top-right, 32dp circle, `surface2` fill

3. **Gold search border** — Search bar: `border: 1.5px solid #F2CC2A` (solid). Background stays `surface`.

4. **Category tiles** (replaces current horizontal chip row):
   - Scrollable row, each tile 62dp wide, `surface` bg, `borderRadius: 14`
   - Emoji (20sp) stacked above cuisine label (9sp, `ink2`)
   - Section label above: "Browse by cuisine" 11sp uppercase `ink2`
   - **Active: solid `#F2CC2A` fill + border, label `#0F1A14` weight 600**
   - Order: All · Levantine · Indian · Japanese · Italian · Malaysian · Thai · French · Australian
   - Tapping filters the recipe list to that cuisine

5. **Hero card** — full-width, `borderRadius: 20`, height 178dp, above category row:
   - Tonight's planned recipe if one exists; otherwise top recipe in active filter
   - Gradient overlay top→bottom (transparent to 88% dark)
   - Badge top-right: "Tonight" or cuisine name
   - Bottom: gold cuisine tag → Playfair title 19sp → chef · time strip + rust CTA pill

6. **Recipe list rows** (replaces card grid):
   - Full-width rows, `surface` bg, `borderRadius: 14`, `border: 1px solid line`
   - 58×58dp thumbnail left, `borderRadius: 10`
   - Gold cuisine tag (9sp uppercase) → Playfair title (14sp 700) → meta (chef · time · difficulty, `ink3`)
   - Chevron right. Planned badge: gold-dim. Pantry match: sage-dim.

7. **Section header** above list: recipe count right-aligned `ink3`.

**Files touched:** `mobile/src/constants/tokens.ts`, `mobile/app/(tabs)/index.tsx`, new components in `mobile/src/components/`

**Prototype:** `docs/prototypes/kitchen-editorial-v1.html`

**Blocks:** COO to sequence. `tokens.gold` change will propagate everywhere — verify no regressions on other screens before shipping.

---

### HANDOFF → Senior Engineer · 2026-05-09 · OPEN URGENT (build #100 — three items, one build)
**From:** Patrick (via COO)
**Subject:** Three items Patrick wants in the next build, all small, all queued. Bundle into one commit / one build.
**Why:** Patrick installed #99, portion sizing now actually shows on-device (good), but two things he's asked for previously haven't been actioned yet, plus the cook just shipped a content-disparity fix. Group them into build #100.

**What's needed:**

1. **Remove the "Scaled Nx up" chip from the recipe screen.** It still shows on-device after picking a non-default count (e.g., "Scaled 1.3x up"). The chip is meaningless — user has no baseline to compare to. The +/− stepper and the "Makes N burgers" copy already convey everything needed. Strip the chip from `mobile/app/recipe/[id].tsx` (or wherever it renders). ~5 minutes.

2. **Implement the Designer's v2.2 visual polish** per the existing handoff below ("scaling control visual polish — implement v2.2 design"). Centre cell resize to 52×40px, stack number + unit label vertically, dimmed +/− on min/max with pointerEvents:none, conditional render of extra-for-tomorrow row. Reference `docs/prototypes/recipe-detail-v2.2.html` for measurements. Designer's mockup has been waiting; ship it now. ~half a session.

3. **Apply the cook's 5-recipe content fixes** per the existing handoff below ("scaling-disparity fix"). Five recipes (SMASH_BURGER, PASTA_CARBONARA, BUTTER_CHICKEN, CHICKEN_SCHNITZEL, FLOUR_TORTILLAS) need their step content / mise text updated to remove hardcoded ingredient quantities so step copy stops lying when the user scales. Exact replacements listed in that handoff. ~30 minutes.

**Validation gate per R-015:**
- `npx tsc --noEmit` clean
- `tail -c 200` of every modified file confirms clean end of byte stream
- Engineer does NOT declare done — declares "shipped to main, awaiting Patrick on-device validation"
- Build log entry written for #100 in the table at the top of this file (per R-015 build-note rule)

**Files touched:** `mobile/app/recipe/[id].tsx` (chip removal + v2.2 wiring), `mobile/src/components/ServingsSelector.tsx` (v2.2 visual), `mobile/src/data/seed-recipes.ts` (cook's 5 recipe content fixes).

**Cost:** ~1 session combined.
**Blocks:** Patrick installing build #100 and walking the validation list.

---

### HANDOFF → Senior Engineer · 2026-05-09 · OPEN (scaling-disparity fix — remove hardcoded quantities from step content in seed-recipes.ts)
**From:** COO (Culinary Research)
**Subject:** Five recipes in seed-recipes.ts have hardcoded ingredient quantities in step `content` or `mise` fields that don't scale when the user changes serving count. Research files have been corrected — engineer applies the fixes to seed-recipes.ts.
**Why:** Step content with "Combine 200g flour..." still shows 200g at 3× scale. The ingredient list scales correctly; the step text doesn't. This is a UX lie — the user sees a scaled ingredient list, then reads a step telling them the unscaled amount.

**What's needed — exact changes to seed-recipes.ts:**

1. **SMASH_BURGER** — Step "Ball and season" `content`:
   - REMOVE: `"Divide the beef into 100g balls per patty."`
   - REPLACE WITH: `"Divide the beef into one ball per patty. Don't pack it — a loose ball smashes better than a dense one. Season the outside of each ball directly in the pan immediately before smashing, not before."`

2. **PASTA_CARBONARA** — Step "Cook pasta" `content` (whichever step reserves pasta water):
   - REMOVE: `"Reserve 200ml of pasta water before draining."`
   - REPLACE WITH: `"Reserve a generous ladleful of pasta water before draining."`

3. **BUTTER_CHICKEN** — Step "Marinate the chicken" `content` AND matching mise:
   - REMOVE all inline quantities: `"Mix yoghurt, lemon juice, 4 crushed garlic cloves, half the grated ginger, kashmiri chilli, 1 tsp garam masala, cumin, coriander, turmeric, and 1 tsp salt into a paste."`
   - REPLACE WITH: `"Combine all marinade ingredients into a paste — the yoghurt, lemon juice, crushed garlic, half the grated ginger, and all the marinade spices."`

4. **CHICKEN_SCHNITZEL** — Mise `content` (breading station setup):
   - REMOVE: `"Dish 2: 2 beaten eggs"`
   - REPLACE WITH: `"Dish 2: the beaten eggs"`
   Also Step 0 brine `content` (if present):
   - REMOVE: `"Dissolve the salt in 1 L of cold water."`
   - REPLACE WITH: `"Dissolve the salt in enough cold water to fully submerge the chicken."`

5. **FLOUR_TORTILLAS** — Step "Divide and rest" `content` AND matching mise:
   - REMOVE: `"Divide the dough into 13 pieces of ~30g each."` (or similar with "13")
   - REPLACE WITH: `"Divide the dough into one piece per tortilla, each roughly 40g."`

**Recipes confirmed CLEAN (no changes needed):** WEEKDAY_BOLOGNESE, THAI_GREEN_CURRY, BEEF_LASAGNE, ROAST_CHICKEN, ROAST_LAMB, FISH_AND_CHIPS, PAVLOVA, HUMMUS, PAD_THAI, FALAFEL, CHICKEN_SHAWARMA. All number references in these are temperatures, times, or cut sizes — not ingredient quantities.

**Files touched:** `mobile/src/data/seed-recipes.ts` (5 recipe consts)
**Reference files:** See engineer-fix notes at the bottom of each corresponding research file in `docs/coo/culinary-research/`

**Blocks:** Content accuracy guarantee for all 16 launch recipes at any serving count.

---

### HANDOFF → Senior Engineer · 2026-05-09 · OPEN (scaling control visual polish — implement v2.2 design)
**From:** Product Designer
**Subject:** Visual polish pass for the per-recipe scaling control — wire in the v2.2 design spec on top of the functional build shipped in `ce3ff2b`
**Why:** Per Patrick's direction, Engineer shipped the functional unit-aware scaling control first. This handoff closes the parallel design track — v2.2 prototype is done and delivers the visual treatment the functional build doesn't yet have.

**What's done:**
- `docs/prototypes/recipe-detail-v2.2.html` — full interactive prototype with:
  - 5 component states (person / burger / loaf / cup / tortilla) in singular and plural
  - Centre cell resized to 52×40px (was 28×32px) to accommodate stacked number + unit label
  - Number sits above the unit label; unit label in `var(--text-secondary)` at 11px
  - 3 interactive in-context demos (Carbonara / Smash Burger / Sourdough) with live ingredient scaling
  - 4 button states: normal, min (− dimmed at 0.28 opacity + `pointerEvents: none`), max (+ dimmed), with hint
  - "Make extra for tomorrow" reads recipe-specific `extra_for_tomorrow_label`; falls back to generic hint when absent
  - Conditional rendering: entire extra-for-tomorrow row omits when field is absent — no broken UI on old seed recipes

**What's needed:**

1. **Resize the centre cell** on `ServingsSelector.tsx` from its current dimensions to `width: 52px, height: 40px`. Stack number and unit label vertically (`flexDirection: 'column', alignItems: 'center', justifyContent: 'center'`).
2. **Unit label row**: `fontFamily: fonts.sans, fontSize: 11, color: tokens.textSecondary, marginTop: 2`. Reads the derived unit string (`output_unit_plural ?? output_unit + 's'` or `"people"` for serve-unit recipes).
3. **Disabled-state spec**: `opacity: 0.28` + `pointerEvents: 'none'` on − when `count === 1`; same on + when `count === output_max` (if `output_max` is absent, no upper clamp).
4. **Extra-for-tomorrow row**: if `extra_for_tomorrow_label` is present on the recipe, render it verbatim. If absent, keep current generic fallback. If no `extra_for_tomorrow_label` AND no generic concept applies, omit the row entirely.
5. Reference `docs/prototypes/recipe-detail-v2.2.html` for all visual measurements. All tokens already exist in v0.7 — no new token additions required.

**Files touched:** `mobile/app/recipe/[id].tsx` (ServingsSelector usage), `mobile/src/components/ServingsSelector.tsx`

**Blocks:** v0.6.x polish milestone. Functional build is already live — this is cosmetic only, non-blocking for Patrick's on-device validation of build #96.

---

### HANDOFF → Patrick · 2026-05-08 · ON-DEVICE VALIDATION (build #96 — DECISION-014 portion-sizing live)
**From:** Senior Engineer
**Subject:** Per-recipe units shipped on `ce3ff2b`. v0.6.0 milestone work landed. Build #96 dispatched on Patrick's go.

**Commit:** `ce3ff2b` — DECISION-014 per-recipe portion units (4 launch-only files: types.ts, seed-recipes.ts, ServingsSelector.tsx, recipe/[id].tsx, RecipeCard.tsx)

**State after this commit:**
- Schema has 4 new optional fields: `output_unit`, `output_unit_plural`, `output_default`, `extra_for_tomorrow_label`. All `.optional()` — non-launch recipes untouched.
- 16 launch recipes carry their unit data verbatim from cook's `launch-recipe-units.md`.
- ServingsSelector renders "Makes 4 burgers" / "Serves 4 people" / "Makes 1 loaf" / "Makes 13 tortillas" / "Makes 2 cups" depending on the recipe.
- RecipeCard chip on the Kitchen screen reads "4 burgers" / "1 chicken" / "8 tortillas" instead of bare "4".
- Default count on recipe-open uses `output_default ?? base_servings`.
- "Make extra for tomorrow" reads recipe-specific label when authored, falls back to generic leftover hint when not.

**On-device checklist Patrick should walk:**
1. **Smash Burger** opens at "4 burgers" (not "4 people"). Stepper increments: "1 burger / 2 burgers / 3 burgers". Right side reads "Makes 4 burgers".
2. **Roast Chicken** opens at "1 chicken". Stepper goes 1 → 2 (capped UI side at 20 by the existing stepper guards). Right side reads "Makes 1 chicken".
3. **Hummus** opens at "2 cups". Stepper increments cups. Right side reads "Makes 2 cups".
4. **Flour Tortillas** opens at "13 tortillas". Right side reads "Makes 13 tortillas".
5. **Pasta Carbonara** opens at "4 serves". Right side reads "Serves 4 serves" — note: this reads slightly oddly because the unit is "serve" and the prefix becomes "Serves", giving "Serves 4 serves". If you want this to read "Serves 4 people" we'll need to set `output_unit_plural: "people"` on those recipes (or special-case the "serve" unit). Flag this if it bothers you and we'll tighten in a follow-up.
6. Tap a non-tonight leftover mode (lunch / 3-day / week). On Smash Burger the hint reads "Make only what you'll eat — smash burgers don't reheat once the crust softens" instead of the generic "+1 portion per person — tomorrow's lunch sorted." Verify recipe-specific labels surface correctly on butter chicken, bolognese, hummus.
7. **Kitchen browse cards**: each card's meta chip should show the unit ("4 burgers", "1 chicken") instead of just "4".
8. **Non-launch recipes** (e.g., open via deep link to `chicken-adobo`): should fall back to legacy "people / portions" rendering, no errors.

**Designer parallel handoff:** still open below. Designer is producing the visual treatment for the new scaling control. This shipped commit is the functional version per Patrick's "ship functional first" direction. Visual polish lands as a follow-up commit.

**Issue that needs your call:** the "Serves 4 serves" oddity above. Three options:
- (a) Special-case unit==='serve' to render right-side caption as "people" (so it reads "Serves 4 people"). Cleanest UX but a magic string in the UI.
- (b) Update each cook-spec recipe's `output_unit_plural` to "people" for the serve-unit recipes (so it reads "Serves 4 people"). Data-driven.
- (c) Leave as-is. "Serves 4 serves" is grammatically valid even if it reads odd.

I recommend (a) — it's a 2-line code change and keeps the cook's spec verbatim. Confirm preference and I'll ship it as a small follow-on.

**Per CLAUDE.md:** GitHub issue NOT closed. Patrick validates on-device and closes himself.

---

### HANDOFF → Senior Engineer · 2026-05-08 · DONE ✅ (portion-sizing redesign — recipe-aware units per Cook's spec)
**Closed by Senior Engineer 2026-05-08 in commit `ce3ff2b`.** All five sub-tasks landed:
- Schema additions (4 fields, all optional)
- 16 launch recipes migrated from cook's launch-recipe-units.md
- ServingsSelector rebuilt with recipe-aware copy + recipe-aware mode hint
- recipe/[id].tsx wires the new props + uses output_default for first-render count
- RecipeCard meta chip on Kitchen surface uses the per-recipe unit

Backwards-compatible: non-launch recipes fall back to legacy "people / portions" rendering. tsc clean. Brace/paren balance 0.

### Original handoff (preserved for audit) → Senior Engineer · 2026-05-08 · OPEN URGENT (portion-sizing redesign — recipe-aware units per Cook's spec)
**From:** Patrick (via COO)
**Subject:** Replace the generic "Servings = N people" scaling model with per-recipe units (burger / loaf / cup / person / item) per Cook's `launch-recipe-units.md`
**Why:** The current scaling math is wrong because it treats every recipe as if "servings" means "people." Burgers are per-person, hummus is by cup, sourdough is one loaf regardless, tortillas are per-tortilla. Cook has authored the per-recipe unit spec at `docs/coo/culinary-research/launch-recipe-units.md` — engineer needs to wire it into the schema and the scaling UI. Cook owns the chef knowledge; engineer owns the math that respects it (per DECISION-007).

**What's needed:**

1. **Schema additions** to `mobile/src/data/types.ts` Recipe Zod schema. Additive only:
   - `output_unit: z.string()` — e.g., `"burger"`, `"loaf"`, `"cup"`, `"person"`, `"tortilla"`, `"piece"`, `"batch"`
   - `output_unit_plural: z.string().optional()` — e.g., `"burgers"`, `"loaves"`, `"cups"`, `"people"`, `"tortillas"`. If omitted, default to `output_unit + "s"`.
   - `output_default: z.number().int().positive()` — sensible default count for one batch (e.g., 4 burgers, 1 loaf, 8 tortillas, 4 people)
   - `extra_for_tomorrow_label: z.string().optional()` — what tapping "Make extra for tomorrow" actually does for THIS recipe (e.g., `"+1 extra burger"`, `"Double the batch"`, `"+4 extra tortillas"`). If omitted, default to `+1 ${output_unit}`.

2. **Migrate the 16 launch recipes' values from Cook's spec.** Read `docs/coo/culinary-research/launch-recipe-units.md`, populate the four new fields per recipe in `seed-recipes.ts`. The 29 not-yet-shipping recipes can stay with sensible defaults for now; cook handles them in v1.1.

3. **Rebuild the scaling control on `mobile/app/recipe/[id].tsx`.** Replace "Servings: 4" with `"Makes ${count} ${output_unit_plural}"` (or `"Serves ${count} ${output_unit_plural}"` when `output_unit === "person"`). The +/− stepper adjusts count, ingredients re-scale per existing `scales` flag + `scaling_note`. UI label updates dynamically: "Makes 4 burgers" → "Makes 6 burgers" → "Makes 8 burgers."

4. **Make "Make extra for tomorrow" recipe-aware.** Read `extra_for_tomorrow_label` for the recipe; if absent, fall back to `+1 ${output_unit}`. Stop the current generic-leftover behaviour that just adds one person.

5. **Designer handoff is in flight in parallel** (separate handoff below). Coordinate with Designer on the visual treatment of the new scaling control once their mockup lands. Don't block engineering on designer — ship the functional version first; restyle in a second pass if needed.

**Files touched:** `mobile/src/data/types.ts`, `mobile/src/data/seed-recipes.ts`, `mobile/app/recipe/[id].tsx`, possibly the Pantry recipe-match-card if it shows serving info.

**Cost:** ~1 session.

**Validation gate:**
- `npx tsc --noEmit` clean
- Recipe screen shows correct unit per recipe — burger says burgers, sourdough says loaf, hummus says cups
- Scaling math respects existing `scales` and `scaling_note` per ingredient
- "Make extra for tomorrow" produces the right delta per recipe
- All 16 launch recipes verified on-device

**Blocks:** v0.6.0 milestone (per DECISION-012, v0.6.0 marks "portion-sizing redesign live").

---

### HANDOFF → Product Designer · 2026-05-08 · DONE ✅ (portion-sizing visual treatment — new scaling control)
**Closed by Product Designer 2026-05-09 — `docs/prototypes/recipe-detail-v2.2.html` delivered. Implementation handoff issued above (→ Senior Engineer · 2026-05-09).**

**From:** Patrick (via COO)
**Subject:** Design the new per-recipe scaling control to display the right unit per recipe ("Makes 4 burgers" / "Makes 1 loaf" / "Serves 4 people")
**Why:** The current "Servings = 4" component on the recipe-detail screen treats every recipe identically. Engineer is migrating the schema and logic per Cook's spec; you need to design how the new scaling reads on-screen.

**What's needed:**

1. Update or extend `docs/prototypes/recipe-detail-v2.html` (or a new `recipe-detail-v2.2.html`) showing the scaling control across these recipe types:
   - **Person-scaled** ("Serves 4 people" — bolognese, butter chicken, carbonara, lamb)
   - **Item-scaled** ("Makes 4 burgers" — smash burger, schnitzel)
   - **Loaf-scaled** ("Makes 1 loaf" — sourdough)
   - **Cup/batch-scaled** ("Makes 2 cups" — hummus, sauces)
   - **Piece-scaled** ("Makes 8 tortillas" — flour tortillas)

2. The control still has a +/− stepper; the *label* changes per recipe.

3. The "Make extra for tomorrow" toggle/button should display the recipe-specific label (Engineer is wiring the data: `extra_for_tomorrow_label`). Show how this reads: `"+1 lunch tomorrow"` for person-scaled, `"+1 extra burger"` for burgers, `"Double the batch"` for hummus, etc.

4. **Constraint:** v0.7 dark sage tokens locked. No visual direction change — same surfaces, same gold accent, same Inter/Playfair type. Just relabel the control honestly.

5. Engineer handoff block at the bottom of the prototype — implementation notes, conditional rendering rules, accessibility labels.

**Files touched:** `docs/prototypes/recipe-detail-v2.html` (update) or `docs/prototypes/recipe-detail-v2.2.html` (new).

**Cost:** ~half a session.

**Coordination:** Engineer's handoff (above) is in flight in parallel. They will ship the functional version first; your visual treatment lands as a polish pass on top. Don't be blocked on Engineer; ship the mockup at your own pace.

**Blocks:** Engineer's polish pass on the scaling control. Functional version ships without you.

---

### HANDOFF → Patrick · 2026-05-08 · ON-DEVICE VALIDATION (build #95 — five fixes incl. v0.5.0 bump, smash-burger sauce split, Equipment redesign, CHICKEN_SHAWARMA, DECISION-013 launch scope)
**From:** Senior Engineer
**Subject:** Five-commit package on `4c4daf9`; build #95 dispatched on Patrick's go.

**Commits:**
- `08529ff` — chore(version): bump to v0.5.0 per DECISION-012
- `a03f0e1` — fix(seed): SMASH_BURGER — burger sauce split into mayo + ketchup + mustard (Patrick on-device 8 May: compound name landed as one shop-list row)
- `f8a4750` — feat(recipe): Equipment as vertical wrap pill list (was horizontal scroll). Recommended over collapsible dropdown — zero-tap, consistent with Prep section, no Android gesture conflict
- `d7c7c5a` — feat(seed): CHICKEN_SHAWARMA new recipe (replaces lamb in v1.0 launch slot per Patrick 8 May)
- `4c4daf9` — feat(seed,ui): DECISION-013 — `not_yet_shipping` flag + filter 30 non-launch recipes; FLOUR_TORTILLAS chef = 'Patrick Nasr'

**State on origin/main after this batch:**
- App version: 0.5.0
- Recipes total: 46 (added CHICKEN_SHAWARMA; LAMB_SHAWARMA stays as not_yet_shipping)
- Recipes user-visible in v1.0: 16 (the launch-16 from DECISION-013)
- Recipes with full DECISION-008 sections: 45 of 46 (sourdough-maintenance still empty by intent — placeholder renders)
- Build #95 queued: https://github.com/patrickpatches/hone/actions/runs/25532238312

**On-device checks Patrick should walk through after the APK lands:**

For DECISION-013 (launch-scope):
1. Kitchen browse — exactly 16 recipes visible. No CHICKEN_ADOBO, no FALAFEL, no KAFTA, no LAMB_SHAWARMA.
2. Search "rendang" → no results (not_yet_shipping).
3. Pantry-match — only suggests from the 16. Even if pantry contains lamb + chickpeas, lamb-shawarma and falafel won't appear.

For SMASH_BURGER:
4. Open Smash Burger → 'Plan this recipe' → switch to Shop tab. Should see three separate items: Mayonnaise, Tomato ketchup, American (yellow) mustard. NOT a single 'Burger sauce (mayo + ketchup + mustard)' row.
5. Tap Mayonnaise on the recipe screen → substitution sheet should show Kewpie + Aioli swaps.

For Equipment UX:
6. Open any recipe with Equipment populated. Should show a vertical wrap of pills, NOT a horizontal side-scroll.
7. Items wrap onto 2-3 lines naturally. Smash Burger (4 items) likely fits 1 line; Beef Wellington (7 items) wraps to 2-3.

For CHICKEN_SHAWARMA:
8. Open chicken-shawarma. Title should read 'Home Oven Chicken Shawarma'. Total time 150 min. Method has 5 steps including "Marinate (2 hours, ideally overnight)". Equipment shows 4 items. Prep shows 7 items.

For FLOUR_TORTILLAS:
9. Open Soft Buttery Flour Tortillas. Source attribution should read 'Patrick Nasr', not 'Hone Kitchen'. Notes: "Patrick's own recipe — soft, buttery, adapted over time from multiple sources."

For v0.5.0 version bump:
10. Settings (or wherever app version is displayed) should show 0.5.0 not 0.4.1.

**Per CLAUDE.md:** GitHub issues NOT closed. Patrick validates on-device and closes himself.

---

### HANDOFF → Senior Engineer · 2026-05-08 · DONE ✅ (DECISION-013 — scope build to 16 launch recipes; tag the rest)
**Closed by Senior Engineer 2026-05-08 in commit `4c4daf9`.** All five sub-tasks landed:
- Schema field `not_yet_shipping?: boolean` added to types.ts (optional, not default(false), so launch-set recipes don't need explicit declarations)
- `getActiveRecipes(db)` helper added to db/database.ts
- 30 non-launch recipes flagged (was 29 in handoff; +1 = CHICKEN_VEG_STIR_FRY which the handoff's "plus any others not in the launch 16" caught)
- Kitchen browse + Pantry match wired through getActiveRecipes
- Shop tab kept on getAllRecipes (lookup map for meal-plan source breakdowns; recipes already in plans must still resolve)
- FLOUR_TORTILLAS chef = 'Patrick Nasr', source.notes updated, video_url removed

### HANDOFF → Senior Engineer · 2026-05-08 · DONE ✅ (CHICKEN_SHAWARMA — new recipe required for v1.0 launch slot)
**Closed by Senior Engineer 2026-05-08 in commit `d7c7c5a`.** New CHICKEN_SHAWARMA const created using cook's research file (chicken-shawarma.md, committed by COO in 6dbbe8e) as content source. Inserted directly after LAMB_SHAWARMA in the seed file and the SEED_RECIPES export array. LAMB_SHAWARMA flagged `not_yet_shipping: true` in commit `4c4daf9` (DECISION-013 batch). Method: 5 steps, 21 ingredients, full DECISION-008 sections. Cultural tag: levantine + chicken.

### HANDOFF → Senior Engineer · 2026-05-08 · DONE ✅ (DECISION-012 — bump version to v0.5.0 on next push)
**Closed by Senior Engineer 2026-05-08 in commit `08529ff`.** Single line change in mobile/app.json: expo.version "0.4.1" → "0.5.0". No other changes.

---

### HANDOFF → Senior Engineer · 2026-05-08 · OPEN URGENT — superseded by DONE entry above (DECISION-013 — scope build to 16 launch recipes; tag the rest)
**From:** Patrick (via COO)
**Subject:** Add `not_yet_shipping` schema flag, tag 29 non-launch recipes, ensure Patrick's flour tortilla attribution is correct
**Why:** Per DECISION-013 (decision-log.md, 8 May), v1.0 ships with 16 specific recipes only. The other 29 stay in the seed file but must be hidden from the build. Patrick's own flour tortilla recipe is the 16th and needs attribution set to him.

**The 16 launch recipes (everything else gets `not_yet_shipping: true`):**
1. Roast Chicken
2. Spaghetti Bolognese
3. Spaghetti Carbonara
4. Butter Chicken
5. Smash Burger
6. Thai Green Curry
7. Chicken Schnitzel
8. Beef Lasagne
9. Roast Lamb with Rosemary & Garlic
10. Fish & Chips
11. Pan-Fried Fish (Barramundi)
12. Pavlova
13. **Chicken** Shawarma (NOT lamb — separate handoff already open to create CHICKEN_SHAWARMA const)
14. Hummus
15. Pad Thai
16. **Soft Buttery Flour Tortillas — Patrick's recipe**

**What's needed:**
1. Add `not_yet_shipping: z.boolean().default(false)` to the Recipe Zod schema in `mobile/src/data/types.ts`. Additive only.
2. In `mobile/src/data/seed-recipes.ts`, set `not_yet_shipping: true` on every recipe NOT in the 16 above (29 recipes — `LAMB_SHAWARMA`, `MUSAKHAN`, `KAFTA`, `FATTOUSH`, `MUJADARA`, `RISOTTO`, `RAMEN`, `SCRAMBLED_EGGS`, `AGLIO_E_OLIO`, `DAL`, `EGG_FRIED_RICE`, `NASI_LEMAK`, `BEEF_RENDANG`, `CURRY_LAKSA`, `CHAR_KWAY_TEOW`, `SAAG_PANEER`, `CHICKEN_KATSU`, `TOM_YUM`, `CHICKEN_ADOBO`, `BEEF_STEW`, `SOURDOUGH_LOAF`, `SOURDOUGH_MAINTENANCE`, `FRENCH_ONION_SOUP`, `BRAISED_SHORT_RIBS`, `BEEF_WELLINGTON`, `SHEET_PAN_HARISSA_CHICKEN`, `PRAWN_TACOS_PINEAPPLE`, `FISH_TACOS`, plus any others not in the launch 16). The 16 launch recipes default to `false` — leave them unset or explicit `false`.
3. Update browse, search, and pantry-match queries to filter `WHERE not_yet_shipping = false` (or equivalent). Hidden from all user-visible surfaces in v1.0.
4. **Patrick's flour tortillas (FLOUR_TORTILLAS const):**
   - `chef`: `"Patrick Nasr"`
   - `source.notes`: `"Patrick's own recipe — soft, buttery, adapted over time from multiple sources"`
   - `source.video_url`: `null`
   - The cook's existing `docs/coo/culinary-research/flour-tortillas.md` is the structural template. Content alignment with Patrick's actual recipe is a separate cook handoff (Patrick provides his ingredient ratios and technique; cook re-formats to 10-section template).
   - Mark FLOUR_TORTILLAS as `not_yet_shipping: false` so it ships in v1.0.

**Files touched:** `mobile/src/data/types.ts`, `mobile/src/data/seed-recipes.ts`, `mobile/app/(tabs)/index.tsx` (Kitchen browse query), `mobile/app/(tabs)/pantry.tsx` (match query), `mobile/db/database.ts` if queries live there.
**Cost:** ~30 minutes for schema + tagging + query updates.
**Blocks:** v1.0 launch scope. Until this lands, the build still shows all 45 recipes to users.

---

### HANDOFF → Culinary Verifier · 2026-05-08 · OPEN (Patrick's flour tortilla recipe — content alignment)
**From:** Patrick (via COO)
**Subject:** Re-author `docs/coo/culinary-research/flour-tortillas.md` to match Patrick's actual recipe with him as the chef
**Why:** Per DECISION-013, Patrick's own flour tortilla recipe is the 16th launch recipe. The current `flour-tortillas.md` research file you wrote in Batch 2/3 may have used a different chef attribution or source. Patrick is the chef-of-record now: it's his recipe, learnt and tweaked from multiple sources over time.
**What's needed:**
1. Open `docs/coo/culinary-research/flour-tortillas.md`.
2. Update the Hero section: `chef: Patrick Nasr`. `source.notes`: "Patrick's own recipe — soft, buttery, adapted over time from multiple sources." `source.video_url`: null.
3. Patrick will provide his actual ingredient ratios and technique notes in a follow-up message in this chat. Reformat his input to the 10-section template (Hero / At a glance / Description / What to know before you start / Equipment / Ingredients / Prep / Cook steps / Finishing & tasting / Leftovers & storage).
4. Apply your pre-flight checklist before declaring it ready — ingredient/step parity, hidden time accounted for, doneness cues on every step, scaling annotations populated, Australian English throughout.
5. Add an entry to `docs/coo/culinary-research/launch-recipe-units.md` for tortillas: unit = "tortilla", default = 8, "make extra" = "+N tortillas".
**Files touched:** `docs/coo/culinary-research/flour-tortillas.md`, `docs/coo/culinary-research/launch-recipe-units.md`
**Blocks:** Engineer's flour tortilla migration into seed-recipes.ts (so FLOUR_TORTILLAS can ship in v1.0)

---

### HANDOFF → Senior Engineer · 2026-05-08 · OPEN (CHICKEN_SHAWARMA — new recipe required for v1.0 launch slot)
**From:** Culinary & Cultural Verifier
**Subject:** Author `CHICKEN_SHAWARMA` recipe const; flag `LAMB_SHAWARMA` as not yet shipping
**Why:** Patrick confirmed 2026-05-08 that the v1.0 launch slot is chicken shawarma, not lamb. The library currently has `LAMB_SHAWARMA` only. A new recipe needs to be created.
**What's done:** Portion sizing spec is locked in `docs/coo/culinary-research/launch-recipe-units.md` (section 13). `LAMB_SHAWARMA` stays in the seed file but must be flagged `not_yet_shipping` — it is a v1.2 candidate.
**What's needed:**
1. Create a new `CHICKEN_SHAWARMA` recipe const in `seed-recipes.ts`. Use the existing `LAMB_SHAWARMA` recipe object as the structural template — replace lamb with boneless chicken thighs, update marinade ratios, adjust cook time to 25–30 min at 220°C, update attribution.
2. Set `LAMB_SHAWARMA` status to `not_yet_shipping` (or remove from the launch set — whichever the schema supports).
3. Culinary Verifier will need to author a full DECISION-009 research file for `CHICKEN_SHAWARMA` before it can pass the pre-flight checklist — create a skeleton `.md` file at `docs/coo/culinary-research/chicken-shawarma.md` as a placeholder so the Verifier knows it's needed.
**Files touched:** `mobile/src/data/seed-recipes.ts`, `docs/coo/culinary-research/launch-recipe-units.md`
**Blocks:** DECISION-009 migration for the shawarma slot; photography scheduling

---

### HANDOFF → Senior Engineer · 2026-05-08 · OPEN (DECISION-012 — bump version to v0.5.0 on next push)
**From:** Patrick (via COO)
**Subject:** Set `version` in `mobile/app.json` to `"0.5.0"` on the next commit. Adopt new versioning policy.
**Why:** Per DECISION-012 (decision-log.md, 8 May), `v1.0.0` is reserved for Play Store production launch day. Pre-launch we use v0.x. Only the COO bumps minor versions — engineer continues to bump patches and build numbers freely. Current state has shipped enough to justify a retroactive bump from `0.4.1` to `0.5.0` to mark the Pantry v3/v4 + dark/sage palettes + Kitchen improvements + recipe template skeleton package.
**What's needed:**
1. In `mobile/app.json`, change `expo.version` from `"0.4.1"` to `"0.5.0"`. No other code changes.
2. `expo.android.versionCode` (the build number) keeps auto-incrementing as normal — that's separate.
3. Going forward: do NOT auto-bump the minor version on your own. Bug-fix patches go `0.5.0 → 0.5.1 → 0.5.2`. Minor bumps (`0.5.x → 0.6.0`) only happen on explicit COO instruction. The milestone map is in DECISION-012.
4. Commit message: `chore(version): bump to v0.5.0 per DECISION-012`.
**Files touched:** `mobile/app.json` only.
**Cost:** ~5 minutes.
**Blocks:** Nothing. Land alongside any other build.

---

### HANDOFF → Patrick · 2026-05-08 · ON-DEVICE VALIDATION (three jobs landed, awaiting your install)
**From:** Senior Engineer
**Subject:** ATTR-FAIL + 11-recipe DECISION-009 + 27-recipe Batch 3+4 + audit placeholder all on origin/main; build not triggered per CLAUDE.md.
**Commits:**
- `ee111a0` — ATTR-FAIL: 16 broken attribution URLs converted to book citations
- `5ac153b` — DECISION-009 Batch 2 (11 launch-priority recipes)
- `e649f0f` — DECISION-009 Batch 3+4 (27 cook-extras)
- `c5f6a2d` — UI placeholder for the one remaining empty recipe (sourdough-maintenance)

**State after all four commits:**
- 44 of 45 seed recipes carry full DECISION-008 sections (Equipment, Prep, Before-you-start, Finishing, Leftovers, total/active timings)
- 1 still empty: `sourdough-maintenance` — intentional, it's a starter-feeder guide, not a meal recipe; renders the new "Equipment and prep notes are coming" placeholder
- Zero broken attribution URLs in `seed-recipes.ts`
- Zero `whole_food_verified` references anywhere outside historical session reports

**On-device checks Patrick should walk through after triggering a build:**
1. Open chicken-adobo (now book-cited "Anthony Bourdain, No Reservations Philippines" with no URL) — Equipment, Prep, Finishing, Leftovers should render
2. Open butter-chicken — total time should read 270 min (4h 30m, including the 4-hour marinade) instead of the previous understated 90
3. Open roast-chicken — total time should read 840 min (14h, dry-brine overnight) instead of 90
4. Open lamb-shawarma — Prep checklist should be tappable, count should tick
5. Open sourdough-maintenance — should show the sage-tinted "Equipment and prep notes are coming" placeholder, NOT empty space
6. Open carbonara — `Watch the original` button should still work (the URL was already clean)

**Per CLAUDE.md:** GitHub issue NOT closed. Patrick validates on-device and closes himself.

**Build trigger:** Patrick decides when. The fixes are stacked on top of `4725618` (REGN-006 + REGN-007 fix that was last built as #92/#93). A new build dispatched on `c5f6a2d` will carry everything since the last validated APK.

---

### HANDOFF → Senior Engineer · 2026-05-08 · DONE ✅ (ATTR-FAIL — 16 broken attribution URLs fixed)
**Closed by Senior Engineer 2026-05-08 in commit `ee111a0`.** All 16 recipes converted to book citations per Patrick's default. Andy Cooks recipes (PRAWN_TACOS_PINEAPPLE, WEEKDAY_BOLOGNESE) used 'inspired by, no URL' framing because Andy Cooks doesn't have a published book. No video_url remains broken in seed-recipes.ts. Patrick validates on-device.

### Original handoff (preserved for audit) → Senior Engineer · 2026-05-08 · OPEN (ATTR-FAIL — fix 16 broken attribution URLs in seed-recipes.ts)
**From:** Culinary & Cultural Verifier
**Subject:** 16 recipes have `video_url` values that violate Golden Rule 1 — fix before any recipe ships
**Why:** The full attribution audit (`docs/coo/culinary-audit.md`, 2026-05-08) found 16 of 45 seed recipes link to a channel homepage, site root, about page, or chef listing page — none of which point to a specific recipe. Under Golden Rule 1, every chef-attributed link must be live and point to the specific recipe, not a channel or site. None of these recipes can ship until the link is correct or the attribution is reframed as a book citation / "inspired by" with no URL.
**What's needed:**
For each recipe below, eit