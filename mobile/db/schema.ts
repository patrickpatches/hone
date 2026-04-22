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
export const SCHEMA_VERSION = 2;

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
    whole_food_verified    INTEGER,
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

  `CREATE TABLE IF NOT EXISTS favorites (
    recipe_id  TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS app_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
];

/**
 * Migration steps for existing installs.
 *
 * Key = the version NUMBER this migration brings the DB to.
 * Value = array of SQL statements to run in order.
 *
 * Version 1 = original schema (no explicit user_version set).
 * Version 2 = Phase 2 additions: categories, whole_food_verified, substitutions.
 */
export const SCHEMA_MIGRATIONS: Record<number, string[]> = {
  2: [
    `ALTER TABLE recipes ADD COLUMN categories TEXT`,
    `ALTER TABLE recipes ADD COLUMN whole_food_verified INTEGER`,
    `ALTER TABLE ingredients ADD COLUMN substitutions TEXT`,
  ],
};
