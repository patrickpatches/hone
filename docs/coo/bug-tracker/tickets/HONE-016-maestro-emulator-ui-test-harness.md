# HONE-016 — Build automated screen-testing so the tester can tap through the app (Maestro + emulator)

```
TYPE:            Task
SEVERITY:        P2
CATEGORY:        Flow
SCREEN:          Other
RECIPE:          
ASSIGNEE:        Engineer
EPIC:            (none)
FOUND IN BUILD:  n/a (test infrastructure)
FIX ATTEMPTED:   (blank)
TARGET BUILD:    (before closed testing)
REPRODUCIBLE:    n/a
DEVICE:          Android emulator / device
GOLDEN RULE:     none
ROOT CAUSE:      The automated Bug Tester (scheduled task `hone-bug-tester`) is code-level only — it reads code, it can't drive the running app. Visual/tap bugs (e.g. HONE-008 cluttered top, HONE-011 stray blue line) are invisible to it. Phase two is a Maestro + emulator harness that runs the launch-critical journeys against the real app.
```

**GitHub Issue:** — · **Filed:** 2026-05-31 · **Reporter:** COO

---

## What this is

Phase two of the testing system. The scheduled Bug Tester catches the code-level class of bug. This ticket gives it (and Patrick) eyes on the *running* app: a Maestro flow suite driven against an Android emulator, run automatically, feeding results back into Bug Lord.

## What's needed (Engineer, Claude Code lane)

1. Add Maestro to the repo: a `.maestro/` flows directory + a runner script (`scripts/run-ui-tests.sh`).
2. Author flows for the launch-critical journeys: Kitchen loads; search; open a recipe; add-missing-to-shopping-list; cook-mode step navigation (the v5/v7 crash area — high value); servings scaling; pantry "cook with what you have".
3. Add stable selectors (`testID` / `accessibilityLabel`) to the components those flows touch. Real RN code, but additive — no schema change, no behaviour change.
4. Stand up the run environment and **recommend where the suite runs autonomously**: local (Patrick's PC + Android SDK, driven by Claude Code) vs GitHub Actions emulator vs Maestro Cloud. Give the trade-off and your pick; flag any cost.
5. Emit machine-readable results (pass/fail per flow) the Bug Tester can read and turn into tickets + Bug Lord updates.

## COO TRIAGE — 2026-05-31

- **Severity:** P2 — not a defect, but real launch-confidence infrastructure. Should land before closed testing so testers don't hit obvious screen bugs.
- **Decision needed:** where the suite runs (local vs CI vs Maestro Cloud) — Engineer recommends, Patrick/COO confirm (cost + reliability).
- **Blocks:** nothing hard; strengthens the "Private test" and closed-testing stages.
- Pairs with the scheduled tester [[feedback_check_bug_lord]].
