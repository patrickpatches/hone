# Hone Session Report — 31 May 2026

**Session:** Senior Engineer — HONE-016 Maestro screen-testing harness
**Build:** #135 (docs/infra only — no app code changed, no EAS dispatch)

---

## What was built

### HONE-016 — Maestro screen-testing harness

Five Maestro YAML flows that can be run against an installed Hone APK on Patrick's
Android device before he validates any build. These are smoke tests, not a full
regression suite — they catch the crash-class bugs that tsc and R-014 cannot see.

| Flow | What it guards |
|---|---|
| `01-kitchen-loads.yaml` | Kitchen tab renders on cold launch |
| `02-browse-recipe.yaml` | Recipe detail screen loads (catches Rules-of-Hooks crash, #129/#131) |
| `03-cook-mode-loads.yaml` | Cook mode loads; step content renders (Hummus s1 body — cook-mode-only text) |
| `04-pantry-tab-loads.yaml` | Pantry tab loads without crashing |
| `05-shop-add-missing-persists.yaml` | HONE-007 regression — items added via "Add missing" survive Shop tab's reconcile() |

`scripts/maestro-local.sh` — one-command runner.

`.github/workflows/maestro-e2e.yml` — CI stub (fully commented out, ready to uncomment).

---

## Recommendation: where to run the suite

**Phase 1 (now): Patrick's physical Android device via USB ADB.**

Why not CI yet:
1. `eas-build.yml` is `workflow_dispatch` — there is no push-triggered APK to hook
   Maestro onto automatically. CI Maestro would still need Patrick to trigger it manually,
   which is no faster than running locally.
2. Android API 26 emulators in GitHub Actions take 3–5 minutes to boot and 2–3 minutes
   to install + warm the app. Five flows on real hardware takes ~3 minutes total.
3. Real hardware catches Fabric/native-driver interactions that emulators don't
   reproduce — the v5 crash class (#124) is the canonical example.

**To run Phase 1:**
```bash
# Once: install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# After each build install, with device connected via USB and USB debugging on:
./scripts/maestro-local.sh
```

**Phase 2 (when to wire into CI): once the suite has 10+ stable flows.**
The commented-out `.github/workflows/maestro-e2e.yml` is the right hook — a
`workflow_dispatch` job that takes a `run_id` input pointing to an `eas-build.yml`
artifact, downloads the APK, starts an API 26 emulator, and runs the flows.
Uncomment it then; don't touch it now.

---

## Why this matters

Three builds in a row were lost to runtime crashes that static checks couldn't detect:
- Build #124 — v5 Fabric/native-driver mismatch. tsc: clean. R-014: clean.
- Build #129 — Rules-of-Hooks violation. tsc: clean. R-014: clean.
- Build #130 — diagnostic only (ErrorBoundary); root cause from #129 unresolved.

Flow `02-browse-recipe.yaml` would have caught #129 on Patrick's device in seconds
rather than after a wasted EAS build cycle. Flow `03-cook-mode-loads.yaml` adds the
cook-mode layer that #131 fixed. Flow `05-shop-add-missing-persists.yaml` locks in
the HONE-007 fix from #134.

---

## What Patrick needs to do

1. **Install build #135** (when he triggers EAS).
2. **Install Maestro CLI** on his laptop (one-time): `curl -Ls "https://get.maestro.mobile.dev" | bash`
3. **Run `./scripts/maestro-local.sh`** with his phone connected via USB — confirm all 5 flows pass.
4. **Validate HONE-016** on-device (R-015) and close the GitHub Issue when satisfied.

Flow `05-shop-add-missing-persists.yaml` uses `clearState: true` — it will reset his
app data on his phone as part of the test run. Run it last, or use `maestro test` with
only the other four flows first if he wants to keep his pantry state.

---

## Files added this session

| File | Purpose |
|---|---|
| `maestro/flows/01-kitchen-loads.yaml` | Kitchen smoke flow |
| `maestro/flows/02-browse-recipe.yaml` | Recipe detail crash guard |
| `maestro/flows/03-cook-mode-loads.yaml` | Cook mode crash guard |
| `maestro/flows/04-pantry-tab-loads.yaml` | Pantry tab smoke |
| `maestro/flows/05-shop-add-missing-persists.yaml` | HONE-007 regression lock |
| `scripts/maestro-local.sh` | One-command local runner |
| `.github/workflows/maestro-e2e.yml` | CI stub (commented — Phase 2) |
| `docs/coo/bug-tracker/tickets/HONE-016-maestro-screen-testing-harness.md` | Ticket |
| `docs/sessions/Hone_Session_Report_31_May_2026.md` | This report |

No app code changed. No schema change. No migration. No EAS dispatch.
