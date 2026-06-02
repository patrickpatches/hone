/**
 * Measure type for an ingredient / shopping / pantry item.
 *
 * HONE-023 (GitHub Issue #13): the pantry stepper treated every item as a bare
 * count — it flattened a weighed "160 g" to a count and clamped at 99, dropping
 * the unit. The measure type tells display + stepper how an item behaves:
 *
 *   - weight  (g, kg, …)   keep the amount + unit; step by sensible weight steps
 *   - volume  (ml, l, …)   keep the amount + unit; step by sensible volume steps
 *   - count   (eggs, tins, cloves, no unit)  whole number; step by 1
 *
 * It is DERIVED from the `unit` string, which is already carried recipe →
 * shopping list → pantry (the shop→pantry mirror copies it, addMissing copies
 * it). Deriving from the carried unit via this one resolver means the measure
 * type is identical at every layer with no stored field that could drift out of
 * sync with the unit. (A whole egg has unit "" → count; 160 g chicken has unit
 * "g" → weight; 400 ml coconut milk → volume; 2 tins → count.)
 */

export type Measure = 'weight' | 'volume' | 'count';

const WEIGHT_UNITS = new Set([
  'g', 'gram', 'grams', 'kg', 'kgs', 'kilogram', 'kilograms',
  'mg', 'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds',
]);

const VOLUME_UNITS = new Set([
  'ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres',
  'l', 'litre', 'litres', 'liter', 'liters',
  'tsp', 'teaspoon', 'teaspoons', 'tbsp', 'tablespoon', 'tablespoons',
  'cup', 'cups', 'floz', 'pinch', 'dash',
]);

/** Resolve an item's measure type from its unit string. Unknown / empty → count. */
export function inferMeasure(unit: string | null | undefined): Measure {
  if (!unit) return 'count';
  const u = unit.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
  if (!u) return 'count';
  if (WEIGHT_UNITS.has(u)) return 'weight';
  if (VOLUME_UNITS.has(u)) return 'volume';
  return 'count';
}

/** True for weight/volume items that carry a real numeric amount + unit. */
export function isWeighed(quantity: number | null | undefined, unit: string | null | undefined): boolean {
  if (quantity == null || !unit) return false;
  const m = inferMeasure(unit);
  return m === 'weight' || m === 'volume';
}

/**
 * Sensible +/- step for a weighed item, scaled to its magnitude so the stepper
 * is useful at 5 g and at 2000 g alike. Counts always step by 1.
 */
export function stepFor(measure: Measure, qty: number): number {
  if (measure === 'count') return 1;
  const q = Math.abs(qty || 0);
  if (q < 20) return 1;
  if (q < 100) return 5;
  if (q < 250) return 10;
  if (q < 1000) return 25;
  return 100;
}

/** "160 g", "400 ml", or just "2" for a count (no unit). Empty for ≤0. */
export function formatQty(qty: number | null | undefined, unit: string | null | undefined): string {
  if (qty == null || qty <= 0) return '';
  const rounded = qty < 10 ? Math.round(qty * 10) / 10 : Math.round(qty);
  const num = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return unit ? `${num} ${unit}` : num;
}
