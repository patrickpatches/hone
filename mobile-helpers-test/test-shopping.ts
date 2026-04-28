import {
  applyMealAdd, applyMealRemove, applyMealServingsChange,
  addManualItem, toggleInCart, editItem, removeShoppingItem, recipesById,
} from './data/shopping-helpers';
import type { ShoppingItem } from '../db/database';

let pass = 0, fail = 0;
function test(name: string, fn: () => void) {
  try { fn(); console.log('  ✓', name); pass++; }
  catch (e: any) { console.log('  ✗', name, '\n     ', e.message); fail++; }
}
function eq<T>(a: T, b: T, msg = '') {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${msg} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}
function approx(a: number | null, b: number, tol = 0.001, msg = '') {
  if (a === null) throw new Error(`${msg} got null`);
  if (Math.abs(a - b) > tol) throw new Error(`${msg} expected ≈${b}, got ${a}`);
}

const ing = (id: string, name: string, amount: number, unit: string, scales: any = 'linear') => ({
  id, name, amount, unit, scales,
});

const aglio: any = {
  id: 'r-aglio', title: 'Spaghetti aglio e olio', tagline: '', base_servings: 2, time_min: 15,
  difficulty: 'Easy', tags: [], user_added: false, generated_by_claude: false,
  ingredients: [
    ing('i1', 'Spaghetti',   200, 'g'),
    ing('i2', 'Garlic',      4,   'clove'),
    ing('i3', 'Olive oil',   45,  'mL'),
    ing('i4', 'Chilli flakes', 1, 'tsp', 'fixed'),
  ],
  steps: [{ id: 's', title: 't', content: 'c' }],
};

const stirfry: any = {
  id: 'r-stirfry', title: 'Quick stir-fry', tagline: '', base_servings: 2, time_min: 12,
  difficulty: 'Easy', tags: [], user_added: false, generated_by_claude: false,
  ingredients: [
    ing('i1', 'Garlic',     2,  'clove'),
    ing('i2', 'Soy sauce',  30, 'mL'),
    ing('i3', 'Ginger',     20, 'g'),
  ],
  steps: [{ id: 's', title: 't', content: 'c' }],
};

const recipes = recipesById([aglio, stirfry]);
const empty: ShoppingItem[] = [];

console.log('\n=== Case 1: meal add → ingredients flow into list ===');
test('aglio at 2 servings → 4 rows', () => {
  const list = applyMealAdd(empty, aglio, 2, recipes);
  eq(list.length, 4);
});
test('garlic row has meal source + correct quantity', () => {
  const list = applyMealAdd(empty, aglio, 2, recipes);
  const garlic = list.find((r) => r.name.toLowerCase() === 'garlic')!;
  eq(garlic.sources.length, 1);
  eq(garlic.sources[0]!.kind, 'meal');
  approx(garlic.quantity, 4, 0.01, 'garlic clove count');
  eq(garlic.unit, 'clove');
  eq(garlic.manually_added, false);
});

console.log('\n=== Case 2: meal remove → meal-only items vanish ===');
test('removing aglio removes spaghetti row entirely', () => {
  let list = applyMealAdd(empty, aglio, 2, recipes);
  list = applyMealRemove(list, 'r-aglio', recipes);
  eq(list.length, 0);
});

console.log('\n=== Case 3: addManualItem → row with manually_added=true ===');
test('manual "milk" creates a manually_added row', () => {
  const list = addManualItem(empty, 'milk');
  eq(list.length, 1);
  eq(list[0]!.manually_added, true);
  eq(list[0]!.sources.length, 1);
  eq(list[0]!.sources[0]!.kind, 'manual');
});

console.log('\n=== Case 4: manual + meal coexist; meal removal preserves the row ===');
test('garlic added manually then by meal then meal removed → row survives', () => {
  let list = addManualItem(empty, 'Garlic', 'Produce');
  list = applyMealAdd(list, aglio, 2, recipes);
  // single row with two sources (manual + meal)
  const garlicAfterAdd = list.find((r) => r.name.toLowerCase() === 'garlic')!;
  if (!garlicAfterAdd.manually_added) throw new Error('manual flag lost');
  if (garlicAfterAdd.sources.length !== 2) throw new Error(`sources=${garlicAfterAdd.sources.length}`);
  list = applyMealRemove(list, 'r-aglio', recipes);
  // row still here because manually_added=true
  const garlicAfterRm = list.find((r) => r.name.toLowerCase() === 'garlic');
  if (!garlicAfterRm) throw new Error('row dropped despite manual flag');
  eq(garlicAfterRm.manually_added, true);
  eq(garlicAfterRm.sources.length, 1, 'manual source remains');
  eq(garlicAfterRm.sources[0]!.kind, 'manual');
});

console.log('\n=== Case 5: two meals same ingredient → quantities sum ===');
test('aglio (4 cloves) + stirfry (2 cloves) at base servings → 6 cloves', () => {
  let list = applyMealAdd(empty, aglio, 2, recipes);
  list = applyMealAdd(list, stirfry, 2, recipes);
  const garlic = list.find((r) => r.name.toLowerCase() === 'garlic')!;
  approx(garlic.quantity, 6, 0.01, 'summed cloves');
  eq(garlic.sources.length, 2);
});
test('different units stay as separate lines (not merged)', () => {
  // Stirfry has soy sauce in mL; manually add it in tbsp — should be 2 lines.
  let list = applyMealAdd(empty, stirfry, 2, recipes);
  list = addManualItem(list, 'Soy sauce', 'Condiments & Sauces', 1, 'tbsp');
  const soyRows = list.filter((r) => r.name.toLowerCase() === 'soy sauce');
  eq(soyRows.length, 2, 'mL row + tbsp row');
});

console.log('\n=== Case 6: servings change recomputes quantity ===');
test('aglio servings 2 → 4 → garlic doubles', () => {
  let list = applyMealAdd(empty, aglio, 2, recipes);
  list = applyMealServingsChange(list, 'r-aglio', 4, recipes);
  const garlic = list.find((r) => r.name.toLowerCase() === 'garlic')!;
  approx(garlic.quantity, 8, 0.01, 'doubled cloves');
  eq(garlic.sources.find((s: any) => s.kind === 'meal')!.servings, 4);
});

console.log('\n=== Case 7: last-source deletion removes row, unless manual ===');
test('drop last meal source on a non-manual row → row removed', () => {
  let list = applyMealAdd(empty, stirfry, 2, recipes);
  list = applyMealRemove(list, 'r-stirfry', recipes);
  eq(list.length, 0, 'all stirfry rows gone');
});
test('drop last meal source but row is manually_added → row stays, sources=[manual]', () => {
  let list = addManualItem(empty, 'Soy sauce', 'Condiments & Sauces', undefined, 'mL');
  list = applyMealAdd(list, stirfry, 2, recipes);
  list = applyMealRemove(list, 'r-stirfry', recipes);
  const soy = list.find((r) => r.name.toLowerCase() === 'soy sauce');
  if (!soy) throw new Error('manual soy sauce dropped');
  eq(soy.sources.length, 1);
  eq(soy.sources[0]!.kind, 'manual');
});

console.log('\n=== Bonus: in-cart toggle, edit, explicit remove ===');
test('toggleInCart flips boolean', () => {
  let list = applyMealAdd(empty, aglio, 2, recipes);
  const id = list[0]!.id;
  list = toggleInCart(list, id);
  eq(list[0]!.in_cart, true);
  list = toggleInCart(list, id);
  eq(list[0]!.in_cart, false);
});
test('editItem patches notes', () => {
  let list = applyMealAdd(empty, aglio, 2, recipes);
  const id = list[0]!.id;
  list = editItem(list, id, { notes: 'the good kind' });
  eq(list[0]!.notes, 'the good kind');
});
test('removeShoppingItem drops by id', () => {
  let list = applyMealAdd(empty, aglio, 2, recipes);
  const id = list[0]!.id;
  list = removeShoppingItem(list, id);
  if (list.find((r) => r.id === id)) throw new Error('not removed');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
