/**
 * Design tokens — matches hone.html's T object exactly.
 * Parchment/cream background, paprika primary, ink text.
 */

export const tokens = {
  // ── Backgrounds ──────────────────────────────────────────────────────────────
  bg:       '#F7F2EA',   // parchment — main screen background
  bgDeep:   '#EDE5D8',   // deeper parchment for pressed states
  cream:    '#FDF9F3',   // cream — sheet/modal backgrounds
  cardBg:   '#FDFAF6',   // card surface

  // ── Text ─────────────────────────────────────────────────────────────────────
  ink:      '#1C1712',   // primary text
  inkSoft:  '#4A3F35',   // secondary text (inkLight in HTML)
  muted:    '#8C7B6E',   // muted/faint text (inkFaint in HTML)

  // ── Primary accent — paprika ─────────────────────────────────────────────────
  paprika:      '#C4422A',
  paprikaDeep:  '#A83420',
  paprikaLight: 'rgba(196,66,42,0.15)',

  // ── Secondary accents ────────────────────────────────────────────────────────
  ochre:     '#D4900A',
  ochreDeep: '#B07808',
  sage:      '#5A7A5A',
  sageDeep:  '#3D5C3D',

  // ── Borders ──────────────────────────────────────────────────────────────────
  line:     '#E8DDD0',
  lineDark: '#C8B8A8',
} as const;

export const fonts = {
  display:      'Fraunces_700Bold',
  displayBold:  'Fraunces_900Black',
  displayItalic:'Fraunces_400Regular_Italic',
  sans:         'Manrope_400Regular',
  sansMedium:   'Manrope_500Medium',
  sansSemiBold: 'Manrope_600SemiBold',
  sansBold:     'Manrope_700Bold',
  sansExtraBold:'Manrope_800ExtraBold',
} as const;
