import type { SQLiteDatabase } from 'expo-sqlite';
import type { Recipe } from './types';
import { upsertPantryItem } from '../../db/database';
import type { PantryItem } from '../../db/database';
import { DERIVATION_LOOKUP } from './ingredient-derivations';
import type { DerivationEntry } from './ingredient-derivations';

export type PantryCategory =
  | 'Proteins'
  | 'Dairy & Eggs'
  | 'Produce'
  | 'Pantry Staples'
  | 'Spices & Seasonings'
  | 'Condiments & Sauces'
  | 'Frozen';

export const PANTRY_CATEGORIES: PantryCategory[] = [
  'Proteins',
  'Dairy & Eggs',
  'Produce',
  'Pantry Staples',
  'Spices & Seasonings',
  'Condiments & Sauces',
  'Frozen',
];

export const CATEGORY_EMOJI: Record<PantryCategory, string> = {
  Proteins: '🥩',
  'Dairy & Eggs': '🧀',
  Produce: '🥦',
  'Pantry Staples': '🫙',
  'Spices & Seasonings': '🌿',
  'Condiments & Sauces': '🥫',
  Frozen: '❄️',
};

export const SHOPPING_SECTION_LABEL: Record<PantryCategory, string> = {
  Proteins: 'Meat & Seafood',
  'Dairy & Eggs': 'Dairy & Eggs',
  Produce: 'Produce',
  'Pantry Staples': 'Pantry',
  'Spices & Seasonings': 'Spices & Herbs',
  'Condiments & Sauces': 'Sauces & Condiments',
  Frozen: 'Frozen',
};

export const SHOPPING_SECTION_ORDER: PantryCategory[] = [
  'Produce',
  'Proteins',
  'Dairy & Eggs',
  'Pantry Staples',
  'Condiments & Sauces',
  'Spices & Seasonings',
  'Frozen',
];

export function cleanIngredientName(raw: string): string {
  return raw
    .replace(/\(.*?\)/g, '')
    .replace(/,\s*.*/g, '')
    .replace(
      /\b(finely|roughly|thinly|coarsely|freshly|lightly|very|extra|large|medium|small|heaped|level)\b/gi,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

export function categorizeIngredient(name: string): PantryCategory {
  const n = name.toLowerCase();

  if (n.includes('frozen')) return 'Frozen';

  const proteins = [
    'beef', 'chicken', 'pork', 'salmon', 'tuna', 'cod', 'sea bass', 'halibut',
    'tilapia', 'shrimp', 'prawn', 'lamb', 'duck', 'turkey', 'tofu', 'tempeh',
    'bacon', 'pancetta', 'lardons', 'chorizo', 'sausage', 'prosciutto',
    'anchovy', 'sardine', 'mackerel', 'mince', 'steak', 'brisket', 'tenderloin',
    'short rib', 'ground beef', 'ground pork', 'ground turkey',
  ];
  if (proteins.some((w) => n.includes(w))) return 'Proteins';

  const dairy = [
    'milk', 'double cream', 'single cream', 'heavy cream', 'whipping cream',
    'cream', 'butter', 'cheese', 'parmesan', 'mozzarella', 'cheddar', 'ricotta',
    'mascarpone', 'brie', 'feta', 'gouda', 'gruyere', 'halloumi', 'stilton',
    'yogurt', 'yoghurt', 'creme fraiche', 'sour cream',
  ];
  if (/\begg/.test(n) || dairy.some((w) => n.includes(w))) return 'Dairy & Eggs';

  const condiments = [
    'soy sauce', 'fish sauce', 'oyster sauce', 'hoisin', 'ketchup',
    'mayonnaise', 'mayo', 'worcestershire', 'tahini', 'miso', 'sriracha',
    'hot sauce', 'chili paste', 'chilli paste', 'gochujang', 'doenjang',
    'tomato paste', 'tomato purée', 'tomato puree', 'tomato concentrate',
    'barbecue sauce', 'teriyaki', 'pesto', 'harissa',
  ];
  if (condiments.some((w) => n.includes(w))) return 'Condiments & Sauces';
  if (n.includes('vinegar')) return 'Condiments & Sauces';
  if (n.includes('mustard') && !n.includes('mustard seed') && !n.includes('mustard powder'))
    return 'Condiments & Sauces';

  const spiceHints = [
    ' powder', ' flakes', 'ground ', 'dried ',
    'cumin', 'turmeric', 'cinnamon', 'nutmeg', 'cardamom', 'star anise',
    'bay leaf', 'bay leaves', 'oregano', 'marjoram', 'cayenne',
    'chilli flake', 'chili flake', 'red pepper flake', 'smoked paprika',
    'sumac', 'garam masala', 'curry powder', 'five spice', 'ras el hanout', "za'atar",
  ];
  if (/\bsalt\b/.test(n) || /\bpepper\b/.test(n)) return 'Spices & Seasonings';
  if (spiceHints.some((w) => n.includes(w))) return 'Spices & Seasonings';
  if (n.includes('paprika') && !n.includes('fresh')) return 'Spices & Seasonings';

  const produce = [
    'onion', 'shallot', 'spring onion', 'scallion', 'leek', 'garlic',
    'tomato', 'potato', 'sweet potato', 'carrot', 'parsnip', 'celery',
    'bell pepper', 'capsicum', 'jalapeño', 'jalapeno', 'serrano', 'habanero',
    'cucumber', 'courgette', 'zucchini', 'eggplant', 'aubergine',
    'broccoli', 'cauliflower', 'cabbage', 'brussels', 'lettuce', 'spinach',
    'kale', 'chard', 'arugula', 'rocket', 'mushroom', 'shiitake', 'portobello',
    'asparagus', 'artichoke', 'fennel', 'lemon', 'lime', 'orange', 'apple',
    'avocado', 'mango', 'lemongrass', 'ginger', 'galangal', 'fresh coriander',
    'fresh parsley', 'fresh basil', 'fresh thyme', 'fresh rosemary', 'fresh mint',
    'fresh dill', 'fresh herb', 'coriander leaf', 'cilantro', 'herb', 'chive',
  ];
  if (produce.some((w) => n.includes(w))) return 'Produce';

  return 'Pantry Staples';
}

export function normalizeForMatch(name: string): string {
  return cleanIngredientName(name)
    .toLowerCase()
    .replace(/\b(fresh|dried|ground|crushed|whole|extra|raw|cooked|ripe|young|old)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface RecipeMatchResult {
  recipe: Recipe;
  score: number;
  haveCount: number;
  totalCount: number;
  /** Backward-compat: names only. Prefer missingIngredients for display. */
  missingNames: string[];
  /** Full ingredient info for Variant A chips — name + amount + unit. */
  missingIngredients: Array<{ name: string; amount: number; unit: string }>;
  /**
   * Phase 2 — ingredients matched via derivation, not direct pantry ownership.
   * E.g. "egg yolks" matched because the user has "Eggs".
   * Used by the UI to show "from your eggs →" annotations and the prep icon.
   * Empty array when no derivation matches occurred.
   */
  derivationMatches: Array<{
    /** Cleaned recipe ingredient name. E.g. "egg yolks" */
    ingredientName: string;
    /** The pantry item that yields this ingredient. E.g. "Eggs" */
    derivedFrom: string;
    /** Full derivation entry — includes prep_note and quality flag. */
    entry: DerivationEntry;
  }>;
}

export function scoreRecipeAgainstPantry(
  recipe: Recipe,
  pantryItems: PantryItem[],
): RecipeMatchResult {
  const havePantryItems = pantryItems.filter((p) => p.have_it);
  const haveNorms = havePantryItems.map((p) => normalizeForMatch(p.name));

  // ── Phase 2: build a derivation lookup for this pantry ───────────────────
  //
  // For each pantry item the user has, look up what ingredients it can produce
  // (e.g. "Eggs" → egg yolks, egg whites, egg wash). We build a map from the
  // DERIVED ingredient's normalised name → the best pantry source for that
  // derivation. This lets isMatch() resolve recipe ingredients that aren't
  // literally in the pantry but can be produced from something that is.
  //
  // WHY: "egg yolks" does not substring-match "eggs" (singular ≠ plural, no
  // common substring longer than 3 chars). Without this, Carbonara and Pavlova
  // score zero on the egg axis even when the user has eggs.
  //
  // The map stores all sources per derived norm so the UI can display the most
  // relevant "from your X →" annotation. The scoring function records only the
  // first (best-quality) source per match.

  const derivationSourceMap = new Map<string, Array<{
    pantryName: string;
    entry: DerivationEntry;
  }>>();

  for (const pantryItem of havePantryItems) {
    const sourceNorm = normalizeForMatch(pantryItem.name);
    const derivations = DERIVATION_LOOKUP.get(sourceNorm) ?? [];
    for (const entry of derivations) {
      const derivedNorm = normalizeForMatch(entry.derived);
      const existing = derivationSourceMap.get(derivedNorm) ?? [];
      existing.push({ pantryName: pantryItem.name, entry });
      derivationSourceMap.set(derivedNorm, existing);
    }
  }

  // Accumulates as isMatch() runs — one entry per recipe ingredient that was
  // matched via derivation rather than direct pantry ownership.
  const derivationHits: RecipeMatchResult['derivationMatches'] = [];

  // ── Core match predicate ─────────────────────────────────────────────────

  const isMatch = (recipeName: string): boolean => {
    const norm = normalizeForMatch(recipeName);

    // 1. Direct match — the existing phase-1 logic.
    const directMatch = haveNorms.some((p) => {
      if (norm === p) return true;
      if (norm.length > 4 && p.length > 4 && (norm.includes(p) || p.includes(norm))) return true;
      const ta = norm.split(' ').filter((t) => t.length > 2);
      const tb = p.split(' ').filter((t) => t.length > 2);
      return ta.filter((t) => tb.includes(t)).length >= 2;
    });
    if (directMatch) return true;

    // 2. Derivation match — Phase 2.
    //    Check whether any pantry item can PRODUCE this ingredient via a known
    //    culinary transformation. Record the match for UI display.
    const sources = derivationSourceMap.get(norm);
    if (sources && sources.length > 0) {
      // Use the first source — if multiple pantry items can derive this
      // ingredient, the first one in the pantry list is fine for display.
      const { pantryName, entry } = sources[0];
      derivationHits.push({
        ingredientName: cleanIngredientName(recipeName),
        derivedFrom: pantryName,
        entry,
      });
      return true;
    }

    return false;
  };

  // ── Score ─────────────────────────────────────────────────────────────────

  let matched = 0;
  const missingRaw: Array<{ name: string; amount: number; unit: string }> = [];

  for (const ing of recipe.ingredients) {
    if (isMatch(ing.name)) {
      matched++;
    } else {
      missingRaw.push({
        name: cleanIngredientName(ing.name),
        amount: ing.amount,
        unit: ing.unit,
      });
    }
  }

  const total = recipe.ingredients.length;
  const coverage = total > 0 ? matched / total : 0;

  const aromaticKeywords = ['garlic', 'onion', 'shallot', 'leek'];
  const recipeAromatics = recipe.ingredients.filter((ing) =>
    aromaticKeywords.some((a) => ing.name.toLowerCase().includes(a)),
  );
  const hasAllAromatics =
    recipeAromatics.length === 0 || recipeAromatics.every((ing) => isMatch(ing.name));

  // Sort missing ingredients so those with substitutions come first —
  // they're the most actionable (the user has fallback options).
  // NOTE: do NOT cap this list here. missingIngredients is used by
  // addMissingToShoppingList() to write ALL missing items to the Shop
  // list. Apply any display cap in the UI (e.g. pantry carousel chips)
  // not in the data layer — a cap here silently drops ingredients.
  const withSubs = missingRaw.filter((m) => {
    const orig = recipe.ingredients.find(
      (ing) => cleanIngredientName(ing.name) === m.name,
    );
    return (orig?.substitutions?.length ?? 0) > 0;
  });
  const withoutSubs = missingRaw.filter((m) => !withSubs.includes(m));
  const sortedMissing = [...withSubs, ...withoutSubs]; // full list — no cap

  return {
    recipe,
    score: coverage + (hasAllAromatics ? 0.1 : 0),
    haveCount: matched,
    totalCount: total,
    missingNames: sortedMissing.map((m) => m.name),
    missingIngredients: sortedMissing,
    derivationMatches: derivationHits,
  };
}

export function pantryId(name: string): string {
  return (
    'pantry-' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

const COMMON_STAPLES: { name: string; category: PantryCategory }[] = [
  { name: 'Salt', category: 'Spices & Seasonings' },
  { name: 'Black pepper', category: 'Spices & Seasonings' },
  { name: 'Olive oil', category: 'Pantry Staples' },
  { name: 'Vegetable oil', category: 'Pantry Staples' },
  { name: 'Plain flour', category: 'Pantry Staples' },
  { name: 'White sugar', category: 'Pantry Staples' },
  { name: 'Brown sugar', category: 'Pantry Staples' },
  { name: 'White rice', category: 'Pantry Staples' },
  { name: 'Pasta', category: 'Pantry Staples' },
  { name: 'Eggs', category: 'Dairy & Eggs' },
  { name: 'Unsalted butter', category: 'Dairy & Eggs' },
  { name: 'Whole milk', category: 'Dairy & Eggs' },
  { name: 'Garlic', category: 'Produce' },
  { name: 'Yellow onion', category: 'Produce' },
  { name: 'Lemon', category: 'Produce' },
  { name: 'Lime', category: 'Produce' },
  { name: 'Chicken stock', category: 'Pantry Staples' },
  { name: 'Vegetable stock', category: 'Pantry Staples' },
  { name: 'Canned tomatoes', category: 'Pantry Staples' },
  { name: 'Soy sauce', category: 'Condiments & Sauces' },
  { name: 'White wine vinegar', category: 'Condiments & Sauces' },
  { name: 'Dijon mustard', category: 'Condiments & Sauces' },
  { name: 'Cumin', category: 'Spices & Seasonings' },
  { name: 'Paprika', category: 'Spices & Seasonings' },
  { name: 'Dried oregano', category: 'Spices & Seasonings' },
  { name: 'Chilli flakes', category: 'Spices & Seasonings' },
  { name: 'Garlic powder', category: 'Spices & Seasonings' },
  { name: 'Onion powder', category: 'Spices & Seasonings' },
  { name: 'Bay leaves', category: 'Spices & Seasonings' },
  { name: 'Cinnamon', category: 'Spices & Seasonings' },
  { name: 'Turmeric', category: 'Spices & Seasonings' },
];

export async function initializePantryItems(
  db: SQLiteDatabase,
  recipes: Recipe[],
): Promise<void> {
  const seen = new Map<string, { name: string; category: PantryCategory }>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const clean = cleanIngredientName(ing.name);
      if (!clean) continue;
      const key = normalizeForMatch(clean);
      if (!seen.has(key)) {
        seen.set(key, { name: clean, category: categorizeIngredient(clean) });
      }
    }
  }

  for (const staple of COMMON_STAPLES) {
    const key = normalizeForMatch(staple.name);
    if (!seen.has(key)) {
      seen.set(key, staple);
    }
  }

  for (const [, { name, category }] of seen) {
    await upsertPantryItem(db, {
      id: pantryId(name),
      name,
      category,
      quantity: null,
      unit: null,
      have_it: false,
    });
  }
}

// ── Autocomplete catalog (added 2026-04-28) ─────────────────────────────────
//
// Goal: search-first pantry. The catalog is what the autocomplete suggests
// when a user starts typing. Aliases bridge US ⇄ AU naming so the user can
// type "cilantro" and we add Coriander; "bell pepper" → Capsicum.
//
// Why a separate constant rather than reading from recipes: recipes have
// messy ingredient strings ("1/2 tsp freshly cracked black pepper"), and
// the catalog should be authoritative names. Recipe ingredients stay
// matched via normalizeForMatch() at scoring time.

export interface CatalogEntry {
  name: string;
  category: PantryCategory;
  /** Alternative names — typing any of these surfaces this entry. */
  aliases?: string[];
}

export const INGREDIENT_CATALOG: CatalogEntry[] = [
  // Spices & seasonings
  { name: 'Salt',                category: 'Spices & Seasonings' },
  { name: 'Black pepper',        category: 'Spices & Seasonings' },
  { name: 'Cumin',               category: 'Spices & Seasonings' },
  { name: 'Cumin seeds',         category: 'Spices & Seasonings' },
  { name: 'Paprika',             category: 'Spices & Seasonings' },
  { name: 'Smoked paprika',      category: 'Spices & Seasonings' },
  { name: 'Dried oregano',       category: 'Spices & Seasonings' },
  { name: 'Chilli flakes',       category: 'Spices & Seasonings', aliases: ['red pepper flakes', 'chili flakes', 'crushed red pepper'] },
  { name: 'Bay leaves',          category: 'Spices & Seasonings' },
  { name: 'Cinnamon',            category: 'Spices & Seasonings' },
  { name: 'Turmeric',            category: 'Spices & Seasonings' },
  { name: 'Garam masala',        category: 'Spices & Seasonings' },
  { name: 'Cardamom',            category: 'Spices & Seasonings' },
  { name: 'Star anise',          category: 'Spices & Seasonings' },
  { name: 'Garlic powder',       category: 'Spices & Seasonings' },
  { name: 'Onion powder',        category: 'Spices & Seasonings' },
  { name: 'Ground coriander',    category: 'Spices & Seasonings' },
  { name: 'Sumac',               category: 'Spices & Seasonings' },
  // Pantry
  { name: 'Olive oil',           category: 'Pantry Staples' },
  { name: 'Vegetable oil',       category: 'Pantry Staples' },
  { name: 'Sesame oil',          category: 'Pantry Staples' },
  { name: 'Plain flour',         category: 'Pantry Staples', aliases: ['all-purpose flour', 'all purpose flour'] },
  { name: 'White sugar',         category: 'Pantry Staples', aliases: ['caster sugar'] },
  { name: 'Brown sugar',         category: 'Pantry Staples' },
  { name: 'White rice',          category: 'Pantry Staples' },
  { name: 'Basmati rice',        category: 'Pantry Staples' },
  { name: 'Pasta',               category: 'Pantry Staples' },
  { name: 'Spaghetti',           category: 'Pantry Staples' },
  { name: 'Chicken stock',       category: 'Pantry Staples' },
  { name: 'Vegetable stock',     category: 'Pantry Staples' },
  { name: 'Beef stock',          category: 'Pantry Staples' },
  { name: 'Canned tomatoes',     category: 'Pantry Staples', aliases: ['tinned tomatoes', 'canned crushed tomatoes'] },
  { name: 'Tomato paste',        category: 'Pantry Staples', aliases: ['tomato puree', 'tomato concentrate'] },
  { name: 'Honey',               category: 'Pantry Staples' },
  { name: 'Maple syrup',         category: 'Pantry Staples' },
  // Sauces / condiments
  { name: 'Soy sauce',           category: 'Condiments & Sauces' },
  { name: 'Fish sauce',          category: 'Condiments & Sauces' },
  { name: 'Oyster sauce',        category: 'Condiments & Sauces' },
  { name: 'Hoisin sauce',        category: 'Condiments & Sauces' },
  { name: 'Dijon mustard',       category: 'Condiments & Sauces' },
  { name: 'Wholegrain mustard',  category: 'Condiments & Sauces' },
  { name: 'White wine vinegar',  category: 'Condiments & Sauces' },
  { name: 'Red wine vinegar',    category: 'Condiments & Sauces' },
  { name: 'Apple cider vinegar', category: 'Condiments & Sauces' },
  { name: 'Rice vinegar',        category: 'Condiments & Sauces' },
  { name: 'Sriracha',            category: 'Condiments & Sauces' },
  { name: 'Worcestershire sauce',category: 'Condiments & Sauces' },
  { name: 'Tahini',              category: 'Condiments & Sauces' },
  { name: 'Miso paste',          category: 'Condiments & Sauces' },
  { name: 'Mayonnaise',          category: 'Condiments & Sauces', aliases: ['mayo'] },
  // Dairy & Eggs
  { name: 'Eggs',                category: 'Dairy & Eggs' },
  { name: 'Unsalted butter',     category: 'Dairy & Eggs' },
  { name: 'Salted butter',       category: 'Dairy & Eggs' },
  { name: 'Whole milk',          category: 'Dairy & Eggs' },
  { name: 'Pure cream',          category: 'Dairy & Eggs', aliases: ['heavy cream', 'whipping cream', 'double cream'] },
  { name: 'Greek yoghurt',       category: 'Dairy & Eggs', aliases: ['greek yogurt'] },
  { name: 'Sour cream',          category: 'Dairy & Eggs' },
  { name: 'Parmesan',            category: 'Dairy & Eggs' },
  { name: 'Mozzarella',          category: 'Dairy & Eggs' },
  { name: 'Cheddar',             category: 'Dairy & Eggs' },
  { name: 'Feta',                category: 'Dairy & Eggs' },
  { name: 'Halloumi',            category: 'Dairy & Eggs' },
  { name: 'Ricotta',             category: 'Dairy & Eggs' },
  // Produce
  { name: 'Garlic',              category: 'Produce' },
  { name: 'Brown onion',         category: 'Produce', aliases: ['yellow onion'] },
  { name: 'Red onion',           category: 'Produce' },
  { name: 'Spring onion',        category: 'Produce', aliases: ['scallion', 'green onion'] },
  { name: 'Shallot',             category: 'Produce' },
  { name: 'Leek',                category: 'Produce' },
  { name: 'Lemon',               category: 'Produce' },
  { name: 'Lime',                category: 'Produce' },
  { name: 'Capsicum',            category: 'Produce', aliases: ['bell pepper'] },
  { name: 'Tomato',              category: 'Produce' },
  { name: 'Cherry tomatoes',     category: 'Produce' },
  { name: 'Cucumber',            category: 'Produce' },
  { name: 'Carrot',              category: 'Produce' },
  { name: 'Celery',              category: 'Produce' },
  { name: 'Potato',              category: 'Produce' },
  { name: 'Sweet potato',        category: 'Produce' },
  { name: 'Zucchini',            category: 'Produce', aliases: ['courgette'] },
  { name: 'Eggplant',            category: 'Produce', aliases: ['aubergine'] },
  { name: 'Mushroom',            category: 'Produce' },
  { name: 'Broccoli',            category: 'Produce' },
  { name: 'Cauliflower',         category: 'Produce' },
  { name: 'Spinach',             category: 'Produce' },
  { name: 'Rocket',              category: 'Produce', aliases: ['arugula'] },
  { name: 'Coriander',           category: 'Produce', aliases: ['cilantro', 'fresh coriander'] },
  { name: 'Parsley',             category: 'Produce', aliases: ['flat-leaf parsley', 'flat leaf parsley'] },
  { name: 'Basil',               category: 'Produce' },
  { name: 'Mint',                category: 'Produce' },
  { name: 'Thyme',               category: 'Produce' },
  { name: 'Rosemary',            category: 'Produce' },
  { name: 'Dill',                category: 'Produce' },
  { name: 'Chives',              category: 'Produce' },
  { name: 'Ginger',              category: 'Produce' },
  { name: 'Lemongrass',          category: 'Produce' },
  { name: 'Avocado',             category: 'Produce' },
  // Proteins
  { name: 'Chicken thigh',       category: 'Proteins', aliases: ['chicken thighs'] },
  { name: 'Chicken breast',      category: 'Proteins' },
  { name: 'Chicken wings',       category: 'Proteins' },
  { name: 'Whole chicken',       category: 'Proteins' },
  { name: 'Beef mince',          category: 'Proteins', aliases: ['ground beef'] },
  { name: 'Pork mince',          category: 'Proteins', aliases: ['ground pork'] },
  { name: 'Lamb mince',          category: 'Proteins', aliases: ['ground lamb'] },
  { name: 'Beef steak',          category: 'Proteins' },
  { name: 'Brisket',             category: 'Proteins' },
  { name: 'Bacon',               category: 'Proteins' },
  { name: 'Pancetta',            category: 'Proteins' },
  { name: 'Chorizo',             category: 'Proteins' },
  { name: 'Salmon',              category: 'Proteins' },
  { name: 'Tuna',                category: 'Proteins' },
  { name: 'Cod',                 category: 'Proteins' },
  { name: 'Prawns',              category: 'Proteins', aliases: ['shrimp'] },
  { name: 'Tofu',                category: 'Proteins' },
];

const _normLower = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Match a typed query against a catalog entry by name OR alias.
 * Substring match — generous on purpose so two letters surface candidates.
 */
export function fuzzyMatchCatalog(entry: CatalogEntry, query: string): boolean {
  const q = _normLower(query);
  if (!q) return false;
  if (_normLower(entry.name).includes(q)) return true;
  if (entry.aliases) return entry.aliases.some((a) => _normLower(a).includes(q));
  return false;
}

/** True if any alias of `entry` matches the query (used to label the row). */
export function matchedAlias(entry: CatalogEntry, query: string): string | null {
  const q = _normLower(query);
  if (!q || !entry.aliases) return null;
  return entry.aliases.find((a) => _normLower(a).includes(q)) ?? null;
}
