/**
 * Design tokens — Hone v0.4 palette.
 *
 * Warm cream / linen background, terracotta primary, olive secondary,
 * gold tertiary. Restyle done as a single source of truth so every
 * screen flows through this file. Never hardcode colours in components.
 *
 * Contrast (against bg #FAF7F2):
 *   ink       #1A130E  ~16:1   AAA
 *   inkSoft   #5C4A3D  ~7.7:1  AAA
 *   muted     #7A6B62  ~4.7:1  AA
 *   primary   #C4562A  ~4.6:1  AA on bg, used sparingly for body copy
 *
 * The `sage` and `ochre` token names are kept (already wired through
 * every component); their values are retuned to the new olive-green
 * and warm-gold accents so the palette change is a value swap, not a
 * codebase-wide rename.
 */

export const tokens = {
  // Surfaces
  bg:      '#FAF7F2',   // warm cream / linen — primary background
  bgDeep:  '#F0EAE0',   // section headers, pressed states (slightly deeper than bg)
  cream:   '#FFFFFF',   // card surfaces, inputs (legacy name kept for compat)
  cardBg:  '#FFFFFF',

  // Ink — text and structural
  ink:     '#1A130E',   // deep espresso — primary text
  inkSoft: '#5C4A3D',   // warm brown — secondary text
  muted:   '#7A6B62',   // warm taupe — captions, hints, placeholders

  // Primary — terracotta (buttons, links, active states)
  primary:      '#C4562A',
  primaryDeep:  '#A3441F',                    // pressed states
  primaryLight: 'rgba(196,86,42,0.12)',       // tints

  // Secondary — olive green (success, checked states).
  // Kept under the `sage` name so existing components don't need refactoring.
  sage:      '#5C7A53',
  sageDeep:  '#465E40',
  sageLight: 'rgba(92,122,83,0.12)',

  // Tertiary — warm gold (badges, highlights). Kept under `ochre`.
  ochre:     '#D4A96A',
  ochreDeep: '#B8893F',

  // Warm brown — category headers, labels (new in v0.4)
  warmBrown: '#85614D',

  // Structural
  line:     '#E5DDD4',   // dividers, light borders
  lineDark: '#D4C9BB',   // stronger borders on white cards
} as const;

/**
 * Shadow tokens — single source of truth for elevation.
 *
 * `card` is the default shadow for any raised surface (recipe cards, pantry
 * zone, shop sections). One look across the app, no per-component tuning.
 * `cardLifted` is for actively-dragged or pressed-up surfaces.
 * `toast` is for floating overlays (undo banner, etc.).
 */
export const shadows = {
  card: {
    shadowColor: '#1F1814',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLifted: {
    shadowColor: '#1F1814',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  toast: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;

/**
 * Font family tokens.
 * Must match exactly what _layout.tsx loads via useFonts.
 *
 * Playfair Display (display) + Source Sans 3 (body): editorial serif paired
 * with a humanist sans optimised for UI. Playfair has more contrast and
 * personality than Lora, suiting the restyled palette; Source Sans 3 reads
 * cleanly at 11–14sp where Inter felt slightly tight.
 */
export const fonts = {
  display:       'PlayfairDisplay_700Bold',
  displayItalic: 'PlayfairDisplay_500Medium_Italic',
  sans:          'SourceSans3_400Regular',
  sansBold:      'SourceSans3_700Bold',
  sansXBold:     'SourceSans3_800ExtraBold',
} as const;

export type TokenName = keyof typeof tokens;
