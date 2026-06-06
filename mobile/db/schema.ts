/**
 * SQLite schema — CREATE TABLE statements + migration system.
 *
 * SCHEMA_SQL: run once on a fresh install (CREATE TABLE IF NOT EXISTS).
 * SCHEMA_MIGRATIONS: ALTER TABLE statements keyed by version number.
 *   initDatabase runs any migration whose version > current PRAGMA user_version,
 *   then sets user_version to the latest applied version.
 *
 * Adding a new column:
 *   1. Add it to SCHEMA_SQL (for fresh installs).
 *   2. Add an entry to SCHEMA_MIGRATIONS (for existing installs).
 *   3. Bump SCHEMA_VERSION.
 */

/** Current target schema version. Must match the highest key in SCHEMA_MIGRATIONS. */
export const SCHEMA_VERSION = 10;

/**
 * Full schema for a fresh install.
 * Each string is run once via execAsync.
 */
export const SCHEMA_SQL: string[] = [
  `CREATE TABLE IF NOT EXISTS recipes (
    id                     TEXT PRIMARY KEY,
    title                  TEXT NOT NULL,
    tagline                TEXT NOT NULL,
    description            TEXT,
    base_servings          INTEGER NOT NULL DEFAULT 2,
    time_min               INTEGER NOT NULL DEFAULT 30,
    difficulty             TEXT NOT NULL DEFAULT 'Easy',
    tags                   TEXT NOT NULL DEFAULT '[]',
    source_chef            TEXT,
    source_video_url       TEXT,
    source_notes           TEXT,
    hero_url               TEXT,
    hero_fallback          TEXT,
    emoji                  TEXT,
    user_added             INTEGER NOT NULL DEFAULT 0,
    generated_by_claude    INTEGER NOT NULL DEFAULT 0,
    leftover_extra_servings INTEGER,
    leftover_note          TEXT,
    categories             TEXT,
    total_time_minutes     INTEGER,
    active_time_minutes    INTEGER,
    equipment              TEXT,
    before_you_start       TEXT,
    mise_en_place          TEXT,
    finishing_note         TEXT,
    leftovers_note         TEXT,
    hero_attribution       TEXT,
    output_unit            TEXT,
    output_unit_plural     TEXT,
    output_default         INTEGER,
    extra_for_tomorrow_label TEXT,
    created_at             TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS ingredients (
    id            TEXT NOT NULL,
    recipe_id     TEXT NOT NULL,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    name          TEXT NOT NULL,
    amount        REAL NOT NULL DEFAULT 0,
    unit          TEXT NOT NULL DEFAULT '',
    scales        TEXT NOT NULL DEFAULT 'linear',
    cap           REAL,
    prep          TEXT,
    curve         TEXT,
    substitutions TEXT,
    PRIMARY KEY (id, recipe_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS method_steps (
    id              TEXT NOT NULL,
    recipe_id       TEXT NOT NULL,
    step_order      INTEGER NOT NULL,
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    stage_note      TEXT,
    lookahead       TEXT,
    timer_seconds   INTEGER,
    photo_url       TEXT,
    why_note        TEXT,
    ingredient_refs TEXT,
    PRIMARY KEY (id, recipe_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS pantry_items (
    id        TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    category  TEXT NOT NULL DEFAULT 'Pantry Staples',
    quantity  REAL,
    unit      TEXT,
    have_it   INTEGER NOT NULL DEFAULT 1
  )`,

  `CREATE TABLE IF NOT EXISTS meal_plan (
    id         TEXT PRIMARY KEY,
    date       TEXT NOT NULL,
    recipe_id  TEXT NOT NULL,
    servings   INTEGER NOT NULL DEFAULT 2,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS shopping_extras (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    amount      REAL NOT NULL DEFAULT 0,
    unit        TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL DEFAULT 'Pantry Staples',
    created_at  INTEGER NOT NULL
  )`,

    `CREATE TABLE IF NOT EXISTS favorites (
    recipe_id  TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS shopping_items (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'Pantry Staples',
    quantity        REAL,
    unit            TEXT,
    notes           TEXT,
    manually_added  INTEGER NOT NULL DEFAULT 0,
    in_cart         INTEGER NOT NULL DEFAULT 0,
    added_at        INTEGER NOT NULL DEFAULT 0,
    sources_json    TEXT NOT NULL DEFAULT '[]'
  )`,

  `CREATE TABLE IF NOT EXISTS app_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS ingredient_swaps (
    id            TEXT PRIMARY KEY,
    recipe_id     TEXT NOT NULL,
    ingredient_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    swap_name     TEXT NOT NULL,
    quantity_note TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS cook_history (
    id         TEXT PRIMARY KEY,
    recipe_id  TEXT NOT NULL,
    cooked_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS recipe_notes (
    recipe_id  TEXT PRIMARY KEY,
    notes      TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  )`,
];

/**
 * Migration steps for existing installs.
 *
 * Key = the version NUMBER this migration brings the DB to.
 * Value = array of SQL statements to run in order.
 *
 * Version 1 = original schema (no explicit user_version set).
 * Version 2 = Phase 2 additions: categories, whole_food_verified (since dropped in v7), substitutions.
 * Version 3 = ingredient_swaps table for persistent cross-screen swap state.
 * Version 4 = shopping_extras (later superseded by shopping_items).
 * Version 5 = source-tracked shopping_items.
 * Version 6 = DECISION-009 extended recipe content fields (timings, equipment, prep, finishing, leftovers).
 * Version 7 = drop whole_food_verified column. The concept was retired
 *             2026-05-07 — see types.ts header for rationale.
 */
export const SCHEMA_MIGRATIONS: Record<number, string[]> = {
  2: [
    `ALTER TABLE recipes ADD COLUMN categories TEXT`,
    `ALTER TABLE recipes ADD COLUMN whole_food_verified INTEGER`,
    `ALTER TABLE ingredients ADD COLUMN substitutions TEXT`,
  ],
  3: [
    `CREATE TABLE IF NOT EXISTS ingredient_swaps (
      id            TEXT PRIMARY KEY,
      recipe_id     TEXT NOT NULL,
      ingredient_id TEXT NOT NULL,
      original_name TEXT NOT NULL,
      swap_name     TEXT NOT NULL,
      quantity_note TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    )`,
  ],
  4: [
    `CREATE TABLE IF NOT EXISTS shopping_extras (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      amount      REAL NOT NULL DEFAULT 0,
      unit        TEXT NOT NULL DEFAULT '',
      category    TEXT NOT NULL DEFAULT 'Pantry Staples',
      created_at  INTEGER NOT NULL
    )`,
  ],
  5: [
    // Source-tracked shopping list. Replaces shopping_extras going forward;
    // shopping_extras stays in the schema for backwards compatibility but
    // is no longer written to. New code reads/writes shopping_items.
    `CREATE TABLE IF NOT EXISTS shopping_items (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      category        TEXT NOT NULL DEFAULT 'Pantry Staples',
      quantity        REAL,
      unit            TEXT,
      notes           TEXT,
      manually_added  INTEGER NOT NULL DEFAULT 0,
      in_cart         INTEGER NOT NULL DEFAULT 0,
      added_at        INTEGER NOT NULL DEFAULT 0,
      sources_json    TEXT NOT NULL DEFAULT '[]'
    )`,
  ],
  6: [
    // DECISION-009: Extended recipe content fields.
    // Seven new columns on the recipes table — all nullable so existing rows
    // are unaffected. refreshSeedRecipeFields (seed.ts) populates them for
    // seed recipes on every launch after this migration runs.
    `ALTER TABLE recipes ADD COLUMN total_time_minutes INTEGER`,
    `ALTER TABLE recipes ADD COLUMN active_time_minutes INTEGER`,
    `ALTER TABLE recipes ADD COLUMN equipment TEXT`,
    `ALTER TABLE recipes ADD COLUMN before_you_start TEXT`,
    `ALTER TABLE recipes ADD COLUMN mise_en_place TEXT`,
    `ALTER TABLE recipes ADD COLUMN finishing_note TEXT`,
    `ALTER TABLE recipes ADD COLUMN leftovers_note TEXT`,
  ],
  7: [
    // 2026-05-07 — drop whole_food_verified. The concept was retired:
    // seed data no longer sets it, the Zod schema no longer declares it,
    // and the UI never used it. This migration cleans up the column on
    // existing installs. SQLite ≥3.35 (March 2021) supports DROP COLUMN
    // natively; expo-sqlite ships a much newer SQLite. The migration
    // runner in database.ts swallows "duplicate column" AND "no such
    // column" as non-fatal so older installs that never had the column
    // (somehow skipped v2) don't fail to upgrade.
    `ALTER TABLE recipes DROP COLUMN whole_food_verified`,
  ],
  8: [
    // 2026-05-09 — DECISION-014 per-recipe portion-sizing fields.
    // Four new columns on the recipes table — all nullable so non-launch
    // recipes (which don't author these fields) keep working. Without this
    // migration the values authored in seed-recipes.ts fall on the floor
    // at the SQLite hop and the UI renders the legacy "people / portions"
    // fallback. refreshSeedRecipeFields (seed.ts) populates them for seed
    // recipes on every launch after this migration runs.
    `ALTER TABLE recipes ADD COLUMN output_unit TEXT`,
    `ALTER TABLE recipes ADD COLUMN output_unit_plural TEXT`,
    `ALTER TABLE recipes ADD COLUMN output_default INTEGER`,
    `ALTER TABLE recipes ADD COLUMN extra_for_tomorrow_label TEXT`,
  ],
  9: [
    // 2026-05-16 — build #113. The CC photography pipeline (DECISION-014
    // 10 May) needs to surface photographer credit on every CC-licensed
    // hero image. The field was added to the Zod schema in build #110 but
    // the SQLite layer never persisted it — same class of bug as DECISION-
    // 014's portion-sizing fields. One nullable column; refreshSeedRecipe-
    // Fields (seed.ts) backfills it on every launch.
    `ALTER TABLE recipes ADD COLUMN hero_attribution TEXT`,
  ],
  10: [
    // 2026-06-06 — issue #41. Cook history + per-recipe notes.
    `CREATE TABLE IF NOT EXISTS cook_history (
      id         TEXT PRIMARY KEY,
      recipe_id  TEXT NOT NULL,
      cooked_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS recipe_notes (
      recipe_id  TEXT PRIMARY KEY,
      notes      TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    )`,
  ],
};
