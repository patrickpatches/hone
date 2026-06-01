/**
 * Database layer — init + CRUD.
 *
 * All functions take a SQLiteDatabase instance (from useSQLiteContext()) so
 * they're testable and can be called from any React component inside the
 * SQLiteProvider tree.
 *
 * Async throughout — never block the JS thread with sync queries on startup.
 */
import type { SQLiteDatabase } from 'expo-sqlite';
import type { Recipe, Ingredient, Step } from '../src/data/types';
import { SCHEMA_SQL, SCHEMA_MIGRATIONS, SCHEMA_VERSION } from './schema';
// seed.ts is intentionally NOT imported here — seed.ts imports insertRecipe
// from this file, so any import back creates a circular dependency that
// corrupts Metro's TypeScript stripping. All seeding is orchestrated from
// setupDatabase in _layout.tsx, which imports both sides independently.

// ── Row types mirror the DB columns exactly ──────────────────────────────────

interface RecipeRow {
  id: string;
  title: string;
  tagline: string;
  description: string | null;
  base_servings: number;
  time_min: number;
  difficulty: string;
  tags: string;
  source_chef: string | null;
  source_video_url: string | null;
  source_notes: string | null;
  hero_url: string | null;
  hero_attribution: string | null;
  hero_fallback: string | null;
  emoji: string | null;
  user_added: number;
  generated_by_claude: number;
  leftover_extra_servings: number | null;
  leftover_note: string | null;
  // DECISION-009 extended content fields
  total_time_minutes: number | null;
  active_time_minutes: number | null;
  // Categories — JSON string → { cuisines, types }
  categories: string | null;
  equipment: string | null;        // JSON string → string[]
  before_you_start: string | null; // JSON string → string[]
  mise_en_place: string | null;    // JSON string → string[]
  finishing_note: string | null;
  leftovers_note: string | null;
  // DECISION-014 per-recipe portion-sizing fields (2026-05-09 migration 8)
  output_unit: string | null;
  output_unit_plural: string | null;
  output_default: number | null;
  extra_for_tomorrow_label: string | null;
}

interface IngredientRow {
  id: string;
  recipe_id: string;
  sort_order: number;
  name: string;
  amount: number;
  unit: string;
  scales: string;
  cap: number | null;
  prep: string | null;
  curve: string | null;
  // Substitutions — JSON string → Substitution[]
  substitutions: string | null;
}

interface StepRow {
  id: string;
  recipe_id: string;
  step_order: number;
  title: string;
  content: string;
  stage_note: string | null;
  lookahead: string | null;
  timer_seconds: number | null;
  photo_url: string | null;
  why_note: string | null;
  ingredient_refs: string | null;
}

// ── Row → type mappers ────────────────────────────────────────────────────────

function rowToIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    unit: row.unit,
    scales: row.scales as Ingredient['scales'],
    cap: row.cap ?? undefined,
    prep: row.prep ?? undefined,
    curve: row.curve ? (JSON.parse(row.curve) as Record<string, number>) : undefined,
    // Build #113 — substitutions were silently dropped: the column exists in
    // SQLite and updateSubstitutions populates it on every launch, but this
    // mapper was never reading them back. Result: ing.substitutions was
    // always undefined and the recipe screen's swap button rendered for zero
    // ingredients. Same R-014 class of bug as DECISION-014's portion-sizing
    // fields. Defensive parse — bad JSON falls back to undefined.
    substitutions: (() => {
      if (!row.substitutions) return undefined;
      try {
        const parsed = JSON.parse(row.substitutions);
        return Array.isArray(parsed) ? parsed as Ingredient['substitutions'] : undefined;
      } catch {
        // eslint-disable-next-line no-console
        console.warn('[rowToIngredient] failed to parse substitutions JSON for ingredient', row.id);
        return undefined;
      }
    })(),
  };
}

function rowToStep(row: StepRow): Step {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    stage_note: row.stage_note ?? undefined,
    lookahead: row.lookahead ?? undefined,
    timer_seconds: row.timer_seconds ?? undefined,
    photo_url: row.photo_url ?? undefined,
    why_note: row.why_note ?? undefined,
    ingredient_refs: row.ingredient_refs
      ? (JSON.parse(row.ingredient_refs) as string[])
      : undefined,
  };
}

function rowToRecipe(
  row: RecipeRow,
  ingredients: Ingredient[],
  steps: Step[],
): Recipe {
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline,
    description: row.description ?? undefined,
    base_servings: row.base_servings,
    time_min: row.time_min,
    difficulty: row.difficulty as Recipe['difficulty'],
    tags: JSON.parse(row.tags) as string[],
    source:
      row.source_chef
        ? {
            chef: row.source_chef,
            video_url: row.source_video_url ?? undefined,
            notes: row.source_notes ?? undefined,
          }
        : undefined,
    hero_url: row.hero_url ?? undefined,
    // Build #113 — hero_attribution column added in migration 9; persisted
    // by refreshSeedRecipeFields. Renders as the small dark-scrim pill on
    // the recipe detail hero image (CC licensing convention).
    hero_attribution: row.hero_attribution ?? undefined,
    hero_fallback: row.hero_fallback
      ? (JSON.parse(row.hero_fallback) as [string, string, string])
      : undefined,
    emoji: row.emoji ?? undefined,
    user_added: Boolean(row.user_added),
    generated_by_claude: Boolean(row.generated_by_claude),
    ingredients,
    steps,
    leftover_mode:
      row.leftover_extra_servings != null
        ? { extra_servings: row.leftover_extra_servings, note: row.leftover_note ?? '' }
        : undefined,
    // DECISION-009 extended content fields
    total_time_minutes: row.total_time_minutes ?? undefined,
    active_time_minutes: row.active_time_minutes ?? undefined,
    equipment: row.equipment ? (JSON.parse(row.equipment) as string[]) : undefined,
    before_you_start: row.before_you_start ? (JSON.parse(row.before_you_start) as string[]) : undefined,
    mise_en_place: row.mise_en_place ? (JSON.parse(row.mise_en_place) as string[]) : undefined,
    finishing_note: row.finishing_note ?? undefined,
    leftovers_note: row.leftovers_note ?? undefined,
    // DECISION-014 per-recipe portion-sizing fields
    output_unit: row.output_unit ?? undefined,
    output_unit_plural: row.output_unit_plural ?? undefined,
    output_default: row.output_default ?? undefined,
    extra_for_tomorrow_label: row.extra_for_tomorrow_label ?? undefined,
    // Build #113 — categories had been silently dropped at the DB hop,
    // so recipe.categories was always undefined and the Kitchen cuisine
    // tile filter trimmed every tile except "All". JSON-parsed from a
    // `{cuisines, types}` shape with defensive fallback.
    categories: (() => {
      if (!row.categories) return undefined;
      try {
        const parsed = JSON.parse(row.categories);
        if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).cuisines) && Array.isArray((parsed as any).types)) {
          return parsed as Recipe['categories'];
        }
        return undefined;
      } catch {
        // eslint-disable-next-line no-console
        console.warn('[rowToRecipe] failed to parse categories JSON for recipe', row.id);
        return undefined;
      }
    })(),
  };
}

// ── Migration runner ──────────────────────────────────────────────────────────

/**
 * Apply any schema migrations that have not run on this device yet.
 *
 * Uses PRAGMA user_version as the version counter (0 on a fresh install before
 * any migration has ever run). Runs each migration in order from
 * (currentVersion + 1) up to SCHEMA_VERSION, then sets user_version to the
 * new target. Each migration step is idempotent where possible (IF NOT EXISTS,
 * ADD COLUMN on SQLite is a no-op if the column already exists).
 */
async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = result?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  for (let v = current + 1; v <= SCHEMA_VERSION; v++) {
    const steps = SCHEMA_MIGRATIONS[v];
    if (!steps) continue;
    for (const sql of steps) {
      try {
        await db.execAsync(sql);
      } catch (e) {
        // ALTER TABLE ADD COLUMN throws if the column already exists on some
        // SQLite builds — treat "duplicate column" as non-fatal.
        // ALTER TABLE DROP COLUMN throws if the column doesn't exist (e.g. a
        // very old install that somehow skipped the v2 migration before v7
        // tries to drop the column it never had). Treat "no such column" as
        // non-fatal too — the goal state is "column gone", and gone is gone.
        const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
        const recoverable =
          msg.includes('duplicate column') ||
          msg.includes('no such column');
        if (!recoverable) throw e;
      }
    }
  }
  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables for a fresh install (all CREATE TABLE IF NOT EXISTS — no-op
  // on existing installs where the table already exists).
  for (const sql of SCHEMA_SQL) {
    await db.execAsync(sql);
  }

  // Apply any pending schema migrations (adds new columns, creates new tables).
  // Must run before seeding so migration 6 columns exist when DECISION-009
  // fields are written.
  await runMigrations(db);

  // Seeding (first-launch and subsequent-launch refresh) is handled by
  // setupDatabase in _layout.tsx so that seed.ts is never imported here.
}

// ── Recipes ───────────────────────────────────────────────────────────────────

export async function getAllRecipes(db: SQLiteDatabase): Promise<Recipe[]> {
  const recipeRows = await db.getAllAsync<RecipeRow>(
    'SELECT * FROM recipes ORDER BY created_at',
  );
  if (recipeRows.length === 0) return [];

  const ingRows = await db.getAllAsync<IngredientRow>(
    'SELECT i.* FROM ingredients i INNER JOIN recipes r ON i.recipe_id = r.id ORDER BY i.recipe_id, i.sort_order',
  );
  const stepRows = await db.getAllAsync<StepRow>(
    'SELECT s.* FROM method_steps s INNER JOIN recipes r ON s.recipe_id = r.id ORDER BY s.recipe_id, s.step_order',
  );

  const ingsByRecipe = new Map<string, IngredientRow[]>();
  const stepsByRecipe = new Map<string, StepRow[]>();

  for (const ing of ingRows) {
    const arr = ingsByRecipe.get(ing.recipe_id) ?? [];
    arr.push(ing);
    ingsByRecipe.set(ing.recipe_id, arr);
  }
  for (const step of stepRows) {
    const arr = stepsByRecipe.get(step.recipe_id) ?? [];
    arr.push(step);
    stepsByRecipe.set(step.recipe_id, arr);
  }

  return recipeRows.map((row) =>
    rowToRecipe(
      row,
      (ingsByRecipe.get(row.id) ?? []).map(rowToIngredient),
      (stepsByRecipe.get(row.id) ?? []).map(rowToStep),
    ),
  );
}

/**
 * Active (user-visible) recipes — alias for getAllRecipes after the
 * 2026-05-09 architectural fix.
 *
 * Background: previously this filtered on a `not_yet_shipping` flag that
 * only existed in memory (never persisted to SQLite). On every launch the
 * DB reload returned all 46 recipes with `undefined` flags and the filter
 * passed all 46 through — Patrick saw the launch roster "creep back" four
 * times in a row.
 *
 * Architectural fix: SEED_RECIPES now contains exactly the launch roster
 * (16). The 30 holding recipes live in SEED_RECIPES_HOLDING, defined in
 * seed-recipes.ts but never inserted. The seeder loop physically cannot
 * see them. So at this point in the code there is nothing left to filter
 * — the DB only ever contains the launch roster + any user-added recipes.
 *
 * Kept as an alias so the 2 callers (Kitchen and Pantry) don't need to
 * be touched and the intent ("give me what should be visible") stays
 * named at the call site.
 */
export async function getActiveRecipes(db: SQLiteDatabase): Promise<Recipe[]> {
  return getAllRecipes(db);
}

export async function getRecipeById(
  db: SQLiteDatabase,
  id: string,
): Promise<Recipe | null> {
  const row = await db.getFirstAsync<RecipeRow>(
    'SELECT * FROM recipes WHERE id = ?',
    [id],
  );
  if (!row) return null;

  const ingRows = await db.getAllAsync<IngredientRow>(
    'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY sort_order',
    [id],
  );
  const stepRows = await db.getAllAsync<StepRow>(
    'SELECT * FROM method_steps WHERE recipe_id = ? ORDER BY step_order',
    [id],
  );

  return rowToRecipe(
    row,
    ingRows.map(rowToIngredient),
    stepRows.map(rowToStep),
  );
}

export async function insertRecipe(
  db: SQLiteDatabase,
  recipe: Recipe,
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO recipes (
      id, title, tagline, description, base_servings, time_min, difficulty,
      tags, source_chef, source_video_url, source_notes, hero_url, hero_attribution, hero_fallback,
      emoji, user_added, generated_by_claude, leftover_extra_servings, leftover_note,
      total_time_minutes, active_time_minutes, categories, equipment, before_you_start,
      mise_en_place, finishing_note, leftovers_note,
      output_unit, output_unit_plural, output_default, extra_for_tomorrow_label
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      recipe.id,
      recipe.title,
      recipe.tagline,
      recipe.description ?? null,
      recipe.base_servings,
      recipe.time_min,
      recipe.difficulty,
      JSON.stringify(recipe.tags),
      recipe.source?.chef ?? null,
      recipe.source?.video_url ?? null,
      recipe.source?.notes ?? null,
      recipe.hero_url ?? null,
      recipe.hero_attribution ?? null,
      recipe.hero_fallback ? JSON.stringify(recipe.hero_fallback) : null,
      recipe.emoji ?? null,
      recipe.user_added ? 1 : 0,
      recipe.generated_by_claude ? 1 : 0,
      recipe.leftover_mode?.extra_servings ?? null,
      recipe.leftover_mode?.note ?? null,
      recipe.total_time_minutes ?? null,
      recipe.active_time_minutes ?? null,
      recipe.categories ? JSON.stringify(recipe.categories) : null,
      recipe.equipment ? JSON.stringify(recipe.equipment) : null,
      recipe.before_you_start ? JSON.stringify(recipe.before_you_start) : null,
      recipe.mise_en_place ? JSON.stringify(recipe.mise_en_place) : null,
      recipe.finishing_note ?? null,
      recipe.leftovers_note ?? null,
      // DECISION-014 per-recipe portion-sizing
      recipe.output_unit ?? null,
      recipe.output_unit_plural ?? null,
      recipe.output_default ?? null,
      recipe.extra_for_tomorrow_label ?? null,
    ],
  );

  for (let i = 0; i < recipe.ingredients.length; i++) {
    const ing = recipe.ingredients[i]!;
    await db.runAsync(
      `INSERT OR REPLACE INTO ingredients
        (id, recipe_id, sort_order, name, amount, unit, scales, cap, prep, curve, substitutions)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        ing.id,
        recipe.id,
        i,
        ing.name,
        ing.amount,
        ing.unit,
        ing.scales,
        ing.cap ?? null,
        ing.prep ?? null,
        ing.curve ? JSON.stringify(ing.curve) : null,
        ing.substitutions && ing.substitutions.length > 0 ? JSON.stringify(ing.substitutions) : null,
      ],
    );
  }

  for (let i = 0; i < recipe.steps.length; i++) {
    const step = recipe.steps[i]!;
    await db.runAsync(
      `INSERT OR REPLACE INTO method_steps
        (id, recipe_id, step_order, title, content, stage_note, lookahead,
         timer_seconds, photo_url, why_note, ingredient_refs)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        step.id,
        recipe.id,
        i,
        step.title,
        step.content,
        step.stage_note ?? null,
        step.lookahead ?? null,
        step.timer_seconds ?? null,
        step.photo_url ?? null,
        step.why_note ?? null,
        step.ingredient_refs ? JSON.stringify(step.ingredient_refs) : null,
      ],
    );
  }
}

export async function deleteRecipe(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
}

// ── Favorites ─────────────────────────────────────────────────────────────────

export async function getFavoriteIds(db: SQLiteDatabase): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ recipe_id: string }>(
    'SELECT recipe_id FROM favorites',
  );
  return new Set(rows.map((r) => r.recipe_id));
}

export async function toggleFavorite(
  db: SQLiteDatabase,
  recipeId: string,
): Promise<void> {
  const existing = await db.getFirstAsync<{ recipe_id: string }>(
    'SELECT recipe_id FROM favorites WHERE recipe_id = ?',
    [recipeId],
  );
  if (existing) {
    await db.runAsync('DELETE FROM favorites WHERE recipe_id = ?', [recipeId]);
  } else {
    await db.runAsync(
      'INSERT INTO favorites (recipe_id) VALUES (?)',
      [recipeId],
    );
  }
}

// ── Pantry ────────────────────────────────────────────────────────────────────

export interface PantryItem {
  id: string;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  have_it: boolean;
}

export async function getPantryItems(
  db: SQLiteDatabase,
): Promise<PantryItem[]> {
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    category: string;
    quantity: number | null;
    unit: string | null;
    have_it: number;
  }>('SELECT * FROM pantry_items ORDER BY category, name');
  return rows.map((r) => ({ ...r, have_it: Boolean(r.have_it) }));
}

export async function upsertPantryItem(
  db: SQLiteDatabase,
  item: PantryItem,
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO pantry_items (id, name, category, quantity, unit, have_it)
     VALUES (?,?,?,?,?,?)`,
    [
      item.id,
      item.name,
      item.category,
      item.quantity ?? null,
      item.unit ?? null,
      item.have_it ? 1 : 0,
    ],
  );
}

export async function deletePantryItem(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM pantry_items WHERE id = ?', [id]);
}

export async function clearAllPantryItems(db: SQLiteDatabase): Promise<void> {
  // "In pantry" = have_it=true rows (per the search-first model). Legacy
  // have_it=false rows from older seeds are left alone.
  await db.runAsync('DELETE FROM pantry_items WHERE have_it = 1');
}

// ── Plan toggle (simple on/off, no dates) ────────────────────────────────────
// Uses meal_plan with sentinel date='planned' and id=recipe_id for 1:1 mapping.

export async function getPlannedRecipeIds(
  db: SQLiteDatabase,
): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ recipe_id: string }>(
    "SELECT recipe_id FROM meal_plan WHERE date = 'planned'",
  );
  return new Set(rows.map((r) => r.recipe_id));
}

export async function togglePlannedRecipe(
  db: SQLiteDatabase,
  recipeId: string,
  baseServings: number,
): Promise<boolean> {
  const existing = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM meal_plan WHERE id = ? AND date = 'planned'",
    [recipeId],
  );
  if (existing) {
    await db.runAsync('DELETE FROM meal_plan WHERE id = ?', [recipeId]);
    return false; // now unplanned
  } else {
    await db.runAsync(
      "INSERT OR REPLACE INTO meal_plan (id, date, recipe_id, servings) VALUES (?, 'planned', ?, ?)",
      [recipeId, recipeId, baseServings],
    );
    return true; // now planned
  }
}

export async function getPlannedEntries(
  db: SQLiteDatabase,
): Promise<MealPlanEntry[]> {
  return db.getAllAsync<MealPlanEntry>(
    "SELECT * FROM meal_plan WHERE date = 'planned' ORDER BY rowid",
  );
}

export async function updatePlannedServings(
  db: SQLiteDatabase,
  recipeId: string,
  servings: number,
): Promise<void> {
  await db.runAsync(
    "UPDATE meal_plan SET servings = ? WHERE id = ? AND date = 'planned'",
    [servings, recipeId],
  );
}

export async function removePlannedRecipe(
  db: SQLiteDatabase,
  recipeId: string,
): Promise<void> {
  await db.runAsync('DELETE FROM meal_plan WHERE id = ?', [recipeId]);
}

// ── Meal Plan ─────────────────────────────────────────────────────────────────

export interface MealPlanEntry {
  id: string;
  date: string;
  recipe_id: string;
  servings: number;
}

export async function getMealPlanForWeek(
  db: SQLiteDatabase,
  weekStart: string,
  weekEnd: string,
): Promise<MealPlanEntry[]> {
  return db.getAllAsync<MealPlanEntry>(
    'SELECT * FROM meal_plan WHERE date >= ? AND date <= ? ORDER BY date',
    [weekStart, weekEnd],
  );
}

export async function getAllMealPlan(
  db: SQLiteDatabase,
): Promise<MealPlanEntry[]> {
  return db.getAllAsync<MealPlanEntry>(
    'SELECT * FROM meal_plan ORDER BY date',
  );
}

export async function setMealPlanEntry(
  db: SQLiteDatabase,
  entry: MealPlanEntry,
): Promise<void> {
  await db.runAsync('DELETE FROM meal_plan WHERE date = ?', [entry.date]);
  await db.runAsync(
    'INSERT INTO meal_plan (id, date, recipe_id, servings) VALUES (?,?,?,?)',
    [entry.id, entry.date, entry.recipe_id, entry.servings],
  );
}

export async function deleteMealPlanEntry(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM meal_plan WHERE id = ?', [id]);
}

// ── Shopping list ─────────────────────────────────────────────────────────────
//
// Shopping list is a *derived view* over the meal plan plus user-typed items.
// Every row tracks its sources (meals it came from, or 'manual') so that
// removing a meal cleanly removes only the items that meal contributed —
// unless the user also added them manually, in which case they survive.
//
// Schema: shopping_items.sources_json holds an array like
//   [{kind:'meal', recipe_id:'r1', servings:4}, {kind:'manual'}]

export type ShoppingSource =
  | { kind: 'meal'; recipe_id: string; servings: number }
  | { kind: 'manual' }
  | { kind: 'pantry-suggestion'; recipe_id: string }
  // Added when the user taps "Add missing to shopping list" on a recipe screen.
  // Differs from 'meal': manually_added=true so reconcile() never strips it.
  // Carries recipe_id so Shop tab can group items by recipe and offer
  // one-tap removal ("remove all Smash Burger items").
  | { kind: 'recipe-add'; recipe_id: string };

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  manually_added: boolean;
  in_cart: boolean;
  added_at: number;
  sources: ShoppingSource[];
}

interface ShoppingItemRow {
  id: string;
  name: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  manually_added: number;
  in_cart: number;
  added_at: number;
  sources_json: string;
}

function rowToShoppingItem(row: ShoppingItemRow): ShoppingItem {
  let sources: ShoppingSource[] = [];
  try {
    const parsed = JSON.parse(row.sources_json);
    if (Array.isArray(parsed)) sources = parsed as ShoppingSource[];
  } catch {
    // Corrupt sources_json (should not happen, but be defensive). Treat as empty.
    sources = [];
  }
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    unit: row.unit,
    notes: row.notes,
    manually_added: Boolean(row.manually_added),
    in_cart: Boolean(row.in_cart),
    added_at: row.added_at,
    sources,
  };
}

export async function getShoppingItems(
  db: SQLiteDatabase,
): Promise<ShoppingItem[]> {
  const rows = await db.getAllAsync<ShoppingItemRow>(
    'SELECT * FROM shopping_items ORDER BY added_at DESC',
  );
  return rows.map(rowToShoppingItem);
}

export async function upsertShoppingItem(
  db: SQLiteDatabase,
  item: ShoppingItem,
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO shopping_items
       (id, name, category, quantity, unit, notes,
        manually_added, in_cart, added_at, sources_json)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      item.id,
      item.name,
      item.category,
      item.quantity ?? null,
      item.unit ?? null,
      item.notes ?? null,
      item.manually_added ? 1 : 0,
      item.in_cart ? 1 : 0,
      item.added_at,
      JSON.stringify(item.sources ?? []),
    ],
  );
}

export async function deleteShoppingItem(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM shopping_items WHERE id = ?', [id]);
}

/** Replace the whole list atomically — used when applying a derivation. */
export async function replaceShoppingItems(
  db: SQLiteDatabase,
  items: ShoppingItem[],
): Promise<void> {
  await db.execAsync('BEGIN TRANSACTION');
  try {
    await db.execAsync('DELETE FROM shopping_items');
    for (const item of items) {
      await upsertShoppingItem(db, item);
    }
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}
