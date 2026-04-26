# Changelog

All notable changes to Hone are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/) once it hits 1.0.0.
Until then we're in `0.x.y` and bump minor for each shipped APK.

## [Unreleased]

Branch model and SQLite migration runner — deferred until needed.

## [0.6.0] — 2026-04-26 — Mona Lisa search

### Added
- **Search overlay** (`mobile/src/components/SearchOverlay.tsx`): full-screen
  modal opened from the Kitchen search bar. Multi-entity results sectioned
  by type — Recipes / Cuisines & Types / Ingredients / Chefs.
- **Multi-tier ranking**: title-prefix (1000) > token-start (700) > title-substring (500) >
  tagline (300) > chef (250) > ingredient (200) > tag (100). Pantry-ready
  recipes get +50 boost so what you can make right now ranks first.
- **READY badge** on recipe results when ≥80% of ingredients are in your
  pantry.
- **Highlighted matched prefix** per Algolia best practice — the matched
  characters render in paprika bold inside each result row.
- **Beautiful empty state** when no query: ✨ title, Trending chips
  (Carbonara, Tom yum, Tacos, Sourdough, Lamb shawarma), Recent searches
  (in-memory for v1; AsyncStorage in v1.0.1), Quick-filter chips.
- **No-results state**: friendly empty card with a search emoji + suggestion
  to try a cuisine, ingredient, or trending search.
- **Cute touches**: paprika accent ring on focused search bar, soft rounded
  emoji-anchored hero squares for recipe results, sage/ochre gradient pill
  for the READY badge, ✨ sparkle indicator in the closed-state Kitchen
  search bar.

### Changed
- Kitchen search bar is now a `Pressable` that opens the overlay (instead
  of an inline `TextInput`). Visual styling unchanged so the affordance
  still reads as "search here". Tapping anywhere inside opens the
  overlay; tapping × clears the saved query.

## [0.5.0] — 2026-04-25 — UX redesign wave 2 (build #14, commit ca4da2c)

### Changed
- **Plan tab dropped → Plan & Shop merged tab.** Two sub-tabs (Shopping list | Meals). No more by-day calendar grid; selected meals are a flat list. Shopping list aggregates across all selected meals, groups by aisle, subtracts pantry. Tab label in bottom nav: "Plan & Shop".
- **Pantry rebuilt as a flat tag-cloud.** Whole pantry visible at a glance as paprika-on-ink chips. No category headers in default view. Quick-add staples below as scrollable chips (only those not already in pantry). Recipe matches render inline (not in a modal): green "You can make these" + ochre "Almost there — grab 1-3 more".
- **Add-to-plan is a one-tap confirm.** Calendar 14-day picker dropped. Tap + on a recipe → small sheet → "Add to plan" → done. Date silently set to today's ISO; column preserved on `MealPlanEntry` for future scheduling.

### Added
- `getAllPlanEntries()` DB helper for the new flat-list view.

## [0.4.0] — 2026-04-25 — Autocomplete-driven Add Recipe + UX quick wins (build #13, commit 5d2475e)

### Added
- `mobile/src/data/canonical-ingredients.ts` — generated. 200 canonical entries with median amount + most-common unit derived from the existing 39-recipe corpus + 10 hand-added staples.
- Three-phase Add Recipe form (What / Ingredients / Method) with autocomplete picker, smart defaults, highlighted matched prefix per Algolia best practice. Custom-add fallback. Paste-mode disclosure. Method live-preview.
- Yield-mode auto-detection from recipe name ("loaf" → makes one; "tortillas" → makes pieces).
- Inline validation ticks per field; sticky CTA shows the first missing thing ("Add a name", "Add a time", etc.).

### Changed
- RecipeCard hero buttons: 36 → 44dp (Apple HIG / Material 3 minimum). Scrim 0.45 → 0.62. + icon 20 → 22, heart 18 → 20. Visible against dark photo heroes (sourdough screenshot was the trigger).
- Kitchen header compressed: kicker line dropped, hero from 38px two-line to 28px one-line, recipe count moves below search bar. Roughly 25% less above-fold chrome.

### Research artefacts
- `docs/ux-redesign-research.md` (3,751 words) — full app UX audit + redesign plan.
- `docs/add-recipe-research.md` (2,510 words) — six peer-reviewed UX findings applied.

## [0.3.0] — 2026-04-25 — Recipe data audit + yield rollout (commit 630076b)

### Changed
- 29 ingredient renames: every "X or Y" inline alternative canonicalised. "Ghee or clarified butter" → "Ghee", "Pappardelle or tagliatelle" → "Pappardelle", "Spaghetti or rigatoni" → "Spaghetti", etc. Verified zero remaining outside-paren " or " patterns.
- Pavlova retagged: `base_servings: 8 → 1, yield_unit: 'pavlova'`. Sourdough Loaf same pattern. Sourdough Maintenance flagged `fixed_yield: true`.
- ServingsSelector: "Makes [N] portions" subtitle now reads "[N] tortillas" / "[N] loaves". Leftover-mode pills hidden for yield recipes.
- RecipeCard meta: "5 tortillas" / "1 loaf" instead of just the number.
- Kitchen search placeholder: "What are you in the mood for?".

### Added
- `pluralizeUnit()` helper handling regular forms + irregular `loaf → loaves`.

## [0.2.0] — 2026-04-25 — UX wave 1 (commit c1c29f3)

### Added
- "+" icon for Add-to-plan affordance on RecipeCard hero and recipe detail (was a calendar icon — too subtle).
- Clear-filter chip rail in Kitchen — one × chip per active filter (paprika fill), "Clear all" when 2+ are on.
- Plan tab empty-state copy points to Kitchen + as primary path.
- Recipe yield-type schema: `Recipe.yield_unit` + `Recipe.fixed_yield` optional fields. Backwards-compatible.

## [0.1.0] — 2026-04-25 — Pantry rework + Add-to-plan + new icon (commit b329bc4)

### Added
- New `AddToPlanSheet` shared component (originally a 14-day picker, since simplified).
- App icon set: chef knife + tomato on yellow. icon.png 1024, adaptive-icon.png with 88% safe area, splash-icon.png, favicon.png 48. `app.json android.adaptiveIcon.backgroundColor: #F9C43F`.
- `INGREDIENT_SYNONYMS` map (60+ plurals + AU regional aliases) and " or X" suffix stripping in `normalizeForMatch`.

### Changed
- Pantry: dual search/add inputs replaced with single combined input + inline "+ Add 'X'" suggestion when novel.

### Documented
- `docs/session-12-backlog.md` — comprehensive PM backlog.
- `docs/onedrive-fix.md` — root-cause writeup of the OneDrive sync corruption that mangles Edit-tool writes.

## [0.0.1] — 2026-04-24 — First working APK (commit c2fa743)

### Added
- First Android APK that installs and runs on Patrick's phone.
- All native packages aligned to Expo SDK 54 / RN 0.81 (`npx expo install --check`).
- GitHub Actions CI: `expo prebuild --clean` → `./gradlew assembleDebug`.
- Working bundle includes JS via `bundleInDebug=true` so APK is standalone (no Metro server needed).

## [0.0.0] — 2026-04-19 → 2026-04-23 — Pre-APK development (sessions 1-10)

Recipe library expanded from 0 to 45. Phase 1-7 complete: dual-axis category browse, recipe detail, ingredient substitutions, cook mode, pantry-to-recipe matching, shopping list, app rename Simmer Fresh → Hone, comprehensive polish pass. See CLAUDE.md for the full session-by-session log.

[Unreleased]: https://github.com/patrickpatches/hone/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/patrickpatches/hone/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/patrickpatches/hone/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/patrickpatches/hone/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/patrickpatches/hone/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/patrickpatches/hone/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/patrickpatches/hone/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/patrickpatches/hone/releases/tag/v0.0.1
