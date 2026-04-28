/**
 * Scaling helpers — the *core* of Golden Rule #3 ("smart scaling").
 *
 * Three scaling modes are defined in types.ts:
 *
 *   linear — standard multiplier. Mince, pasta, stock.
 *   fixed  — caps at `cap`. A pinch of salt per person has a ceiling, and
 *            so do bay leaves and most dried herbs. Going past the cap
 *            makes the dish taste "off" long before it makes it wrong.
 *   custom — lookup curve keyed by *absolute servings* (not factor). Rice-
 *            to-water, for example, because surface evaporation scales with
 *            pot radius (~ cube-root of volume), not volume — so 4× servings
 *            needs less than 4× water. The curve encodes the real ratio;
 *            values between keys are linearly interpolated.
 *
 * formatAmount renders quantities in a humane way:
 *   - < 1  : common fractions when close to them (½, ¼, ¾, ⅓, ⅔)
 *   - 1–10 : one decimal place, trimmed if clean (1 instead of 1.0)
 *   - ≥ 10 : rounded to integer (nobody measures 12.3 grams of beef)
 *
 * Kept deliberately tiny and dependency-free so we can unit-test it in
 * seconds and debug scaling bugs by reading one file.
 */

import type { Ingredient } from './types';

// ---------------------------------------------------------------------------
// formatAmount
// ---------------------------------------------------------------------------

const FRACTIONS: Array<[number, string]> = [
  [1 / 8, '⅛'],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
];

/** How close two numbers have to be to render as the fraction. */
const FRACTION_TOLERANCE = 0.04;

export function formatAmount(n: number): string {
  if (!isFinite(n) || n <= 0) return '0';

  // Heavy ingredients (grams, ml) — integer rounding.
  if (n >= 10) return Math.round(n).toString();

  // Mid-range — one decimal, trimmed.
  if (n >= 1) {
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
  }

  // Below 1 — try to hit a common fraction.
  for (const [value, glyph] of FRACTIONS) {
    if (Math.abs(n - value) < FRACTION_TOLERANCE) return glyph;
  }
  // Not near a fraction — two decimals, trimmed.
  const rounded = Math.round(n * 100) / 100;
  return rounded.toString();
}

// ---------------------------------------------------------------------------
// scaleIngredient
// ---------------------------------------------------------------------------

/**
 * Compute the display amount for an ingredient at a given target serving
 * count. Never mutates the input.
 *
 * The caller passes *absolute target servings* (e.g. "4 people") and the
 * recipe's *base servings* so the function can:
 *   1. derive a factor for linear/fixed scaling
 *   2. query a custom curve by servings directly
 *
 * This is a pure function. Unit-testable.
 */
export function scaleIngredient(
  ing: Ingredient,
  targetServings: number,
  baseServings: number,
): number {
  const factor = baseServings > 0 ? targetServings / baseServings : 1;

  switch (ing.scales) {
    case 'linear':
      return ing.amount * factor;

    case 'fixed': {
      const scaled = ing.amount * factor;
      if (typeof ing.cap === 'number') return Math.min(scaled, ing.cap);
      return scaled;
    }

    case 'custom': {
      const curve = ing.curve;
      if (!curve) return ing.amount * factor; // graceful fallback

      const keys = Object.keys(curve)
        .map((k) => Number(k))
        .filter((k) => !Number.isNaN(k))
        .sort((a, b) => a - b);

      if (keys.length === 0) return ing.amount * factor;

      // Below the curve: clamp to the smallest key's value.
      if (targetServings <= keys[0])
        return curve[String(keys[0])] ?? ing.amount;
      // Above the curve: clamp to the largest key's value.
      if (targetServings >= keys[keys.length - 1])
        return curve[String(keys[keys.length - 1])] ?? ing.amount;

      // Interpolate linearly between the two surrounding keys.
      for (let i = 0; i < keys.length - 1; i += 1) {
        const a = keys[i];
        const b = keys[i + 1];
        if (targetServings >= a && targetServings <= b) {
          const va = curve[String(a)] ?? 0;
          const vb = curve[String(b)] ?? 0;
          const t = (targetServings - a) / (b - a);
          return va + (vb - va) * t;
        }
      }
      return ing.amount * factor;
    }

    default:
      return ing.amount * factor;
  }
}

// ---------------------------------------------------------------------------
// Leftover-mode helpers (for the servings selector)
// ---------------------------------------------------------------------------

/**
 * The fixed list of "how much are we making" modes.
 *
 * Two *different* sizing semantics live here on purpose — mixing them was a
 * deliberate call from the HTML prototype and survived user testing:
 *
 *   Person-based (`extra`):
 *     totalPortions = people + extra
 *     Used for "tonight" and "+ lunches tomorrow". You picked 4 people; you
 *     get 4 or 5 portions. The serving size is per-head and intuitive.
 *
 *   Batch-based (`multiplier`):
 *     totalPortions = multiplier × baseServings   (ignores `people`)
 *     Used for "3-day batch" and "freezer batch". These are cook-once-eat-
 *     later modes anchored to the recipe's natural batch size, not to who
 *     is at the table tonight. A ragù is a ragù whether you're eating alone
 *     or feeding a family — the pot is the same size.
 *
 * The UI surfaces both without explaining the math: the hint text makes
 * the intent clear, and the resulting portion count is shown to the user
 * before they commit.
 *
 * Kept next to scale.ts because this flow is tightly coupled: servings
 * selection → absolute portions → ingredient scaling.
 */
export type LeftoverModeId = 'tonight' | 'lunch' | 'threedays' | 'week';

export interface LeftoverOption {
  id: LeftoverModeId;
  label: string;
  hint: string;
  /** Person-based: portions added to `people`. Exclusive with `multiplier`. */
  extra?: number;
  /** Batch-based: portions = `multiplier × baseServings`. Ignores `people`. */
  multiplier?: number;
}

export const LEFTOVER_OPTIONS: ReadonlyArray<LeftoverOption> = [
  {
    id: 'tonight',
    label: 'Just tonight',
    extra: 0,
    hint: 'Exact portions — no leftovers.',
  },
  {
    id: 'lunch',
    label: '+ Lunches tomorrow',
    extra: 1,
    hint: 'One extra portion per person — tomorrow\u2019s lunch sorted.',
  },
  {
    id: 'threedays',
    label: '3-day batch',
    multiplier: 3,
    hint: 'Cook once, eat three times. Best for ragùs, curries, stews.',
  },
  {
    id: 'week',
    label: 'Big freezer batch',
    multiplier: 5,
    hint: 'A week of dinners in one session. Heavy ingredients only.',
  },
];

export function leftoverById(id: LeftoverModeId): LeftoverOption {
  return LEFTOVER_OPTIONS.find((o) => o.id === id) ?? LEFTOVER_OPTIONS[0];
}

/**
 * Resolve a leftover choice plus a party size into the *absolute number of
 * portions* to cook. This is the value that becomes `targetServings` for
 * `scaleIngredient`.
 *
 * The branch is intentional — see the LEFTOVER_OPTIONS comment above for
 * why we keep two semantics side by side.
 */
export function totalPortionsFor(
  opt: LeftoverOption,
  people: number,
  baseServings: number,
): number {
  if (typeof opt.multiplier === 'number') {
    return Math.max(1, opt.multiplier * baseServings);
  }
  return Math.max(1, people + (opt.extra ?? 0));
}
