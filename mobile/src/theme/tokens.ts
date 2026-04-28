/**
 * Design tokens — Hone v0.5 pastel palette.
 *
 * Sun-faded "Scandi-linen" pastels: chalk-linen background, dusty-rose
 * primary, fern-mist secondary, butter tertiary, taupe-rose labels, sky
 * for info accents. Strong dark ink kept as-is — pastel surfaces need a
 * confident text colour to read at small sizes (this is the most common
 * pastel-redesign mistake; we deliberately don't lift the ink).
 *
 * The token NAMES (`sage`, `ochre`, etc.) are kept from v0.4 so existing
 * components don't need a rename pass; only the values move.
 *
 * Contrast notes (against bg #F7F2EE):
 *   ink       #1A130E   ~16:1   AAA body
 *   inkSoft   #5A4D44   ~7.5:1  AAA body
 *   muted     #7A6B62   ~4.7:1  AA body
 *   warmBrown #85614D   ~5.0:1  AA body (labels)
 *   primary   #D88A7B   ~2.5:1  used as a SURFACE; text on top must be
 *                                tokens.ink (6.9:1 AAA), not white.
 *
 * On-pastel text rule: any solid pastel surface (`primary`, `sage`,
 * `ochre`) takes `tokens.ink` for text/icons, NOT '#FFF'. Dark surfaces
 * (`tokens.ink`, dark scrims) keep '#FFF'.
 *
 * Cook mode (CLAUDE.md mandate: dark, OLED-friendly true blacks) gets
 * its own surface set under `tokens.cookMode`. The recipe screen swaps
 * surfaces to that group while `cooking` is true.
 */

export const tokens = {
  // Surfaces
  bg:      '#F7F2EE',   // chalk-linen — primary background
  bgDeep:  '#EDE6DD',   // section headers, pressed states
  cream:   '#FFFFFF',   // card surfaces, inputs (legacy name kept for compat)
  cardBg:  '#FFFFFF',

  // Ink — text and structural (kept dark on purpose)
  ink:     '#1A130E',   // deep espresso — primary text
  inkSoft: '#5A4D44',   // warm brown — secondary text (slightly cooler)
  muted:   '#7A6B62',   // warm taupe — captions, hints, placeholders

  // Primary — dusty rose (buttons, links, active states).
  // Buttons with `backgroundColor: primary` MUST use `color: tokens.ink`.
  primary:      '#D88A7B',
  primaryDeep:  '#B86A5A',                    // pressed states / borders for separation
  primaryLight: 'rgba(216,138,123,0.18)',     // tints for chips

  // Secondary — fern-mist (success, checked states).
  // Same on-pastel rule: text on solid sage = tokens.ink.
  sage:      '#9DB89C',
  sageDeep:  '#7A9779',
  sageLight: 'rgba(157,184,156,0.22)',

  // Tertiary — butter (badges, highlights).
  ochre:     '#E8C97A',
  ochreDeep: '#C9A858',

  // Warm brown — category headers, labels. Kept dark for AA on cream.
  warmBrown: '#85614D',

  // Sky — soft info/filter accent (new in v0.5).
  // Use as a tint background; for text on solid sky use tokens.ink.
  sky:      '#B8CFD9',
  skyDeep:  '#7A9CAB',
  skyLight: 'rgba(184,207,217,0.28)',

  // Structural
  line:     '#E8DFD4',   // dividers, light borders
  lineDark: '#D4C9BB',   // stronger borders on white cards

  // Cook-mode surfaces. CLAUDE.md mandate: dark, OLED true blacks.
  // The recipe screen pulls from this group while `cooking` is true.
  cookMode: {
    screenBg: '#0B0807',   // near-black OLED-friendly screen background
    cardBg:   '#16100C',   // raised card surface (espresso)
    bgDeep:   '#22180F',   // callouts, leftover note
    ink:      '#F5EFE8',   // warm cream — primary text on dark
    inkSoft:  '#D4C5B4',   // softer cream for body
    muted:    '#9C8E80',   // dimmed warm taupe for captions
    line:     'rgba(255,255,255,0.06)',
    lineDark: 'rgba(255,255,255,0.12)',
    // Accents stay readable on dark by lifting their values.
    primary:  '#E8A091',   // dusty rose lifted for dark bg
    sage:     '#B8D2B7',   // fern lifted
    ochre:    '#F2D896',   // butter lifted
  },
} as const;

/**
 * Shadow tokens — single source of truth for elevation.
 *
 * `card` is the default shadow for any raised surface (recipe cards, pantry
 * zone, shop sections). One look across the app, no per-component tuning.
 * `cardLifted` is for actively-pressed-up surfaces.
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
