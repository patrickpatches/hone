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

---

## Part 2 (same session) — The Bread Bench prototype

Patrick parked the usability tester (needs the API-key secret) and asked for "the
world's greatest interactive sourdough, tortillas and fluffy pita guide" — Perfect
Loaf depth, Australian terminology, metric, with equipment/flour swaps producing
unique instructions.

**Built:** `docs/prototypes/bread-guide-v1.html` — a fully working interactive
prototype (prototypes over specs, per CLAUDE.md), single self-contained file.

### What makes it different from every existing bread app

The recipe is **computed, not written**. Inputs: flour (bakers/plain/wholemeal/
spelt), equipment (dutch oven, camp oven over coals, tray + steam, loaf tin; comal
equivalents and BBQ flatplate for the flatbreads), kitchen temperature (16–32°C
slider), quantity, schedule (overnight cold proof vs same-day; yeast vs sourdough
starter for pita). Outputs: hydration, formula in baker's percentages, fermentation
hours (temperature model: rate ~doubles per 8°C), the actual instruction sentences,
and a timeline that back-calculates from "I want bread by Friday 4pm" to "build
your levain Thursday 3:21pm". Every step carries a doneness cue ("The dough tells
you"), a why-note, and pre-emptive rescue advice. Honest-swap notes state what each
choice costs (house voice: honest about limits). Inline SVG line-art teaches
technique (stretch-and-fold, batard shaping, scoring angle, windowpane, rolling
thickness gauges, the puff sequence); photo slots carry inline briefs for the
Photography Director.

### Verified

Headless Chromium (Playwright) walkthrough: 9/9 functional checks pass — flour
swap changes hydration + notes, temp slider rewrites bulk time and warnings, gear
swap rewrites the bake step, count scaling, pita yeast↔starter timeline re-plan,
target-time back-calculation. No JS errors (Google Fonts falls back to system
fonts offline). Screenshots reviewed against brand tokens.

### Follow-ups (part 2)

1. Patrick: open `docs/prototypes/bread-guide-v1.html` in a browser, play with the bench, make the direction call.
2. If approved: engineer ticket to port the adaptive engine into the app — the recipe schema needs a `variants`/`computed` concept (ingredients + step text as functions of config), which is a schema decision worth an ADR.
3. Cook to validate the baking content (formulas, temps, times) per the culinary-audit process; Photography Director to pick up the four inline photo briefs.

---

## Part 3 (same session) — Bread Bench v2: full design & UX overhaul

Patrick asked for a complete design/UX rebuild with full creative licence.
**Built:** `docs/prototypes/bread-guide-v2.html`, superseding v1's
single-document layout.

### Design thesis

Baking has two contexts that deserve two designs:

- **Planning** (couch, daylight, reading): warm flour-paper editorial surface —
  Fraunces display, Newsreader body, Archivo UI — progressive disclosure
  home → setup → plan, one decision per group with "whisper" honesty notes at
  the moment of choice, a live CTA that previews consequences (hydration, bulk
  time) before committing, and a visual mass bar for the formula.
- **Executing** (kitchen, floury hands, arm's length): **Oven Mode** — true
  black, one step per screen, 40px serif step titles, the doneness cue as the
  hero element, why/rescue folded behind disclosure, "while you're here"
  anticipation hints, built-in step timers (fold intervals, proofs, the cool),
  screen wake-lock, giant thumb-zone Back/Next, and a persistent
  **"Something's wrong?"** rescue button opening contextual troubleshooting as
  a bottom sheet — mid-bake, where it's actually needed.

### Research applied

Progressive disclosure · thumb-zone primary actions · glanceability type scale
for distance reading · recognition-over-recall (the computed plan travels into
oven mode) · anticipation two steps ahead (house voice) · honest-swap notes at
decision time. Same computed-recipe engine as v1 (no content regression).

### Verified

Headless Chromium full-journey walkthrough: 14/14 checks pass (setup whispers,
live CTA, computed plan summary, mass bar, ready-by back-calc, oven step flow,
running timer, rescue sheet open/close, finish-exits-to-plan, pita
starter cross-over). Zero JS errors. Visual review surfaced and fixed two
issues: rescue FAB overlapping the timer button, and a missing explicit close
affordance on the rescue sheet (plus Escape-to-close).

### Follow-ups (part 3)

1. Patrick: direction call on v2 vs v1 — v2 is the recommendation.
2. The light "morning bakery" planning palette intentionally diverges from the
   app's current dark theme — if approved, decide whether bread-guide ships as
   its own visual world (like cook mode already does) or the palette feeds the
   broader recipe-detail-v7 direction call.

---

## Part 4 (12 June) — real stage photos in the Bread Bench

Patrick asked for accurate images in the placeholders (personal project — golden
rules relaxed for this prototype by his instruction).

**How:** the remote sandbox can't reach image CDNs, so a disposable CI workflow
downloaded a 21-image candidate pool from Pexels to a temp branch; every
candidate was then **visually inspected** and picked or rejected on accuracy.
Rejected: 3 "tortilla" shots that were actually filled tacos (one corn, not
flour), a pasta-machine shot, red novelty dough, a pale honey-crust loaf (the
exact colour the guide warns against), a challah mislabelled as pita. Kept 4:

| Slot | File | Why it won |
|---|---|---|
| Sourdough · Shape | `assets/bread/sourdough-shaping.jpg` | Cupped hands, taut round, floured bench — textbook preshape tension (Skyler Ewing) |
| Sourdough · Bake | `assets/bread/sourdough-loaf-ear.jpg` | Deep mahogany boule with a proud ear + banneton — literally illustrates "darker than feels polite" (Geraud Pfeiffer) |
| Tortillas · Roll | `assets/bread/tortilla-rolling.jpg` | Pale round rolled centre-out — moved the figure from Cook to Roll to match |
| Pita · Bake | `assets/bread/pita-fresh.jpg` | Barely blonde, char freckles — the guide's exact doneness cue (Polina Tankilevitch) |

Images are **local repo assets** (offline-first; the kitchen has no wifi
guarantee) with credit-linked captions, the Photography Director's brief kept
inline ("our shot, when we shoot it"), and an onerror fallback to the brief —
a broken-image icon can never appear. The Cook-step pan shot remains brief-only
(no accurate candidate found). Verified: images render in headless Chromium,
fallback engages on a missing file, full journey suite still passes.

**Housekeeping:** fetch workflow deleted after use; candidate pool removed.
The git proxy refused remote deletion of `claude/bread-assets-tmp` — **Patrick:
one-click delete it in GitHub UI** (branch rule: max 2 open claude/* branches).
Also noted: `usability-test.yml` is dispatch-only and GitHub registers those
from `main` — it becomes triggerable once this branch merges.

---

## Part 5 (12 June) — every slot sourced + the bench learns your kitchen

Patrick: source all images myself (no photographer-pending placeholders) and
make the app better — thoughtful, no overload.

**Images:** added the fifth verified photo — a cut loaf showing crumb on a
near-black background (Marcel Fiedler), placed in the Cool step as the payoff
shot. Photographer-brief machinery removed entirely; captions are now one line
with a credit link. Deliberate non-additions: the tortilla-pan and pita-balloon
moments keep their sequence diagrams instead of photos — no accurate candidate
existed across three fetch rounds, and the line art teaches those moments
better than a static photo would. A photo must out-teach the diagram to earn a
slot. (Round-3 scraper note: Pexels bot-blocks even Actions runners' page
scrapes; only direct CDN image URLs by known ID work.)

**Three upgrades, all invisible until needed:**
1. **Bake Log lite — the bench learns your kitchen.** Finishing a bake asks two
   taps (rise vs plan: faster/spot-on/slower · result: dense/right/over). Each
   answer nudges a per-bread calibration factor (×0.9 / drift-to-1 / ×1.15,
   clamped 0.7–1.5) applied to every fermentation model. Setup then whispers:
   "Your kitchen note: past bakes ran slower than planned here, so every time
   below is already nudged +15%." Home shows a one-line log count.
2. **Fan-forced toggle** (sourdough + pita): every oven temperature in the
   steps states the number for *your* oven — no mid-bake mental arithmetic.
3. **Choices persist** (localStorage) — reopen the guide, your bench is as you
   left it.

**Verified:** 10/10 new-feature checks (fan conversion 260→"240°C fan-forced",
debrief flow, log + cfg persistence across reload, +15% kitchen note after a
"slower" answer, crumb photo renders, zero brief boxes left) and the original
14-check journey suite re-passes. Fetch workflow + candidate pool removed again.
