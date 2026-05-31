# HONE-016 — No automated screen-level tests; crash regressions require Patrick to install each build

```
TYPE:            Task
SEVERITY:        P2
CATEGORY:        Infra
SCREEN:          All
RECIPE:          (all)
ASSIGNEE:        Engineer
EPIC:            EPIC-launch-ready
FOUND IN BUILD:  #131  (d7332fc — Rules-of-Hooks crash, first crash detectable only at runtime)
FIX ATTEMPTED:   #135  (commit <tbd>)
TARGET BUILD:    #135
REPRODUCIBLE:    Always
DEVICE:          Patrick's Pixel (Android 14)
GOLDEN RULE:     none
ROOT CAUSE:      Static checks (tsc, R-014) cannot detect React runtime invariants (Rules-of-Hooks,
                 Fabric driver constraints). Three builds in a row (#124, #129, #131) were lost to
                 runtime crashes that only manifested on-device. A Maestro smoke suite catches these
                 before Patrick installs.
```

**GitHub Issue:** (not yet filed — Engineer-initiated task) · **Filed:** 2026-05-31 · **Reporter:** Senior Engineer

---

## Repro

1. Ship a build with a runtime crash (e.g. Rules-of-Hooks violation in recipe screen).
2. Patrick installs the APK.
3. Patrick opens a recipe.
4. App force-closes. Build is wasted. Diagnosis takes another build cycle.

This repro has happened three times: builds #124, #129, #130.

## Expected

A smoke test runs before Patrick installs, catches the crash-class failure, and blocks the bad build.

## Actual

No automated screen tests exist. Every runtime failure reaches Patrick's hands first.

---

## COO TRIAGE — 2026-05-31

_Added by Senior Engineer (no COO triage awaited — engineering-initiated, self-assigned)._

- **Severity confirmed:** P2. Not blocking launch, but each missed crash costs 1–2 build cycles and Patrick's time. Three occurrences in six weeks justifies the investment.
- **Sequencing:** land in build #135 as a docs/infra-only commit (no app code change). Run manually on Patrick's device until suite has 10+ stable flows, then wire into CI.
- **Blocks:** nothing functional. Unblocks faster iteration by catching crash-class bugs before install.

---

## FIX ATTEMPTED — Build #135 (commit `f3bb986`) — 2026-05-31

_Added by Senior Engineer._

- **Root cause:** no screen-level test harness existed in the project.
- **Code change:** five Maestro YAML flows in `maestro/flows/` + `scripts/maestro-local.sh` runner.
- **Why this won't regress the symptom:** the flows are additive (no app code changed); a failing flow blocks the build pipeline once wired into CI.
- **Flows shipped:**
  - `01-kitchen-loads.yaml` — Kitchen tab renders on cold launch
  - `02-browse-recipe.yaml` — recipe detail screen loads without crashing (catches Rules-of-Hooks class)
  - `03-cook-mode-loads.yaml` — entering cook mode does not crash; asserts step content visible
  - `04-pantry-tab-loads.yaml` — Pantry tab loads without crashing
  - `05-shop-add-missing-persists.yaml` — HONE-007 regression: items added via "Add missing" survive Shop tab's reconcile() sweep

**Where the suite runs (Phase 1 — now):** Patrick's physical Android device via USB ADB.
  - Install Maestro CLI once: `curl -Ls "https://get.maestro.mobile.dev" | bash`
  - After each build install: `./scripts/maestro-local.sh`

**Where it should run (Phase 2 — once 10+ stable flows exist):** GitHub Actions, as a dependent job in `eas-build.yml`, after the APK artifact is uploaded. Uses `reactivecircus/android-emulator-runner@v2`, API 26 emulator, downloads APK artifact, runs `maestro test maestro/flows/`. A commented-out stub is ready in `.github/workflows/maestro-e2e.yml` — uncomment when the suite is ready.

Per R-015: not self-closing. Awaiting Patrick's on-device validation.
