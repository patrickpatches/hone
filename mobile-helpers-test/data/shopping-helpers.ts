/**
 * Shopping list — pure functions over a list of ShoppingItem.
 *
 * The list is a *derived view*. Every row tracks the sources that put it
 * there: meal contributions and/or a manual flag. Source tracking is the
 * single mechanism that makes "delete a meal removes its ingredients
 * unless I added them too" trivially correct — we just remove that meal's
 * source entry and drop rows whose source list ends up empty AND aren't
 * manually-added.
 *
 * All functions here are pure: they take the current list (and inputs)
 * and return a new list. The caller persists via replaceShoppingItems.
 */

import type { Recipe } from './types';
import type { ShoppingItem, ShoppingSource } from '../../db/database';
import { categorizeIngredient, cleanIngredientName, normalizeForMatch } from './pantry-helpers';
import { scaleIngredient } from './scale';

// ── ID helper ────────────────────────────────────────────────────────────────

function shoppingId(name: string): string {
  return (
    'shop-' +
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 8)
  );
}

// ── Find by canonical name + unit ────────────────────────────────────────────
//
// Two ingredients merge into one shopping row when their normalised names
// match AND their units match. Different units stay as separate lines; we
// don't pretend to convert grams ↔ cups.

function sameSlot(a: ShoppingItem, b: { name: string; unit: string | null }): boolean {
  if (normalizeForMatch(a.name) !== normalizeForMatch(b.name)) return false;
  // Merge when units match OR when either side has no unit. A manual row
  // typed as just "Garlic" should absorb a meal contribution of "4 cloves
  // garlic" — real users don't think in units. The merged row inherits the
  // more specific (non-null) unit.
  const ua = a.unit ?? null;
  const ub = b.unit ?? null;
  if (ua === ub) return true;
  return ua === null || ub === null;
}

// ── Recompute quantity from sources ──────────────────────────────────────────
//
// For each meal source on the row, look up the matching ingredient on the
// recipe, scale it to that meal's servings, sum. Manual-only rows keep
// whatever quantity they were last set to.

function recomputeQuantity(
  item: ShoppingItem,
  recipes: ReadonlyMap<string, Recipe>,
  ingredientNameMatch: string, // normalised name we're summing for
): number | null {
  let total = 0;
  let hadAny = false;
  for (const src of item.sources) {
    if (src.kind !== 'meal') continue;
    const recipe = recipes.get(src.recipe_id);
    if (!recipe) continue; // recipe deleted — source will be cleaned by reconcile
    const ing = recipe.ingredients.find(
      (i) => normalizeForMatch(i.name) === ingredientNameMatch && (i.unit ?? '') === (item.unit ?? ''),
    );
    if (!ing) continue;
    total += scaleIngredient(ing, src.servings, recipe.base_servings);
    hadAny = true;
  }
  if (hadAny) return total;
  // No meal sources contributed — keep manual quantity untouched.
  return item.quantity;
}

// ── Apply: meal added to plan ────────────────────────────────────────────────

export function applyMealAdd(
  list: ReadonlyArray<ShoppingItem>,
  recipe: Recipe,
  servings: number,
  recipes: ReadonlyMap<string, Recipe>,
): ShoppingItem[] {
  const next: ShoppingItem[] = list.map((it) => ({ ...it, sources: [...it.sources] }));
  const now = Date.now();

  for (const ing of recipe.ingredients) {
    const cleaned = cleanIngredientName(ing.name);
    if (!cleaned) continue;
    const slot = { name: cleaned, unit: ing.unit ?? null };
    const existingIdx = next.findIndex((it) => sameSlot(it, slot));
    const newSource: ShoppingSource = {
      kind: 'meal',
      recipe_id: recipe.id,
      servings,
    };

    if (existingIdx >= 0) {
      const existing = next[existingIdx];
      // Remove any prior source for this same recipe (re-adding replaces).
      const otherSources = existing.sources.filter(
        (s) => !(s.kind === 'meal' && s.recipe_id === recipe.id),
      );
      // If the existing row had no unit (e.g. user typed plain "Garlic"),
      // adopt the meal's unit so quantities can sum sensibly later.
      const adoptedUnit = existing.unit ?? ing.unit ?? null;
      const updated: ShoppingItem = {
        ...existing,
        unit: adoptedUnit,
        sources: [...otherSources, newSource],
      };
      updated.quantity = recomputeQuantity(updated, recipes, normalizeForMatch(cleaned));
      next[existingIdx] = updated;
    } else {
      const fresh: ShoppingItem = {
        id: shoppingId(cleaned),
        name: cleaned,
        category: categorizeIngredient(cleaned),
        quantity: scaleIngredient(ing, servings, recipe.base_servings),
        unit: ing.unit ?? null,
        notes: null,
        manually_added: false,
        in_cart: false,
        added_at: now,
        sources: [newSource],
      };
      next.push(fresh);
    }
  }
  return next;
}

// ── Apply: meal removed from plan ────────────────────────────────────────────

export function applyMealRemove(
  list: ReadonlyArray<ShoppingItem>,
  recipeId: string,
  recipes: ReadonlyMap<string, Recipe>,
): ShoppingItem[] {
  const out: ShoppingItem[] = [];
  for (const it of list) {
    const remainingSources = it.sources.filter(
      (s) => !(s.kind === 'meal' && s.recipe_id === recipeId),
    );
    if (remainingSources.length === it.sources.length) {
      // No source for this recipe on this row — pass through unchanged.
      out.push(it);
      continue;
    }
    if (remainingSources.length === 0 && !it.manually_added) {
      // Last source went, no manual flag → drop the row entirely.
      continue;
    }
    const updated: ShoppingItem = { ...it, sources: remainingSources };
    updated.quantity = recomputeQuantity(updated, recipes, normalizeForMatch(it.name));
    out.push(updated);
  }
  return out;
}

// ── Apply: meal servings changed ─────────────────────────────────────────────

export function applyMealServingsChange(
  list: ReadonlyArray<ShoppingItem>,
  recipeId: string,
  newServings: number,
  recipes: ReadonlyMap<string, Recipe>,
): ShoppingItem[] {
  return list.map((it) => {
    const sources = it.sources.map((s) =>
      s.kind === 'meal' && s.recipe_id === recipeId ? { ...s, servings: newServings } : s,
    );
    if (sources === it.sources) return it;
    const updated: ShoppingItem = { ...it, sources };
    updated.quantity = recomputeQuantity(updated, recipes, normalizeForMatch(it.name));
    return updated;
  });
}

// ── Manual add ───────────────────────────────────────────────────────────────

export function addManualItem(
  list: ReadonlyArray<ShoppingItem>,
  rawName: string,
  category?: string,
  quantity?: number,
  unit?: string,
): ShoppingItem[] {
  const cleaned = cleanIngredientName(rawName);
  if (!cleaned) return [...list];
  const slot = { name: cleaned, unit: unit ?? null };
  const existingIdx = list.findIndex((it) => sameSlot(it, slot));
  const next = list.map((it) => ({ ...it, sources: [...it.sources] }));

  if (existingIdx >= 0) {
    // Already on the list — just flip the manually_added flag so it sticks
    // even if its meal sources later go away.
    const existing = next[existingIdx];
    if (existing.manually_added) return next; // no change
    next[existingIdx] = {
      ...existing,
      manually_added: true,
      sources: existing.sources.some((s) => s.kind === 'manual')
        ? existing.sources
        : [...existing.sources, { kind: 'manual' }],
    };
    return next;
  }

  const fresh: ShoppingItem = {
    id: shoppingId(cleaned),
    name: cleaned,
    category: category ?? categorizeIngredient(cleaned),
    quantity: quantity ?? null,
    unit: unit ?? null,
    notes: null,
    manually_added: true,
    in_cart: false,
    added_at: Date.now(),
    sources: [{ kind: 'manual' }],
  };
  next.push(fresh);
  return next;
}

// ── Toggle in cart ───────────────────────────────────────────────────────────

export function toggleInCart(
  list: ReadonlyArray<ShoppingItem>,
  id: string,
): ShoppingItem[] {
  return list.map((it) => (it.id === id ? { ...it, in_cart: !it.in_cart } : it));
}

// ── Edit quantity / unit / notes ─────────────────────────────────────────────

export function editItem(
  list: ReadonlyArray<ShoppingItem>,
  id: string,
  patch: Partial<Pick<ShoppingItem, 'quantity' | 'unit' | 'notes' | 'category'>>,
): ShoppingItem[] {
  return list.map((it) => (it.id === id ? { ...it, ...patch } : it));
}

// ── User-explicit removal ────────────────────────────────────────────────────

export function removeShoppingItem(
  list: ReadonlyArray<ShoppingItem>,
  id: string,
): ShoppingItem[] {
  return list.filter((it) => it.id !== id);
}

// ── Convenience: build the recipes-by-id map the helpers expect ──────────────

export function recipesById(recipes: ReadonlyArray<Recipe>): Map<string, Recipe> {
  const m = new Map<string, Recipe>();
  for (const r of recipes) m.set(r.id, r);
  return m;
}
