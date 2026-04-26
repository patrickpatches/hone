# Changelog

All notable changes to Hone are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/) once it hits 1.0.0.
Until then we're in `0.x.y` and bump minor for each shipped APK.

## [Unreleased]

— EAS Update will be re-attempted via EAS Build cloud, not DIY Gradle CI.
  See `docs/eas-update-strategy.md`.

## [0.6.3] — 2026-04-26 — Rolled back v0.7.x EAS Update attempt

### Removed
- `expo-updates` package and all related app.json config (`updates.*`,
  `runtimeVersion`, plugin entry). v0.7.0 and v0.7.1 attempts to add
  EAS Update to our DIY Gradle pipeline failed with three different
  Gradle hangs in a row. The right tool for this is EAS Build cloud,
  which we'll use in a dedicated future session — see
  `docs/eas-update-strategy.md`.
- `.github/workflows/eas-update.yml` renamed to `.disabled` (kept for
  reference, no longer triggers on push).

### Note
- All bug fixes from v0.6.2 are preserved — Plan & Shop multi-meal,
  Pantry persistence, search crash null-safety, recipe-detail contrast,
  in-app version label, ad-hoc shopping items.
- Patrick should install v0.6.2 (build #21, hone-v0.6.2-build21.apk)
  which is already built and proven. v0.6.3 is just the OTA-attempt
  rollback — a v0.6.3 APK will be built but it's functionally identical
  to v0.6.2 from a user perspective.

## [0.7.1] — 2026-04-26 — EAS Update plumbing fixes (v0.7.0 builds were broken)

### Fixed
- **EAS Update workflow:** added `--platform android` to `eas update` so
  it skips web bundling (which chokes on `expo-sqlite/web/worker.ts`'s
  WASM import and aborts the whole update push). Web isn't a target for
  us; OTA only needs the Android bundle.
- **APK Gradle hang:** `expo-updates:verifyReleaseResources` was failing
  because `expo-updates` wasn't listed in app.json's `plugins` array,
  so prebuild didn't write the required AndroidManifest meta-data.
  Added it. Without this, the runtime fails the resource-verification
  step and the Gradle task hangs indefinitely.

### Changed
- Skipping the broken v0.7.0 tag entirely; v0.7.1 is the first OTA-enabled
  version that actually builds.

## [0.7.0] — 2026-04-26 — Over-the-air JS updates (EAS Update) [BROKEN — see 0.7.1]

### Added
- **`expo-updates` integrated** (~29.0.16, the SDK 54 compatible version).
- **`app.json` configured for OTA**: updates URL points at our EAS project,
  `runtimeVersion: "1.0.0"` (manually bumped only when native deps change),
  `checkAutomatically: ON_LOAD`, `fallbackToCacheTimeout: 5000` (5s grace).
- **New workflow `.github/workflows/eas-update.yml`**: triggers on any push
  to `main` that touches `mobile/` outside the native shells, plus
  manual `workflow_dispatch`. Runs `eas update --branch preview` so the
  bundle hits Expo's CDN within ~30 seconds of a push.

### How it works for testing
Once the v0.7.0 APK is installed on Patrick's phone:
1. I push a JS change.
2. The eas-update workflow runs, compiles a JS bundle, uploads to Expo CDN.
3. Patrick opens Hone — `expo-updates` fires off a check on launch.
4. New bundle downloads silently in background (~1-3 MB).
5. On next app open, the new code runs.

Effectively zero-touch from his side. APKs are only needed when native
deps change (new Expo modules, Gradle config) — bumped via
`runtimeVersion`.

## [0.6.2] — 2026-04-26 — Pantry persistence + search crash + visible version

### Fixed
- **Pantry items disappearing after add.** handleAddByName + handleRemove
  now re-read from SQLite via getPantryItems(db) after every mutation.
  Solves the bug at the root: no more stale closure, bool serialization, or
  useEffect race possibilities can drop the item. Both paths wrapped in
  try/catch with console.warn diagnostics.
- **Search crashes from Kitchen.** SearchOverlay was non-defensive about
  user-added recipes with null tagline / tags / categories. Each recipe
  iteration now in try/catch with null-safe field access; one bad row no
  longer brings down the screen.

### Added
- **Search button on Pantry tab.** Same SearchOverlay opened from a
  magnifier in the Pantry header. Searches the whole recipe library, not
  just pantry items.
- **In-app version label.** v0.6.2 visible at the bottom of the Kitchen
  header. Patrick can verify the installed APK at a glance — solves the
  'did you actually upload it' confusion when multiple hone-release.apk
  files pile up in Downloads.

### Process
- Build #21+ uses versioned artifact names: hone-v0.6.2-build21.apk.

## [0.6.1] — 2026-04-26 — Plan & Shop multi-meal fix + Pantry display fix + contrast pass

### Fixed
- **Plan & Shop now allows multiple meals.** `setMealPlanEntry` was doing
  `DELETE FROM meal_plan WHERE date = ?` before INSERT — a regression from
  the calendar removal. Every new "today" add was wiping the previous one.
  Switched to plain `INSERT OR REPLACE` keyed on `id` (each add is a unique
  row).
- **Same recipe added twice now shows twice** in the Meals view. The
  `plannedRecipes` dedup-by-recipe-id was silently swallowing legitimate
  second adds (batch-cooking, cooking the same thing twice in a week).
- **Pantry chips visible after add.** SQLite stores booleans as 0/1; the
  `myPantry = pantryItems.filter(p => p.have_it)` filter was failing
  intermittently. Now coerced to `Boolean(p.have_it)`. The tag-cloud
  container now also always renders with a placeholder when empty (so the
  panel doesn't look broken).
- **Recipe detail top-bar contrast.** `CircleButton` was 42×42 / 0.92 cream;
  now 44×44 / 0.97 cream with a drop shadow + 20px icons. Visible on dark
  food heroes (smash burger screenshot was the trigger).

### Added
- **Add ad-hoc ingredients to the shopping list** — "+ Add ingredient"
  button at the top of the Plan & Shop / Shopping list tab. Opens a small
  sheet for name + amount + unit. Persists to a new `shopping_extras`
  SQLite table. Schema bumped to v4 with a migration for existing installs.
- **Pantry quick-add: category grid** — Proteins / Produce / Dairy & Eggs /
  Pantry / Sauces, wrapping flex layout. Replaces the single horizontal
  scroll. Expanded staples list from 8 to ~20.
- **`docs/SMOKE-TEST.md`** — pre-release manual checklist. Trigger: Patrick
  caught five regressions in one APK install. Rule going forward: no
  release notes without the checklist passing.

### Changed
- Pantry tag cloud is always rendered (with placeholder when empty), not
  conditionally hidden — empty state is more discoverable.

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

[Unreleased]: https://github.com/patrickpatches/hone/compare/v0.6.3...HEAD
[0.6.3]: https://github.com/patrickpatches/hone/compare/v0.7.1...v0.6.3
[0.7.1]: https://github.com/patrickpatches/hone/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/patrickpatches/hone/compare/v0.6.2...v0.7.0
[0.6.2]: https://github.com/patrickpatches/hone/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/patrickpatches/hone/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/patrickpatches/hone/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/patrickpatches/hone/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/patrickpatches/hone/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/patrickpatches/hone/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/patrickpatches/hone/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/patrickpatches/hone/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/patrickpatches/hone/releases/tag/v0.0.1
