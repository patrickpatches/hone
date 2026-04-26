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
import { seedDatabase, syncNewSeedRecipes, updateSubstitutions } from './seed';

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
  hero_fallback: string | null;
  emoji: string | null;
  user_added: number;
  generated_by_claude: number;
  leftover_extra_servings: number | null;
  leftover_note: string | null;
  categories: string | null;
  whole_food_verified: number | null;
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
    substitutions: row.substitutions
      ? (JSON.parse(row.substitutions) as Ingredient['substitutions'])
      : undefined,
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
    categories: row.categories
      ? (JSON.parse(row.categories) as Recipe['categories'])
      : undefined,
    whole_food_verified: row.whole_food_verified != null
      ? Boolean(row.whole_food_verified)
      : undefined,
  };
}

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create all tables (IF NOT EXISTS — safe to run on every launch)
  for (const sql of SCHEMA_SQL) {
    await db.execAsync(sql);
  }

  // Run any pending migrations for existing installs.
  // user_version = 0 means the DB existed before we introduced migrations (v1 schema).
  const versionRow = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    const versionsToRun = Object.keys(SCHEMA_MIGRATIONS)
      .map(Number)
      .filter((v) => v > currentVersion)
      .sort((a, b) => a - b);

    for (const version of versionsToRun) {
      const statements = SCHEMA_MIGRATIONS[version]!;
      for (const sql of statements) {
        // ALTER TABLE may fail if the column already exists (e.g. fresh install
        // where SCHEMA_SQL already added it). Catch and continue.
        try {
          await db.execAsync(sql);
        } catch {
          // Column already exists — safe to ignore
        }
      }
    }

    // Set user_version to target. SQLite doesn't allow ? binding in PRAGMA,
    // so we interpolate directly (SCHEMA_VERSION is a compile-time constant).
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  // Seed on first run
  const meta = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'seeded'",
  );
  if (!meta) {
    await seedDatabase(db);
    await db.runAsync(
      "INSERT INTO app_meta (key, value) VALUES ('seeded', '1')",
    );
  }

  // Insert any seed recipes added after the initial install — safe every launch.
  await syncNewSeedRecipes(db);

  // Always sync substitution data from seed — idempotent UPDATE, no data loss.
  await updateSubstitutions(db);
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
      tags, source_chef, source_video_url, source_notes, hero_url, hero_fallback,
      emoji, user_added, generated_by_claude, leftover_extra_servings, leftover_note,
      categories, whole_food_verified
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
      recipe.hero_fallback ? JSON.stringify(recipe.hero_fallback) : null,
      recipe.emoji ?? null,
      recipe.user_added ? 1 : 0,
      recipe.generated_by_claude ? 1 : 0,
      recipe.leftover_mode?.extra_servings ?? null,
      recipe.leftover_mode?.note ?? null,
      recipe.categories ? JSON.stringify(recipe.categories) : null,
      recipe.whole_food_verified != null ? (recipe.whole_food_verified ? 1 : 0) : null,
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
        ing.substitutions ? JSON.stringify(ing.substitutions) : null,
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

export async function getAllPlanEntries(
  db: SQLiteDatabase,
): Promise<MealPlanEntry[]> {
  return db.getAllAsync<MealPlanEntry>(
    `SELECT id, date, recipe_id, servings FROM meal_plan ORDER BY rowid DESC`
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

// ── Ingredient swaps ──────────────────────────────────────────────────────────

export interface SwapRecord {
  id: string;            // `{recipe_id}:{ingredient_id}`
  recipe_id: string;
  ingredient_id: string;
  original_name: string;
  swap_name: string;
  quantity_note: string | null;
}

/** Load all active swaps for a specific recipe. Map key = ingredient_id. */
export async function getSwapsForRecipe(
  db: SQLiteDatabase,
  recipeId: string,
): Promise<Map<string, SwapRecord>> {
  const rows = await db.getAllAsync<SwapRecord>(
    'SELECT * FROM ingredient_swaps WHERE recipe_id = ?',
    [recipeId],
  );
  const map = new Map<string, SwapRecord>();
  for (const row of rows) map.set(row.ingredient_id, row);
  return map;
}

/** Load ALL active swaps across all recipes. Map key = `{recipe_id}:{ingredient_id}`. */
export async function getAllSwaps(
  db: SQLiteDatabase,
): Promise<Map<string, SwapRecord>> {
  const rows = await db.getAllAsync<SwapRecord>('SELECT * FROM ingredient_swaps');
  const map = new Map<string, SwapRecord>();
  for (const row of rows) map.set(row.id, row);
  return map;
}

/** Apply or update a swap for an ingredient in a recipe. */
export async function setIngredientSwap(
  db: SQLiteDatabase,
  recipeId: string,
  ingredientId: string,
  originalName: string,
  swapName: string,
  quantityNote?: string,
): Promise<void> {
  const id = `${recipeId}:${ingredientId}`;
  await db.runAsync(
    `INSERT OR REPLACE INTO ingredient_swaps
       (id, recipe_id, ingredient_id, original_name, swap_name, quantity_note)
     VALUES (?,?,?,?,?,?)`,
    [id, recipeId, ingredientId, originalName, swapName, quantityNote ?? null],
  );
}

/** Remove a swap, reverting the ingredient to its original. */
export async function clearIngredientSwap(
  db: SQLiteDatabase,
  recipeId: string,
  ingredientId: string,
): Promise<void> {
  const id = `${recipeId}:${ingredientId}`;
  await db.runAsync('DELETE FROM ingredient_swaps WHERE id = ?', [id]);
}
