# Hone

A recipe and meal planning app for the Google Play Store. Australian-first,
metric-only, chef-inspired, whole-food only. The app's POV: a calm, intuitive
head chef who guides you from fridge to plate.

## Status

Pre-launch. Targeting Google Play Store ~June 2026.

- ✅ Core loop working (browse → cook → plate)
- ✅ Pantry-to-recipe matching, ingredient substitutions, shopping list
- ✅ First Android APK built and installable
- 🚧 World-class search overhaul in progress
- 🚧 Real food photos (10 launch-anchor recipes)
- 🚧 Play Store assets and submission

See [CHANGELOG.md](./CHANGELOG.md) for shipped versions.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Mobile framework | Expo + TypeScript + expo-router | Fastest path to Android + PWA from one codebase |
| Styling | NativeWind | Tailwind ergonomics on RN |
| Local DB | expo-sqlite | Offline-first, no server |
| Schema validation | Zod | Catches bad recipe data at the boundary |
| Build & CI | GitHub Actions | Free for public repos, no EAS quota concerns |
| Distribution | Google Play Store (Android-first); iOS post-launch | |

See `docs/adr/001-stack.md` for the full reasoning.

## Project rules (non-negotiable)

1. **Research-backed UX.** Every UX decision must have a reason — cognitive load, motor ergonomics, or proven interaction pattern. If it can't be justified, it doesn't ship.
2. **Credit the source chefs.** Recipes are inspired by and attributed to Andy Cooks, Joshua Weissman, Gordon Ramsay, Anthony Bourdain, and others. Full attribution with links to original videos.
3. **Smart scaling.** Ingredients scale by serving count, with leftover-aware proportions. A recipe for "4 people with lunch leftovers tomorrow" produces exactly that — not 1.25× everything.
4. **User-added recipes.** Users can add and edit their own recipes using the same structured format the app uses internally.
5. **Stage-by-stage visuals.** Real photos of what the food should look like at each step. No glamour-shot-only recipe cards. No AI-generated photos ever.
6. **Honest about limitations.** No fluff, no pretending. If a substitution changes the dish, explain how. If an ingredient is hard to find in Australia, flag it and suggest the local equivalent.

## Whole-food rule (non-negotiable)

Every recipe uses whole, unprocessed ingredients only. No preservatives. No stock cubes (specify a fresh stock recipe or quality brand fallback). No packaged seasoning mixes. If a traditionally preserved ingredient is required (miso, fish sauce, preserved lemon), it must be the real thing and called out explicitly.

## Australian context

- Metric only — grams, mL, °C
- Australian English — capsicum (not bell pepper), coriander (not cilantro), grill (not broil), eggplant
- Southern-hemisphere seasonality
- Hard-to-find ingredients flagged with sourcing notes

## Build locally

Prerequisites: Node 20+, JDK 17, Android SDK + emulator (or a connected device).

```bash
git clone https://github.com/patrickpatches/hone
cd hone/mobile
npm ci
npx expo install --check    # ensures package versions match SDK 54
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleDebug
# APK lands at app/build/outputs/apk/debug/app-debug.apk
```

For PWA: `cd mobile && npx expo export --platform web` then deploy `dist/` to any static host.

## Build via CI

Push to `main` triggers GitHub Actions. To build an APK on demand:

```
gh workflow run "Hone Android Build" --field profile=preview
```

Artifact attaches to the run. See [docs/RELEASING.md](./docs/RELEASING.md) for the full release runbook.

## Documentation

- `CLAUDE.md` — single source of truth for project rules, decisions, session log
- `CHANGELOG.md` — shipped versions
- `docs/RELEASING.md` — how to cut a release
- `docs/the file system-fix.md` — known issue with the working-folder location
- `docs/adr/` — Architecture Decision Records
- `docs/ux-redesign-research.md` — current UX redesign master plan
- `docs/add-recipe-research.md` — Add Recipe screen design supplement
- `docs/session-NN/` — per-session backups and notes

## Licence

This is a private project. All recipe content, attribution, and code © Patrick Nasr. Original chef inspirations and source URLs are credited per recipe.
