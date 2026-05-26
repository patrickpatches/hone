/**
 * OriginFlag — cuisine origin indicator for the recipe detail "at a glance" row.
 *
 * Two shapes, decided by cuisine:
 *  - COUNTRY cuisines → a small SVG flag (filled, multicolour — flags are
 *    inherently coloured; this is the one place colour comes from the asset,
 *    not a token). Rendered inside a rounded, clipped container.
 *  - REGIONAL cuisines → a neutral globe glyph + the countries named in text
 *    (never a single flag for a region — that also keeps the no-Israeli-
 *    labelling rule for the Levant).
 *
 * Build #124 (Recipe Detail v5 "The Pass"). SVG flags, never emoji.
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect, G, type SvgProps } from 'react-native-svg';
import { tokens } from '../theme/tokens';

export type FlagCode = 'US' | 'IT' | 'JP' | 'TH' | 'MX' | 'FR' | 'IN' | 'MY';

export type Origin =
  | { kind: 'country'; code: FlagCode; label: string }
  | { kind: 'region'; label: string; countries: string[] };

/**
 * Resolve `categories.cuisines[0]` to an origin descriptor.
 * Country cuisines get a flag; regional cuisines get the globe + named countries.
 * Unknown/missing falls back to a globe with the capitalised cuisine name.
 */
export function originForCuisine(cuisine: string | undefined): Origin {
  const c = (cuisine ?? '').toLowerCase();
  const COUNTRY: Record<string, { code: FlagCode; label: string }> = {
    american:  { code: 'US', label: 'American' },
    italian:   { code: 'IT', label: 'Italian' },
    japanese:  { code: 'JP', label: 'Japanese' },
    thai:      { code: 'TH', label: 'Thai' },
    mexican:   { code: 'MX', label: 'Mexican' },
    french:    { code: 'FR', label: 'French' },
    indian:    { code: 'IN', label: 'Indian' },
    malaysian: { code: 'MY', label: 'Malaysian' },
  };
  if (COUNTRY[c]) return { kind: 'country', ...COUNTRY[c] };

  if (c === 'levantine') {
    return { kind: 'region', label: 'Levantine', countries: ['Lebanon', 'Syria', 'Jordan', 'Palestine'] };
  }
  if (c === 'australian') {
    return { kind: 'region', label: 'Modern Australian', countries: ['Australia'] };
  }
  const label = c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Origin';
  return { kind: 'region', label, countries: [] };
}

/** A small SVG flag, clipped to a rounded rect. width:height ~ 3:2. */
export function Flag({ code, width = 22 }: { code: FlagCode; width?: number }) {
  const h = Math.round((width / 3) * 2);
  return (
    <View
      style={{
        width,
        height: h,
        borderRadius: 3,
        overflow: 'hidden',
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.25)',
      }}
    >
      <Svg width={width} height={h} viewBox="0 0 24 16">
        {FLAGS[code]}
      </Svg>
    </View>
  );
}

/** Neutral globe glyph for regional cuisines — stroke-tinted like the icon set. */
export function GlobeGlyph({ size = 18, color = tokens.inkSoft }: { size?: number; color?: string } & Omit<SvgProps, 'children'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="9" />
      <Path d="M3 12h18" />
      <Path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z" />
    </Svg>
  );
}

// prettier-ignore
const FLAGS: Record<FlagCode, React.ReactNode> = {
  // Italy — green / white / red vertical tricolour
  IT: <><Rect x="0" y="0" width="8" height="16" fill="#009246" /><Rect x="8" y="0" width="8" height="16" fill="#FFFFFF" /><Rect x="16" y="0" width="8" height="16" fill="#CE2B37" /></>,
  // France — blue / white / red vertical tricolour
  FR: <><Rect x="0" y="0" width="8" height="16" fill="#0055A4" /><Rect x="8" y="0" width="8" height="16" fill="#FFFFFF" /><Rect x="16" y="0" width="8" height="16" fill="#EF4135" /></>,
  // Mexico — green / white / red vertical + small central emblem dot (simplified)
  MX: <><Rect x="0" y="0" width="8" height="16" fill="#006847" /><Rect x="8" y="0" width="8" height="16" fill="#FFFFFF" /><Rect x="16" y="0" width="8" height="16" fill="#CE1126" /><Circle cx="12" cy="8" r="1.7" fill="none" stroke="#7B4B2A" strokeWidth="0.9" /></>,
  // Japan — white field + central red disc
  JP: <><Rect x="0" y="0" width="24" height="16" fill="#FFFFFF" /><Circle cx="12" cy="8" r="4.2" fill="#BC002D" /></>,
  // Thailand — red / white / blue(double) / white / red horizontal bands
  TH: <><Rect x="0" y="0" width="24" height="16" fill="#A51931" /><Rect x="0" y="2.7" width="24" height="10.6" fill="#F4F5F8" /><Rect x="0" y="5.3" width="24" height="5.4" fill="#2D2A4A" /></>,
  // India — saffron / white / green horizontal + navy chakra ring
  IN: <><Rect x="0" y="0" width="24" height="5.33" fill="#FF9933" /><Rect x="0" y="5.33" width="24" height="5.34" fill="#FFFFFF" /><Rect x="0" y="10.67" width="24" height="5.33" fill="#138808" /><Circle cx="12" cy="8" r="2.1" fill="none" stroke="#000080" strokeWidth="0.7" /></>,
  // United States — simplified: blue canton + 6 alternating stripes + 3 white star dots
  US: <><Rect x="0" y="0" width="24" height="16" fill="#B22234" /><Rect x="0" y="2.29" width="24" height="2.29" fill="#FFFFFF" /><Rect x="0" y="6.86" width="24" height="2.29" fill="#FFFFFF" /><Rect x="0" y="11.43" width="24" height="2.29" fill="#FFFFFF" /><Rect x="0" y="0" width="10" height="8.6" fill="#3C3B6E" /><Circle cx="2.6" cy="2.3" r="0.7" fill="#FFFFFF" /><Circle cx="5.6" cy="2.3" r="0.7" fill="#FFFFFF" /><Circle cx="8.0" cy="2.3" r="0.7" fill="#FFFFFF" /><Circle cx="4.1" cy="4.6" r="0.7" fill="#FFFFFF" /><Circle cx="7.0" cy="4.6" r="0.7" fill="#FFFFFF" /><Circle cx="2.6" cy="6.5" r="0.7" fill="#FFFFFF" /><Circle cx="5.6" cy="6.5" r="0.7" fill="#FFFFFF" /><Circle cx="8.0" cy="6.5" r="0.7" fill="#FFFFFF" /></>,
  // Malaysia — simplified: blue canton + yellow crescent + star, red/white stripes
  MY: <><Rect x="0" y="0" width="24" height="16" fill="#CC0001" /><Rect x="0" y="2.29" width="24" height="2.29" fill="#FFFFFF" /><Rect x="0" y="6.86" width="24" height="2.29" fill="#FFFFFF" /><Rect x="0" y="11.43" width="24" height="2.29" fill="#FFFFFF" /><Rect x="0" y="0" width="11" height="9.14" fill="#010066" /><G><Circle cx="4.8" cy="4.6" r="2.6" fill="#FFCC00" /><Circle cx="5.9" cy="4.6" r="2.2" fill="#010066" /><Path d="M8.2 3.0l.5 1.2 1.3.1-1 .9.3 1.3-1.1-.7-1.1.7.3-1.3-1-.9 1.3-.1z" fill="#FFCC00" /></G></>,
};
