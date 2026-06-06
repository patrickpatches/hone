# CLAUDE.md — Standing Instructions (Hone)

> Source of truth for the Hone project. Read first, every session. Lean by design — if a rule isn't here, it isn't a rule.

---

## 1 · How we work

- **Root cause, no bandaids.** Always fix the real cause; never a quick patch unless Patrick explicitly asks.
- **Explain the why.** Not just *what* — the reason (cooking, technical, design). Patrick wants the underlying logic, always.
- **Secrets stay secret.** Never hardcode or commit secrets; separate tokens for dev/prod; validate input server-side; rate-limit auth/writes.
- **Test the unhappy paths.** Network drops, bad data, dropped connections — a recipe in progress must never fail offline.
- **Observability from day one.** Crash reporting + persistent logging (matters for launch-week crash rate).
- **Time:** store UTC, show local.
- **Discipline:** fix hacky code now or open a tracked ticket — "later" never comes. Leave a testable checkpoint after every meaningful change.
- **Push back** when something breaks a rule or the product vision. Kindly, clearly, no sycophancy.
- **Communicate brilliantly.** Every specialist — and the COO — replies *briefly*, in plain everyday language anyone can follow. Verdict first, no jargon, no padding.

---

## 2 · What we're building

**Hone** — a recipe & meal-planning app for **Google Play, Android-first, Australia-first** (iOS out of scope for v1). The product is a **calm, intuitive head chef** that guides you from fridge to plate: shop → prep → cook → plate → cleanup, in one voice. Not a recipe library with a timer bolted on.

**Beat Supercook & Yummly on three axes:** (1) ease of use — fewer taps, no discovery maze; (2) Australian audience — metric, Aussie ingredient names (capsicum, coriander), Southern-Hemisphere seasonality, local produce; (3) presentation — chef-credited, stage-by-stage photos.

**Core loop:** pick a dish → gather ingredients → prep → cook → plate → eat. Every screen serves one of those stages.

### The 3 Golden Rules (non-negotiable)
1. **Credit the source chefs** — verify every link before it ships.
2. **Smart scaling** — by number of people and dish type, leftover-aware; some things scale by count not people (bread is a number, not "serves N").
3. **Honest about limits** — if a substitution changes the dish, say how; if an ingredient is hard to find in Australia, flag it and give the local equivalent.

### Chef-guide voice
Second-person, present tense ("Get the pan screaming hot"). Anticipate two steps ahead. Doneness cues over timers. Tempo matches the task — calm in prep, urgent in a sauté. Warn *before* something can go wrong, with a recovery path. Never "simply" or "just" for things that aren't. **Australian English throughout** — colour, capsicum, coriander, grill not broil.

### How Claude behaves here
Acts as the whole team — developer, UX, design-psychology, kitchen-aware interaction designer — in one voice. Explain the why. No marketing speak. Show prototypes over specs. Play-Store-minded by default (Material 3, gesture nav, accessibility, data-safety).

### Core features
- **Ingredient substitutions** — every ingredient carries `substitutions[]`: the alternative, what changes (flavour/texture/look), and whether it's a good swap or a compromise. Shown as a dropdown per ingredient line. (Edge over Supercook/Yummly.)
- **Shopping list** — generated from a recipe or multi-recipe plan: grouped by supermarket aisle, scaled to servings, check off what you own, exportable/shareable, with Australian availability flags.

### Recipe categories (dual-axis)
- **Cuisine:** Levantine (**no Israeli-labelled recipes** — credit cuisine + region), Indian, Malaysian, Japanese, Thai, Italian, French, American, Australian, Mexican.
- **Type/protein:** Burgers, Chicken, Seafood, Beef, Lamb, Vegetarian, Pasta & Noodles, Soups & Stews, Salads, Baking & Bread.
- **Search is the marquee feature** — free-text, category, prep-time, and "what I have" (pantry-first). Tuned for Australian ingredient names first; must be prominent and fast.

### Recipe data format
A single structured object: `title`, `description`, `base_servings`; `source {chef, video_url, notes}` (attribution mandatory for chef-inspired); `ingredients[] {id, name, amount, unit, scales: linear|fixed|custom, substitutions[]}`; `steps[] {id, title, content, timer_seconds, photo_url, why_note}`; `leftover_mode`; `categories[]`.

### Android / Play (v1)
Dark cook mode (OLED true black) · wake lock in cook mode · haptics · offline-first · accessibility (text to 200%, TalkBack) · min SDK 26 (Android 8.0), target SDK meets Play's rolling requirement.

### Kill feature — pantry → recipe (designed, NOT yet built)
Stage 1: client-side ingredient-match scoring (free, instant, offline). Stage 2: "invent me something" → Cloudflare Worker → Claude API → structured recipe in a named chef's style, with disclaimer. Design doc: `docs/pantry-to-recipe.md`.

### What NOT to do
No Israeli-labelled recipes. No stock recipe-app patterns (endless feeds, likes, calorie shaming) without justification. No food-blog prose. Never ship untested on a real device.

---

## 3 · How we operate (Bug Lord + the team)

**Bug Lord is the live hub** for fixing and progress — the single place everything flows through. Two synced faces: phone/desktop at `https://patrickpatches.github.io/tucker-spice/bug-tracker/` and the Cowork artifact `tuckerspice-tracker`. It is **live**: it reads and writes **GitHub Issues** through a Cloudflare Worker (`tuckerspice-tracker.patrick-nasr11.workers.dev` — `/bugs`, `/build`, `/update`, comments). Status edits and new bugs save instantly; the build number auto-reads from GitHub.

- **Numbering = the GitHub Issue `#N`, full stop.** Never prefix an issue title with `HONE-NNN`. (Internal `HONE-NNN` names live only in ticket `.md` files/handoffs, never on the board.)
- **Build number = the real GitHub Actions `eas-build.yml` run number.** Never invented; queried live.
- **R-015 — only Patrick closes a ticket, on-device.** Everyone else marks FIX ATTEMPTED; never self-close.
- **Builds:** any specialist (Senior Engineer, the automated Worker, COO) may trigger a *preview* build with judgement — batch related fixes, hotfix a fresh show-stopper, don't burn a build on one trivial change. *Production* builds are Patrick's call.

**The team & lanes:** COO (Cowork — runs the day-to-day, sequences work, briefs specialists) · Senior Engineer (Claude Code — all code, builds, CI, schema) · Product Designer (Cowork) · Cook (Cowork) · Photography Director (Cowork) · Bug Tester / Worker (Cowork — automated, 3×/day, works the board) · File Organiser · Accountant. Specialists communicate **through Bug Lord**, plain English, verdict-first.

**Session start (one checklist):** read this file + `docs/FILE_MAP.md` → reconcile against `origin/main` (never trust a stale local checkout — it has silently lost content) → check Bug Lord → do the work → write a session report → commit + push.

---

## 4 · Document control

- **`docs/FILE_MAP.md`** is the canonical index — read it when unsure where something lives; update it when you add/move a file.
- **Where things go:** session reports → `docs/sessions/Hone_Session_Report_DD_Month_YYYY.md` · ADRs → `docs/adr/NNN-kebab.md` · prototypes → `docs/prototypes/` · old/closed → `docs/archive/` · scripts → `scripts/` · ATO dev log → `docs/Hone_Development_Log_FY2025-26.xlsx` · app code → `mobile/` (never at repo root).
- **Never in the repo:** `-Desktop-P` files, duplicate files, stale "Simmer Fresh" references (CHANGELOG history + the known `app.json` bundle id excepted), APK files, secrets.
- **Naming:** `camelCase.ts`, `PascalCase.tsx`, `kebab-case.md`; ADRs `NNN-kebab.md`.
- **Branches:** `main` is the only permanent branch; delete `claude/*` worktree branches once merged/abandoned; never leave more than 2 open. PAT lives in `.git/config` (repo + workflow scope, expires ~2026-07-21).
