# CLAUDE.md — Standing Instructions

> This file is the source of truth for the Simmer Fresh project. It is read every session. Keep it current.

## What this project is

**Simmer Fresh** — a recipe and meal planning app shipping to the **Google Play Store**. Android-first; iOS is out of scope for v1.

The product POV: **the app is a calm, intuitive head chef who guides you from fridge to plate** — shopping list, prep, cooking, plating, and cleanup cues, all in one consistent voice. Not a recipe library with a timer bolted on.

**Competitive target:** beat Supercook and Yummly on three axes:
1. **Ease of use** — fewer taps, less friction, no discovery maze
2. **Australian audience** — metric only, Australian ingredient names (capsicum not bell pepper, coriander not cilantro), seasonal awareness for the Southern Hemisphere, locally available produce and proteins
3. **Recipe presentation** — chef-inspired with attribution, whole-food only (no preservatives), stage-by-stage photos of real food

The core user loop is: **pick a dish → gather ingredients → prep → cook → plate → eat.** Every screen serves one of those stages.

## Roles

- **Patrick** — CEO and owner. GitHub: `patrickpatches`. His name and identity are on all accounts (Play Console, EAS, GitHub). He tests the app, gives direction, and makes final calls. He does not write code.
- **Claude** — the entire dev team: project manager, developer, UX researcher, design psychologist, and interaction designer. Claude explains every decision, maintains this file, manages the build pipeline, and leaves a testable checkpoint after every meaningful unit of work.

## The 6 Golden Rules (non-negotiable)

1. **Research-backed UX and ergonomics.** Every UX decision must have a reason grounded in cognitive load, motor ergonomics, or proven interaction patterns. If it can't be justified, it doesn't ship.
2. **Credit the source chefs.** Recipes are inspired by and attributed to Andy Cooks, Joshua Weissman, Gordon Ramsay, Anthony Bourdain, and others. Full attribution with links to original videos. No stealing, no laundering ideas without credit.
3. **Smart scaling.** Ingredients scale by number of people, with leftover-aware proportions. A recipe for "4 people with lunch leftovers tomorrow" should produce exactly that, not just 1.25x everything.
4. **User-added recipes.** Users can add and edit their own recipes using the same structured format the app uses internally.
5. **Stage-by-stage visuals.** Real photos of what the food should look like at each step. No glamour-shot-only recipe cards. No AI-generated photos ever.
6. **Honest about limitations.** No fluff, no pretending. If a substitution changes the dish, explain how. If an ingredient is hard to find in Australia, flag it and suggest the local equivalent.

## Whole-food rule (non-negotiable)

**Every recipe uses whole, unprocessed ingredients only. No preservatives.** This means:
- Fresh herbs, not bottled pastes
- Real stocks, not stock cubes (or specify a quality brand as a fallback, with a note on flavour impact)
- No recipes that rely on processed sauces, packaged seasoning mixes, or preserved shortcuts
- If a traditionally preserved ingredient is required (e.g. miso, fish sauce, preserved lemon), it must be the real thing and be called out explicitly

## Ingredient substitutions (core feature)

Every ingredient in every recipe carries a `substitutions[]` array. Each substitution entry includes:
- The alternative ingredient
- What changes about the dish (flavour, texture, appearance)
- Whether it's a good swap or a compromise

Displayed in the app as a dropdown on each ingredient line. This is a direct competitive advantage over Yummly and Supercook.

## Shopping list (core feature)

From any recipe (or multi-recipe meal plan), users can generate a shopping list:
- Grouped by supermarket aisle category (produce, meat/seafood, pantry, dairy, bakery)
- Scaled to the serving count the user selected
- Items the user already owns can be checked off
- List is exportable / shareable
- Australian product context: flag anything that may be hard to find outside major cities and suggest a substitute

## Recipe categories (world-class taxonomy)

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
- Burgers
- Chicken
- Seafood
- Beef
- Lamb
- Vegetarian
- Pasta & Noodles
- Soups & Stews
- Salads
- Baking & Bread

Search must support: free-text, category filter, prep time filter, and "what I have" (pantry-first mode). Search relevance is tuned for Australian ingredient names first.

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

## Decisions locked

| Decision | Choice | Rationale |
|---|---|---|
| App name | Simmer Fresh | |
| Stack | Expo + TypeScript + expo-router + NativeWind | Play Store timeline, single codebase for PWA + native |
| Delivery order | PWA first (Cloudflare Pages), native Android second | Instant phone testing |
| Data | Markdown authoring → SQLite runtime, Zod schema validation | |
| Voice input | **Dropped** | Unreliable in kitchen, mic permission friction |
| Cook mode navigation | Standard tap/swipe — knuckle-tap dropped | Patrick's call |
| Monetization | Free, no ads ever | Pro tier = unlimited pantry-to-recipe generation |
| Photos | 10 hand-shot chef-inspired launch recipes. No AI photos ever | |
| Min SDK | Android 8.0 (API 26) | |
| Measurements | Metric only (grams, mL, °C) | Australian audience |
| Ingredient language | Australian English (capsicum, coriander, etc.) | |
| Recipe sourcing | Andy Cooks, Joshua Weissman, Gordon Ramsay (attributed, inspired) | |
| Whole-food rule | No preservatives in any recipe | Non-negotiable product position |

## Testing pipeline

```
Claude makes a change
    ↓
PWA on Cloudflare Pages updates → Patrick refreshes on phone (30-second loop)
    ↓  (weekly or at milestones)
EAS preview build → .apk installed on phone → native feel, haptics, gestures
    ↓  (when feature-complete)
Play Store internal track → Patrick only
    ↓
Play Store open/closed testing
    ↓
Production release
```

## What Patrick must do personally (cannot be delegated)

1. **Google Play Console** — $25 one-time at play.google.com/console. 1–2 weeks identity verification. Start now — this is the long pole.
2. **Expo/EAS account** — free at expo.dev. Tell Claude the username when done.
3. **GitHub** — account is `patrickpatches`.

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

- **One-handed thumb zone.** Primary actions in the bottom third. Never "Next step" at the top.
- **Dark mode default in cook mode.** OLED-friendly true blacks.
- **Wake lock in cook mode.** Screen stays on while recipe is active.
- **Haptics for confirmations.**
- **Offline-first.** A recipe in progress must never fail on dropped connection.
- **Accessibility.** Text scaling to 200%, TalkBack labels, sufficient contrast in both themes.

## Kill feature (designed, not yet built)

**Pantry → recipe in two stages:**
- Stage 1 — client-side ingredient-match scoring against recipe library (free, instant, offline)
- Stage 2 — "invent me something" → Cloudflare Worker → Claude API → structured recipe in a named chef's style, with explicit disclaimer

Design doc: `docs/pantry-to-recipe.md`

## What NOT to do

- Don't add features before the core loop works (pick → gather → prep → cook → plate).
- Don't use US-centric measurements, ingredient names, or seasonal assumptions.
- Don't label any recipe as Israeli.
- Don't include preservatives, processed shortcuts, or packaged seasoning mixes in recipes.
- Don't adopt stock recipe-app patterns (endless feeds, "likes", calorie shaming) without justification.
- Don't scrape recipes without attribution. Ever.
- Don't write food-blog prose.
- Don't ship untested on actual device.
- Don't use AI-generated food photos.
- Don't reintroduce voice input without Patrick explicitly asking.
- Don't reintroduce knuckle-tap cook mode without Patrick explicitly asking.

## Current status (updated 2026-04-22, session 3)

- **Target launch:** ~June 2026 (~8 weeks). Play Console verification is the long pole.
- **Live prototype:** `simmer-fresh.html` at project root — single-file React + Tailwind, **44 recipes**, core loop + dual-axis categories + Phase 4 shopping list. Deployed to GitHub Pages as `index.html`.
- **Phase 3 ✅:** Recipe library expanded to 44 recipes. All cuisines represented. Attribution on every recipe.
- **Phase 4 ✅:** Shopping list grouped by aisle (Produce/Meat & Seafood/Dairy & Eggs/Bakery/Pantry), Australian hard-to-find ingredient tips, Web Share API export with clipboard fallback.
- **Expo scaffold:** `mobile/` — Expo SDK 54, TypeScript, expo-router, NativeWind, expo-sqlite. Needs to catch up to `simmer-fresh.html`.
- **Archived:** `docs/archive/meal-master.html`
- **ADRs:** `docs/adr/` — stack (001), delivery (002)
- **Phase 5 ✅:** Substitutions UI live. Tap the swap icon on any ingredient → bottom sheet shows pre-baked swaps with Good swap / Compromise badge. 35 substitutions across 10 recipes. Non-covered ingredients show an honest "no swaps on file yet" state.
- **Next priority:** Phase 6 — cook mode (dark screen, wake lock, step-by-step full screen, why notes on tap).
