/**
 * Design tokens — Tucker & Spice.
 *
 * Two named themes (v2):
 *   darkTokens  ("Dark")  — dark warm "cookbook on near-black paper" (original brand).
 *   lightTokens ("Light") — retro synthwave: deep violet canvas, hot-magenta neons, warm pink glow.
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

// ─── Light (Retro Synthwave) ────────────────────────────────────────────────
// Reference: SF Golden Gate synthwave image.
//
// CORRECT colour distribution (the image):
//   ~60% bright hot magenta  → bg (the SKY — dominant colour)
//   ~30% near-black purple   → cream/cards (SILHOUETTES sitting on the sky)
//   ~10% salmon-pink         → accent/glow (sun, neon text highlights)
//
// Wrong approach (previous): dark canvas + magenta accents = too purple.
// Right approach: MAGENTA IS THE CANVAS. Dark cards are the silhouettes.
export const lightTokens = {
  // THE SKY — delivered as a LinearGradient in _layout.tsx AppShell.
  // bg is 'transparent' so every screen container passes through to the gradient.
  // The gradient colours live in SYNTHWAVE_GRADIENT in _layout.tsx:
  //   #D0006A (top) → #9A0055 → #3D0860 → #1A0530 (bottom).
  bg:     'transparent',
  bgDeep: '#1A0530',   // bottom of the gradient — used for scrims / pressed states

  // The SILHOUETTES. Cards sit on the gradient sky like the bridge & trees.
  cream:  '#1E0535',   // near-black warm purple — recipe rows, settings cards
  dockBg: '#120228',   // darkest — dock anchors hard at the bottom

  // Warm pink-white text. Works on both: magenta sky (~6.5:1) AND dark cards (~15:1).
  ink:     '#FFCCE4',
  inkSoft: 'rgba(255,204,228,0.70)',
  muted:   'rgba(255,204,228,0.45)',

  // PRIMARY: salmon-pink (swatch 1). On dark cards it glows bright.
  // Lighter than the magenta sky — so CTAs contrast clearly against both surfaces.
  primary:      '#FF7BAC',
  primaryDeep:  '#E0508A',
  primaryInk:   '#FFB0CE',
  primaryLight: 'rgba(255,123,172,0.22)',
  onPrimary:    '#1A0530',   // dark silhouette text on the salmon button

  sage:      '#E050A0',
  sageDeep:  '#B03070',
  sageLight: 'rgba(224,80,160,0.18)',

  ochre:     '#FF7050',
  ochreDeep: '#E05030',

  warmBrown: '#FFB0CE',

  amber:     '#2A0848',    // dark purple for info surfaces
  amberLine: 'rgba(255,123,172,0.20)',

  sky:      '#FF9EC5',     // softer salmon-pink for sky-tinted tones
  skyDeep:  '#FF7BAC',
  skyLight: 'rgba(255,158,197,0.20)',

  // Editorial accent: salmon-pink (swatch 1) — wordmark dot, tags, search ring.
  gold:       '#FF7BAC',
  goldDim:    'rgba(255,123,172,0.18)',
  bronze:     '#FF9EC5',
  bronzeSoft: 'rgba(255,158,197,0.14)',

  // Recipe hero title: warm pink-white glow on the dark silhouette card.
  recipeTitle: '#FFCCE4',

  // Lines on dark cards: faint salmon edge-lighting.
  line:     'rgba(255,123,172,0.18)',
  lineDark: 'rgba(255,123,172,0.32)',

  // Inactive tabs on near-black dock.
  tabInactive: 'rgba(255,172,218,0.40)',

  cookMode: {
    screenBg: '#000000',
    cardBg:   '#0D0018',
    bgDeep:   '#1A0030',
    ink:      '#FFCCE4',
    inkSoft:  'rgba(255,204,228,0.65)',
    muted:    'rgba(255,204,228,0.38)',
    line:     'rgba(255,123,172,0.10)',
    lineDark: 'rgba(255,123,172,0.22)',
    primary:  '#FF7BAC',   // salmon-pink on OLED black
    sage:     '#E050A0',
    ochre:    '#FF7050',
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
