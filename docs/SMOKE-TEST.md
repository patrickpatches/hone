# Tucker & Spice — pre-release smoke test

A 5-minute manual checklist run on the latest APK before claiming a release
is "shippable". Triggered by Patrick's session 14 review where multiple
already-released bugs slipped through (Plan & Shop one-meal limit, pantry
chips invisible, contrast regressions).

The rule: **no release notes go out without this checklist passing.**

## Setup

- Install the latest APK from the GitHub Actions run.
- If upgrading over a previous version, the migration runner should kick in
  on first launch — verify by checking that pantry items from the old
  install survive (or that a fresh seed runs cleanly on a clean install).
- One-handed phone use, average kitchen lighting.

## 1. Kitchen tab

- [ ] Header is one line, not two ("What are you _cooking_?")
- [ ] Search bar tap opens the Mona Lisa overlay (full-screen modal slides up)
- [ ] Recipe cards show: hero, title, time, serves/yield, chef
- [ ] **+** icon on every card hero (top-right of photo) — bigger, visible
      against dark heroes (44dp, 0.62 ink scrim)
- [ ] **♥** icon next to the +, same treatment
- [ ] Tap a mood chip → list filters; chip rail appears showing active filter
- [ ] Tap × on chip rail → clears that one filter
- [ ] Filter chip rail uses paprika fill, cream text — readable

## 2. Search overlay (Mona Lisa)

- [ ] Empty state shows: ✨ title, Trending pills, Recent (if any), Quick filters
- [ ] Type "carb" → Carbonara appears with paprika-highlighted prefix
- [ ] Type "aubergine" → eggplant recipes appear (synonym match)
- [ ] Type a chef name (e.g. "Andy") → Chefs section appears
- [ ] Type a cuisine (e.g. "Thai") → Cuisines & types section appears
- [ ] Tap any result → closes overlay, navigates to the right screen
- [ ] Type something gibberish ("xyzqq") → friendly "Nothing yet" state

## 3. Pantry tab

- [ ] Header: "Pantry" / "what can you cook right now?"
- [ ] Search-or-add bar visible
- [ ] **Tap any quick-add chip** (Chicken, Beef mince, etc.):
  - [ ] Item appears as a paprika-on-ink chip in the tag cloud above the input
  - [ ] The quick-add chip disappears (it's now in pantry)
- [ ] Type a novel ingredient (e.g. "kombu") → "+ Add 'kombu' to your pantry" suggestion appears
- [ ] Press Enter → kombu chip appears in cloud
- [ ] Tap × on a pantry chip → it disappears and reappears in quick-add (if it was a staple)
- [ ] **"You can make these" / "Almost there" sections** appear once you have ≥3 items in pantry
- [ ] Quick-add chips are organised in **categories** (Proteins / Produce / Dairy / Pantry / Sauces) — vertical layout, NOT a single horizontal scroll

## 4. Recipe detail screen

- [ ] Hero photo loads (or gradient fallback)
- [ ] Top-bar buttons (back, +, ♥) are 44×44, visible on dark hero (drop shadow)
- [ ] Title + tagline + time + difficulty visible
- [ ] **For tortilla recipe:** servings selector reads "How many tortillas"; subtitle says "5 tortillas" not "5 portions"; no leftover-mode pills
- [ ] **For pavlova:** "How many pavlovas", subtitle "1 pavlova" or "2 pavlovas"
- [ ] **For sourdough:** "Yield", no stepper, subtitle "1 loaf"
- [ ] **For a normal meal recipe (e.g. Carbonara):** "How many people", leftover-mode pills visible
- [ ] Tap "Watch the original" → opens the chef's source URL
- [ ] Tap **+** → AddToPlanSheet appears
- [ ] Tap "Add to plan" → meal added, sheet dismisses

## 5. Plan & Shop tab

- [ ] Tab label reads "Plan & Shop"
- [ ] Two sub-tabs: **Shopping list** | **Meals**
- [ ] After adding 1 meal: header reads "1 meal on the go", Shopping list shows ingredients
- [ ] **Add a SECOND meal**: header reads "2 meals on the go" (NOT still 1!)
  - [ ] Shopping list aggregates ingredients across both meals
  - [ ] If an ingredient appears in both, quantity adds up (e.g. 2× yellow onion = 2 onions, one row)
- [ ] **Add the SAME meal twice**: should show 2 rows in Meals tab, both contribute to shopping
- [ ] Tap an × next to a meal in Meals tab → meal removed, shopping list updates
- [ ] **Add an extra ingredient** via "+ Add ingredient" button at top of Shopping list:
  - [ ] Modal sheet appears
  - [ ] Type a name → tap "Add to list"
  - [ ] Item appears in shopping list with "Added by you" instead of "for [recipe]"
- [ ] Tap **Share** → native share sheet with plain-text list

## 6. Add Recipe tab

- [ ] Three-phase form: name + emoji + time + yield → ingredients → method
- [ ] Type "flour" in ingredient input → suggestions dropdown shows canonical matches (Plain flour, Bread flour, etc.) with frequency indicator
- [ ] Tap a suggestion → ingredient row added with smart-default amount + unit pre-filled
- [ ] Type something not in the database → "Add custom: 'X'" appears at the bottom of suggestions
- [ ] Tab "Got a wall of text" → paste-mode area expands
- [ ] Method paste → live preview shows parsed steps below
- [ ] Save CTA is disabled until name + time + ingredients + method all present
- [ ] CTA shows what's missing ("Add a name", "Add a time", etc.)

## 7. Cross-cutting visual checks

- [ ] No text is ghost-grey-on-grey (any chip, any header)
- [ ] No buttons are < 44dp tap target
- [ ] Bottom nav active tab uses paprika fill, white text — clearly distinguishable
- [ ] App icon on home screen is the chef-knife-and-tomato yellow
- [ ] Splash screen on cold launch shows the icon centred on cream

## 8. Performance (rough check)

- [ ] Cold launch under 3 seconds
- [ ] Tab switches feel instant (< 200ms perceived)
- [ ] Search overlay appears within 100ms of tapping the search bar
- [ ] Typing in search shows results updating live, no perceptible lag

## 9. Things that should NOT happen (regression checks)

- [ ] Adding a meal does NOT replace an existing meal on the same day
- [ ] Adding the same meal twice does NOT silently merge into one row
- [ ] Pantry chips do NOT disappear after being added
- [ ] Pantry quick-add does NOT show items already in pantry
- [ ] Filter chip rail does NOT disappear when you remove only one filter

## 10. Regression checklist

Before every release tag, run the items in [`docs/regression-checklist.md`](regression-checklist.md).
The full checklist takes under two minutes and covers bugs that have already bitten us once.

Current entries:
- **REGN-001** — Recipe card carousel partial-snap (was fixed 29 April, regressed in Pantry v2)