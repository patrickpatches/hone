# Hone Session Report — 25 May 2026

**Role:** Product Designer
**Focus:** Recipe-detail redesign challenge — produce an independent concept (v4) that either improves meaningfully on v3 or argues honestly why v3 is already right. Outcome: built v4 "The Pass" — keeps v3's strong bones, fixes four real weaknesses, recipe-generic for all food types now and future. Then, on Patrick's feedback, built **v5** with two requested changes + three best-practice patterns.

---

## Update — v5 (after Patrick approved the v4 direction)

Patrick: "ok i like it, but remove the Makes 2 burgers at the top because we are inputting how many burgers below anyway. Put the flag origin instead. If you have access to the best design resources… how would you improve this? make v5."

Built `docs/prototypes/recipe-detail-v5.html`:

- **Removed the top "Makes N" yield** (redundant with the stepper; it also pre-asserted a number before the user chose). Glance row is now a clean trio: **time · effort · origin**.
- **Origin shown as a flag** — rendered as an **SVG, not an emoji** (Android emoji-flag support is unreliable). Honesty rule: country cuisine → flag; **regional cuisine (Levantine) → neutral globe + countries named**, never a single flag (also sidesteps the no-Israeli-labelling rule).
- **Sticky bottom "Start Cooking" bar** — fades in once the inline CTA scrolls off, so the primary action is always one tap away on a long page (NYT Cooking / Airbnb / checkout pattern).
- **Collapsing Material-3 top app bar** — back + recipe title fade in as the hero scrolls away; keeps you oriented deep in the method.
- All v4 wins carried over. Demos below the frame now show the flag path (Japanese) and the honest globe path (Levantine) side by side.

Extra engineer cost vs v4: a scroll listener, an animated header (RN has the pattern built in), and a small SVG flag set keyed to cuisine. Build target once approved = v5. v4 kept on disk for comparison.

---

## What I did

Read the brief, `CLAUDE.md`, `docs/FILE_MAP.md`, `docs/prototypes/recipe-detail-v3.html` (the current best attempt), the v3 schema-contract handoff, and the real `mobile/src/data/types.ts` to ground every field claim. Then designed and built **`docs/prototypes/recipe-detail-v4.html`** — a self-contained phone-frame prototype (Smash Burger example) plus a written rationale and three "works for every recipe" demos below the frame.

**My honest verdict:** v3 is a good skeleton but not the right answer as-is. I kept its bones and fixed four places where it was quiet, incomplete, or only worked because the example happened to be a burger.

## The five changes (vs v3)

1. **Why-note elevated.** v3 set the per-step "why" in muted grey — the lowest-contrast text on the page — which quietly contradicts CLAUDE.md's core rule ("explain the underlying reason, *always*"). v4 lifts it to ink-soft on a gold-dim panel with a full-strength gold marker. Calm, but no longer a footnote. CSS only.
2. **"At a glance" tells a story.** Leads with the two decision-drivers (time + effort, weighted/labelled), demotes yield + cuisine, and renders **active vs total time** when they diverge (the real planning fact for slow dishes). Reads existing time fields.
3. **Allergen / dietary strip** — the head-chef "before you commit" signal Patrick chose. Neutral, honest, no alarm colours. The one genuinely new data need; flagged to engineering, not faked.
4. **Equipment defaults collapsed but names the blockers in the closed summary** ("Needs: cast-iron pan, flat spatula · +2 more"). Serves first-timers (blocker visible) and repeat cooks (out of the way) at once.
5. **Leftover nudge** under the stepper, rendered only when `leftover_mode !== 'none'` — v3 dropped this field entirely.

Kept from v3: single rust "Start Cooking" CTA + ghost secondary actions, one gold section-header language, equipment-before-ingredients, the carousel→full-method jump, a why-note on every step.

## Recipe-generic (Patrick: "all recipes now and future, all food types not just burgers")

The page is built from recipe fields, never burger assumptions — stepper label is `output_unit`/`output_unit_plural`, hero pulls `hero_url` with a designed typographic fallback when null, the glance row reads `