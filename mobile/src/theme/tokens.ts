/**
 * Design tokens — Hone Dark palette.
 *
 * DECISION-012 · 2026-05-07. Direction: Dark.
 * Previous: Sage palette (DECISION-011, light surfaces #E8F0E6).
 *
 * CHANGE:
 *   Surfaces moved to very dark grey almost-black. Ink inverted to warm cream.
 *   Accent colours (rust, forest, ochre, sky) unchanged — all read well on dark.
 *
 * Surfaces:
 *   bg      #141414   — primary screen background (very dark grey)
 *   bgDeep  #0F0F0F   — section headers, pressed states, deeper recesses
 *   cream   #1E1E1E   — elevated card surfaces, input backgrounds
 *
 * Ink (inverted from Sage):
 *   ink     #F5EFE8   — warm cream — primary text  (~16:1 on #141414)
 *   inkSoft #C4B8A8   — softer cream — secondary text
 *   muted   #8A7E72   — warm taupe — captions, hints, placeholders
 *
 * Lines (white-alpha on dark):
 *   line     rgba(255,255,255,0.07)
 *   lineDark rgba(255,255,255,0.13)
 *
 * Cook mode (CLAUDE.md mandate: OLED true blacks) stays at #000000
 * — visually distinct from app bg #141414.
 *
 * Contrast notes (against bg #141414):
 *   ink     #F5EFE8   ~16:1   AAA body
 *   inkSoft #C4B8A8   ~8.5:1  AAA body
 *   muted   #8A7E72   ~4.2:1  AA large text + UI components
 *   primary #B84030   ~3.8:1  AA large text + UI components (rust on near-black)
 *   sage    #2E5E3E   ~2.9:1  use for icons/badges only, not body text
 */

export const tokens = {
  // Surfaces — dark
  bg:      '#141414',   // very dark grey — primary background
  bgDeep:  '#0F0F0F',   // deeper dark — section headers, pressed states
  cream:   '#1E1E1E',   // elevated dark — card surfaces, inputs

  // Ink — warm cream on dark
  ink:     '#F5EFE8',   // warm cream — primary text
  inkSoft: '#C4B8A8',   // softer cream — secondary text
  muted:   '#8A7E72',   // warm taupe — captions, hints, placeholders

  // Primary — rust (buttons, links, Kitchen eyebrow, active states, step numbers).
  // Buttons with `backgroundColor: primary` use `color: tokens.onPrimary` (#FAFAF7).
  // For inline text: `primaryInk` — same rust, reads on dark surfaces.
  primary:      '#B84030',
  primaryDeep:  '#8E2E20',                   // pressed states / borders
  primaryInk:   '#D05040',                   // slightly lightened rust for text on dark
  primaryLight: 'rgba(184,64,48,0.18)',      // tint for chips, selected states (raised opacity for dark bg)
  onPrimary:    '#FAFAF7',                   // text/icon on solid rust surfaces

  // Secondary — forest green (Pantry/Shop eyebrow, "See all" chip, "why" callouts,
  //   step completion, checked states).
  // Text on solid forest = tokens.onPrimary (#FAFAF7).
  sage:      '#3A7050',                      // slightly lightened for dark bg legibility
  sageDeep:  '#1E4E2E',
  sageLight: 'rgba(46,94,62,0.20)',          // raised opacity for dark bg

  // Tertiary — amber/ochre (mise en place zone, badges, highlights).
  ochre:     '#C07038',                      // slightly lightened for dark bg
  ochreDeep: '#A05C28',

  // Warm brown — recipe detail framing headers (Finishing & tasting band).
  warmBrown: '#B08060',                      // lightened for dark bg

  // Amber — mise en place zone background + border.
  amber:     '#1E1408',                      // dark amber tint (was warm cream #FEF4E2)
  amberLine: 'rgba(160,92,40,0.32)',         // raised opacity for dark bg

  // Sky — soft info/filter accent (filter chips, informational states).
  sky:      '#7AAABB',
  skyDeep:  '#5A8A9B',
  skyLight: 'rgba(122,170,187,0.20)',

  // Gold — Editorial accent (introduced 2026-05-10). Used by the Kitchen
  // wordmark period, search border, active category tile fill, recipe
  // cuisine tags, and 'Tonight'/'Planned' badges. Single source of truth
  // for the gold accent so any future tweak propagates everywhere at once.
  gold:    '#F2CC2A',
  goldDim: 'rgba(242,204,42,0.15)',
  // Soft antique bronze-gold — header accents (eyebrow, title italic). Deliberately
  // darker/desaturated vs the bright stepper gold so the two never compete.
  bronze:  '#C2A15A',
  // Bronze tinted at low alpha — honest-swap callout bg, swap-pill 'on' state (v7).
  bronzeSoft: 'rgba(194,161,90,0.10)',

  // Structural — white-alpha on dark surfaces
  line:     'rgba(255,255,255,0.07)',   // subtle dividers
  lineDark: 'rgba(255,255,255,0.13)',   // stronger borders

  // Cook-mode surfaces. CLAUDE.md mandate: dark, OLED true blacks.
  // True #000000 to be visually distinct from app bg #141414.
  // The recipe screen pulls from this group while `cooking` is true.
  cookMode: {
    screenBg: '#000000',   // true OLED black — visually distinct from app bg #141414
    cardBg:   '#0D0D0D',   // raised card surface
    bgDeep:   '#161616',   // callouts, leftover note
    ink:      '#F5EFE8',   // warm cream — primary text
    inkSoft:  '#C4B8A8',   // softer cream for body
    muted:    '#8A7E72',   // warm taupe for captions
    line:     'rgba(255,255,255,0.06)',
    lineDark: 'rgba(255,255,255,0.12)',
    // Accents — rust and forest read well on true black.
    primary:  '#B84030',   // rust — same as app primary
    sage:     '#2E5E3E',   // forest — same as app sage
    ochre:    '#A05C28',   // amber ochre
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
 * Fraunces (display) + Inter (body): editorial serif paired with
 * a geometric sans. v0.6 change: Source Sans 3 → Inter for body text.
 * Inter is more architectural and confident at UI sizes (12–15sp); it
 * also has tighter default letter-spacing which suits the deeper terracotta
 * palette — less delicate, more considered.
 *
 * Engineer note: swap @expo-google-fonts/playfair-display → @expo-google-fonts/fraunces (v7, build #127)
 * in package.json and update useFonts() in mobile/app/_layout.tsx.
 * Constant names are unchanged — no component rename pass required.
 */
export const fonts = {
  display:       'Fraunces_700Bold',
  displayItalic: 'Fraunces_500Medium_Italic',
  sans:          'Inter_400Regular',
  sansBold:      'Inter_600SemiBold',
  sansXBold:     'Inter_800ExtraBold',
  // Poppins — recipe-detail browse meta line (Issue #23). Loaded in _layout.tsx.
  poppins:       'Poppins_400Regular',
} as const;

export type TokenName = keyof typeof tokens;
