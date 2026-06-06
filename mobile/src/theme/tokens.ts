/**
 * Design tokens — Tucker & Spice.
 *
 * Two named themes (v2):
 *   darkTokens  ("Dark")  — dark warm "cookbook on near-black paper" (original brand).
 *   lightTokens ("Light") — neon green canvas, hot-pink CTAs, magenta editorial accent.
 *
 * The exported `tokens` object is MUTABLE — setActiveTheme() swaps values in
 * place so static importers see the new theme on next render after a remount.
 *
 * Themes are toggled from ThemeContext (src/theme/ThemeContext.tsx) which
 * forces a Stack remount via key={theme} in _layout.tsx.
 */

// ─── Dark (warm near-black) ─────────────────────────────────────────────────
export const darkTokens = {
  bg:      '#141414',
  bgDeep:  '#0F0F0F',
  cream:   '#1E1E1E',
  dockBg:  '#1E1E1E',

  ink:     '#F5EFE8',
  inkSoft: '#C4B8A8',
  muted:   '#8A7E72',

  // Gold — action accent. Bright yellow fill, so text ON the button must be
  // dark (onPrimary) for contrast. primaryInk stays bright gold — it's used as
  // text ON the dark bg, where gold reads ~10:1.
  primary:      '#F2CC2A',
  primaryDeep:  '#D4A91A',
  primaryInk:   '#F5D64A',
  primaryLight: 'rgba(242,204,42,0.18)',
  onPrimary:    '#1A1206',

  sage:      '#3A7050',
  sageDeep:  '#1E4E2E',
  sageLight: 'rgba(46,94,62,0.20)',

  ochre:     '#C07038',
  ochreDeep: '#A05C28',

  warmBrown: '#B08060',

  amber:     '#1E1408',
  amberLine: 'rgba(160,92,40,0.32)',

  sky:      '#7AAABB',
  skyDeep:  '#5A8A9B',
  skyLight: 'rgba(122,170,187,0.20)',

  // Gold — editorial accent (wordmark period, search border, cuisine tags).
  gold:       '#F2CC2A',
  goldDim:    'rgba(242,204,42,0.15)',
  bronze:     '#C2A15A',
  bronzeSoft: 'rgba(194,161,90,0.10)',

  // Recipe hero title colour. Warm gold on dark (Issue #23 §2).
  recipeTitle: 'rgb(255,202,89)',

  line:     'rgba(255,255,255,0.07)',
  lineDark: 'rgba(255,255,255,0.13)',

  // Inactive tab colour — cream at 55% on dark dock.
  tabInactive: 'rgba(245,239,232,0.55)',

  cookMode: {
    screenBg: '#000000',
    cardBg:   '#0D0D0D',
    bgDeep:   '#161616',
    ink:      '#F5EFE8',
    inkSoft:  '#C4B8A8',
    muted:    '#8A7E72',
    line:     'rgba(255,255,255,0.06)',
    lineDark: 'rgba(255,255,255,0.12)',
    primary:  '#B84030',
    sage:     '#2E5E3E',
    ochre:    '#A05C28',
  },
};

// ─── Light (bright green canvas) ───────────────────────────────────────────
export const lightTokens = {
  bg:      '#00FF9A',
  bgDeep:  '#00D482',
  cream:   '#E8FFF5',   // mint-tinted cards — part of the green world, not cold white
  dockBg:  '#0D1B2A',   // dark navy dock floats on neon green

  // Ink inverted — dark navy on light surfaces.
  ink:     '#0D1B2A',
  inkSoft: '#1E3A4A',
  muted:   '#4A7A8A',

  // Hot pink — action accent.
  primary:      '#FF2E88',
  primaryDeep:  '#CC1A6A',
  primaryInk:   '#CC0060',
  primaryLight: 'rgba(255,46,136,0.12)',
  onPrimary:    '#F6F7FF',

  sage:      '#3A7050',
  sageDeep:  '#1E4E2E',
  sageLight: 'rgba(46,94,62,0.20)',

  ochre:     '#C07038',
  ochreDeep: '#A05C28',

  warmBrown: '#0D1B2A',

  amber:     '#D4FFF0',
  amberLine: 'rgba(13,27,42,0.10)',

  sky:      '#7AAABB',
  skyDeep:  '#5A8A9B',
  skyLight: 'rgba(122,170,187,0.20)',

  // Hot pink — editorial accent (cuisine tags, search border, wordmark period).
  // Unified with primary — one accent, not two competing colours.
  gold:       '#FF2E88',
  goldDim:    'rgba(255,46,136,0.12)',
  bronze:     '#FF2E88',
  bronzeSoft: 'rgba(255,46,136,0.10)',

  // Recipe hero title — magenta in Neon (replaces the orphan gold).
  recipeTitle: '#FF2E88',

  // Lines — dark-alpha on light surfaces (inverted from stealth).
  line:     'rgba(13,27,42,0.08)',
  lineDark: 'rgba(13,27,42,0.16)',

  // Inactive tab — near-white at 50% on dark navy dock.
  tabInactive: 'rgba(246,247,255,0.50)',

  cookMode: {
    screenBg: '#000000',
    cardBg:   '#0D0D0D',
    bgDeep:   '#161616',
    ink:      '#F5EFE8',
    inkSoft:  '#C4B8A8',
    muted:    '#8A7E72',
    line:     'rgba(255,255,255,0.06)',
    lineDark: 'rgba(255,255,255,0.12)',
    primary:  '#00FF9A',   // neon green on OLED black
    sage:     '#2E5E3E',
    ochre:    '#A05C28',
  },
};

export type ActiveTheme = 'light' | 'dark';

/**
 * Mutable active token object. Components import this statically; setActiveTheme
 * mutates it in place so a forced remount picks up the new values automatically.
 * Default = dark (the original brand).
 */
export const tokens: typeof darkTokens = {
  ...darkTokens,
  cookMode: { ...darkTokens.cookMode },
};

export function setActiveTheme(name: ActiveTheme): void {
  const src = name === 'dark' ? darkTokens : lightTokens;
  Object.assign(tokens, src);
  Object.assign(tokens.cookMode, src.cookMode);
}

// ─── Shadows ──────────────────────────────────────────────────────────────
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

// ─── Fonts ────────────────────────────────────────────────────────────────
export const fonts = {
  display:       'Fraunces_700Bold',
  displayItalic: 'Fraunces_500Medium_Italic',
  sans:          'Inter_400Regular',
  sansBold:      'Inter_600SemiBold',
  sansXBold:     'Inter_800ExtraBold',
  poppins:       'Poppins_400Regular',
} as const;

export type TokenName = keyof typeof tokens;
