# FILE_MAP.md — Canonical File & Folder Index

> Last updated: 2026-05-25. This is the authoritative map of what lives where in the Hone repo.
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
| `index.html` | The deployed PWA — web export of the Hone app. Copied to `_site/` by the Pages workflow. Do not move. |
| `mobile/` | The entire Expo / React Native app. All app code lives here. |
| `docs/` | All project documentation. See below. |
| `scripts/` | Developer utility scripts (bat, sh). Not app code. |
| `.github/workflows/` | CI/CD: Android APK build + GitHub Pages deploy. |

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
| `docs/sessions/` | Per-session reports. Filename: `Hone_Session_Report_DD_Month_YYYY.md`. |
| `docs/coo/` | COO operating system — cadence, handoffs, command centre, launch plan, specialist briefs. |
| `docs/coo/specialists/` | Role briefs for each specialist chat. One file per role. |
| `docs/coo/photography/` | Photography Director outputs — shot lists, preset, pre-flight checklist, shoot retrospectives. |
| `docs/coo/photography/preflight-checklist.md` | Pre-flight checklist Patrick runs every shoot weekend. Print-ready, one page. |
| `docs/coo/photography/post-processing-preset.md` | Lightroom Mobile settings for the Hone visual preset. Apply consistently to every photo. |
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
| `docs/archive/` | Completed checklists, old backups, superseded documents. Nothing here is current. |
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
| `mobile/app/(tabs)/` | Tab bar screens: index (home), pantry, shop, add. |
| `mobile/app/(tabs)/index.tsx` | Home / recipe browser screen. |
| `mobile/app/(tabs)/pantry.tsx` | Pantry management screen. |
| `mobile/app/(tabs)/shop.tsx` | Shopping list screen. |
| `mobile/app/(tabs)/add.tsx` | Add a recipe screen. |
| `mobile/app/recipe/[id].tsx` | Recipe detail + cook mode screen. |
| `mobile/app/_layout.tsx` | Root layout: fonts, SQLite provider, navigation shell. |
| `mobile/src/components/` | Shared React Native components. |
| `mobile/src/data/` | Business logic: types, scaling, seed recipes, pantry helpers. |
| `mobile/src/data/types.ts` | Zod schemas and TypeScript types for recipes, ingredients, substitutions. |
| `mobile/src/data/seed-recipes.ts` | All seeded recipe data. The recipe library. |
| `mobile/src/data/scale.ts` | Ingredient scaling logic (linear / fixed / custom). |
| `mobile/src/data/pantry-helpers.ts` | Pantry-to-recipe matching and scoring. |
| `mobile/src/data/shopping-helpers.ts` | Shopping list aggregation and aisle grouping. |
| `mobile/src/theme/tokens.ts` | Design tokens: colours (terracotta/olive/gold), fonts (Playfair Display / Source Sans 3). |
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

## scripts/

| File | Purpose |
|---|---|
| `scripts/run-android.bat` | Windows helper: runs `npx expo start` targeting a connected Android device. |

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
