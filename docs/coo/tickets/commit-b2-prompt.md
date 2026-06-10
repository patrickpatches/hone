# Commit B2 — Recipe Detail v7 browse-mode completion

You are the Senior Engineer on Hone, Patrick's Android-first React Native cooking app. Expo SDK 54, RN 0.81.5, New Architecture (Fabric) enabled. Your standing brief lives in `CLAUDE.md`. The repo is `patrickpatches/hone`.

This single file is your complete instruction set. Read it in full, then execute.

---

## 1. Session ritual — read these FROM GITHUB main (not your stale local checkout) before touching code

In this order:

1. `CLAUDE.md`
2. `docs/FILE_MAP.md`
3. `BUGS.md`
4. Top of `docs/coo/handoffs.md` — current build-log table state and Open handoffs
5. `docs/coo/tickets/recipe-detail-v7-build.md` — the v7 ticket in full
6. `docs/prototypes/recipe-detail-v7.html` — design reference (Frame A = browse mode)
7. `mobile/app/recipe/[id].tsx` — the file you will edit, ~2423 lines, browse-mode (`!cooking`) sections only

Use `gh api` or `curl` against the GitHub Contents API. The local checkout is stale.

---

## 2. Where things stand

- Build #127 (commit `0f423b5`): Playfair → Fraunces font swap, `bronzeSoft` token added. `fonts.display = 'Fraunces_700Bold'`.
- Build #128 (`c5bde6d`): regenerated `package-lock.json` to match.
- Build #129 (`ebebc27`, partial Commit B): added v7 In-your-pantry card, Your-Kitchen-Journey 3-card row with Plate tap-to-expand (absorbed finishing_note + leftovers_note), hero typographic fallback, Method tap-row-to-enter-cook.
- Build #130 (`5dc6da5`): added `RecipeErrorBoundary` class + `RecipeErrorFallback` functional wrapper. LEAVE THIS IN PLACE.
- Build #131 (`d7332fc`): fixed Rules of Hooks violation by hoisting all v7 `useMemo`/`useCallback` ABOVE the recipe-loaded early-return guards. The hoist pattern is established — preserve and extend it.

Patrick validated #131 on-device: recipes open, new v7 sections render. He flagged that the new v7 elements still sit alongside the old #126 elements — that's the gap you're closing.

Latest main HEAD as of this brief: `4e67e38`.

---

## 3. Your mission — Commit B2

Single file: `mobile/app/recipe/[id].tsx`, **`!cooking` branch only**. Cook mode untouched. Land all of the following in ONE commit.

### 3.1 Top bar restyle

The Back / Plan / Heart row above the hero. Restyle to v7 vocabulary:

- 42×42 dp circular Pressables
- `hitSlop: 10`
- No background on idle
- Plan icon tints to `tokens.primaryLight` (rust) when `isPlanned`
- Heart fills `tokens.primary` when favourited
- `accessibilityRole: 'button'` on each

### 3.2 Replace title card

Remove the current cream cardBg block containing title + tagline + meta + Watch link + Plan toggle. Replace with:

- Bronze uppercase eyebrow: `Inspired by {source.chef} · Watch the original ↗`
  - Hide the Watch link when `source.video_url` is null
  - Make "Watch the original ↗" an inline Pressable that calls the existing `openSource` handler
- Title in Fraunces 38sp: `fontFamily: fonts.display`, `lineHeight: 40`, `letterSpacing: -0.6`
- Italic tagline below: `fontFamily: fonts.displayItalic`, `tokens.inkSoft`, 17sp
- Compact meta line in `tokens.muted`: `{difficulty} · Serves {output_default ?? base_servings} · {categories.cuisines[0]}`
- Plan toggle is GONE from this block — it's the top-bar button now

### 3.3 Drop "At a glance" entirely

Remove the `{!cooking && hasGlanceData && ...}` block. Its info is now split between the title meta line (cuisine + difficulty) and the Your-Kitchen-Journey card (time). Redundant and visually competing.

### 3.4 Add inline rust "Start cooking" pill + ghost row

Immediately after the title block:

- Full-width 56dp pill, `backgroundColor: tokens.primary`, white text, `borderRadius: 16`, 20×20 play icon. `onPress = toggleCooking`.
- Centred ghost row below with two Pressables:
  - "Plan it" (calls existing `handleTogglePlan`; label flips to "In your plan" when `isPlanned`)
  - "Watch the chef" (calls `openSource`; hide entire link when `source.video_url` is null)

The existing always-visible bottom sticky Start Cooking pill stays as-is. Do NOT gate it on scroll — that is the v5 crash class.

### 3.5 Equipment + Prep merged into "Get ready" block

- One bronze eyebrow `GET READY` (per §3.8 styling)
- Two sub-areas separated by a thin `tokens.lineDark` rule
- Equipment: each string becomes a `.b-row` style pill row — small left rail dot + name. Drop any "Essential" tag (Phase 2 schema).
- Prep: keep the existing `MiseItem` component and its checkmark behaviour; restyle the surrounding container to match v7 pill-row vocabulary.

### 3.6 Method section restyle

The tap-row-to-enter-cook behaviour from #129 stays. Restyle the row container:

- Bronze step number on left, Fraunces (`fontFamily: fonts.display`, 22sp)
- Cream title centre (`tokens.ink`, 16sp)
- Tabular muted time on right: `fontVariant: ['tabular-nums']`, `tokens.muted`
- Chevron at far right (existing icon)
- Pill-row vocabulary like the Pantry tab

### 3.7 Ingredients rows — full v7 restyle

This is the bulk of the work. Each ingredient row becomes a `.b-row` style pill row with:

**Leading icon (30×30)**

```
<FoodIcon
  name={ingredientIconName(ing.name, categorizeIngredient(ing.name))}
  size={30}
  color={inPantry ? tokens.bronze : tokens.inkSoft}
/>
```

`ingredientIconName` and `FoodIcon` are exported from `mobile/src/components/PantryIcons.tsx`. `categorizeIngredient` is the existing helper from `pantry-helpers`.

**Name text**

- In-pantry rows: `tokens.muted`, `textDecorationLine: 'line-through'`, `textDecorationColor: tokens.bronze`
- Need-to-buy rows: `tokens.ink`

**Sub-line in `tokens.muted`**

- Always start with the scaled amount/unit from existing `formatAmount` / `scaleIngredient` helpers (do NOT change the scaling math)
- Append ` · in pantry` in `tokens.bronze` when `ingredientInPantry(ing.name)` is true
- Append ` · on shopping list` when the ingredient appears in the shopping list state (see hoist note below)

**Swap pill on the right** (when `(ing.substitutions?.length ?? 0) > 0`)

- Idle: gold-outline pill — `borderColor: 'rgba(242,204,42,0.42)'`, `backgroundColor: 'transparent'`
- Active swap: `backgroundColor: tokens.bronzeSoft`, `borderColor: tokens.bronze`
- Trigger: existing `openSwapSheet` handler

**Honest-swap callout** — inline block UNDER the row, rendered ONLY when an active swap exists AND `activeSwap.changes` is non-empty:

- `padding: 12`
- `backgroundColor: tokens.bronzeSoft`
- `borderLeftWidth: 3`, `borderLeftColor: tokens.bronze`
- Small uppercase label `HONEST SWAP` — `fontFamily: fonts.sansBold`, 10sp, `letterSpacing: 1.4`, `tokens.bronze`
- Body: `fontFamily: fonts.displayItalic`, 13/19, `tokens.inkSoft`, content = `activeSwap.changes`

**Shopping-list membership state** — you need to read shopping items to compute the `· on shopping list` label. Add a `shoppingItems` state + a load `useEffect` calling `getShoppingItems(db)`, **hoisted above the early-return guards** alongside the existing pantry load. Pattern is already in the file — copy it. Defensive default `[]` when `recipe` is undefined. Then derive a `Set<string>` of normalised names via `useMemo` (also hoisted) and a `ingredientOnShoppingList(name)` callback (hoisted).

### 3.8 Section headers — bronze eyebrows

For "Ingredients", "Get ready", "Method": uppercase, `letterSpacing: 1.5`, `fontSize: 11`, `color: tokens.bronze`. Keep the existing icon if any, tinted bronze.

### 3.9 Plate-time bug from #129 — make Plate honestly recipe-aware

Build #129's closeout flagged that the Plate card in the Your-Kitchen-Journey row is hard-coded to `3 min` for every recipe because the original ticket's check (`leftover_mode === 'tonight'`) didn't match the schema's actual shape.

`leftover_mode` is `{ extra_servings: number; note: string } | undefined`, not a string.

Replace the hard-coded 3 with this honest rule:

- If `recipe.leftover_mode` is `undefined` → Plate = `0 min` (no plating beyond serving)
- If `recipe.leftover_mode.extra_servings > 0` → Plate = `5 min` (you're plating + packing tomorrow's portion away)
- Otherwise → Plate = `3 min` (plating + a quick wipe-down)

When Plate is `0 min`, do NOT hide the card — keep it visible so the journey row still shows three stages; just render `"0 min"` honestly. Honest visibility > clever hiding (CLAUDE.md golden rule 5).

Same display formatting as the Mise and Cook cards — no other visual change.

Quick verify after wiring: open BUTTER_CHICKEN (has leftover_mode), HUMMUS (no leftover_mode, no plating beyond serving), and SMASH_BURGER (no leftover_mode, served immediately). Confirm the Plate number reads honestly for each.

---

## 4. Hard safety — non-negotiable

### 4.1 Rules of Hooks (the bug from #129)

EVERY `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef` declaration MUST live ABOVE the recipe-loaded early-return guards (`if (recipe === undefined) return <Loading/>` / `if (!recipe) return <NotFound/>`).

Any new hook you add (e.g. `shoppingItems` state, its load effect, the membership set) MUST be hoisted and made defensive against `recipe` being undefined.

After your edit, grep all hook declarations and confirm every line number is LESS than the line of the first top-level guard. Hooks INSIDE the body of an existing `useMemo` callback (like `if (!recipe) return null` inside a memo) are fine — those are runtime branches inside the hook, not hook declarations after it.

### 4.2 v5 crash class (Fabric runtime fragility)

ZERO of any of these introduced anywhere:

- `Animated.ScrollView`
- `Animated.event`
- `scrollY`
- `addListener` on any Animated.Value
- `onScroll`

Plain `ScrollView` only. No sticky-bar opacity gating off scroll. The existing bottom sticky pill stays always-visible.

### 4.3 Scope guard

- Do NOT touch the `cooking` branch.
- Do NOT touch `mobile/app/_layout.tsx` (Patrick's substitution-quality migration stands).
- Do NOT touch `mobile/src/components/SubstitutionSheet.tsx` (Patrick's qualityConfig fallback stands).
- Do NOT touch any other tab.
- No schema change. No data migration. No new dependency.
- Leave the `RecipeErrorBoundary` class component and its wrapper export in place exactly as-is.

---

## 5. Pre-flight checks — run all of these locally before push

### 5.1 tsc clean on the recipe file

    cd mobile && npx tsc --noEmit 2>&1 | grep "recipe/\[id\]" | grep -v "@react-navigation"

Expect: empty output.

### 5.2 R-014 tail-check

    bash scripts/check-ts-truncation.sh

Expect: `27/27 balanced` (or whatever the current denominator is — it must report ALL files balanced).

### 5.3 Brace/paren/bracket balance

    python3 -c "c=open('mobile/app/recipe/[id].tsx',encoding='utf-8').read(); print('balance:', c.count('{')-c.count('}'), c.count('(')-c.count(')'), c.count('[')-c.count(']'))"

Expect: `balance: 0 0 0`.

### 5.4 Hard-safety grep

    for t in 'Animated.ScrollView' 'Animated.event' 'scrollY' 'addListener' 'onScroll'; do echo "$t: $(grep -c "$t" mobile/app/recipe/\[id\].tsx)"; done

Expect every count to be `0`.

### 5.5 Hook-order check

    python3 -c "
    import re
    lines=open('mobile/app/recipe/[id].tsx',encoding='utf-8').readlines()
    first_guard=next(i for i,L in enumerate(lines,1) if 'if (recipe === undefined)' in L and 'function' not in L)
    hook_lines=[i for i,L in enumerate(lines,1) if re.search(r'\bu(seState|seEffect|seMemo|seCallback|seRef)\(',L)]
    after=[i for i in hook_lines if i>first_guard]
    print('first guard line:',first_guard)
    print('hooks after guard (must be 0 in component body):',len(after))
    for i in after[:5]: print('  ',i,lines[i-1].strip()[:80])
    "

Expect: `hooks after guard (must be 0 in component body): 0`. If non-zero, look at the offending lines — they are either bugs you need to hoist OR they are inside the cook-mode branch (which is fine), but err on the side of investigating each one.

---

## 6. Commit + push

Use the GitHub Trees API for an atomic multi-file tree (the local git is stale).

The commit MUST contain:

1. `mobile/app/recipe/[id].tsx` — your edits
2. `docs/coo/handoffs.md` — a new build-log row #132 with hash `pending`, AND a closeout block at the top of "Open handoffs"

Commit message: `Recipe Detail v7 Phase 1 Commit B2 — browse-mode v7 restyle complete (#132)`.

After push, fetch the new short sha and do a single hash-fill commit swapping `pending` → the sha in the build-log row.

**DO NOT dispatch the EAS Android Build workflow.** Patrick triggers it.

Per R-015 (engineer never self-closes): the closeout block says "shipped, awaiting Patrick's on-device validation." Do NOT call the GitHub Issues close endpoint.

---

## 7. Monitor

After your push, watch CI for ~90 seconds. Two workflows must succeed on your feature commit:

- "Deploy to GitHub Pages" (runs `npm ci` strict against `package-lock.json`)
- "R-014 truncation check"

If either fails:

1. Fetch the failed step's log via the Actions API
2. Diagnose
3. Fix-forward in a follow-up commit on `main` (do not revert)

---

## 8. Report back

Produce a single structured summary under 300 words. No fluff, no bullet padding. Include:

1. Commit shas (feature + hash-fill)
2. Which of §3.1–§3.8 actually landed; flag anything skipped or compromised, with reason
3. Hook-order check result (number of hooks above first guard, number after)
4. Hard-safety grep result (each forbidden term + count)
5. Both CI workflow conclusions on your feature commit
6. Any decisions that diverged from this brief — write them down so they can be confirmed or reversed
7. One line of on-device validation checklist Patrick can run

Stop there. Do not trigger EAS. Do not close any issue.
