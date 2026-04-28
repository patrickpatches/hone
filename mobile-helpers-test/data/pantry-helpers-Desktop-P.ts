import type { SQLiteDatabase } from 'expo-sqlite';
import type { Recipe } from './types';
import { upsertPantryItem } from '../../db/database';
import type { PantryItem } from '../../db/database';

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

  // ── Proteins ──────────────────────────────────────────────────────────────
  const proteins = [
    // General meats
    'beef', 'chicken', 'pork', 'lamb', 'duck', 'turkey',
    'mince', 'steak', 'brisket', 'tenderloin', 'short rib',
    'ground beef', 'ground pork', 'ground turkey',
    // Seafood — general
    'salmon', 'tuna', 'cod', 'sea bass', 'halibut', 'tilapia',
    'snapper', 'flathead', 'whiting',
    // Australian seafood
    'barramundi', 'kingfish', 'balmain bug', 'moreton bay bug',
    'mud crab', 'blue swimmer crab',
    // Shellfish & crustaceans
    'shrimp', 'prawn', 'scallop', 'mussel', 'oyster', 'squid', 'octopus', 'crab', 'lobster',
    // Cured & processed meats (whole-food varieties)
    'bacon', 'pancetta', 'lardons', 'chorizo', 'sausage', 'prosciutto',
    'guanciale', 'bresaola', 'coppa', 'salami',
    'lap cheong', 'chinese sausage',
    // Small fish
    'anchovy', 'sardine', 'mackerel',
    // Offal & other
    'liver', 'kidney', 'heart',
    // Plant proteins
    'tofu', 'tempeh',
    // Kangaroo (Australian)
    'kangaroo',
  ];
  if (proteins.some((w) => n.includes(w))) return 'Proteins';

  // ── Dairy & Eggs ──────────────────────────────────────────────────────────
  const dairy = [
    'milk', 'double cream', 'single cream', 'heavy cream', 'whipping cream',
    'cream', 'butter', 'ghee',
    'cheese', 'parmesan', 'mozzarella', 'cheddar', 'ricotta',
    'mascarpone', 'brie', 'feta', 'gouda', 'gruyere', 'halloumi', 'stilton',
    'paneer',
    'yogurt', 'yoghurt', 'creme fraiche', 'sour cream',
    'condensed milk', 'evaporated milk', 'coconut cream', 'coconut milk',
  ];
  if (/\begg/.test(n) || dairy.some((w) => n.includes(w))) return 'Dairy & Eggs';

  // ── Condiments & Sauces ───────────────────────────────────────────────────
  const condiments = [
    'soy sauce', 'fish sauce', 'oyster sauce', 'hoisin', 'ketchup',
    'mayonnaise', 'mayo', 'worcestershire', 'tahini', 'miso', 'sriracha',
    'hot sauce', 'chili paste', 'chilli paste', 'gochujang', 'doenjang',
    'tomato paste', 'tomato purée', 'tomato puree', 'tomato concentrate',
    'barbecue sauce', 'teriyaki', 'pesto', 'harissa',
    'sambal', 'belacan', 'shrimp paste', 'dried shrimp paste',
    'tamarind paste', 'tamarind concentrate',
    'kecap manis', 'sweet soy',
    'nam pla', 'nuoc mam',
    'black bean sauce', 'doubanjiang',
    'pomegranate molasses',
  ];
  if (condiments.some((w) => n.includes(w))) return 'Condiments & Sauces';
  if (n.includes('vinegar')) return 'Condiments & Sauces';
  if (n.includes('mustard') && !n.includes('mustard seed') && !n.includes('mustard powder'))
    return 'Condiments & Sauces';

  // ── Spices & Seasonings ───────────────────────────────────────────────────
  const spiceHints = [
    ' powder', ' flakes', 'ground ', 'dried ',
    'cumin', 'turmeric', 'cinnamon', 'nutmeg', 'cardamom', 'star anise',
    'bay leaf', 'bay leaves', 'oregano', 'marjoram', 'cayenne',
    'chilli flake', 'chili flake', 'red pepper flake', 'smoked paprika',
    'sumac', 'garam masala', 'curry powder', 'five spice', 'ras el hanout', "za'atar",
    'allspice', 'clove', 'fenugreek', 'asafoetida', 'hing',
    'mace', 'saffron', 'vanilla',
    // Malaysian / Southeast Asian whole spices
    'candlenut', 'kemiri',
    'kaffir lime leaf', 'makrut lime leaf',
    'pandan leaf', 'pandan',
    'lemongrass',
    'galangal', 'blue ginger',
    'dried chilli', 'dried chili',
    'white pepper',
    // South Asian
    'mustard seed', 'curry leaf', 'dried mango powder', 'amchur',
    'kashmiri chilli', 'kashmiri chili',
    // Middle Eastern
    'dried rose petal', 'barberries', 'loomi', 'dried lime',
    'nigella seed', 'black seed',
  ];
  if (/\bsalt\b/.test(n) || /\bpepper\b/.test(n)) return 'Spices & Seasonings';
  if (spiceHints.some((w) => n.includes(w))) return 'Spices & Seasonings';
  if (n.includes('paprika') && !n.includes('fresh')) return 'Spices & Seasonings';

  // ── Produce ───────────────────────────────────────────────────────────────
  const produce = [
    // Alliums
    'onion', 'shallot', 'spring onion', 'scallion', 'leek', 'garlic',
    // Nightshades
    'tomato', 'potato', 'sweet potato', 'bell pepper', 'capsicum',
    'jalapeño', 'jalapeno', 'serrano', 'habanero',
    'eggplant', 'aubergine',
    // Roots & tubers
    'carrot', 'parsnip', 'turnip', 'beetroot', 'beet', 'radish', 'daikon',
    'jerusalem artichoke', 'taro', 'cassava',
    // Brassicas
    'broccoli', 'cauliflower', 'cabbage', 'brussels', 'bok choy', 'pak choi',
    'chinese cabbage', 'wombok',
    // Gourds
    'courgette', 'zucchini', 'cucumber', 'pumpkin', 'butternut squash',
    // Greens
    'lettuce', 'spinach', 'kale', 'chard', 'arugula', 'rocket',
    'watercress', 'silverbeet', 'kangkong', 'water spinach',
    // Mushrooms
    'mushroom', 'shiitake', 'portobello', 'enoki', 'oyster mushroom',
    'wood ear', 'cloud ear',
    // Other veg
    'asparagus', 'artichoke', 'fennel', 'celery', 'corn', 'peas',
    'broad bean', 'runner bean', 'green bean',
    // Fruits used as veg
    'avocado', 'mango',
    // Citrus & fruit
    'lemon', 'lime', 'orange', 'apple', 'pear', 'banana',
    'pineapple', 'papaya', 'pawpaw',
    // Aromatics (fresh)
    'ginger', 'galangal', 'fresh galangal', 'fresh ginger',
    'lemongrass', 'fresh lemongrass',
    'kaffir lime', 'makrut lime', 'fresh kaffir',
    'fresh pandan', 'pandan leaf',
    'fresh turmeric', 'fresh coriander', 'fresh parsley',
    'fresh basil', 'fresh thyme', 'fresh rosemary', 'fresh mint',
    'fresh dill', 'fresh herb', 'coriander leaf', 'cilantro',
    'herb', 'chive', 'tarragon', 'chervil', 'sage', 'bay fresh',
    // Australian native
    'finger lime', 'davidson plum', 'quandong', 'lemon myrtle', 'wattleseed',
    'mountain pepper', 'bush tomato', 'kakadu plum',
  ];
  if (produce.some((w) => n.includes(w))) return 'Produce';

  // ── Pantry Staples (default) ───────────────────────────────────────────────
  return 'Pantry Staples';
}

/**
 * Synonym map - collapses surface-form variants (plurals, regional names,
 * inline alternatives like "ghee or clarified butter") to a single canonical
 * key, so the pantry doesn't show three rows for what's the same ingredient.
 */
const INGREDIENT_SYNONYMS: Record<string, string> = {
  // Plurals (most common)
  'yellow onions': 'yellow onion',
  'red onions': 'red onion',
  'brown onions': 'brown onion',
  'spring onions': 'spring onion',
  'shallots': 'shallot',
  'tomatoes': 'tomato',
  'cherry tomatoes': 'cherry tomato',
  'roma tomatoes': 'roma tomato',
  'potatoes': 'potato',
  'sweet potatoes': 'sweet potato',
  'carrots': 'carrot',
  'mushrooms': 'mushroom',
  'oyster mushrooms': 'oyster mushroom',
  'shiitake mushrooms': 'shiitake mushroom',
  'eggs': 'egg',
  'chillies': 'chilli',
  'chiles': 'chilli',
  'chilis': 'chilli',
  'red chillies': 'red chilli',
  'green chillies': 'green chilli',
  'limes': 'lime',
  'lemons': 'lemon',
  'oranges': 'orange',
  'apples': 'apple',
  'cucumbers': 'cucumber',
  'lamb chops': 'lamb chop',
  'pork chops': 'pork chop',
  'bay leaves': 'bay leaf',
  'curry leaves': 'curry leaf',
  'kaffir lime leaves': 'kaffir lime leaf',
  'makrut lime leaves': 'makrut lime leaf',
  'pandan leaves': 'pandan leaf',
  'mustard seeds': 'mustard seed',
  'nigella seeds': 'nigella seed',
  'cardamom pods': 'cardamom pod',
  'cloves': 'clove',
  'star anises': 'star anise',
  'prawns': 'prawn',
  'scallops': 'scallop',
  'mussels': 'mussel',
  'sausages': 'sausage',
  'capsicums': 'capsicum',
  // Regional aliases - pin to AU canonical (per CLAUDE.md)
  'cilantro': 'coriander',
  'cilantro leaves': 'coriander',
  'fresh cilantro': 'coriander',
  'green onion': 'spring onion',
  'green onions': 'spring onion',
  'scallion': 'spring onion',
  'scallions': 'spring onion',
  'bell pepper': 'capsicum',
  'bell peppers': 'capsicum',
  'red bell pepper': 'red capsicum',
  'green bell pepper': 'green capsicum',
  'aubergine': 'eggplant',
  'aubergines': 'eggplant',
  'zucchini': 'courgette',
  'zucchinis': 'courgette',
  'arugula': 'rocket',
};

/**
 * Normalise an ingredient name to a canonical match key.
 * Pipeline: clean -> lowercase -> drop descriptors -> strip " or X"
 * suffix (compound names like "Ghee or clarified butter" canonicalize to
 * the FIRST term) -> apply synonyms (plurals + regional aliases).
 */
export function normalizeForMatch(name: string): string {
  let s = cleanIngredientName(name)
    .toLowerCase()
    .replace(/\b(fresh|dried|ground|crushed|whole|extra|raw|cooked|ripe|young|old)\b/g, '')
    .replace(/\s+or\s+.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (INGREDIENT_SYNONYMS[s]) return INGREDIENT_SYNONYMS[s];
  // Last-token plural lookup - "sliced yellow onions" -> "yellow onion"
  const tokens = s.split(' ');
  if (tokens.length >= 2) {
    const last = tokens[tokens.length - 1];
    const lastSingular = INGREDIENT_SYNONYMS[last];
    if (lastSingular) {
      tokens[tokens.length - 1] = lastSingular;
      return tokens.join(' ');
    }
  }
  return s;
}

export interface RecipeMatchResult {
  recipe: Recipe;
  score: number;
  haveCount: number;
  totalCount: number;
  missingNames: string[];
  /** Missing ingredients that could be covered by a pantry-available substitution. */
  swapCoveredCount: number;
}

export function scoreRecipeAgainstPantry(
  recipe: Recipe,
  pantryItems: PantryItem[],
): RecipeMatchResult {
  const haveNorms = pantryItems
    .filter((p) => p.have_it)
    .map((p) => normalizeForMatch(p.name));

  const isMatch = (name: string): boolean => {
    const norm = normalizeForMatch(name);
    return haveNorms.some((p) => {
      if (norm === p) return true;
      if (norm.length > 4 && p.length > 4 && (norm.includes(p) || p.includes(norm))) return true;
      const ta = norm.split(' ').filter((t) => t.length > 2);
      const tb = p.split(' ').filter((t) => t.length > 2);
      return ta.filter((t) => tb.includes(t)).length >= 2;
    });
  };

  let matched = 0;
  let swapCovered = 0;
  const missingNames: string[] = [];

  for (const ing of recipe.ingredients) {
    if (isMatch(ing.name)) {
      matched++;
    } else {
      const subCovered =
        (ing.substitutions ?? []).some((sub) => isMatch(sub.ingredient));
      if (subCovered) swapCovered++;
      missingNames.push(cleanIngredientName(ing.name));
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

  return {
    recipe,
    score: coverage + (hasAllAromatics ? 0.1 : 0),
    haveCount: matched,
    totalCount: total,
    missingNames: missingNames.slice(0, 4),
    swapCoveredCount: swapCovered,
  };
}

function pantryId(name: string): string {
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
  { name: 'Peanut oil', category: 'Pantry Staples' },
  { name: 'Sesame oil', category: 'Pantry Staples' },
  { name: 'Coconut oil', category: 'Pantry Staples' },
  { name: 'Plain flour', category: 'Pantry Staples' },
  { name: 'White sugar', category: 'Pantry Staples' },
  { name: 'Brown sugar', category: 'Pantry Staples' },
  { name: 'Palm sugar', category: 'Pantry Staples' },
  { name: 'White rice', category: 'Pantry Staples' },
  { name: 'Basmati rice', category: 'Pantry Staples' },
  { name: 'Jasmine rice', category: 'Pantry Staples' },
  { name: 'Pasta', category: 'Pantry Staples' },
  { name: 'Rice noodles', category: 'Pantry Staples' },
  { name: 'Breadcrumbs', category: 'Pantry Staples' },
  { name: 'Panko breadcrumbs', category: 'Pantry Staples' },
  { name: 'Eggs', category: 'Dairy & Eggs' },
  { name: 'Unsalted butter', category: 'Dairy & Eggs' },
  { name: 'Ghee', category: 'Dairy & Eggs' },
  { name: 'Whole milk', category: 'Dairy & Eggs' },
  { name: 'Coconut milk', category: 'Dairy & Eggs' },
  { name: 'Garlic', category: 'Produce' },
  { name: 'Yellow onion', category: 'Produce' },
  { name: 'Ginger', category: 'Produce' },
  { name: 'Lemon', category: 'Produce' },
  { name: 'Lime', category: 'Produce' },
  { name: 'Chicken stock', category: 'Pantry Staples' },
  { name: 'Vegetable stock', category: 'Pantry Staples' },
  { name: 'Canned tomatoes', category: 'Pantry Staples' },
  { name: 'Soy sauce', category: 'Condiments & Sauces' },
  { name: 'Fish sauce', category: 'Condiments & Sauces' },
  { name: 'Oyster sauce', category: 'Condiments & Sauces' },
  { name: 'White wine vinegar', category: 'Condiments & Sauces' },
  { name: 'Dijon mustard', category: 'Condiments & Sauces' },
  { name: 'Tamarind paste', category: 'Condiments & Sauces' },
  { name: 'Cumin', category: 'Spices & Seasonings' },
  { name: 'Paprika', category: 'Spices & Seasonings' },
  { name: 'Turmeric', category: 'Spices & Seasonings' },
  { name: 'Cinnamon', category: 'Spices & Seasonings' },
  { name: 'Garam masala', category: 'Spices & Seasonings' },
  { name: 'Curry powder', category: 'Spices & Seasonings' },
  { name: 'Dried oregano', category: 'Spices & Seasonings' },
  { name: 'Chilli flakes', category: 'Spices & Seasonings' },
  { name: 'Garlic powder', category: 'Spices & Seasonings' },
  { name: 'Onion powder', category: 'Spices & Seasonings' },
  { name: 'Bay leaves', category: 'Spices & Seasonings' },
  { name: 'Star anise', category: 'Spices & Seasonings' },
  { name: 'Cardamom pods', category: 'Spices & Seasonings' },
  { name: 'White pepper', category: 'Spices & Seasonings' },
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
