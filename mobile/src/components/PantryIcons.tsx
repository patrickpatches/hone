/**
 * PantryIcons — neutral line-icons for the pantry "what you have" list.
 *
 * Lucide/Tabler-style, ~1.7px stroke, round caps/joins, viewBox 0 0 24 24 —
 * same visual family as Icon.tsx so the app reads as one icon system. These are
 * STROKE-based (no fill) so they tint to a single colour; the pantry list tints
 * them to tokens.inkSoft (neutral cream) — icons are wayfinding, not status,
 * per the Designer's calm-palette brief.
 *
 * Build #122 Pass 1: the 7 category icons + categoryIconName() resolver.
 * Build #122 Pass 2 extends this file with per-ingredient icons + an
 * ingredientIconName() resolver, falling back to the category icon.
 */
import React from 'react';
import Svg, { Circle, Line, Path, Rect, type SvgProps } from 'react-native-svg';
import { tokens } from '../theme/tokens';
import type { PantryCategory } from '../data/pantry-helpers';

export type FoodIconName =
  | 'cat-produce'
  | 'cat-protein'
  | 'cat-dairy'
  | 'cat-pantry'
  | 'cat-spice'
  | 'cat-sauce'
  | 'cat-frozen';

type Props = {
  name: FoodIconName;
  size?: number;
  color?: string;
} & Omit<SvgProps, 'children'>;

export function FoodIcon({
  name,
  size = 18,
  color = tokens.inkSoft,
  ...rest
}: Props) {
  const p = FOOD_PATHS[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {p}
    </Svg>
  );
}

/** Map a PantryCategory to its header/fallback icon. */
export function categoryIconName(category: PantryCategory): FoodIconName {
  switch (category) {
    case 'Produce':              return 'cat-produce';
    case 'Proteins':             return 'cat-protein';
    case 'Dairy & Eggs':         return 'cat-dairy';
    case 'Pantry Staples':       return 'cat-pantry';
    case 'Spices & Seasonings':  return 'cat-spice';
    case 'Condiments & Sauces':  return 'cat-sauce';
    case 'Frozen':               return 'cat-frozen';
    default:                     return 'cat-pantry';
  }
}

// prettier-ignore
const FOOD_PATHS: Record<FoodIconName, React.ReactNode> = {
  // Produce — leaf (Lucide "leaf")
  'cat-produce': <><Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><Path d="M2 21c0-3 1.85-5.36 5.08-6" /></>,
  // Proteins / Meat & Seafood — drumstick (Lucide "drumstick")
  'cat-protein': <><Path d="M15.45 15.4c-2.13.65-4.3.32-5.7-1.1-2.29-2.27-1.76-6.5 1.17-9.42 2.93-2.93 7.15-3.46 9.42-1.17 1.42 1.41 1.74 3.57 1.1 5.71-1.4-.51-3.26-.02-4.64 1.36-1.38 1.38-1.87 3.23-1.35 4.62z" /><Path d="m11.25 15.6-2.16 2.16a2.5 2.5 0 1 1-4.56 1.73 2.49 2.49 0 0 1-1.41-4.24 2.5 2.5 0 0 1 3.14-.32l2.16-2.16" /></>,
  // Dairy & Eggs — egg (Lucide "egg")
  'cat-dairy': <Path d="M12 22c-3.3 0-6-2.69-6-6 0-4 3-12 6-12s6 8 6 12c0 3.31-2.7 6-6 6Z" />,
  // Pantry Staples — canister/jar
  'cat-pantry': <><Rect x="6" y="8" width="12" height="13" rx="2" /><Path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><Path d="M9.5 13h5" /></>,
  // Spices & Seasonings — sprout (Lucide "sprout")
  'cat-spice': <><Path d="M7 20h10" /><Path d="M10 20c5.5-2.5.8-6.4 3-10" /><Path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" /><Path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" /></>,
  // Condiments & Sauces — bottle
  'cat-sauce': <><Path d="M10 2h4v3l1.4 2.4A4 4 0 0 1 16 9.5V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9.5a4 4 0 0 1 .6-2.1L10 5z" /><Line x1="8" y1="12" x2="16" y2="12" /></>,
  // Frozen — snowflake (Lucide "snowflake")
  'cat-frozen': <><Line x1="2" y1="12" x2="22" y2="12" /><Line x1="12" y1="2" x2="12" y2="22" /><Path d="m20 16-4-4 4-4" /><Path d="m4 8 4 4-4 4" /><Path d="m16 4-4 4-4-4" /><Path d="m8 20 4-4 4 4" /></>,
};
