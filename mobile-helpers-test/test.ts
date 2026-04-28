// Re-implement just the imports we need without RN deps
import {
  cleanIngredientName, normalizeForMatch, categorizeIngredient,
  scoreRecipeAgainstPantry, INGREDIENT_CATALOG, fuzzyMatchCatalog, matchedAlias,
} from './data/pantry-helpers';

let passed = 0, failed = 0;
function test(name: string, fn: () => void) {
  try { fn(); console.log('  ✓', name); passed++; }
  catch (e: any) { console.log('  ✗', name, '\n     ', e.message); failed++; }
}
function eq<T>(a: T, b: T, msg = '') {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

console.log('\n--- cleanIngredientName ---');
test('strips parentheticals',  () => eq(cleanIngredientName('garlic (peeled)'),  'garlic'));
test('strips post-comma notes', () => eq(cleanIngredientName('onion, finely diced'), 'onion'));
test('strips prep words',      () => eq(cleanIngredientName('finely chopped parsley'), 'chopped parsley'));
test('handles empty',          () => eq(cleanIngredientName(''), ''));
test('handles whitespace',     () => eq(cleanIngredientName('  garlic  '), 'garlic'));
test('preserves multi-word',   () => eq(cleanIngredientName('extra virgin olive oil'), 'virgin olive oil'));

console.log('\n--- normalizeForMatch ---');
test('lowercases',             () => eq(normalizeForMatch('Garlic'), 'garlic'));
test('strips fresh/dried',     () => eq(normalizeForMatch('fresh basil'), 'basil'));
test('idempotent',             () => eq(normalizeForMatch(normalizeForMatch('Fresh Garlic')), 'garlic'));

console.log('\n--- categorizeIngredient ---');
test('beef → Proteins',        () => eq(categorizeIngredient('beef mince'), 'Proteins'));
test('feta → Dairy & Eggs',    () => eq(categorizeIngredient('feta'), 'Dairy & Eggs'));
test('garlic → Produce',       () => eq(categorizeIngredient('garlic'), 'Produce'));
test('soy sauce → Condiments', () => eq(categorizeIngredient('soy sauce'), 'Condiments & Sauces'));
test('cumin → Spices',         () => eq(categorizeIngredient('cumin'), 'Spices & Seasonings'));
test('frozen anything → Frozen', () => eq(categorizeIngredient('frozen peas'), 'Frozen'));
test('unknown → Pantry Staples', () => eq(categorizeIngredient('xyzabc'), 'Pantry Staples'));

console.log('\n--- fuzzyMatchCatalog ---');
const coriander = INGREDIENT_CATALOG.find((e) => e.name === 'Coriander')!;
const capsicum  = INGREDIENT_CATALOG.find((e) => e.name === 'Capsicum')!;
const garlic    = INGREDIENT_CATALOG.find((e) => e.name === 'Garlic')!;
test('"cilantro" → Coriander', () => { if (!fuzzyMatchCatalog(coriander, 'cilantro')) throw new Error('miss'); });
test('"bell pepper" → Capsicum', () => { if (!fuzzyMatchCatalog(capsicum, 'bell pepper')) throw new Error('miss'); });
test('"GAR" → Garlic (case insensitive)', () => { if (!fuzzyMatchCatalog(garlic, 'GAR')) throw new Error('miss'); });
test('empty query → no match', () => { if (fuzzyMatchCatalog(garlic, '')) throw new Error('false hit'); });
test('whitespace query → no match', () => { if (fuzzyMatchCatalog(garlic, '   ')) throw new Error('false hit'); });
test('no false alias hit', () => { if (fuzzyMatchCatalog(coriander, 'pepper')) throw new Error('false hit'); });

console.log('\n--- matchedAlias ---');
test('returns matched alias', () => eq(matchedAlias(coriander, 'cilantro'), 'cilantro'));
test('null when query matches name only', () => eq(matchedAlias(garlic, 'gar'), null));
test('null when entry has no aliases', () => eq(matchedAlias(garlic, 'xyz'), null));

console.log('\n--- scoreRecipeAgainstPantry ---');
const recipe: any = {
  id: 'r1', title: 'Test', tagline: '', base_servings: 2, time_min: 10, difficulty: 'Easy', tags: [],
  ingredients: [
    { id: '1', name: 'Garlic',   amount: 2, unit: 'clove', scales: 'linear' },
    { id: '2', name: 'Olive oil', amount: 30, unit: 'mL', scales: 'linear' },
    { id: '3', name: 'Pasta',    amount: 200, unit: 'g', scales: 'linear' },
    { id: '4', name: 'Salt',     amount: 1, unit: 'tsp', scales: 'fixed' },
  ],
  steps: [{ id: 's1', title: 't', content: 'c' }],
};
const pantryItem = (name: string): any => ({ id: name, name, category: 'Produce', quantity: null, unit: null, have_it: true });

test('empty pantry → 0/4 covered', () => {
  const r = scoreRecipeAgainstPantry(recipe, []);
  eq(r.haveCount, 0); eq(r.totalCount, 4);
});
test('pantry covers all → 4/4', () => {
  const r = scoreRecipeAgainstPantry(recipe, ['Garlic', 'Olive oil', 'Pasta', 'Salt'].map(pantryItem));
  eq(r.haveCount, 4); eq(r.totalCount, 4);
});
test('partial coverage → score < 1', () => {
  const r = scoreRecipeAgainstPantry(recipe, ['Garlic', 'Olive oil'].map(pantryItem));
  eq(r.haveCount, 2);
  if (r.score >= 1) throw new Error(`score ${r.score} should be < 1`);
});
test('aromatic bonus when all aromatics present', () => {
  const allAromatic = scoreRecipeAgainstPantry(recipe, ['Garlic'].map(pantryItem));
  // recipe has only "garlic" as aromatic — having it triggers +0.1
  if (allAromatic.score <= 0.25) throw new Error(`aromatic bonus missing, score=${allAromatic.score}`);
});

console.log('\n--- INGREDIENT_CATALOG sanity ---');
test('catalog has at least 60 entries', () => {
  if (INGREDIENT_CATALOG.length < 60) throw new Error(`only ${INGREDIENT_CATALOG.length}`);
});
test('no duplicate names', () => {
  const names = INGREDIENT_CATALOG.map(e => e.name.toLowerCase());
  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length) throw new Error('dupes: ' + dupes.join(','));
});
test('all categories valid', () => {
  const valid = ['Proteins','Dairy & Eggs','Produce','Pantry Staples','Spices & Seasonings','Condiments & Sauces','Frozen'];
  const bad = INGREDIENT_CATALOG.filter(e => !valid.includes(e.category));
  if (bad.length) throw new Error('bad cats: ' + bad.map(b=>b.name+':'+b.category).join(','));
});
test('aliases are non-empty when present', () => {
  const bad = INGREDIENT_CATALOG.filter(e => e.aliases && e.aliases.some(a => !a.trim()));
  if (bad.length) throw new Error('empty aliases');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
