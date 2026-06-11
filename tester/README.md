# Agentic usability tester

**What it is:** Claude operating the real APK on a real emulator, as a real person —
a rushed mum, a 61-year-old first-timer, a waste-conscious pantry cook, a bloke
mid-cook with greasy hands. It taps, scrolls, types, gets lost, gets annoyed, and
writes up every piece of friction against a kitchen-specific usability rubric.

**Why it exists:** Maestro tells us flows *work*; the startup smoke tells us the app
*boots*. Neither tells us the app feels like a calm head chef. This layer judges the
experience — taps per task, glanceability, honest substitutions, chef credit — the
axes we're beating Supercook and Yummly on.

**What it is not:** a replacement for Patrick on a real phone (R-015 — only Patrick
closes tickets, on-device), or for watching real humans before launch. It's the
tireless pre-filter that catches regressions weekly and before they reach people.

## The three test layers

| Layer | Question | Cost | When |
|---|---|---|---|
| `startup-smoke.yml` | Does it boot to Kitchen? | free | every build |
| `maestro/flows/` | Do the key flows still work? | free | startup-smoke now; full suite is Phase 2 |
| `usability-test.yml` (this) | Is it actually *good* to use? | ~US$5–15 in API tokens per full run | weekly + on demand |

## Files

- `agent.mjs` — the harness. Screenshot + accessibility tree → Claude decides an action → adb executes → repeat. Manual tool loop on `claude-opus-4-8` with adaptive thinking; old screenshots are pruned from context to keep cost flat.
- `personas.json` — who tests and what they try. Add a persona/task here; no code changes needed.
- `heuristics.md` — the rubric: Nielsen as the floor, plus kitchen-context heuristics (glanceability, messy hands, doneness cues) and the 3 Golden Rules (chef credit, honest scaling, honest substitutions).
- `output/<run>/` — gitignored. `usability-report.md`, `findings.json`, and a screenshot per step.

## Running it

**CI (normal path):** Actions → "Usability test (agentic)" → Run workflow. Optionally pass an eas-build run id and a persona filter. Also runs every Monday 6am AEST against the latest successful build. Requires the `ANTHROPIC_API_KEY` repo secret.

**Locally** (emulator running, APK installed — see `docs/dev-emulator-setup.md`):

```sh
cd tester && npm install
export ANTHROPIC_API_KEY=sk-ant-...
node agent.mjs                          # all personas (~30-60 min)
PERSONAS=weeknight-rush node agent.mjs  # one persona
```

## Findings → Bug Lord

The agent **never files or closes issues itself**. `findings.json` entries are
written Bug-Lord-ready (title, severity, heuristic, detail, fix suggestion,
screenshot reference); whoever triages — the Bug Tester worker, the COO, or
Patrick — decides what becomes a GitHub Issue. Severity meanings are in
`heuristics.md`. The CI job goes red only on **blocker** findings, so the weekly
run can't cry wolf.

## Honest limits

- The agent reads the screen better than it feels lag — sub-second jank can slip past it. Keep profiling on real devices.
- It tests on a cold-state emulator: no real network flakiness, no incoming calls. Offline/interruption behaviour still needs the manual regression checklist.
- An emulator pass is **not** an on-device pass (CLAUDE.md rule). This narrows what Patrick has to check by hand; it doesn't replace it.
