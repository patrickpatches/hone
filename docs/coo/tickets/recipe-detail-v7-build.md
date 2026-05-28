# TICKET — Recipe Detail v7 "Mise" · Phase 1 (styling + IA, no schema)

| | |
|---|---|
| **Status** | ✅ READY TO BUILD — approved by Patrick 2026-05-28 |
| **Owner** | Senior Engineer |
| **File** | `mobile/app/recipe/[id].tsx` (both browse + cook branches), `mobile/src/theme/tokens.ts`, `mobile/app/_layout.tsx`, `mobile/package.json` |
| **Design reference** | `docs/prototypes/recipe-detail-v7.html` — open in browser. Frame A (browse) and Frame B (cook) + four rationale panels. |
| **Visual anchor** | The live Pantry tab on build #126 (`mobile/app/(tabs)/pantry.tsx`). v7 borrows its vocabulary so Recipe + Pantry feel like one app. |
| **Supersedes** | GitHub Issue #5 (the v5 build that crashed on Fabric native-driver scroll, reverted in #126). |

## Why this exists

v5 was a behavioural redesign (collapsing header + sticky bar via `Animated` native driver) that force-closed under Fabric. v7 is a **visual + IA redesign with zero scroll-driven chrome** — every visual is achievable with StyleSheet + simple state. Browse is restructured around the Pantry tab's vocabulary (bronze uppercase eyebrows + pill rows + 5-token palette). Cook gets a single small font fix on the doneness cue. Schema work (allergens, equipment enrichment) is deferred to Phase 2.

## Before you code — pitch your plan

Reply to Patrick with: (1) the exact `tokens.ts` additions you propose, (2) the Fraunces font package + load order, (3) a component breakdown of the new browse layout (what's a new sub-component, what's a restyle of existing), (4) the commit splits you'll use. Recommended split: **(A)** tokens + fonts · **(B)** browse-mode restyle · **(C)** cook-mode Look-for fix. Each independently revertable. **Wait for Patrick's go before any code edit.**

---

## Phase 1 · what to build

### 0 · Tokens & fonts (commit A — dependency of everything)

**tokens.ts additions:**
- `bronzeSoft: 'rgba(194,161,90,0.10)'` — honest-swap callout bg, swap-pill "on" state bg
- Use existing `primaryInk: #D05040` for the Start cooking button bg (close enough to the prototype's `#D8634F`; no new token needed unless you'd rather add one)

**Font additions:**

```ts
// package.json
"@expo-google-fonts/fraunces": "^0.2.x"

// mobile/app/_layout.tsx — extend useFonts()
import {
  Fraunces_400Regular,
  Fraunces_700Bold,
  Fraunces_500Medium_Italic,
} from '@expo-google-fonts/fraunces';
useFonts({
  ...currentInter,
  Fraunces_400Regular,
  Fraunces_700Bold,
  Fraunces_500Medium_Italic,
});

// mobile/src/theme/tokens.ts — point fonts.display + fonts.displayItalic at Fraunces
display:        'Fraunces_700Bold',
displayItalic:  'Fraunces_500Medium_Italic',
sans:           'Inter_400Regular',           // unchanged
sansBold:       'Inter_600SemiBold',          // unchanged
```

**Why Fraunces.** Playfair Display has very high stroke contrast — hairlines vanish under Android anti-aliasing at small sizes. Fraunces is a variable serif with a real optical-sizing axis (opsz 9–144), so the same glyph renders crisply at 12sp captions and 38sp titles on a mid-tier Pixel. Inter is the right call for body and UI — keep it exactly as is, no changes.

Runtime weight added: ≈110 KB on first launch, cached. Min font-scale 100%; support up to 200% per CLAUDE.md accessibility mandate. Tabular numerals on timers/quantities via `fontFeatureSettings: ['tnum','lnum']`.

### 1 · Browse-mode restyle (commit B — on top of A)

Map every visual in `recipe-detail-v7.html` Frame A onto the existing component tree in `recipe/[id].tsx` (the `!cooking` branch). **The component tree, state, navigation, and data reads stay exactly as build #126** — this is a StyleSheet + small JSX layout pass. Sections in order:

1. **Top bar** — back chevron · spacer · plan toggle (rust-tinted when on, via `primaryLight` bg) · favourite. Each 42×42dp circular Pressable, `hitSlop: 10`, `accessibilityRole: 'button'`.
2. **Hero** — existing `hero_url` via expo-image, edge-to-edge, 340dp. **No-photo fallback:** when `hero_url` is null, render a typographic Fraunces title card over the existing `hero_fallback` gradient bands — no new data field, just a styled fallback view.
3. **Title block** — bronze uppercase eyebrow: `Inspired by {source.chef} · [Watch the original ↗]` (hide watch link when `source.video_url` is null). Then Fraunces 38sp title (`fonts.display`, line-height 1.02, letter-spacing -0.6). Italic Fraunces tagline below. Compact meta line in `tokens.muted`: `{difficulty} · Serves {output_default ?? base_servings} · {categories.cuisines[0]}`.
4. **Allergens row** — render ONLY when `recipe.allergens` is present (it isn't in Phase 1; the whole row stays hidden until Phase 2 wires the data). Don't fake it.
5. **Primary CTA** — full-width 56dp pill, `primaryInk` bg, white text, `borderRadius: 16`, soft rust glow shadow. Label "Start cooking" with a 20×20 play-icon. Below: a centred ghost row "Plan it · Watch the chef" (hide "Watch" when video_url null).
6. **"In your pantry" section** — bronze section eyebrow (icon · uppercase label · count chip · 1px line below). Card body: large Fraunces "N/M" bronze numeral on the left, status line ("You're nearly there" / "Ready to cook now") + sub-line in muted, then the missing items as small dark pills, then a gold-outlined "Add missing to shopping list" button. **Wire to the existing `scoreRecipeAgainstPantry`** — that's where N/M and the missing list come from. Add-to-list calls the existing shopping helper.
7. **"Your kitchen journey" section** — bronze eyebrow + 3-card row: Mise · Cook · Plate. Each card: bronze step number (Fraunces), cream label, muted time. Read-only summary — Mise time from `sum(mise_en_place duration)` or `5 min` default; Cook time from `sum(steps[].timer_seconds)`; Plate time as a `3 min` default (or 0 if `leftover_mode === 'tonight'`). No interaction.
8. **"Ingredients" section** — bronze eyebrow + pantry-style pill rows. Each row:
   - 30×30 icon on the left — **use the existing `PantryIcons.tsx` `ingredientIconName(name, category)` resolver from build #122** so users see the same icons they see in the Pantry tab
   - Cream name, muted sub-line with amount + state ("in pantry" / "on shopping list" / amount only)
   - Swap pill on the right when the ingredient has substitutions (gold-bordered outline default; bronze tint when a swap is active)
   - **In-pantry rows:** dimmed bronze icon, name in muted with bronze strikethrough. Visual signal that you've got it.
   - **Need-to-buy rows:** full ink name, swap pill bordered gold
   - **Honest-swap callout** (golden rule 5): when a swap is active and `sub.changes` exists, render an inline bronze italic Fraunces block under the name: `<b>HONEST SWAP</b> {sub.changes}` — bronze left rail, `bronzeSoft` bg
9. **"Get ready" section** — bronze eyebrow + equipment pill rows (same `.b-row` pattern) + a bronze-rail Prep band reading from `mise_en_place[]`. **Drop the "Essential" tag in Phase 1** — `equipment` is `string[]` and can't honestly carry it. Phase 2 enriches the schema.
10. **"Method" section** — bronze eyebrow + compact pill rows: bronze step number (Fraunces) + cream title + tabular muted time + chevron. Tap a row to enter cook mode at that step (uses existing `setCurrentStepIdx + setCooking(true)`).

**Stays exactly as #126:** recipe state machine, SubstitutionSheet trigger/behaviour (built natively per #116), scaling math, cook-mode toggle, routing, haptics, the existing photo-notice logic, all `before_you_start` / `mise_en_place` / `finishing_note` reads.

### 2 · Cook-mode "Look for" font fix (commit C — small)

In the `cooking` branch of `recipe/[id].tsx`, find the doneness-cue Callout that reads `step.stage_note` (shipped in cook-mode-v2 #117 with Playfair italic). Change its body text style to:

```ts
{
  fontFamily: fonts.sansBold,   // Inter SemiBold
  fontSize: 19,
  lineHeight: 27,
  color: tokens.ink,
  letterSpacing: 0.1,
}
```

Keep the gold left rail + the small uppercase "LOOK FOR" label above. **That's the only change in this commit.** Everything else in cook mode is functionally unchanged from #117.

**Why this matters.** "Look for" is operational text — a label you act on at arm's length, not voice. Italic serif tested poorly for glanceability on a propped phone with kitchen glare. Upright sans wins. This establishes a clean type-by-job rule we'll apply elsewhere over time:

- **Operational text** (labels, buttons, "Look for", timers, body) → **Inter**
- **Chef voice** (asides, attribution, honest-swap notes) → **Fraunces italic**
- **Titles & headings** → **Fraunces upright**

---

## Phase 2 (deferred — separate ticket when ready)

- **Allergens / dietary schema** — new `allergens: z.array(z.string()).optional()` + `dietary: z.array(z.string()).optional()` on the Recipe type · SQLite migration · seed values for 16 launch recipes. Unlocks the allergens row on browse.
- **Equipment enrichment** — `equipment: z.array(z.string())` → `z.array(z.object({ name, note?, essential: boolean }))` + migration + reseed. Unlocks the Essential/Optional tags.
- **Cook-mode enhancements** — auto-advance on timer expiry (opt-in toggle), larger doneness-photo block (420dp), tools row (scaling/ingredients/exit) at the bottom.

---

## Colour rules (each colour, ONE job — matches Pantry tab discipline)

- **terra** (`primaryInk` #D05040) — Start cooking button · Plan-toggle active state
- **gold** (#F2CC2A) — Stepper · "Add to shopping list" outline · cook-mode "Look for" rail (only interactive accent)
- **bronze** (#C2A15A) — eyebrows · icons · chef voice · in-pantry strikes · step numbers · honest swap · prep
- **ink** (#F5EFE8) + **inkSoft** (#C4B8A8) + **muted** (#8A7E72) — text

**Dead:** olive (in-pantry green), ochre (honest-swap), sky (info). Their jobs are absorbed by bronze. No fifth direction introduced.

---

## ⚠ Safety constraints (the v5 lesson, written in)

- **NO collapsing/animated header.** No scroll-driven `Animated.event` or transforms. No `Animated` on the native driver.
- **NO sticky bottom bar.** The cook-mode "Next" button is a static `position:absolute; bottom:0` view (not pinned via Animated transforms).
- **NO new scroll listeners.** Browse is a plain `ScrollView`.
- The whole concept is achievable with StyleSheet + the existing simple state. **If a visual seems to need any of the above — stop and flag it to Patrick before coding.**
- **Do not touch any other tab.** Pantry, Shop, Home, Add stay exactly as build #126.

---

## Definition of Done

- Browse mode: every section in §1 renders with the correct hierarchy, palette, and pill-row style. In-pantry vs need-to-buy ingredient differentiation works (reads `scoreRecipeAgainstPantry`). Pantry signal counts match. Swap pill behaviour unchanged. Tapping a method row enters cook mode at that step.
- Cook mode: "Look for" cue is Inter SemiBold upright 19sp. Everything else functionally unchanged from #117.
- `npx tsc --noEmit` clean. **R-014 tail-check on every edited file.** **Build-log row added in the SAME tree as the code.**
- **R-015 — do NOT self-close.** Ship to `main`, then await Patrick's on-device validation.
- **Do NOT dispatch an EAS build — Patrick triggers it.**

---

## Reference

- Prototype: `docs/prototypes/recipe-detail-v7.html`
- Visual anchor: `mobile/app/(tabs)/pantry.tsx` (build #126) + `mobile/src/components/PantryIcons.tsx`
- Schema contract (unchanged): the v3 "data fields to preserve" handoff in `docs/coo/handoffs.md`
- Type-by-job rule: rationale panel in the prototype + this ticket
