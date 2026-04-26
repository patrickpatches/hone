/**
 * Design tokens — Hone v2 retro-pastel palette.
 *
 * Philosophy:
 *   - Light, airy backgrounds (very pale warm cream, not heavy brown)
 *   - A full set of named pastels so different UI elements can carry
 *     different colours — not just paprika red for everything.
 *   - Each pastel has a "light" variant (pill background) and a
 *     "solid" variant (filled pill with white text).
 *   - Ink stays warm-dark for legibility. Nothing purely neutral grey.
 *
 * If a colour is missing add it here FIRST, then mirror it in
 * tailwind.config.js. Never invent shades ad hoc in components.
 */
export const tokens = {
  // ── Surfaces ──────────────────────────────────────────────────────────────
  bg:     '#FDFAF3',   // Primary background — very light warm cream
  bgDeep: '#F5EFE3',   // Deeper cream for nested/secondary surfaces
  cream:  '#FFFFFF',   // Card surfaces — clean white

  // ── Ink — warm dark, never cold grey ──────────────────────────────────────
  ink:     '#1A1612',
  inkSoft: '#3D342C',
  muted:   '#9B8B7A',

  // ── Primary CTA — terracotta peach (lighter / warmer than old paprika) ────
  paprika:     '#C44536',  // Legacy alias — prefer `peach` for new code
  paprikaDeep: '#9B2F24',  // Legacy deep alias
  peach:       '#E07A52',  // Primary action: "Start cooking", main CTAs
  peachDeep:   '#BE5C38',
  peachLight:  '#FDEADA',  // Pill background for peach chips

  // ── Sage — success, "can make", confirmations ────────────────────────────
  sage:      '#4E8A65',
  sageDeep:  '#376349',
  sageLight: '#E0F0E8',

  // ── Sky — info, calendar, add-to-plan ────────────────────────────────────
  sky:      '#4E85B5',
  skyDeep:  '#366090',
  skyLight: '#DCF0F8',

  // ── Rose — favourites, love ───────────────────────────────────────────────
  rose:      '#C4646A',
  roseDeep:  '#A04850',
  roseLight: '#FDDFDD',

  // ── Butter — weekend, highlights, warnings ───────────────────────────────
  butter:      '#C8900A',
  butterDeep:  '#A07008',
  butterLight: '#FEF2D0',

  // ── Lavender — pantry, tags, "yours" ─────────────────────────────────────
  lavender:      '#7860B0',
  lavenderDeep:  '#5A4490',
  lavenderLight: '#EDE8F8',

  // ── Mint — alternative accent ─────────────────────────────────────────────
  mint:      '#3A9478',
  mintDeep:  '#287258',
  mintLight: '#DCF2EA',

  // ── Ochre — in-plan indicators, leftover notes ───────────────────────────
  ochre:     '#C89060',
  warn:      '#B8860B',

  // ── Structural ────────────────────────────────────────────────────────────
  line: '#EAE4D8',
} as const;

/**
 * Font family tokens — matches @expo-google-fonts package names verbatim.
 */
export const fonts = {
  display:      'Fraunces_700Bold',
  displayItalic:'Fraunces_600SemiBold_Italic',
  sans:         'Manrope_500Medium',
  sansBold:     'Manrope_700Bold',
  sansXBold:    'Manrope_800ExtraBold',
} as const;

export type TokenName = keyof typeof tokens;
