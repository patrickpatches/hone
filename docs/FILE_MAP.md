# FILE_MAP.md — Canonical File & Folder Index

> Last updated: 2026-04-29 (COO scaffolding added). This is the authoritative map of what lives where in the Hone repo.
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
| `docs/coo/` | COO operating system — cadence, handoffs, command centre, launch plan, specialist briefs. See section below. |
| `docs/archive/` | Completed checklists, old backups, superseded documents. Nothing here is current. |
| `docs/archive/sessions/` | Numbered session backup folders (11–14, README). |
| `docs/archive/backup-*/` | Point-in-time snapshot backups created during risky refactors. |
| `docs/archive/simmer-fresh-rename-leftovers/` | Artefacts from the Simmer Fresh → Hone rename. |
| `docs/archive/rename-checklist.md` | Completed rename checklist. Archived — do not update. |
| `docs/archive/session-12-backlog.md` | Session 12 backlog. Archived. |

---

## docs/coo/ — COO operating system

The layer where the business actually runs. Every specialist chat reads relevant files here at session start. See `docs/coo/operating-rhythm.md` for the cadence.

| Path | Purpose |
|---|---|
| `docs/coo/operating-rhythm.md` | Weekly cadence, per-session rituals, decision rights. Read at start of every chat. |
| `docs/coo/handoffs.md` | Cross-chat baton-pass log. Updated every session. Where work moves between specialists. |
| `docs/coo/command-centre.md` | State-of-Hone snapshot. Top risk, top blocker, this week's priorities. Patrick's at-a-glance dashboard. |
| `docs/coo/launch-plan.md` | Calendar-driven critical path to v1.0 launch (target 24 July 2026). |
| `docs/coo/risk-register.md` | Risks scored by likelihood and impact. Mitigations and triggers. |
| `docs/coo/decision-log.md` | Business decisions (separate from `docs/adr/` which is technical). |
| `docs/coo/patrick-daily-flow.md` | Patrick's lived-experience guide: what to do when he logs on each day, how the multi-chat thing works. |
| `docs/coo/specialist-starter-prompts.md` | Copy-paste prompts to spin up each specialist chat. The starter prompt makes the chat self-orienting. |
| `docs/coo/launch-recipe-research.md` | Research-backed recommendation of the 10 launch recipes, with sources. |
| `docs/coo/marketing/` | Sales & Marketing Lead's outputs (Play Store copy, ASO research, launch comms). Created when role activates ~1 June 2026. |
| `docs/coo/beta/` | Beta Tester Coordinator's outputs (tester roster, feedback log, weekly digests, graduation memo). Created when role activates 22 May 2026. |
| `docs/coo/culinary-audit.md` | Per-recipe verification report. Owned by Culinary & Cultural Verifier. (Created when audit starts.) |
| `docs/coo/specialists/` | Role briefs — read by the matching specialist chat at session start. |
| `docs/coo/specialists/product-designer.md` | UX, UI, interaction. The unified design role. |
| `docs/coo/specialists/photography-director.md` | Visual coherence and shot direction for the food photography. |
| `docs/coo/specialists/qa-test-lead.md` | Smoke tests, performance budget, accessibility audit, bug triage. |
| `docs/coo/specialists/culinary-verifier.md` | Chef attribution accuracy, cultural sensitivity, substitution honesty. |
| `docs/coo/specialists/file-organiser.md` | Document control, naming conventions, FILE_MAP accuracy, repo hygiene. |
| `docs/coo/specialists/sales-marketing-lead.md` | Play Store listing, ASO, launch comms, post-launch reviews. Standby until ~1 June 2026. |
| `docs/coo/specialists/beta-tester-coordinator.md` | Closed Testing programme — recruitment, retention, feedback triage. Standby until 22 May 2026. |
| `docs/coo/photography/` | Shot lists, presets, pre-flight checklists for shoot weekends. (Created when shot list lands.) |
| `docs/coo/qa/` | Performance budget, accessibility audit, release sign-off notes. (Created when QA spins up.) |

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
| `mobile/src/components/` | Shared React Native componen