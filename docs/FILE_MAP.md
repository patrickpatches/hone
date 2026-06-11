# FILE_MAP.md — Canonical File & Folder Index

> Last updated: 2026-06-11 (post-audit refresh). This is the authoritative map of what lives where in the Tucker & Spice repo.
> If you create a new file and aren't sure where it goes, this doc has the answer.
> If something is missing from this map, add it here when you create it.

---

## Root level — only permanent project fixtures live here

| File / Folder | Purpose |
|---|---|
| `CLAUDE.md` | Single source of truth: project rules, product vision, document control. Every session reads this first. |
| `BUGS.md` | Open bug tracker. Synced from GitHub Issues at session start. Never self-close bugs — Patrick validates on-device. |
| `CHANGELOG.md` | Shipped version history. Keep a Changelog format, semver from 1.0. |
| `README.md` | Public-facing repo intro: stack, rules, build instructions, doc index. |
| `index.html` | The deployed PWA — web export of the Tucker & Spice app. Copied to `_site/` by the Pages workflow. Do not move. |
| `mobile/` | The entire Expo / React Native app. All app code lives here. |
| `docs/` | All project documentation. See below. |
| `scripts/` | Developer utility scripts (bat, sh, validation guards). Not app code. |
| `workers/` | Cloudflare Workers: `tracker/` (Bug Lord ↔ GitHub Issues bridge) and `bug-lord/`. |
| `maestro/` | Maestro E2E flows (`flows/*.yaml`) run by the startup-smoke and e2e workflows. |
| `tester/` | Agentic usability tester — Claude drives the APK on an emulator as personas and reports friction. See `tester/README.md`. |
| `package.json` | Workspace root manifest (worker tooling). The app's own manifest is `mobile/package.json`. |
| `.github/workflows/` | CI/CD: eas-build (validate → APK), startup-smoke, maestro-e2e, usability-test (agentic, weekly), ts-truncation-check, Pages deploy. |

---

## docs/ — project documentation

| Path | Purpose |
|---|---|
| `docs/FILE_MAP.md` | This file. Canonical index. |
| `docs/RELEASING.md` | Full release runbook: how to trigger a build, download APK, tag a version. |
| `docs/SMOKE-TEST.md` | Manual test checklist to run before every release. |
| `docs/roadmap.md` | Phased build plan and current status. Update when a phase completes. |
| `docs/competitive-analysis.md` | Supercook / Yummly comparison. Update when doing competitive research. |
| `docs/eas-update-strategy.md` | Why OTA updates via EAS Build cloud (not DIY Gradle). |
| `docs/pantry-to-recipe.md` | Design doc for the pantry → recipe kill feature (not yet built). |
| `docs/patrick-action-list.md` | Things only Patrick can do (Play Console, photo shoots, etc.). |
| `docs/Hone_Development_Log_FY2025-26.xlsx` | ATO development log spreadsheet. Update after each session. |
| `docs/adr/` | Architecture Decision Records. One file per major decision. |
| `docs/adr/001-stack.md` | Why Expo + TypeScript + expo-router. |
| `docs/adr/002-delivery-targets.md` | Why Android-first, iOS post-launch. |
| `docs/adr/003-bundle-id-rename.md` | Bundle ID rename simmerfresh → hone (renumbered from 001, 2026-06-11). |
| `docs/adr/004-recipe-template-expansion.md` | Recipe template expansion / DECISION-009 (renumbered from 002, 2026-06-11). |
| `docs/sessions/` | Per-session reports. Filename: `Hone_Session_Report_DD_Month_YYYY.md`. |
| `docs/dev-emulator-setup.md` | Local Android emulator setup guide for on-device checks. |
| `docs/regression-checklist.md` | Manual regression checklist run before release candidates. |
| `docs/coo/` | COO operating system — cadence, handoffs, command centre, launch plan, specialist briefs. |
| `docs/coo/COO_START_BRIEF.md` | COO session-start brief — what the COO reads first each day. |
| `docs/coo/handoffs.md` | Live specialist handoff log (current cycle). Older cycles archive to `docs/archive/handoffs-*.md`. |
| `docs/coo/command-centre.md` | COO command centre — current priorities and sequencing. |
| `docs/coo/culinary-audit.md` | Cook's running culinary review log (recipe accuracy issues). |
| `docs/coo/visual-assets-ledger.md` | Ledger of every recipe image: source, licence, status. |
| `docs/coo/specialist-starter-prompts.md` | Copy-paste starter prompts for each specialist chat. |
| `docs/coo/decision-log.md` | DECISION-NNN log (one file, newest at top). |
| `docs/coo/risk-register.md` | R-NNN risk register (one file). |
| `docs/coo/pass/` | "The Pass" build-cycle protocol: PROTOCOL.md, _TEMPLATE.md, build-history.csv. |
| `docs/coo/tickets/` | Engineer build tickets — focused work orders with acceptance criteria + Definition of Done. |
| `docs/coo/tickets/recipe-detail-v5-build.md` | Recipe detail v5 build ticket. **SUPERSEDED** — v5 crashed on Fabric scroll, reverted in #126. Issue #5 closed. |
| `docs/coo/tickets/recipe-detail-v7-build.md` | Recipe detail v7 "Mise" Phase 1 build ticket — styling + IA only, no schema. ✅ READY TO BUILD. |
| `docs/coo/specialists/` | Role briefs for each specialist chat. One file per role. |
| `docs/coo/photography/` | Photography Director outputs — shot lists, preset, pre-flight checklist, shoot retrospectives. |
| `docs/coo/photography/preflight-checklist.md` | Pre-flight checklist Patrick runs every shoot weekend. Print-ready, one page. |
| `docs/coo/photography/post-processing-preset.md` | Lightroom Mobile settings for the Tucker & Spice visual preset. Apply consistently to every photo. |
| `docs/coo/photography/shot-list-showcase.md` | Per-recipe stage shot lists for the 10 showcase recipes. Includes doneness cues, alt text, and schedule. |
| `docs/coo/photography/shot-list-hero-only.md` | Hero-only shot list for ~24 remaining recipes. Includes hero batch weekend plan. |
| `docs/coo/photography/image-briefs/` | Per-recipe working briefs for AI image generation. One file per recipe. Contains deep research, DALL-E 3 prompts, cook validation checklists. |
| `docs/coo/photography/image-briefs/smash-burger.md` | Smash Burger generation brief — 6 prompts (hero + 5 stage shots). Status: prompts written, images not yet generated. |
| `docs/coo/photography/image-briefs/carbonara.md` | Spaghetti Carbonara generation brief — 4 prompts (hero + 3 stage shots). Status: prompts written, images not yet generated. |
| `docs/coo/photography/image-briefs/roast-chicken.md` | Roast Chicken generation brief — 4 prompts (hero + 3 stage shots). Status: prompts written, images not yet generated. |
| `docs/accounting/` | ATO records: tax advice doc and receipts folder. |
| `docs/accounting/tax-advice-FY2025-26.md` | Running tax strategy and deduction guidance for FY 2025–26. |
| `docs/accounting/receipts/` | Supplier invoices as PDFs. Naming: `Supplier-InvoiceNumber-YYYY-MM-DD.pdf`. Keep 5 years (ATO rule). |
| `docs/prototypes/` | HTML mockups used during design exploration. Read-only reference — not deployed code. |
| `docs/prototypes/recipe-card-states.html` | Recipe card component states prototype. |
| `docs/prototypes/substitution-sheet.html` | Ingredient substitution sheet UI prototype. |
| `docs/prototypes/colour-refinement-v1.html` | Colour upgrade before/after (substitution pill green + pantry-mode eyebrow). Awaiting Patrick's A/B pick. |
| `docs/prototypes/pantry-haves-v1.html` | Approved pantry "what you have" list + stepper + carousel — shipped as build #122. |
| `docs/prototypes/cook-mode-v2.html` | Cook-mode single-step navigator — shipped as build #117. |
| `docs/prototypes/recipe-detail-v3.html` | Recipe detail "Kitchen Brief" concept (24 May). Superseded by v5 as the direction. |
| `docs/prototypes/recipe-detail-v4.html` | Recipe detail "The Pass" — elevated why-note, story glance, allergen strip, leftover nudge. |
| `docs/prototypes/recipe-detail-v5.html` | Recipe detail "The Pass" (latest) — v4 + origin flag, sticky CTA, collapsing app bar. APPROVED for engineer build. |
| `docs/prototypes/recipe-detail-v6.html` | Aesthetic-only restyle of the working build-#126 recipe page — safe rebuild after the v5 crash (no scroll-driven chrome). |
| `docs/prototypes/recipe-detail-v7.html` | **Vision concept** — kitchen-first redesign: warm-paper browse + OLED cook flow, Fraunces+Inter type, pantry signal up top, ergonomic cook step. For Patrick's direction call. |
| `docs/prototypes/bread-guide-v1.html` | **The Bread Bench** — working interactive baking guide (sourdough, tortillas, pita). Adaptive engine: flour/equipment/kitchen-temp/schedule inputs recompute the formula, timings, and instruction text; back-calculating "ready by" timeline; SVG technique diagrams; photo briefs inline. For Patrick's direction call before in-app build. |
| `docs/prototypes/` (others) | ~11 further exploration mockups (kitchen-*, pantry-*, cook-mode-v1, recipe-card-v2, recipe-detail-v2*, substitution-sheet-v2, app-flow-v2, Recipe Page Design). Read-only design history — list not itemised; the rows above are the shipped/approved ones. |
| `docs/archive/` | Completed checklists, old backups, superseded documents. Nothing here is current. |
| `docs/archive/handoffs-2026-05.md` | May 2026 handoff log (archived from docs/coo/handoffs.md). |
| `docs/archive/sessions/` | Numbered session backup folders (11–14, README). |
| `docs/archive/backup-*/` | Point-in-time snapshot backups created during risky refactors. |
| `docs/archive/simmer-fresh-rename-leftovers/` | Artefacts from the Simmer Fresh → Hone rename. |
| `docs/archive/rename-checklist.md` | Completed rename checklist. Archived — do not update. |
| `docs/archive/session-12-backlog.md` | Session 12 backlog. Archived. |

---

## mobile/ — the Expo app

| Path | Purpose |
|---|---|
| `mobile/app/` | Expo Router screens. One file = one route. |
| `mobile/app/(tabs)/` | Tab bar screens: index (Kitchen), pantry, plan, shop, add. |
| `mobile/app/(tabs)/index.tsx` | Kitchen — home / recipe browser screen. |
| `mobile/app/(tabs)/pantry.tsx` | Pantry management screen. |
| `mobile/app/(tabs)/plan.tsx` | Weekly meal planner screen. |
| `mobile/app/(tabs)/shop.tsx` | Shopping list screen. |
| `mobile/app/(tabs)/add.tsx` | Add a recipe screen (placeholder until the form ships). |
| `mobile/app/recipe/[id].tsx` | Recipe detail + cook mode screen. |
| `mobile/app/settings.tsx` | Settings: theme toggle, default servings, °C/°F + ml/cups. |
| `mobile/app/_layout.tsx` | Root layout: providers, fonts, DB watchdog, theme background shells. |
| `mobile/global.css` | Tailwind base + web-only background overrides. |
| `mobile/src/components/` | Shared React Native components (RecipeCard, SearchOverlay, Icon, …). |
| `mobile/src/state/PreferencesContext.tsx` | User preferences (servings, units) persisted to SQLite. |
| `mobile/src/theme/ThemeContext.tsx` | Light/Dark theme state; remounts Stack on toggle. |
| `mobile/src/data/` | Business logic: types, scaling, seed recipes, pantry helpers. |
| `mobile/src/data/types.ts` | Zod schemas and TypeScript types for recipes, ingredients, substitutions. |
| `mobile/src/data/allergens.ts` | Australian PEAL allergen taxonomy + name-based inference. Derives each recipe's allergen declaration. |
| `mobile/src/data/seed-recipes.ts` | All seeded recipe data. The recipe library. |
| `mobile/src/data/scale.ts` | Ingredient scaling logic (linear / fixed / custom). |
| `mobile/src/data/units.ts` | Honest unit conversion (°C/°F, ml/cups) + duration & difficulty display formatting. |
| `mobile/src/data/measure.ts` | Quantity formatting/stepping helpers for pantry amounts. |
| `mobile/src/data/pantry-helpers.ts` | Pantry-to-recipe matching and scoring. |
| `mobile/src/data/shopping-helpers.ts` | Shopping list aggregation and aisle grouping. |
| `mobile/src/theme/tokens.ts` | Design tokens — two themes: Dark (warm near-black + gold) and Light (retro synthwave); fonts Fraunces / Inter / Poppins. |
| `mobile/scripts/check-parse.mjs` | R-014 parse guard — Babel-parses every .ts/.tsx; run by the eas-build validate job (`npm run check:parse`). |
| `mobile/db/` | SQLite schema, migrations, and seed runner. |
| `mobile/db/schema.ts` | Table definitions (expo-sqlite). |
| `mobile/db/database.ts` | DB connection, initialisation, and query helpers. |
| `mobile/db/seed.ts` | Seed runner — loads seed-recipes into SQLite on first launch. |
| `mobile/app.json` | Expo config: name, slug, version, SDK, permissions. |
| `mobile/package.json` | Node dependencies. |
| `mobile/babel.config.js` | Babel config — includes reanimated plugin (required for animations). |
| `mobile/tailwind.config.js` | NativeWind / Tailwind config. |
| `mobile/android/` | Generated Android native project (from expo prebuild). Do not hand-edit. |
| `mobile/assets/` | App icons and splash screen images. |

---

## tester/ — agentic usability tester

| File | Purpose |
|---|---|
| `tester/README.md` | Design doc + how to run. The "is it actually good?" layer above startup-smoke and Maestro. |
| `tester/agent.mjs` | The harness: screenshot + accessibility tree → Claude picks an action → adb executes → repeat. |
| `tester/personas.json` | Persona × task matrix (weeknight rush, first-timer, pantry cook, mid-cook crisis). Edit here to add tests. |
| `tester/heuristics.md` | Usability rubric: Nielsen floor + kitchen-context heuristics + the 3 Golden Rules + accessibility. |
| `tester/output/` | Gitignored run output: usability-report.md, findings.json, per-step screenshots. CI uploads it as an artifact. |

---

## scripts/

| File | Purpose |
|---|---|
| `scripts/run-android.bat` | Windows helper: runs `npx expo start` targeting a connected Android device. |
| `scripts/check-ts-truncation.sh` | R-014 fast tripwire — flags .ts/.tsx files ending mid-token. Runs on every push and in the eas-build validate job. |

---

## Naming conventions

- **Session reports:** `Hone_Session_Report_DD_Month_YYYY.md` → `docs/sessions/`. For a second (or third) session on the same day, append a sequential number: `_2.md`, `_3.md`. **Never** append a role tag (`_COO`, `_engineer`, etc.) — discoverable content lives in the H1 title and summary inside the file, not the filename.
- **ADRs:** `NNN-kebab-title.md` → `docs/adr/`
- **Specialist briefs:** `<role-name>.md` → `docs/coo/specialists/`
- **Decision log entries:** `DECISION-NNN` numbered, all in `docs/coo/decision-log.md` (one file, newest at top)
- **Risk register entries:** `R-NNN` numbered, all in `docs/coo/risk-register.md` (one file)
- **Backups created during a risky refactor:** `backup-YYYY-MM-DD[-descriptor]/` → `docs/archive/`
- **Worktree branch files:** never leave `-Desktop-P` or similar suffixed duplicates in the working tree — delete them when the worktree is pruned
- **No files in repo root** except: CLAUDE.md, BUGS.md, CHANGELOG.md, README.md, and the four standard hidden dirs (.git, .github, .claude, .gitignore)

---

## What does NOT belong in this repo

- `node_modules/` — gitignored, never commit
- `.expo/` — gitignored
- `mobile/android/` generated files — prebuild output, do not hand-edit or commit changes
- APK files — upload as GitHub Actions artifacts, never commit to git
- Secrets, API keys, PATs — never hardcoded anywhere
- ~~AI-generated food photography~~ — **Rescinded per DECISION-014 (10 May 2026).** AI and CC-licensed stock images are now permitted as temporary placeholders until real photography catches up; cook validates accuracy per recipe.
