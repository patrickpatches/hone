/**
 * Seed loader — runs once on first app launch, gated by the `app_meta.seeded`
 * flag set inside `initDatabase`.
 *
 * The job here is deliberately thin:
 *   1. iterate `SEED_RECIPES`
 *   2. validate each one at runtime against the Zod schema
 *   3. write it through the same `insertRecipe` CRUD path user-added recipes use
 *
 * Why validate at runtime when the array is already typed as `Recipe[]`?
 * Because Zod's `.refine()` on Recipe (the rule that a non-user-added, non-
 * Claude-generated recipe must have a `source`) runs at runtime, not at the
 * TS level. A seed that ships without attribution would silently break
 * Golden Rule #2 in production. Better to crash loudly in dev.
 *
 * Why reuse `insertRecipe` instead of writing a bespoke bulk path? One write
 * path means "does the seed work" and "does user-add work" are the same
 * question. Twenty-eight inserts on first launch is not a perf problem.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { Recipe as RecipeSchema } from '../src/data/types';
import { SEED_RECIPES } from '../src/data/seed-recipes';
import { insertRecipe } from './database';

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  // One transaction for all 16 recipes. SQLite flushes to disk once on COMMIT
  // instead of ~80 times (once per runAsync inside insertRecipe) — this is the
  // bulk of cold-boot time. A validation throw inside rolls the whole seed back,
  // which is correct: setupDatabase only writes `seeded=1` after this resolves,
  // so a partial seed can never be marked complete.
  await db.withTransactionAsync(async () => {
    for (const raw of SEED_RECIPES) {
      const parsed = RecipeSchema.safeParse(raw);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new Error(
          `seed: recipe "${(raw as { id?: string }).id ?? '(unknown)'}" failed ` +
            `validation at "${first.path.join('.')}" — ${first.message}`,
        );
      }
      await insertRecipe(db, parsed.data);
    }
  });
}

/**
 * Insert any seed recipes that are not yet in the database.
 *
 * Runs every launch. Skips recipes whose ID already exists, so it is safe
 * and cheap after the initial seed (one SELECT per recipe). This is what
 * makes new seed recipes appear on existing installs without a reinstall.
 */
export async function syncNewSeedRecipes(db: SQLiteDatabase): Promise<void> {
  // Single transaction: the common case is 16 SELECTs and zero inserts (cheap),
  // but when new seed recipes ship, batching their inserts into one commit keeps
  // this fast on slow storage.
  await db.withTransactionAsync(async () => {
    for (const raw of SEED_RECIPES) {
      const existing = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM recipes WHERE id = ?',
        [(raw as { id: string }).id],
      );
      if (existing) continue;

      const parsed = RecipeSchema.safeParse(raw);
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        throw new Error(
          `seed: recipe "${(raw as { id?: string }).id ?? '(unknown)'}" failed ` +
            `validation at "${first.path.join('.')}" — ${first.message}`,
        );
      }
      await insertRecipe(db, parsed.data);
    }
  });
}

/**
 * Refresh DECISION-009 content fields on existing seed recipes.
 *
 * Runs every launch (cheap: one SELECT + one UPDATE per recipe, all on the
 * same connection). Idempotent — running it again produces the same rows.
 *
 * This is the fix for the seeding-guard problem: once `app_meta.seeded = '1'`
 * is set, seedDatabase never runs again. Any new content fields added to
 * SEED_RECIPES after the initial install are invisible unless we explicitly
 * UPDATE the existing rows. This function does that for all authored seed
 * recipes on every launch, so new field data ships in the next APK with no
 * reinstall required.
 *
 * Only updates rows where user_added = 0 and generated_by_claude = 0 —
 * user recipes are never clobbered. Silently skips recipes that fail
 * validation (safeParse) so a broken seed entry can't crash the launch.
 */
export async function refreshSeedRecipeFields(db: SQLiteDatabase): Promise<void> {
  // Batch the 16 UPDATEs into one commit (one disk flush, not 16) each launch.
  await db.withTransactionAsync(async () => {
  for (const raw of SEED_RECIPES) {
    const recipeId = (raw as { id: string }).id;

    const existing = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM recipes WHERE id = ? AND user_added = 0 AND generated_by_claude = 0',
      [recipeId],
    );
    if (!existing) continue; // Not yet seeded — syncNewSeedRecipes will handle it

    const parsed = RecipeSchema.safeParse(raw);
    if (!parsed.success) continue; // Don't crash on refresh — bad entry, skip

    const r = parsed.data;
    await db.runAsync(
      `UPDATE recipes SET
        total_time_minutes = ?,
        active_time_minutes = ?,
        equipment = ?,
        before_you_start = ?,
        mise_en_place = ?,
        finishing_note = ?,
        leftovers_note = ?,
        difficulty = ?,
        output_unit = ?,
        output_unit_plural = ?,
        output_default = ?,
        extra_for_tomorrow_label = ?,
        categories = ?,
        hero_attribution = ?,
        hero_url = ?
       WHERE id = ? AND user_added = 0`,
      [
        r.total_time_minutes ?? null,
        r.active_time_minutes ?? null,
        r.equipment ? JSON.stringify(r.equipment) : null,
        r.before_you_start ? JSON.stringify(r.before_you_start) : null,
        r.mise_en_place ? JSON.stringify(r.mise_en_place) : null,
        r.finishing_note ?? null,
        r.leftovers_note ?? null,
        r.difficulty,
        // DECISION-014 per-recipe portion-sizing
        r.output_unit ?? null,
        r.output_unit_plural ?? null,
        r.output_default ?? null,
        r.extra_for_tomorrow_label ?? null,
        // Build #113 — categories + hero_attribution + hero_url. Last
        // three picked up on every launch so existing installs whose
        // seed rows pre-date these columns get backfilled without a
        // reinstall. hero_url is included here so the #110 hotfix
        // (REJECTED smash-burger photo) and the #113 URL-strip
        // (broken Unsplash short-id URLs for falafel/pavlova) reach
        // Patrick's DB on next launch without an uninstall.
        r.categories ? JSON.stringify(r.categories) : null,
        r.hero_attribution ?? null,
        r.hero_url ?? null,
        r.id,
      ],
    );
  }
  });
}

/**
 * Sync substitution data from seed recipes into the DB.
 *
 * Runs every launch (idempotent UPDATE — no data loss). This ensures that
 * when swap data is added or updated in seed-recipes.ts, existing installs
 * get the new data without requiring a full re-seed (which would wipe meal
 * plan entries via cascade delete).
 */
export async function updateSubstitutions(db: SQLiteDatabase): Promise<void> {
  // Batch every substitution UPDATE into one commit each launch (these run on a
  // per-ingredient loop, so without batching it is one disk flush per ingredient).
  await db.withTransactionAsync(async () => {
    for (const recipe of SEED_RECIPES) {
      for (const ing of recipe.ingredients) {
        if (ing.substitutions && ing.substitutions.length > 0) {
          await db.runAsync(
            'UPDATE ingredients SET substitutions = ? WHERE id = ? AND recipe_id = ?',
            [JSON.stringify(ing.substitutions), ing.id, recipe.id],
          );
        }
      }
    }
  });
}


/**
 * Prune any seed-origin rows that are no longer in SEED_RECIPES.
 *
 * Background: Patrick's launch roster is exactly 16 recipes (DECISION-013).
 * Earlier seeds wrote 46 rows; the 30 non-launch ones used to be filtered
 * at the JS layer via a `not_yet_shipping` flag, but that flag never reached
 * SQLite, so on every launch the DB read returned all 46 with `undefined`
 * flags and the launch filter passed all of them through. Patrick saw the
 * launch list "creep back" four times in a row.
 *
 * Architectural fix (2026-05-09): SEED_RECIPES is now exactly 16. The other
 * 30 live in SEED_RECIPES_HOLDING and are never inserted. This routine
 * cleans up existing installs by deleting any seeded row whose id is no
 * longer in the launch array. ON DELETE CASCADE handles meal_plan,
 * favorites, and ingredient_swaps cleanup automatically.
 *
 * Idempotent: once Patrick's DB matches the launch roster, this is a no-op
 * (one SELECT, zero deletes). Cheap to run every launch.
 *
 * Only deletes seeded rows (`user_added = 0 AND generated_by_claude = 0`) —
 * user-added recipes and Claude-generated recipes are never touched.
 */
export async function pruneOrphanedSeedRecipes(db: SQLiteDatabase): Promise<number> {
  const validIds = new Set(SEED_RECIPES.map((r) => r.id));
  const seeded = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM recipes WHERE user_added = 0 AND generated_by_claude = 0',
  );
  const orphans = seeded.map((r) => r.id).filter((id) => !validIds.has(id));
  for (const id of orphans) {
    await db.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
  }
  return orphans.length;
}

/**
 * Dev-only smoke alarm — counts seeded rows in SQLite and screams in the
 * console if the count drifts from SEED_RECIPES.length.
 *
 * Not a guard: it doesn't change UI or block startup. It's a tripwire that
 * fires loudly the next time something accidentally puts a 17th seeded row
 * into the DB (or removes one). Gated on `__DEV__` so the installed APK
 * stays silent.
 */
export async function smokeAlarmSeedCount(db: SQLiteDatabase): Promise<void> {
  // eslint-disable-next-line no-undef
  if (!(typeof __DEV__ !== 'undefined' && __DEV__)) return;
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM recipes WHERE user_added = 0 AND generated_by_claude = 0',
  );
  const actual = row?.n ?? 0;
  const expected = SEED_RECIPES.length;
  if (actual !== expected) {
    const seeded = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM recipes WHERE user_added = 0 AND generated_by_claude = 0',
    );
    const inDb = new Set(seeded.map((r) => r.id));
    const inSeed = new Set(SEED_RECIPES.map((r) => r.id));
    const orphans = [...inDb].filter((id) => !inSeed.has(id));
    const missing = [...inSeed].filter((id) => !inDb.has(id));
    // eslint-disable-next-line no-console
    console.error(
      `[seed smoke alarm] expected ${expected} seeded recipes, found ${actual}. ` +
        `Orphans (in DB but not in SEED_RECIPES): ${JSON.stringify(orphans)}. ` +
        `Missing (in SEED_RECIPES but not in DB): ${JSON.stringify(missing)}.`,
    );
  }
}


/**
 * DECISION-015 — substitution quality sanity check + step_overrides validator.
 *
 * Runs in dev only (gated on __DEV__). Two checks:
 *   1. Count substitution `quality` values across SEED_RECIPES. The 4-tier
 *      legacy values (perfect_swap / great_swap / good_swap / good /
 *      compromise) should be zero after the static migration in
 *      seed-recipes.ts. If any appear, console.error loudly — the regression
 *      pattern Patrick has been hit by must scream the moment it returns.
 *   2. For every substitution with `step_overrides`, every key must match an
 *      existing step id on the parent recipe. Bad keys silently fall through
 *      to default step text — surface them so cook's mapping mistakes are
 *      visible in dev.
 *
 * Production APK stays silent. Tripwire only.
 */
export function validateDecision015(): void {
  // eslint-disable-next-line no-undef
  if (!(typeof __DEV__ !== 'undefined' && __DEV__)) return;

  const counts = { green: 0, yellow: 0, red: 0, legacy: 0 };
  const legacyValues = new Set([
    'perfect_swap',
    'great_swap',
    'good_swap',
    'good',
    'compromise',
  ]);
  const badOverrides: Array<{ recipe: string; ingredient: string; sub: string; key: string }> = [];

  for (const recipe of SEED_RECIPES) {
    const stepIds = new Set(recipe.steps.map((s) => s.id));
    for (const ing of recipe.ingredients) {
      for (const sub of ing.substitutions ?? []) {
        const q = sub.quality as unknown as string;
        if (q === 'green' || q === 'yellow' || q === 'red') {
          counts[q] += 1;
        } else if (legacyValues.has(q)) {
          counts.legacy += 1;
        }
        if (sub.step_overrides) {
          for (const key of Object.keys(sub.step_overrides)) {
            if (!stepIds.has(key)) {
              badOverrides.push({
                recipe: recipe.id,
                ingredient: ing.name,
                sub: sub.ingredient,
                key,
              });
            }
          }
        }
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[DECISION-015] substitution quality counts: green=${counts.green} yellow=${counts.yellow} red=${counts.red} legacy=${counts.legacy}`,
  );

  if (counts.legacy > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `[DECISION-015] LEGACY QUALITY VALUES STILL PRESENT in SEED_RECIPES (${counts.legacy} occurrences). The 4-tier migration to 3-colour has regressed.`,
    );
  }

  if (badOverrides.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[DECISION-015] step_overrides references ${badOverrides.length} unknown step id(s):`,
      badOverrides,
    );
  }

  // ── Cuisine + Type enum guardrail (build #110) ──────────────────────────
  // Per Patrick's brief: console.warn on app launch if any CuisineId or
  // TypeId in seed data doesn't match the enum. The Zod schema would
  // already throw at parseRecipe() time — this is a belt-and-braces tripwire
  // for cases where data slips past parse (e.g. raw seed access). Listed
  // values must match the enums in types.ts exactly.
  const VALID_CUISINES = new Set<string>([
    'levantine', 'palestinian', 'indian', 'malaysian', 'japanese', 'thai',
    'italian', 'french', 'american', 'australian', 'mexican',
    'filipino', 'chinese', 'german', 'british',
  ]);
  const VALID_TYPES = new Set<string>([
    'burgers', 'chicken', 'seafood', 'beef', 'lamb', 'vegetarian',
    'pasta', 'soups', 'salads', 'baking', 'eggs', 'dessert',
  ]);
  const badTaxonomy: Array<{ recipe: string; field: string; value: string }> = [];
  for (const recipe of SEED_RECIPES) {
    const cats = recipe.categories;
    if (!cats) continue;
    for (const c of cats.cuisines ?? []) {
      if (!VALID_CUISINES.has(c)) {
        badTaxonomy.push({ recipe: recipe.id, field: 'cuisines', value: c });
      }
    }
    for (const t of cats.types ?? []) {
      if (!VALID_TYPES.has(t)) {
        badTaxonomy.push({ recipe: recipe.id, field: 'types', value: t });
      }
    }
  }
  if (badTaxonomy.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[taxonomy] ${badTaxonomy.length} seed value(s) outside the CuisineId/TypeId enums:`,
      badTaxonomy,
    );
  }
}
