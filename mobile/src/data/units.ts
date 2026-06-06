/**
 * Unit conversion — honest, exact-only.
 *
 * Golden Rule #3 ("honest about limits") applied to measurements: we convert
 * ONLY what converts exactly.
 *
 *   Temperature  °C ↔ °F   — exact (rounded to the nearest 5°F so it reads like
 *                            an oven dial, not a science experiment).
 *   Volume       ml ↔ cups — exact, using AUSTRALIAN spoons: 1 cup = 250 ml,
 *                            1 tbsp = 20 ml, 1 tsp = 5 ml. (AU tbsp is 20 ml,
 *                            not the US 15 ml — we're Australia-first.)
 *
 * What we DON'T do: weight ↔ volume (grams ↔ cups). A cup of flour and a cup of
 * sugar weigh different amounts — converting between them needs a per-ingredient
 * density we don't have, and faking it would be a lie. Weights stay in grams.
 *
 * Pure + dependency-light so it's trivially unit-testable.
 */
import { formatAmount } from './scale';
import type { Recipe } from './types';

export type TemperatureUnit = 'C' | 'F';
export type VolumeSystem = 'metric' | 'cups';

// ── Temperature ─────────────────────────────────────────────────────────────

/** Exact °C → °F, rounded to the nearest 5°F (oven-dial friendly). */
export function cToF(celsius: number): number {
  const f = (celsius * 9) / 5 + 32;
  return Math.round(f / 5) * 5;
}

/**
 * Convert every "NNN°C" (optional space, optional decimal) inside a block of
 * text to °F. Safe in any context — oven temps, internal meat temps, fridge
 * temps all convert correctly. Returns the text unchanged when unit is 'C'.
 */
export function convertTemps(text: string, unit: TemperatureUnit): string {
  if (unit === 'C' || !text) return text;
  return (
    text
      // Ranges first — "72–74°C" must convert BOTH ends, else "72" stays celsius
      // and reads as a lie. Handles hyphen / en-dash / em-dash separators.
      .replace(
        /(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)\s*°C/g,
        (_m, a, b) => `${cToF(Number(a))}–${cToF(Number(b))}°F`,
      )
      // Then any remaining single value.
      .replace(/(\d+(?:\.\d+)?)\s*°C/g, (_m, n) => `${cToF(Number(n))}°F`)
  );
}

/**
 * Return a copy of the recipe with EVERY user-facing temperature converted to
 * the chosen unit. Converting ONCE here — rather than at each render site —
 * means steps, equipment notes, "what to know" tips, mise en place and the
 * finishing / leftover notes are all consistent. No render path can be
 * forgotten, which is exactly the bug that whack-a-mole wrapping invites.
 * No-op (returns the same object) when unit is 'C'.
 */
export function convertRecipeTemperature(recipe: Recipe, unit: TemperatureUnit): Recipe {
  if (unit === 'C') return recipe;
  const opt = (s: string | undefined) => (s === undefined ? undefined : convertTemps(s, unit));
  return {
    ...recipe,
    tagline: convertTemps(recipe.tagline, unit),
    description: opt(recipe.description),
    finishing_note: opt(recipe.finishing_note),
    leftovers_note: opt(recipe.leftovers_note),
    equipment: recipe.equipment?.map((e) => convertTemps(e, unit)),
    before_you_start: recipe.before_you_start?.map((e) => convertTemps(e, unit)),
    mise_en_place: recipe.mise_en_place?.map((e) => convertTemps(e, unit)),
    steps: recipe.steps.map((s) => ({
      ...s,
      title: convertTemps(s.title, unit),
      content: convertTemps(s.content, unit),
      stage_note: opt(s.stage_note),
      why_note: opt(s.why_note),
      lookahead: opt(s.lookahead),
    })),
  };
}

// ── Volume ──────────────────────────────────────────────────────────────────

const ML_PER = { cup: 250, tbsp: 20, tsp: 5 } as const;

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1, milliliter: 1, millilitre: 1, milliliters: 1, millilitres: 1,
  l: 1000, litre: 1000, litres: 1000, liter: 1000, liters: 1000,
  cup: ML_PER.cup, cups: ML_PER.cup,
  tbsp: ML_PER.tbsp, tablespoon: ML_PER.tbsp, tablespoons: ML_PER.tbsp,
  tsp: ML_PER.tsp, teaspoon: ML_PER.tsp, teaspoons: ML_PER.tsp,
};

function normUnit(unit: string): string {
  return unit.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
}

/** Is this a volume unit we can convert? */
export function isVolumeUnit(unit: string | null | undefined): boolean {
  if (!unit) return false;
  return normUnit(unit) in VOLUME_TO_ML;
}

/** Does formatAmount render this as a clean fraction/integer (no stray decimal)? */
function readsClean(n: number): boolean {
  return !formatAmount(n).includes('.');
}

/**
 * Render `amount` of `unit` in the chosen system. Non-volume units (g, kg, each,
 * "to taste") are returned untouched — honesty rule: we never invent a volume
 * for a weight.
 *
 * Returns the formatted measure string WITH unit, e.g. "250 ml" / "1 cup".
 */
export function formatMeasure(
  amount: number,
  unit: string | null | undefined,
  system: VolumeSystem,
): string {
  // Non-volume → format the number and append the unit verbatim.
  if (!isVolumeUnit(unit)) {
    const u = unit ? ` ${unit}` : '';
    return `${formatAmount(amount)}${u}`;
  }

  const ml = amount * VOLUME_TO_ML[normUnit(unit as string)];

  if (system === 'metric') {
    if (ml >= 1000) return `${formatAmount(ml / 1000)} L`;
    return `${formatAmount(ml)} ml`;
  }

  // system === 'cups' — pick the largest spoon/cup unit that reads cleanly.
  const cups = ml / ML_PER.cup;
  if (cups >= 1 || (cups >= 0.25 && readsClean(cups))) {
    return `${formatAmount(cups)} ${cups === 1 ? 'cup' : 'cups'}`;
  }
  const tbsp = ml / ML_PER.tbsp;
  if (tbsp >= 1) return `${formatAmount(tbsp)} tbsp`;
  const tsp = ml / ML_PER.tsp;
  return `${formatAmount(tsp)} tsp`;
}
