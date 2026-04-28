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
 *   - `whole_food_verified` on Recipe (no preservatives flag)
 */

import { z } from 'zod';

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
  'levantine',  // Lebanese, Syrian, Jordanian, Palestinian
  'indian',     // North + South Indian
  'malaysian',
  'japanese',
  'thai',
  'italian',
  'french',
  'american',   // Burgers, BBQ, Southern
  'australian', // Modern Australian, indigenous-inspired
  'mexican',
  'filipino',
  'chinese',
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
]);
export type TypeId = z.infer<typeof TypeId>;

// ---------------------------------------------------------------------------
// Substitutions — the competitive advantage over Yummly and Supercook
// ---------------------------------------------------------------------------

/**
 * Honest quality rating for an ingredient substitution.
 *
 * 'perfect_swap' — virtually identical result; most people wouldn't notice.
 * 'great_swap'   — excellent alternative; minor character difference only.
 * 'good_swap'    — solid swap with a small but acceptable trade-off.
 * 'good'         — legacy alias for good_swap (backward compat).
 * 'compromise'   — noticeable trade-off; dish works but something changes.
 *
 * There is no "bad substitute" in the schema — if the result is bad,
 * don't list it. The app never suggests something that ruins a dish.
 */
export const SwapQuality = z.enum(['good', 'compromise', 'good_swap', 'great_swap', 'perfect_swap']);
export type SwapQuality = z.infer<typeof SwapQuality>;

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

export const DifficultyLevel = z.enum(['Easy', 'Intermediate', 'Involved']);
export type DifficultyLevel = z.infer<typeof DifficultyLevel>;

export const Recipe = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** One-line pitch shown on cards. */
  tagline: z.string().min(1),
  /** Short editorial note. NOT food-blog prose. */
  description: z.string().optional(),
  base_servings: z.number().int().positive(),
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
   * Attribution. REQUIRED unless user_added or generated_by_claude.
   * If we can't name the source, the recipe does not ship.
   */
  source: Source.optional(),

  hero_url: z.string().optional(),
  hero_fallback: z.array(z.string()).length(3).optional(),
  emoji: z.string().optional(),

  ingredients: z.array(Ingredient).min(1),
  steps: z.array(Step).min(1),

  leftover_mode: LeftoverMode.optional(),

  /**
   * Confirms every ingredient is whole and unprocessed.
   * No preservatives, no stock cubes, no packaged seasoning mixes.
   * Required true for all authored recipes. Non-negotiable product position.
   * User-added recipes are exempt — the app shows a disclaimer instead.
   */
  whole_food_verified: z.boolean().optional(),

  /** True for recipes a user added in-app. Exempt from source requirement. */
  user_added: z.boolean().default(false),
  /** True for recipes generated by the pantry "invent a recipe" feature. */
  generated_by_claude: z.boolean().default(false),
}).refine(
  (r) => r.user_added || r.generated_by_claude || r.source !== undefined,
  { message: 'Recipe requires `source` unless user_added or generated_by_claude' },
).refine(
  (r) => r.user_added || r.generated_by_claude || r.whole_food_verified === true,
  { message: 'Authored recipe is missing `whole_food_verified: true` — check no preservatives are used' },
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
 * Validate a raw object as a Recipe without throwing.
 * Returns { success: true, data } or { success: false, error }.
 */
export function safeParseRecipe(raw: unknown) {
  return Recipe.safeParse(raw);
}
