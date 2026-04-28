/**
 * Recipe data types + runtime validation.
 *
 * The schema below is the single source of truth for what a recipe IS —
 * both for authored markdown recipes (parsed at build time) and for
 * user-added recipes (created at runtime). zod validates both paths so
 * bad data is rejected before it reaches the UI.
 *
 * Schema decisions mapped to CLAUDE.md Golden Rules:
 *   Rule #2 (credit the chefs)     -> `source` is REQUIRED for chef-inspired recipes.
 *   Rule #3 (smart scaling)        -> each ingredient has `scales: 'linear'|'fixed'|'custom'`.
 *   Rule #5 (stage photos)         -> each step has optional `photo_url` — the app
 *                                     renders a "photo missing" warning if absent,
 *                                     so we cannot silently ship a recipe without them.
 *   Rule #6 (honesty)              -> `why_note` field captures the underlying
 *                                     mechanism so the user can reason about
 *                                     substitutions, not just follow.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------------

/**
 * How an ingredient scales when the user changes servings.
 *
 *   linear — standard multiplier (mince, pasta, stock)
 *   fixed  — caps out at a ceiling (a pinch of salt per person, bay leaves)
 *   custom — follows a lookup table (rice-to-water ratios are non-linear
 *            because surface evaporation scales with pot radius, not volume)
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
   * When scales === 'custom', a lookup table keyed by servings.
   * E.g. rice: { '1': 0.5, '2': 0.9, '4': 1.6, '8': 3.0 }.
   * The scaler interpolates between keys.
   */
  curve: z.record(z.number()).optional(),
  /** Optional short note — "fine dice", "room temp", etc. */
  prep: z.string().optional(),
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
   * This is the SIGNAL. The timer below is a safety net.
   */
  stage_note: z.string().optional(),
  /** Tip for what's coming next so the user can prep in parallel. */
  lookahead: z.string().optional(),
  /** Fallback timer in seconds. Optional — never the primary signal. */
  timer_seconds: z.number().int().positive().optional(),
  /** Real hand-shot photo of the food AT THIS STAGE (not glamour shot). */
  photo_url: z.string().optional(),
  /** The underlying mechanism — so users can reason about substitutions. */
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
  /** Brief note explaining how this recipe relates to the original. */
  notes: z.string().optional(),
});
export type Source = z.infer<typeof Source>;

// ---------------------------------------------------------------------------
// Leftover mode — recipe-level scaling hint
// ---------------------------------------------------------------------------

export const LeftoverMode = z.object({
  /** Servings beyond the main meal that this recipe is optimised for. */
  extra_servings: z.number().int().positive(),
  /** Short human description — "packs for two lunches tomorrow". */
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
  /**
   * Short editorial note. This is where "in the style of" framing lives,
   * or the author's single most important POV. NOT food-blog prose.
   */
  description: z.string().optional(),
  base_servings: z.number().int().positive(),
  time_min: z.number().int().positive(),
  difficulty: DifficultyLevel,
  tags: z.array(z.string()),

  /**
   * Attribution. REQUIRED unless `user_added` is true.
   * If this is a chef-inspired recipe and we can't name the source,
   * the recipe does not ship.
   */
  source: Source.optional(),

  hero_url: z.string().optional(),
  hero_fallback: z.array(z.string()).length(3).optional(),
  emoji: z.string().optional(),

  ingredients: z.array(Ingredient).min(1),
  steps: z.array(Step).min(1),

  leftover_mode: LeftoverMode.optional(),

  /** True for recipes a user added in-app. Exempt from source requirement. */
  user_added: z.boolean().default(false),
  /** True for recipes generated by the pantry "invent a recipe" feature. */
  generated_by_claude: z.boolean().default(false),
}).refine(
  (r) => r.user_added || r.generated_by_claude || r.source !== undefined,
  { message: 'Recipe requires `source` unless user_added or generated_by_claude' },
);
export type Recipe = z.infer<typeof Recipe>;
