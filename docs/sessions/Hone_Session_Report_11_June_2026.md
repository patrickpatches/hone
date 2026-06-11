# Hone Session Report — 11 June 2026

**Role:** Senior Engineer (Claude Code)
**Branch:** `claude/app-tester-usability-c2qypv`
**Build triggered:** No — test infrastructure only, no app code touched

---

## What was built — the agentic usability tester

Patrick asked for "an app tester that can actually use the app and do world-class
usability testing". Verdict: built. Claude now drives the real APK on a CI
emulator as four personas, judges every screen against a kitchen-specific rubric,
and writes a findings report. New top-level `tester/` directory + a weekly
GitHub Actions workflow.

### Why this shape

We already had two layers: the startup smoke ("does it boot?") and Maestro flows
("do the flows work?"). Both are deterministic — they can never tell us the app
*feels* wrong. The missing layer is judgement: taps per task, glanceability at
arm's length, honest substitutions, chef credit visible. That requires an agent
that actually *uses* the app and can be annoyed by it.

### How it works

1. `usability-test.yml` boots the proven startup-smoke emulator stack (API 26,
   pixel_6, KVM) and installs the latest successful eas-build APK.
2. `tester/agent.mjs` runs one agentic session per persona task: screenshot +
   trimmed accessibility tree (with exact tap coordinates) → Claude
   (`claude-opus-4-8`, adaptive thinking) picks one action → adb executes →
   new screen comes back. Old screenshots are pruned from context so cost stays
   flat over a 30-step task.
3. Personas (`tester/personas.json`): Mel the weeknight rush, Dario the
   61-year-old first-timer, Priya the pantry cook, Tom mid-cook with greasy
   hands. Each has a goal, success criteria, and a step budget — and explicit
   permission to *give up* the way a real user would.
4. The rubric (`tester/heuristics.md`): Nielsen heuristics as the floor, then
   the differentiators — kitchen-context (glanceability, messy-hands targets,
   doneness cues over timers, interruption survival) and the 3 Golden Rules
   (chef credit, honest scaling, honest substitutions), plus accessibility.
5. Output: `usability-report.md` (verdict first), `findings.json`
   (Bug-Lord-ready: title, severity, heuristic, detail, fix suggestion,
   screenshot reference), and every screenshot — uploaded as a CI artifact.

### Guardrails (deliberate)

- **Never files or closes issues.** Findings are triage candidates; R-015 stands.
- **CI goes red only on blockers** — major/minor land in the report, so the weekly run can't cry wolf.
- **Weekly + on-demand, not per-push** — each run costs ~US$5–15 in API tokens; the free deterministic layers stay on every build.
- **Doesn't replace on-device checks** — an emulator pass is not an on-device pass; the report narrows what Patrick checks by hand.

### Verified

- `node --check` passes on the agent; workflow YAML and personas JSON parse clean.
- `npm install` in `tester/` resolves `@anthropic-ai/sdk@0.88.0` and the SDK loads.
- Not yet run end-to-end: needs the `ANTHROPIC_API_KEY` repo secret (added as
  item 0 on Patrick's action list) and an emulator. First real run = trigger
  "Usability test (agentic)" from the Actions tab once the secret is in.

### Files

- `tester/agent.mjs`, `tester/personas.json`, `tester/heuristics.md`, `tester/README.md`, `tester/package.json`
- `.github/workflows/usability-test.yml`
- `docs/FILE_MAP.md`, `docs/patrick-action-list.md`, `.gitignore` — updated

### Follow-ups

1. Patrick: add the `ANTHROPIC_API_KEY` secret, then dispatch the workflow once to shake it down.
2. After 2–3 clean weekly runs: consider growing the Maestro suite toward the 10-flow bar so the deterministic e2e layer (currently a stub) can also go live per-build.
3. Before launch: 3–5 real humans on real phones. The agent is the pre-filter, not the finish line.
