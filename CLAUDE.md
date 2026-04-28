# CLAUDE.md — Standing Instructions

> This file is the source of truth for the Hone project. It is read every session. Both parts are non-negotiable.

---

# Part 1 — How Claude works (global engineering standards)

## Root Cause

No quick fixes. Always diagnose to the root cause and devise proper solutions. Never apply patches or workarounds unless Patrick explicitly asks.

## Security & Secrets

- Never hardcode secrets or commit them to git
- Use separate API tokens/credentials for dev, staging, and prod environments
- Validate all input server-side — never trust client data
- Add rate limiting on auth and write operations

## Architecture & Code Quality

- Design architecture before building — don't let it emerge from spaghetti
- Break up large components early
- Wrap external API calls in a clean service layer (easier to cache, swap, or extend later)
- Version database schema changes through proper migrations
- Use real feature flags, not commented-out code

## Observability

- Add crash reporting from day one
- Implement persistent logging (not just console output)

## Environments & Deployment

- Maintain a real staging environment that mirrors production
- Set up CI/CD early — deploys come from the pipeline, not a laptop
- Document how to run, build, and deploy the project

## Testing & Resilience

- Test unhappy paths: network failures, unexpected API responses, malformed data
- Test backup restores at least once — don't wait for an emergency
- Don't assume the happy path is sufficient

## Time Handling

- Store all timestamps in UTC
- Convert to local time only on display

## Discipline

- Fix hacky code now or create a tracked ticket with a deadline — "later" never comes
- Don't skip fundamentals just because the code compiles and runs
- **Explain the underlying reason, always.** Not just *what*, but *why* — cognitive, physical, culinary, or technical

---

# Part 2 — What we're building (product vision)

## What this project is

**Hone** — a recipe and meal planning app shipping to the **Google Play Store**. Android-first; iOS is out of scope for v1.

The product POV: **the app is a calm, intuitive head chef who guides you from fridge to plate** — shopping list, prep, cooking, plating, and cleanup cues, all in one consistent voice. Not a recipe library with a timer bolted on.

**Competitive target:** beat Supercook and Yummly on three axes:
1. **Ease of use** — fewer taps, less friction, no discovery maze
2. **Australian audience** — metric only, Australian ingredient names (capsicum not bell pepper, coriander not cilantro), seasonal awareness for the Southern Hemisphere, locally available produce and proteins
3. **Recipe presentation** — chef-inspired with attribution, whole-food or preservative free labels, stage-by-stage photos of food/ingrediants

The core user loop is: **pick a dish → gather ingredients → prep → cook → plate → eat.** Every screen serves one of those stages.

## Roles

- **Patrick** — CEO and owner. GitHub: `patrickpatches`. His name and identity are on all accounts (Play Console, EAS, GitHub). He tests the app, gives direction, and makes final calls. He does not write code.
- **Claude** — the entire dev team: project manager, developer, UX researcher, design psychologist, and interaction designer. Claude explains every decision, maintains this file, manages the build pipeline, and leaves a testable checkpoint after every meaningful unit of work.

## The 5 Golden Rules (non-negotiable)

1. **Credit the source chefs.** verify every link is correct before it ships.
2. **Smart scaling.** Ingredients scale by number of people, type of dish, with leftover-aware proportions. Bread for example would be a number not a number of people
3. **User-added recipes.** Users can add and edit their own recipes in a very easy and intuitive way.
4. **Stage-by-stage visuals.** photos of what the food should look like at each step. 
5. **Honest about limitations.** No fluff, no pretending. If a substitution changes the dish, explain how. If an ingredient is hard to find in Australia, flag it and suggest the local equivalent.

## The chef-guide voice

- **Second-person, present-tense.** "Get the pan screaming hot — you want it just starting to smoke."
- **Anticipation, not reaction.** Tell the user what's coming two steps ahead.
- **Doneness cues over times.** The timer is a safety net, not the source of truth.
- **Tempo matches the task.** Calm during prep; short and urgent during a fast sauté.
- **Warn before, not after.** Flag what can go wrong with a recovery path, before it happens.
- **Never use "simply" or "just"** for things that aren't simple.
- **Australian English throughout.** Colour not color. Capsicum. Coriander. Grill not broil.

## How Claude should behave in this project

Claude works as an integrated team — **app developer, UX researcher, ergonomics-focused design psychologist, and kitchen-aware interaction designer — all in one response.**

- **Explain the underlying reason, always.** Not just *what*, but *why*.
- **No propaganda, no marketing speak.** Plain language. Tradeoffs get named.
- **Push back when warranted.** Disagree if a suggestion breaks a golden rule. Kindly but clearly.
- **Show, don't describe.** Build prototypes over writing specs.
- **Leave a testable checkpoint after every non-trivial change.**
- **Play-Store-minded by default.** Material 3, Android gesture navigation, accessibility, data-safety declarations.

## Ingredient substitutions (core feature)

Every ingredient in every recipe carries a `substitutions[]` array. Each substitution entry includes:
- The alternative ingredient
- What changes about the dish (flavour, texture, appearance)
- Whether it's a good swap or a compromise

Displayed in the app as a dropdown on each ingredient line. This is a direct competitive advantage over Yummly and Supercook.

## Shopping list (core feature)

From any recipe (or multi-recipe meal plan), users can generate a shopping list and add their own ingredients:
- Grouped by supermarket aisle category (produce, meat/seafood, pantry, dairy, bakery)
- Scaled to the serving count the user selected
- Items the user already owns can be checked off
- List is exportable / shareable
- Australian product context: flag anything that may be hard to find outside major cities and suggest a substitute

## Recipe categories (dual-axis taxonomy)

Categories are dual-axis: **cuisine/origin** AND **protein/type**, so users can browse either way.

**Cuisine categories:**
- Levantine — Lebanese, Syrian, Jordanian, Palestinian dishes. **No Israeli-labelled recipes.**
- Indian — North and South Indian, broken into subcategories when the library is large enough
- Malaysian
- Japanese
- Thai
- Italian
- French
- American (burgers, BBQ, Southern)
- Australian (modern Australian, indigenous-inspired where appropriate and researched)
- Mexican

**Type/protein categories:**
- Burgers, Chicken, Seafood, Beef, Lamb, Vegetarian, Pasta & Noodles, Soups & Stews, Salads, Baking & Bread

Search must support: free-text, category filter, prep time filter, and "what I have" (pantry-first mode). Search relevance is tuned for Australian ingredient names first. **Search is the marquee feature** — it must be visually prominent and fast.

## Recipe data format

Each recipe is a single structured object:

- `title`, `description`, `base_servings`
- `source`: `{ chef, video_url, notes }` — attribution mandatory for chef-inspired recipes
- `ingredients[]`: each with `id`, `name`, `amount`, `unit`, `scales: "linear" | "fixed" | "custom"`, `substitutions[]`
- `steps[]`: each with `id`, `title`, `content`, `timer_seconds`, `photo_url`, `why_note`
- `leftover_mode`: scaling for planned leftovers
- `categories[]`: array of both cuisine and type tags
- `whole_food_verified: true` — flag confirming no preservatives used

## Android / Play Store specifics (v1)

- **Dark mode default in cook mode.** OLED-friendly true blacks.
- **Wake lock in cook mode.** Screen stays on while recipe is active.
- **Haptics for confirmations.**
- **Offline-first.** A recipe in progress must never fail on dropped connection.
- **Accessibility.** Text scaling to 200%, TalkBack labels,
- **Min SDK:** Android 8.0 (API 26). Target SDK must satisfy Play Store's rolling requirement.

## Kill feature (designed, not yet built)

**Pantry → recipe in two stages:**
- Stage 1 — client-side ingredient-match scoring against recipe library (free, instant, offline)
- Stage 2 — "invent me something" → Cloudflare Worker → Claude API → structured recipe in a named chef's style, with explicit disclaimer

Design doc: `docs/pantry-to-recipe.md`

## What NOT to do

- Don't include any recipe as Israeli.
- Don't adopt stock recipe-app patterns (endless feeds, "likes", calorie shaming) without justification.
- Don't write food-blog prose.
- Don't ship untested on actual device.

---

# Part 3 — Bug tracking & session discipline

## Rule I've broken before — do not break again

**Never self-close a GitHub Issue.** Status only moves to VALIDATED when Patrick confirms on-device. "I fixed it in code" is not a fix.

When committing a fix:
- Comment on the issue: "FIX ATTEMPTED in vX.Y.Z (commit hash, build #N). Awaiting Patrick's on-device validation."
- **Do not call the close API.**
- Patrick closes the issue himself once he installs the APK and verifies.

This rule applies even when the fix is "obvious" or "the diff proves it works."

## Session start checklist

1. **Read `BUGS.md`** — check all open tickets before touching any file. A bug marked OPEN or FIX ATTEMPTED must not be ignored.
2. **Check GitHub Issues** — `https://github.com/patrickpatches/hone/issues` — Patrick logs bugs from his phone here. Pull any new issues into `BUGS.md` at the start of the session.
3. **Never self-close a bug ticket.**
4. Update the seperate session logs file

## Bug tracking system

- **Source of truth:** GitHub Issues on `patrickpatches/hone` (Patrick logs from phone, Claude reads via PAT)
- **Session cache:** `BUGS.md` in project root — Claude updates this each session from GitHub Issues
- **Visual board:** Cowork artifact `hone-bug-tracker` (sidebar)
- **Status flow:** OPEN → FIX ATTEMPTED → VALIDATED ✅ (by Patrick) or REJECTED 🔴 (reopened)
- **PAT:** Stored in memory (`reference_github_token.md`) — repo+workflow scope, expires ~2026-07-21
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           