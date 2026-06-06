/**
 * Recipe data types + runtime validation.
 *
 * The schema below is the single source of truth for what a recipe IS —
 * both for authored seed recipes and for user-added recipes at runtime.
 * Zod validates both paths so bad data is rejected before it reaches the UI.
 *
 * Schema decisions mapped to CLAUDE.md Golden Rules:
 *   Rule #2 (credit the chefs)     -> `source` is REQUIRED for chef-inspired recipes.
 *   Rule #3 (smart scaling)        -> each ingredient has `scales: 'linear'|'fixed'|'custom'`.
 *   Rule #5 (stage photos)         -> each step has optional `photo_url` — the app
 *                                     renders a "photo missing" warning if absent.
 *   Rule #6 (honesty)              -> `why_note` captures the underlying mechanism;
 *                                     `substitutions` captures honest tradeoff notes.
 *
 * Phase 2 additions (2026-04-22):
 *   - CuisineId + TypeId enums — the dual-axis category taxonomy
 *   - SwapQuality + Substitution — ingredient-level swap data
 *   - `substitutions[]` on Ingredient
 *   - `categories` on Recipe (dual-axis taxonomy, required for non-user recipes)
 *
 * Removed 2026-05-07:
 *   - `whole_food_verified` — concept retired. Caused recurring data drift
 *     and a SMASH_BURGER rendering regression on 6 May. The associated
 *     SQLite column is dropped by a forward migration in schema.ts; old
 *     installs upgrade cleanly.
 */

import { z } from 'zod';
import { AllergenId } from './allergens';

// ---------------------------------------------------------------------------
// Taxonomy — dual-axis category system
// ---------------------------------------------------------------------------

/**
 * AXIS 1: Cuisine origin — where the dish is FROM.
 *
 * No Israeli-labelled recipes per CLAUDE.md. Levantine covers Lebanese,
 * Syrian, Jordanian, and Palestinian dishes.
 *
 * Filipino and Chinese added to accommodate existing seed recipes
 * (Chicken Adobo, Egg Fried Rice). Expand as the library grows.
 */
export const CuisineId = z.enum([
  'levantine',    // Lebanese, Syrian, Jordanian, Palestinian — broad Levantine tag
  'palestinian',  // Explicit Palestinian cultural attribution (Hummus, Falafel)
  'indian',       // North + South Indian
  'malaysian',
  'japanese',
  'thai',
  'italian',
  'french',
  'american',     // Burgers, BBQ, Southern
  'australian',   // Modern Australian, indigenous-inspired
  'mexican',
  'filipino',
  'chinese',
  'german',       // German + Austrian (Schnitzel lineage) — recognisable broad label
  'british',      // British (Fish & Chips origin)
]);
export type CuisineId = z.infer<typeof CuisineId>;

/**
 * AXIS 2: Type/format — what the dish IS, not where it's from.
 * Allows browsing by "I want chicken tonight" regardless of cuisine.
 */
export const TypeId = z.enum([
  'burgers',
  'chicken',
  'seafood',
  'beef',
  'lamb',
  'vegetarian',
  'pasta',    // pasta + noodles
  'soups',    // soups + stews
  'salads',
  'baking',   // bread, pastry, baked goods
  'eggs',
  'dessert',  // sweet dishes served after the main — Pavlova etc.
]);
export type TypeId = z.infer<typeof TypeId>;

// ---------------------------------------------------------------------------
// Substitutions — the competitive advantage over Yummly and Supercook
// ---------------------------------------------------------------------------

/**
 * Substitution quality — DECISION-015 (2026-05-12). Three-colour system that
 * replaces the prior four-tier model. Rendered as green / yellow / red pills
 * with icon + label per Designer's v2 prototype.
 *
 *   'green'  — works as well or near-as-well. No real compromise.
 *              (was: perfect_swap, great_swap)
 *   'yellow' — honest tradeoff. Dish still good. (was: good_swap, good)
 *   'red'    — works in a pinch. Dish genuinely different. (was: compromise)
 *
 * Migration: a `z.preprocess` step coerces any remaining legacy four-tier
 * value to its new-colour equivalent and emits `console.warn` so a legacy
 * value sneaking back in via a future commit is visible in dev logs. The
 * canonical authored values in seed-recipes.ts have all been migrated
 * statically to the 3-colour set — the preprocess is the defensive net.
 *
 * Cook may override per-swap as part of her DECISION-015 discrepancy work —
 * see docs/coo/culinary-research/<recipe>.md tables.
 *
 * There is no 'bad substitute' in the schema — if the result is bad, don't
 * list it. The app never suggests something that ruins a dish.
 */
const LEGACY_QUALITY_MAP: Record<string, 'green' | 'yellow' | 'red'> = {
  perfect_swap: 'green',
  great_swap:   'green',
  good_swap:    'yellow',
  good:         'yellow',
  compromise:   'red',
};

export const SwapQuality = z.preprocess(
  (v) => {
    if (typeof v === 'string' && Object.prototype.hasOwnProperty.call(LEGACY_QUALITY_MAP, v)) {
      const mapped = LEGACY_QUALITY_MAP[v]!;
      // Defensive log so a legacy value sneaking in is visible — never silent.
      // eslint-disable-next-line no-console
      console.warn('[DECISION-015] legacy substitution quality coerced:', v, '->', mapped);
      return mapped;
    }
    return v;
  },
  z.enum(['green', 'yellow', 'red']),
);
export type SwapQuality = 'green' | 'yellow' | 'red';

/**
 * A single substitution entry on an ingredient.
 *
 * Australian context fields: hard_to_find flags ingredients that require
 * a specialty grocer outside Sydney, Melbourne, Brisbane, or Perth.
 * local_alternative tells the user where to look or what brand to ask for.
 */
export const Substitution = z.object({
  /**
   * The alternative ingredient name. Australian English.
   * Do NOT repeat "instead of X" — that's implied by the parent ingredient.
   */
  ingredient: z.string().min(1),
  /**
   * What specifically changes. Be concrete.
   * "Slightly more sour, less body" beats "flavour changes".
   */
  changes: z.string().min(1),
  /** Honest quality assessment. Never omit to avoid disappointing users. */
  quality: SwapQuality,
  /**
   * Optional quantity note: how to adjust the amount when swapping.
   * E.g. "use 20% less — stronger flavour", "add an extra 50ml — less fat".
   */
  quantity_note: z.string().optional(),
  /**
   * True if the ORIGINAL ingredient (not this substitute) is hard to source
   * outside major Australian cities. Signals the app to show a sourcing note.
   */
  hard_to_find: z.boolean().optional(),
  /**
   * Where to find the original, or what brand to ask for.
   * E.g. "Ask at Italian delis or Harris Farm Markets — Coles rarely stocks it."
   */
  local_alternative: z.string().optional(),
  /**
   * DECISION-015 step text overrides. Keyed by Step id (e.g. 's2', 's4').
   * When this swap is active, the recipe screen renders the override text
   * instead of the step's default `content` and shows the sage
   * "adapted for your [name] swap" cue. Only authored where the swap
   * genuinely changes technique — most swaps need no overrides.
   *
   * Most-recent-active swap wins when multiple swaps touch the same step.
   * A console.warn fires at app start if a step id appears here that the
   * recipe doesn't actually contain (silent-failure guardrail).
   */
  step_overrides: z.record(z.string(), z.string()).optional(),
});
export type Substitution = z.infer<typeof Substitution>;

// ---------------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------------

/**
 * How an ingredient scales when the user changes servings.
 *
 *   linear — standard multiplier (mince, pasta, stock)
 *   fixed  — caps at `cap` (bay leaves, salt — adding more doesn't help)
 *   custom — follows a lookup curve (rice-to-water ratios are non-linear
 *            because evaporation scales with pot radius, not volume)
 */
export const ScalingMode = z.enum(['linear', 'fixed', 'custom']);
export type ScalingMode = z.infer<typeof ScalingMode>;

export const Ingredient = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  amount: z.number(),
  unit: z.string(),
  scales: ScalingMode.default('linear'),
  /** Hard cap when scales === 'fixed'. Ignored otherwise. */
  cap: z.number().optional(),
  /**
   * When scales === 'custom', a lookup table keyed by servings count.
   * E.g. { '1': 0.5, '2': 0.9, '4': 1.6, '8': 3.0 }.
   * Values between keys are linearly interpolated.
   */
  curve: z.record(z.number()).optional(),
  /** Short prep instruction — "fine dice", "room temp", etc. */
  prep: z.string().optional(),
  /**
   * Chef-knowledge note about how this ingredient scales non-obviously.
   * Populated per DECISION-007 when naïve multiplication misleads —
   * concentration limits (brine salt), coverage quantities (dusting flour),
   * depth-driven volumes (frying oil), surface-area constraints (lasagne sheets).
   * Rendered as a subtle tooltip on the ingredient line in cook mode.
   */
  scaling_note: z.string().optional(),
  /**
   * Swap options for this ingredient.
   * Optional field — absence means swaps haven't been researched yet,
   * not that no swaps exist. Phase 5 renders this as a tap-to-expand
   * dropdown on each ingredient line.
   */
  substitutions: z.array(Substitution).optional(),
});
export type Ingredient = z.infer<typeof Ingredient>;

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export const Step = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** Main instruction — present tense, imperative, short. */
  content: z.string().min(1),
  /**
   * Doneness cue shown prominently. Visual / aural / olfactory.
   * This is the PRIMARY SIGNAL. The timer is a safety net.
   */
  stage_note: z.string().optional(),
  /** What's coming next — lets the user prep in parallel. */
  lookahead: z.string().optional(),
  /** Fallback timer in seconds. Never the primary signal. */
  timer_seconds: z.number().int().positive().optional(),
  /** Real hand-shot photo of the food AT THIS STAGE. No AI photos. */
  photo_url: z.string().optional(),
  /** The underlying mechanism — lets users reason about substitutions. */
  why_note: z.string().optional(),
  /** Ingredient IDs used in this step — enables highlight / smart-prep lists. */
  ingredient_refs: z.array(z.string()).optional(),
});
export type Step = z.infer<typeof Step>;

// ---------------------------------------------------------------------------
// Source — attribution is MANDATORY for chef-inspired recipes
// ---------------------------------------------------------------------------

export const Source = z.object({
  chef: z.string().min(1),
  /** Link to the original video/recipe. Users can tap through. */
  video_url: z.string().url().optional(),
  /** Brief note on how this recipe relates to the original. */
  notes: z.string().optional(),
});
export type Source = z.infer<typeof Source>;

// ---------------------------------------------------------------------------
// Leftover mode — recipe-level scaling hint
// ---------------------------------------------------------------------------

export const LeftoverMode = z.object({
  /** Servings beyond the main meal. */
  extra_servings: z.number().int().positive(),
  /** Human description — "packs for two lunches tomorrow". */
  note: z.string(),
});
export type LeftoverMode = z.infer<typeof LeftoverMode>;

// ---------------------------------------------------------------------------
// Recipe — the full object
// ---------------------------------------------------------------------------

/**
 * Accepted difficulty values.
 *
 * New recipes use lowercase ('beginner', 'intermediate', 'advanced').
 * Legacy seed recipes written before DECISION-009 use the old capitalised
 * values ('Easy', 'Intermediate', 'Involved') — both sets are valid so
 * existing DB rows don't break. refreshSeedRecipeFields normalises seed
 * recipes to lowercase on every launch; user-added recipes keep whatever
 * the UI wrote. Display label mapping lives in recipe/[id].tsx.
 */
export const DifficultyLevel = z.enum([
  'beginner', 'intermediate', 'advanced',
  'Easy', 'Intermediate', 'Involved',
]);
export type DifficultyLevel = z.infer<typeof DifficultyLevel>;

export const Recipe = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** One-line pitch shown on cards. */
  tagline: z.string().min(1),
  /** Short editorial note. NOT food-blog prose. */
  description: z.string().optional(),
  base_servings: z.number().int().positive(),

  /**
   * Yield unit for recipes that don't fit the "serves N people" model.
   * If set, the servings stepper shows "How many {yield_unit}" instead of
   * "How many people" — e.g. "How many tortillas". Leave undefined for
   * standard meals.
   * Examples: 'tortillas', 'cookies', 'dumplings', 'loaf', 'L of stock'.
   */
  yield_unit: z.string().optional(),

  /**
   * True for recipes whose yield doesn't scale linearly — sourdough loaves,
   * stocks, ferments. Disables the stepper; user gets the recipe at base
   * yield only. Default false.
   */
  fixed_yield: z.boolean().optional(),

  time_min: z.number().int().positive(),
  difficulty: DifficultyLevel,
  /** Freeform search keywords. Structured taxonomy lives in `categories`. */
  tags: z.array(z.string()),

  /**
   * Dual-axis category taxonomy.
   *
   * cuisines: where the dish is FROM — drives the cuisine-origin filter.
   * types:    what the dish IS — drives the protein/format filter.
   *
   * Required on all authored (non-user-added) recipes. A recipe with
   * neither axis is undiscoverable in the category browser.
   */
  categories: z.object({
    cuisines: z.array(CuisineId).min(1),
    types: z.array(TypeId).min(1),
  }).optional(),

  /**
   * Allergen declaration (Australian PEAL / Food Standards Code 1.2.3).
   *
   * DERIVED, not authored or persisted. It is computed from the ingredient
   * names by `recipeAllergens()` (src/data/allergens.ts) at the DB-load
   * boundary in `rowToRecipe`, so one auditable rule set covers seed recipes,
   * user-added recipes, and pantry/Claude-generated recipes alike — nothing
   * can ship an ingredient whose allergens go undeclared. Optional here
   * because raw seed objects don't carry it; the field is populated on the
   * in-memory Recipe the UI receives.
   *
   * An empty array after derivation means "no major allergens from the listed
   * ingredients" — a real result the UI renders explicitly, distinct from
   * `undefined` (not yet computed).
   */
  allergens: z.array(AllergenId).optional(),

  /**
   * Attribution. REQUIRED unless user_added or generated_by_claude.
   * If we can't name the source, the recipe does not ship.
   */
  source: Source.optional(),

  hero_url: z.string().optional(),
  /** Photographer credit + source for CC-licensed hero images.
   *  Rendered as a small muted line on the recipe screen. Required when
   *  hero_url points at Unsplash/Pexels/etc — CC licensing convention. */
  hero_attribution: z.string().optional(),
  hero_fallback: z.array(z.string()).length(3).optional(),
  emoji: z.string().optional(),

  ingredients: z.array(Ingredient).min(1),
  steps: z.array(Step).min(1),

  leftover_mode: LeftoverMode.optional(),

  // ── DECISION-009: Extended recipe content fields ──────────────────────────
  /**
   * Total elapsed time in minutes (including passive time such as soaking,
   * marinating, proofing). Shown in the "At a glance" strip.
   */
  total_time_minutes: z.number().int().positive().optional(),
  /**
   * Hands-on time only — excludes waiting, soaking, oven time.
   * Shown alongside total_time_minutes so users can plan their day.
   */
  active_time_minutes: z.number().int().positive().optional(),
  /**
   * Physical tools and vessels required. Rendered before ingredients so the
   * user can check their kitchen before they start shopping.
   */
  equipment: z.array(z.string()).optional(),
  /**
   * 2–4 non-obvious things to know before starting. Critical gotchas only —
   * not a summary of the recipe. Rendered as a "What to know" block.
   */
  before_you_start: z.array(z.string()).optional(),
  /**
   * Ordered prep steps: what to have ready before the first cook step.
   * Rendered as the "Mise en place" block — one of the six DECISION-008 sections.
   */
  mise_en_place: z.array(z.string()).optional(),
  /**
   * Finishing cue — taste, adjust, plate. One paragraph.
   * Rendered as "Finishing & tasting" after the method steps.
   */
  finishing_note: z.string().optional(),
  /**
   * Storage, reheating, and next-day use. One paragraph.
   * Rendered as "Leftovers" at the bottom of the recipe detail screen.
   */
  leftovers_note: z.string().optional(),
  // ─────────────────────────────────────────────────────────────────────────

  /** True for recipes a user added in-app. Exempt from source requirement. */
  user_added: z.boolean().default(false),
  /** True for recipes generated by the pantry "invent a recipe" feature. */
  generated_by_claude: z.boolean().default(false),

  /**
   * DECISION-013 (2026-05-08): launch-scope flag.
   *
   * When `true`, the recipe is hidden from every user-visible surface in v1.0
   * — Kitchen browse, search, pantry-match, meal-plan suggestions. The recipe
   * stays in the seed file and the database so deep links and existing meal-
   * plan entries still resolve, but the recipe never appears in the regular
   * discovery loop.
   *
   * v1.0 ships 16 recipes only (the launch-16 named in handoffs.md /
   * decision-log.md DECISION-013). The other 30 recipes default to
   * `not_yet_shipping: true` and surface in later releases.
   *
   * Filtering happens in `getActiveRecipes()` in `db/database.ts`. Do NOT
   * filter directly in components — always go through that helper so the
   * scope is consistent and one place to flip when v1.x ships more recipes.
   *
   * Schema note: `.optional()` (not `.default(false)`) so launch-set recipes
   * don't need to spell out `not_yet_shipping: false` in seed-recipes.ts.
   * Absent === false at the filter site (`!r.not_yet_shipping`).
   */
  not_yet_shipping: z.boolean().optional(),

  // ── DECISION-014 (2026-05-08): per-recipe portion sizing ─────────────────
  // Cook's spec: docs/coo/culinary-research/launch-recipe-units.md.
  //
  // The legacy `base_servings` field treats every recipe as if "servings"
  // means "people." That's wrong: burgers are per-person, hummus is by cup,
  // sourdough is one loaf regardless of party size, tortillas are per-piece.
  //
  // The four optional fields below let the recipe screen render the right
  // unit per recipe — "Makes 4 burgers" / "Makes 1 loaf" / "Makes 8 tortillas"
  // / "Serves 4 people" — without breaking existing recipes that don't yet
  // have these populated.
  //
  // Migration strategy: launch-16 recipes get these populated from the cook's
  // spec; non-launch recipes default to legacy "people" rendering until the
  // cook authors their unit data in v1.1+.

  /**
   * The unit this recipe produces — the singular form of what's on the
   * stepper. Examples: `"burger"`, `"serve"`, `"loaf"`, `"cup"`, `"piece"`,
   * `"tortilla"`, `"chicken"`, `"schnitzel"`. When the unit is `"serve
"` or
   * `"person"`, the UI prefix is "Serves N"; otherwise it's "Makes N".
   *
   * If absent, the recipe falls back to the legacy "N people" rendering.
   */
  output_unit: z.string().optional(),

  /**
   * Plural form of `output_unit` for display when count !== 1.
   * If absent, the UI auto-pluralises by appending "s" (works for the
   * common cases — burgers, tortillas, cups, etc.).
   *
   * Note: "loaf" → "loafs" via auto-pluralise is wrong; this is exactly why
   * the field exists. Set `output_unit_plural: "loaves"` for sourdough.
   */
  output_unit_plural: z.string().optional(),

  /**
   * Default count for the unit (e.g., 4 burgers, 1 loaf, 8 tortillas,
   * 4 people). Distinct from `base_servings`, which means "default people"
   * and is the legacy recipe-scaling input. For launch-16 recipes the two
   * are usually the same number — the difference is semantic. When this
   * field is absent, the UI uses `base_servings` as the default count.
   */
  output_default: z.number().int().positive().optional(),

  /**
   * Recipe-aware label for the "Make extra for tomorrow" affordance. The
   * cook's spec at `launch-recipe-units.md` writes this per recipe based on
   * how the dish stores: e.g., `"+2 lunches tomorrow"` (butter chicken),
   * `"Double the batch — freezes 3 months"` (bolognese), `"No tomorrow —
   * carbonara doesn't store"` (pasta carbonara — UI should show this as a
   * disabled/explanatory state).
   *
   * If absent, the UI falls back to the leftover-mode option's generic hint.
   */
  extra_for_tomorrow_label: z.string().optional(),
  // ─────────────────────────────────────────────────────────────────────────
}).refine(
  (r) => r.user_added || r.generated_by_claude || r.source !== undefined,
  { message: 'Recipe requires `source` unless user_added or generated_by_claude' },
).refine(
  (r) => r.user_added || r.generated_by_claude || r.categories !== undefined,
  { message: 'Authored recipe is missing `categories` — add cuisines[] and types[] for discoverability' },
);
export type Recipe = z.infer<typeof Recipe>;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Parse and validate a raw object as a Recipe.
 * Returns the validated recipe or throws a ZodError with field-level messages.
 * Use this at the database ingestion boundary, not in hot UI code.
 */
export function parseRecipe(raw: unknown): Recipe {
  return Recipe.parse(raw);
}

/**
 * Same as parseRecipe but returns a SafeParseReturnType — never throws.
 */
export function safeParseRecipe(raw: unknown) {
  return Recipe.safeParse(raw);
}
