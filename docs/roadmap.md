# Simmer Fresh — Development Roadmap

> Last updated: 2026-04-22 (session 3). This is the working build plan. Update it as phases complete or priorities shift.

## Status legend
- ⬜ Not started
- 🔄 In progress
- ✅ Done

---

## Phase 1 — Live PWA on your phone
**Goal:** Patrick can open a URL on his Android phone and test the app after every change.  
**Delivery:** GitHub Pages (patrickpatches account, no new accounts needed)  
**Effort:** ~1–2 hours

- ✅ simmer-fresh.html prototype (30 recipes, dual-axis categories, core loop)
- ✅ Create GitHub repo `simmer-fresh` under patrickpatches
- ✅ Deploy to GitHub Pages → `patrickpatches.github.io/simmer-fresh`
- ⬜ Verify it loads and is usable on Android Chrome

---

## Phase 2 — Data foundation (substitutions schema)
**Goal:** Every ingredient in every recipe has a `substitutions[]` array. This is the foundation for the shopping list, ingredient swaps, and the future pantry feature.  
**Effort:** ~1 session

- ✅ Update Zod schema in `mobile/src/data/types.ts` — added `CuisineId`, `TypeId`, `SwapQuality`, `Substitution` types + `substitutions[]` on Ingredient
- ✅ Added `categories` (cuisines + types dual-axis) and `whole_food_verified` to Recipe schema with refine validation
- ✅ All 28 seed recipes updated with correct categories and `whole_food_verified: true`
- ✅ Full substitution data on SMASH_BURGER (6 ingredients, 13 swaps), PASTA_CARBONARA (3 ingredients, 6 swaps), MUSAKHAN (3 ingredients, 7 swaps)
- ✅ TypeScript check passes — 0 errors
- ✅ Fixed pre-existing package.json truncation bug

---

## Phase 3 — Recipe library expansion ✅
**Goal:** 30–40 recipes across all category axes. Chef-attributed. Every ingredient has substitutions. No preservatives.  
**Sources:** Andy Cooks, Joshua Weissman, Gordon Ramsay (inspired, attributed, linked)  
**Completed:** 2026-04-22 (sessions 2–3). 44 recipes live in simmer-fresh.html.

**Cuisine targets:**
- ✅ Levantine — musakhan, kafta, hummus, fattoush, shawarma, lamb shawarma (no Israeli labels)
- ✅ Indian — butter chicken (from scratch), saag paneer, dal (existing)
- ✅ Malaysian — nasi lemak, curry laksa, char kway teow, beef rendang
- 🔄 Japanese — ramen (existing), chicken katsu ✅, gyoza ⬜, miso soup ⬜
- 🔄 Thai — green curry (existing), pad thai (existing), tom yum ✅, larb ⬜
- ✅ Italian — carbonara (existing), risotto (existing), bolognese ✅, aglio e olio ✅
- 🔄 American — smash burger (existing), BBQ brisket ⬜, mac and cheese ⬜
- ✅ Australian — barramundi lemon butter, pavlova
- ✅ Other — egg fried rice, mujadara, sheet-pan harissa chicken

**Type targets:**
- ✅ Burgers — smash burger (existing)
- ✅ Seafood — prawns, barramundi, fish tacos (existing), curry laksa
- ✅ Chicken — roast chicken (existing), adobo (existing), katsu, butter chicken, harissa chicken
- ✅ Soups & Stews — beef stew (existing), french onion (existing), ramen (existing), tom yum

---

## Phase 4 — Shopping list feature ✅
**Goal:** From any recipe (or multi-recipe plan), generate a grouped, checkable shopping list scaled to serving count.  
**Completed:** 2026-04-22 (session 3) — in simmer-fresh.html prototype.

- ✅ Group by aisle: Produce / Meat & Seafood / Dairy & Eggs / Bakery / Pantry
- ✅ Scale quantities to selected serving count (via leftover multiplier)
- ✅ Check-off items (in-memory, per session)
- ✅ Flag hard-to-find Australian ingredients with local store tips (12 ingredients)
- ✅ Share/export list — Web Share API with clipboard fallback
- ⬜ Shopping list screen in Expo native app (deferred to native build phase)
- ⬜ Persist check-off state in SQLite (native app only)

---

## Phase 5 — Ingredient substitutions UI
**Goal:** Every ingredient line in a recipe has a dropdown showing alternatives with honest notes on what changes.  
**Effort:** 1 session

- ⬜ Substitution dropdown component
- ⬜ Triggered by tapping ingredient
- ⬜ Shows: alternative ingredient, what changes (flavour/texture/appearance), good swap or compromise rating

---

## Phase 6 — Cook mode
**Goal:** Full-screen step-by-step cook experience. Dark mode. Screen stays on. Haptics on step advance.  
**Effort:** 1 session

- ⬜ Cook mode screen
- ⬜ Wake lock (screen stays on)
- ⬜ OLED dark mode (true blacks)
- ⬜ Haptic confirmation on step advance
- ⬜ Doneness cues displayed prominently over timers
- ⬜ Why-notes available on tap

---

## Phase 7 — Play Store submission prep
**Goal:** Everything Google needs to approve and publish the app.  
**Depends on:** Play Console identity verification completing (~1 week wait)  
**Effort:** 1 session

- ⬜ Play Console verification confirmed
- ⬜ EAS production build (.aab) generated
- ⬜ Store listing: description, screenshots, feature graphic
- ⬜ Privacy policy (required by Play Store)
- ⬜ Data safety form completed
- ⬜ Submit to internal testing track
- ⬜ Patrick tests on device from Play Store
- ⬜ Submit for review → production

---

## Kill feature (post-launch or late v1)
**Pantry → recipe generation**
- Stage 1: client-side ingredient matching (free, offline)
- Stage 2: "invent me something" → Claude API → recipe in a chef's style
- Design doc: `docs/pantry-to-recipe.md`

---

## Accounts (Patrick's ownership)
| Account | Username/ID | Status |
|---|---|---|
| GitHub | patrickpatches | ✅ Active |
| Expo/EAS | patrick.nasr | ✅ Active |
| Google Play Console | patrick.nasr11@gmail.com | 🔄 Identity verification pending |
| Cloudflare | — | Not created |
