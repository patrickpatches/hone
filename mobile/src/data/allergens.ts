/**
 * Allergens — declaration + inference.
 *
 * WHY THIS EXISTS
 * ----------------
 * Allergen information is a food-SAFETY feature. A missed declaration can put
 * someone in hospital. So the design here is deliberately conservative and
 * traceable:
 *
 *   1. The canonical list is the AUSTRALIAN standard — Food Standards Code
 *      1.2.3 / Plain English Allergen Labelling (PEAL, mandatory since Feb
 *      2024). This is the legal allergen set for an Australia-first app. It is
 *      NOT the US "Big 8/9": Australia declares lupin and molluscs separately,
 *      and — critically — does NOT treat coconut as a tree nut (see below).
 *
 *   2. Allergens are DERIVED from ingredient names, not authored on each
 *      recipe. One auditable rule set is the single source of truth, so the
 *      same logic covers the 16 seed recipes, future seed recipes, user-added
 *      recipes, AND pantry/Claude-generated recipes — nothing can ship an
 *      ingredient whose allergens silently go undeclared. The rules below were
 *      verified line-by-line against every ingredient in the launch roster.
 *
 *   3. We err towards OVER-declaring. For allergens, a false positive ("this
 *      might contain X") is a minor annoyance; a false negative is dangerous.
 *      Where an ingredient *commonly* carries a hidden allergen (Thai curry
 *      paste → shrimp paste; soy sauce → wheat), we declare it.
 *
 * THE TRAPS (why this file is mostly exclusions)
 * ----------------------------------------------
 * Naive substring matching is how people get hurt. Each of these is a real
 * ingredient in the recipe data that a sloppy matcher gets WRONG:
 *   - "Chicken breast, butterflied"     → NOT milk  (has "butter")
 *   - "Butter lettuce" / "butter bean"  → NOT milk
 *   - "Beef mince (chuck or oyster blade)" → NOT mollusc (beef cut)
 *   - "Oyster mushrooms"                → NOT mollusc (a fungus)
 *   - "Whole nutmeg, freshly grated"    → NOT tree nut (a seed)
 *   - "Chestnut mushrooms"              → NOT tree nut
 *   - "Cornflour"                       → NOT gluten (maize starch, GF in AU)
 *   - "Sebago potatoes (floury variety)"→ NOT gluten ("floury" texture)
 *   - "Salt (for pasta water)"          → NOT gluten (it's salt)
 *   - "Flat rice noodles" / "rice vermicelli" → NOT gluten (rice)
 *   - "Coconut milk" / "coconut cream"  → NOT milk, NOT tree nut (AU exempts coconut)
 *   - "Flaky salt" / "sea salt flakes"  → NOT fish ("flake" = gummy shark fish)
 *
 * Honest about limits (CLAUDE.md Golden Rule #6): name-based inference cannot
 * see brand-specific recipe variations or cross-contamination. The UI pairs
 * every declaration with a "check the packet" disclaimer — see
 * ALLERGEN_DISCLAIMER.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// The canonical allergen set — Australian PEAL (Food Standards Code 1.2.3)
// ---------------------------------------------------------------------------

export const AllergenId = z.enum([
  'gluten',     // cereals containing gluten: wheat, rye, barley, oats
  'crustacean', // prawn, crab, lobster, shrimp paste
  'mollusc',    // oyster, mussel, squid, scallop (declared separately to crustacea in AU)
  'egg',
  'fish',       // incl. fish sauce, anchovy, Worcestershire
  'milk',       // dairy
  'peanut',
  'tree_nut',   // almond, cashew, pine nut, etc. — NOT coconut in Australia
  'sesame',     // incl. tahini
  'soy',
  'lupin',
  'sulphites',  // added sulphites ≥10 mg/kg
]);
export type AllergenId = z.infer<typeof AllergenId>;

export interface AllergenMeta {
  id: AllergenId;
  /** Display label, Australian English. */
  label: string;
  /** Short clarifier shown under the label, e.g. what it includes. */
  note?: string;
}

/**
 * Display order + metadata. Order is roughly by prevalence/severity so the
 * most common declarations read first. The UI renders allergens in THIS order
 * regardless of detection order.
 */
export const ALLERGENS: AllergenMeta[] = [
  { id: 'gluten',     label: 'Gluten',     note: 'wheat, rye, barley, oats' },
  { id: 'milk',       label: 'Milk',       note: 'dairy' },
  { id: 'egg',        label: 'Egg' },
  { id: 'fish',       label: 'Fish',       note: 'incl. fish sauce, anchovy' },
  { id: 'crustacean', label: 'Crustacean', note: 'prawn, crab, shrimp paste' },
  { id: 'mollusc',    label: 'Mollusc',    note: 'oyster, squid, mussel' },
  { id: 'peanut',     label: 'Peanut' },
  { id: 'tree_nut',   label: 'Tree nuts',  note: 'almond, cashew, pine nut' },
  { id: 'sesame',     label: 'Sesame',     note: 'incl. tahini' },
  { id: 'soy',        label: 'Soy' },
  { id: 'lupin',      label: 'Lupin' },
  { id: 'sulphites',  label: 'Added sulphites' },
];

const ALLERGEN_ORDER: Record<AllergenId, number> = ALLERGENS.reduce(
  (acc, a, i) => { acc[a.id] = i; return acc; },
  {} as Record<AllergenId, number>,
);

export function allergenMeta(id: AllergenId): AllergenMeta {
  return ALLERGENS.find((a) => a.id === id) ?? { id, label: id };
}

/**
 * Shown alongside every allergen declaration. Honesty about the limits of
 * recipe-level, name-based inference (CLAUDE.md Golden Rule #6).
 */
export const ALLERGEN_DISCLAIMER =
  'Based on the listed ingredients. Always check the packet on branded ' +
  'products — sauces, stocks and pastes vary by brand, and fresh pasta may ' +
  'contain egg. This does not account for cross-contamination or traces. ' +
  'If you have a serious allergy, confirm every ingredient yourself.';

// ---------------------------------------------------------------------------
// Inference — ingredient name → allergens
// ---------------------------------------------------------------------------

/**
 * Detect the allergens an ingredient carries from its name.
 *
 * Operates on the lowercased name. Every rule was checked against the real
 * launch-roster ingredient list; the comments call out the specific
 * false-positive each exclusion prevents.
 *
 * Returns allergens in canonical display order, de-duplicated.
 */
export function inferIngredientAllergens(rawName: string): AllergenId[] {
  // Normalise: lowercase, collapse hyphens/dashes to spaces so "butter-bean"
  // and "butter bean" behave the same. Keep it simple — no stemming.
  const n = rawName.toLowerCase().replace(/[-–—]/g, ' ');
  const found = new Set<AllergenId>();
  const has = (re: RegExp) => re.test(n);

  const isCoconut = /\bcoconut\b/.test(n); // AU: coconut is neither milk nor tree nut

  // ── MILK ──────────────────────────────────────────────────────────────────
  // Skipped ENTIRELY for coconut-based ingredients: coconut milk / coconut
  // cream / coconut butter are plant-based, and Australia does not treat
  // coconut as a dairy (or a tree nut). Without this guard, "Coconut milk"
  // would trip the \bmilk\b rule below.
  if (!isCoconut) {
    // Explicit dairy words (whole-word).
    if (has(/\b(milk|buttermilk|cheese|cheddar|parmesan|parmigiano|pecorino|gruyere|gruyère|mozzarella|provolone|paneer|halloumi|feta|ricotta|mascarpone|ghee|yoghurt|yogurt|custard|crema|brioche)\b/)) {
      found.add('milk');
    }
    // "cream"/"crème" — but NOT the "Dutch Cream" potato variety or cream of
    // tartar (a raising agent, not dairy).
    if (has(/\b(cream|crème|creme)\b/) && !/dutch cream|cream of tartar/.test(n)) {
      found.add('milk');
    }
    // "butter" is the trap field. Flag milk only when it really is dairy butter.
    // Excludes: butterflied (chicken), butter lettuce/bean/head, butternut,
    // peanut butter (→ peanut), cocoa butter.
    if (
      has(/\bbutter/) &&
      !/butterfl|butter lettuce|butter bean|butterhead|butternut|peanut butter|cocoa butter/.test(n)
    ) {
      found.add('milk');
    }
  }

  // ── EGG ───────────────────────────────────────────────────────────────────
  // "egg"/"eggs" but never "eggplant"; plus egg-bearing products.
  if ((/\begg/.test(n) && !/eggplant/.test(n)) || has(/\b(mayonnaise|mayo|aioli|meringue|brioche)\b/)) {
    found.add('egg');
  }

  // ── GLUTEN (wheat/rye/barley/oats) ─────────────────────────────────────────
  // "flour" → gluten, EXCEPT naturally gluten-free flours and the "floury
  // potato" texture word.
  if (
    /\bflour/.test(n) &&
    !/cornflour|corn flour|rice flour|chickpea flour|besan|almond flour|coconut flour|tapioca flour|potato flour|buckwheat flour|gluten free|gluten-free|floury/.test(n)
  ) {
    found.add('gluten');
  }
  // Breads, crumbs, baked wheat goods, wheat grains.
  if (has(/\b(bread|breadcrumb|panko|crouton|bun|buns|brioche|pitta|pita|flatbread|naan|roti|chapati|sourdough|baguette|ciabatta|croissant|crumpet|bagel|pretzel|cracker|pastry|filo|wheat|spelt|farro|semolina|couscous|bulgur|barley|\brye\b|malt|seitan)\b/) && !/buckwheat|gluten free|gluten-free/.test(n)) {
    found.add('gluten');
  }
  // Wheat pasta / wheat noodles. Rice noodles & rice vermicelli are GF, and
  // "salt for pasta water" is salt, not pasta.
  if (
    has(/\b(pasta|spaghetti|pappardelle|lasagne|lasagna|macaroni|penne|fettuccine|tagliatelle|linguine|fusilli|rigatoni|orzo|gnocchi|ramen|udon|soba)\b/) &&
    !/pasta water/.test(n)
  ) {
    // (soba is buckwheat but usually cut with wheat flour — declare to be safe.)
    found.add('gluten');
  }
  if (has(/\b(noodle|noodles|vermicelli)\b/) && !/rice (noodle|noodles|vermicelli)|rice vermicelli|kway teow|glass noodle|mung bean/.test(n)) {
    found.add('gluten');
  }
  // Beer/ale/lager (barley).
  if (has(/\b(beer|lager|ale|stout)\b/)) found.add('gluten');

  // ── CRUSTACEAN ─────────────────────────────────────────────────────────────
  if (has(/\b(prawn|prawns|shrimp|crab|lobster|crayfish|langoustine|scampi|yabby|krill)\b/)) {
    found.add('crustacean');
  }
  // Shrimp paste / fermented shrimp products.
  if (has(/\b(belacan|terasi|kapi|bagoong)\b/) || /shrimp paste/.test(n)) found.add('crustacean');
  // Thai/SE-Asian curry PASTE (not powder) commonly contains shrimp paste.
  if (/curry paste/.test(n) && !/curry powder/.test(n)) found.add('crustacean');
  // Thai roasted chilli jam commonly contains dried shrimp + fish.
  if (/nam prik pao|chilli jam|chili jam/.test(n)) { found.add('crustacean'); found.add('fish'); }

  // ── MOLLUSC ────────────────────────────────────────────────────────────────
  // "oyster" → mollusc, but NOT "oyster mushroom" (fungus) or "oyster blade"
  // (a beef cut).
  if (/\boyster/.test(n) && !/oyster mushroom|oyster blade/.test(n)) found.add('mollusc');
  if (has(/\b(mussel|clam|scallop|squid|calamari|octopus|cuttlefish|abalone|whelk|periwinkle|escargot)\b/)) {
    found.add('mollusc');
  }
  // Oyster sauce: oyster (mollusc) and commonly wheat.
  if (/oyster sauce/.test(n)) { found.add('mollusc'); found.add('gluten'); }

  // ── FISH ───────────────────────────────────────────────────────────────────
  // \bflake\b matches the standalone fish "flake" (gummy shark) but the word
  // boundary leaves "flakes"/"flaky" (salt/chilli) untouched.
  if (has(/\b(fish|anchovy|anchovies|barramundi|salmon|tuna|cod|haddock|halibut|snapper|mackerel|sardine|trout|flake|whitebait|bream|trevally|pollock|tilapia|kingfish|whiting)\b/)) {
    found.add('fish');
  }
  if (/fish sauce|nam pla|nuoc mam|worcestershire/.test(n)) found.add('fish');
  // Worcestershire also carries malt (barley) gluten.
  if (/worcestershire/.test(n)) found.add('gluten');

  // ── PEANUT ─────────────────────────────────────────────────────────────────
  if (has(/\b(peanut|peanuts|groundnut|groundnuts|satay)\b/)) found.add('peanut');

  // ── TREE NUTS ──────────────────────────────────────────────────────────────
  // Named nuts only — never bare "nut" (would catch nutmeg, butternut,
  // coconut). "chestnut" is deliberately omitted: the only occurrences in the
  // data are "chestnut mushrooms" (a fungus) and water chestnut (an aquatic
  // veg), neither of which is a tree nut.
  if (has(/\b(almond|almonds|hazelnut|hazelnuts|walnut|walnuts|cashew|cashews|pecan|pecans|pistachio|pistachios|macadamia|macadamias|brazil nut|brazil nuts|pine nut|pine nuts|pinenut|pinenuts|candlenut|candlenuts|praline|marzipan|frangipane|nutella|gianduja)\b/)) {
    found.add('tree_nut');
  }

  // ── SESAME ─────────────────────────────────────────────────────────────────
  // tahini & hummus (which is built on tahini) are the hidden ones.
  if (has(/\b(sesame|tahini|tahina|hummus|houmous|gomashio|halva|halwa|benne)\b/) || /za'?atar/.test(n)) {
    found.add('sesame');
  }

  // ── SOY ────────────────────────────────────────────────────────────────────
  // Named soy products only — never bare "bean" (bean sprouts are mung bean).
  if (has(/\b(soy|soya|soybean|soybeans|edamame|tofu|tempeh|miso|natto|tamari|shoyu)\b/) || /kecap manis|hoisin|teriyaki/.test(n)) {
    found.add('soy');
  }
  // Regular soy sauce contains wheat; tamari is the gluten-free exception.
  if (/soy sauce|\bshoyu\b/.test(n) && !/tamari/.test(n)) found.add('gluten');

  // ── LUPIN ──────────────────────────────────────────────────────────────────
  if (has(/\blupin\b/)) found.add('lupin');

  // ── ADDED SULPHITES ────────────────────────────────────────────────────────
  // Deliberately narrow. We do NOT flag wine/vinegar in cooked dishes: sulphite
  // levels there are typically well below the 10 mg/kg declaration threshold
  // and flagging every braise would be noise that erodes trust in the badge.
  // We DO flag dried fruit, where added sulphites are characteristically high
  // and present in the final dish.
  if (/\b(sultana|sultanas|raisin|raisins)\b/.test(n) || /dried (apricot|apricots|fig|figs|fruit|mango|pear|peach)/.test(n)) {
    found.add('sulphites');
  }

  return [...found].sort((a, b) => ALLERGEN_ORDER[a] - ALLERGEN_ORDER[b]);
}

// ---------------------------------------------------------------------------
// Recipe-level rollup
// ---------------------------------------------------------------------------

/** Minimal shape needed for the rollup — anything with named ingredients. */
interface HasNamedIngredients {
  ingredients: { name: string }[];
}

/**
 * The union of all allergens across a recipe's ingredients, in canonical
 * display order. This is the recipe's declaration.
 *
 * An empty array is a meaningful result — "no major allergens from the listed
 * ingredients" — and the UI renders it as such (with the disclaimer), never as
 * a blank.
 */
export function recipeAllergens(recipe: HasNamedIngredients): AllergenId[] {
  const found = new Set<AllergenId>();
  for (const ing of recipe.ingredients) {
    for (const a of inferIngredientAllergens(ing.name)) found.add(a);
  }
  return [...found].sort((a, b) => ALLERGEN_ORDER[a] - ALLERGEN_ORDER[b]);
}

// ---------------------------------------------------------------------------
// Dev audit — coverage tripwire (mirrors the validateDecision015 pattern)
// ---------------------------------------------------------------------------

/**
 * Dev-only. Logs each recipe's derived allergens so a regression in the rules
 * is visible at a glance, and flags ingredients that matched NO allergen rule
 * AND look like they might carry one (a heuristic catch-net for gaps in the
 * inference table). Production APK stays silent.
 */
export function auditAllergens(recipes: Array<HasNamedIngredients & { id?: string; title?: string }>): void {
  // eslint-disable-next-line no-undef
  if (!(typeof __DEV__ !== 'undefined' && __DEV__)) return;

  // Words that strongly imply an allergen — if an ingredient contains one of
  // these but inference returned nothing, the rule table may have a gap.
  const SUSPICIOUS = /\b(milk|butter|cheese|cream|egg|flour|bread|pasta|noodle|sesame|tahini|soy|tofu|fish|prawn|shrimp|oyster|wheat|gluten|peanut|almond|cashew)\b/;

  for (const r of recipes) {
    const declared = recipeAllergens(r);
    // eslint-disable-next-line no-console
    console.log(`[allergens] ${r.id ?? r.title ?? '?'}: ${declared.length ? declared.join(', ') : '(none)'}`);
    for (const ing of r.ingredients) {
      const hit = inferIngredientAllergens(ing.name);
      if (hit.length === 0 && SUSPICIOUS.test(ing.name.toLowerCase())) {
        // eslint-disable-next-line no-console
        console.warn(`[allergens] possible gap — "${ing.name}" matched no allergen rule but looks allergen-bearing`);
      }
    }
  }
}
