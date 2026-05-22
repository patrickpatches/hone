/**
 * PantryIcons — neutral line-icons for the pantry "what you have" list.
 *
 * Lucide/Tabler-style, ~1.7px stroke, round caps/joins, viewBox 0 0 24 24 —
 * same visual family as Icon.tsx so the app reads as one icon system. These are
 * STROKE-based (no fill) so they tint to a single colour; the pantry list tints
 * them to tokens.inkSoft (neutral cream) — icons are wayfinding, not status,
 * per the Designer's calm-palette brief.
 *
 * Build #122 Pass 1: the 7 category icons + categoryIconName().
 * Build #122 Pass 2: ~19 per-ingredient icons + ingredientIconName() resolver
 *   (garlic→allium, lemon→citrus, salmon→fish…). The resolver keyword-matches
 *   the ingredient name and FALLS BACK to the category icon when there's no
 *   confident match — so a row never shows a rough/ambiguous shape.
 */
import React from 'react';
import Svg, { Circle, Line, Path, Rect, type SvgProps } from 'react-native-svg';
import { tokens } from '../theme/tokens';
import type { PantryCategory } from '../data/pantry-helpers';

export type FoodIconName =
  // category icons (pass 1)
  | 'cat-produce'
  | 'cat-protein'
  | 'cat-dairy'
  | 'cat-pantry'
  | 'cat-spice'
  | 'cat-sauce'
  | 'cat-frozen'
  // ingredient icons (pass 2)
  | 'ing-tomato'
  | 'ing-carrot'
  | 'ing-citrus'
  | 'ing-herb'
  | 'ing-onion'
  | 'ing-chilli'
  | 'ing-cheese'
  | 'ing-milk'
  | 'ing-fish'
  | 'ing-egg'
  | 'ing-poultry'
  | 'ing-meat'
  | 'ing-grain'
  | 'ing-pasta'
  | 'ing-flour'
  | 'ing-nut'
  | 'ing-can'
  | 'ing-bottle'
  | 'ing-jar';

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

/**
 * Resolve an ingredient name to its best-fit icon. Keyword-matched in priority
 * order; falls back to the category icon when nothing matches confidently.
 */
export function ingredientIconName(
  name: string,
  category: PantryCategory,
): FoodIconName {
  const n = name.toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => n.includes(k));

  // Specific produce / aromatics first (most distinctive shapes)
  if (has('tomato', 'passata')) return 'ing-tomato';
  if (has('carrot')) return 'ing-carrot';
  if (has('lemon', 'lime', 'orange', 'citrus')) return 'ing-citrus';
  if (has('garlic', 'onion', 'shallot', 'leek')) return 'ing-onion';
  if (has('chilli', 'chili', 'capsicum', 'jalapeno', 'cayenne')) return 'ing-chilli';
  if (has('coriander', 'parsley', 'basil', 'mint', 'oregano', 'thyme', 'rosemary',
          'bay leaf', 'bay leaves', 'sage', 'dill', 'spinach', 'lettuce', 'rocket',
          'kale', 'herb')) return 'ing-herb';

  // Dairy & eggs
  if (has('egg')) return 'ing-egg';
  if (has('cheese', 'parmesan', 'parmigiano', 'mozzarella', 'cheddar', 'feta',
          'haloumi', 'halloumi', 'ricotta')) return 'ing-cheese';
  if (has('milk', 'cream', 'yoghurt', 'yogurt', 'butter')) return 'ing-milk';

  // Proteins
  if (has('fish', 'salmon', 'barramundi', 'tuna', 'cod', 'prawn', 'shrimp',
          'squid', 'seafood')) return 'ing-fish';
  if (has('chicken', 'turkey', 'duck')) return 'ing-poultry';
  if (has('beef', 'lamb', 'pork', 'mince', 'steak', 'bacon', 'sausage', 'veal',
          'chorizo')) return 'ing-meat';

  // Pantry staples
  if (has('pasta', 'spaghetti', 'noodle', 'macaroni', 'penne', 'fettuccine',
          'linguine')) return 'ing-pasta';
  if (has('rice')) return 'ing-grain';
  if (has('flour')) return 'ing-flour';
  if (has('peanut', 'cashew', 'almond', 'walnut', 'pine nut', 'sesame', 'nut')) return 'ing-nut';

  // Containers — sauces, condiments, tins
  if (has('canned', 'tinned', 'stock', 'broth')) return 'ing-can';
  if (has('oil', 'vinegar', 'soy', 'fish sauce', 'oyster', 'hoisin', 'sriracha',
          'worcestershire', 'sauce')) return 'ing-bottle';
  if (has('honey', 'syrup', 'tahini', 'miso', 'paste', 'mustard', 'jam', 'sugar')) return 'ing-jar';

  return categoryIconName(category);
}

// prettier-ignore
const FOOD_PATHS: Record<FoodIconName, React.ReactNode> = {
  // ── Category icons ────────────────────────────────────────────────────────
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

  // ── Ingredient icons ──────────────────────────────────────────────────────
  // Tomato — round body + 3-leaf calyx on top
  'ing-tomato': <><Circle cx="12" cy="14.5" r="6" /><Path d="M12 8.5V6.2" /><Path d="M12 7c-1.4 0-2.4-.8-2.7-2.1" /><Path d="M12 7c1.4 0 2.4-.8 2.7-2.1" /></>,
  // Carrot (Lucide "carrot")
  'ing-carrot': <><Path d="M2.27 21.7s9.87-3.5 12.73-6.36a4.5 4.5 0 0 0-6.36-6.37C5.77 11.84 2.27 21.7 2.27 21.7Z" /><Path d="M8.64 14 6.6 11.95" /><Path d="M15.34 15l-2.46-2.46" /><Path d="M22 9s-1.33-2-3.5-2C16.86 7 15 9 15 9s1.33 2 3.5 2S22 9 22 9Z" /><Path d="M15 2s-2 1.33-2 3.5S15 9 15 9s2-1.84 2-3.5C17 3.33 15 2 15 2Z" /></>,
  // Citrus (Lucide "citrus")
  'ing-citrus': <><Path d="M21.66 17.67a1.08 1.08 0 0 1-.04 1.6A12 12 0 0 1 4.73 2.38a1.1 1.1 0 0 1 1.61-.04Z" /><Path d="M19.65 15.66A8 8 0 0 1 8.35 4.34" /><Path d="m14 10-5.5 5.5" /><Path d="M14 17.85V10H6.15" /></>,
  // Herb — single leaf with vein
  'ing-herb': <><Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><Path d="M9 14c2-2 4-3 7-3.5" /></>,
  // Onion / allium — bulb with layered curves + top sprout
  'ing-onion': <><Path d="M12 21c-3.6 0-6.2-2.7-6.2-6.5C5.8 10.5 8.4 6 12 6s6.2 4.5 6.2 8.5C18.2 18.3 15.6 21 12 21Z" /><Path d="M9.6 8.4C8.7 10.6 8.7 16 12 20" /><Path d="M14.4 8.4c.9 2.2.9 7.6-2.4 11.6" /><Path d="M12 6c-.6-1-1-1.8-1-2.6" /><Path d="M12 6c.6-1 1-1.8 1-2.6" /></>,
  // Chilli — curved pod + stem
  'ing-chilli': <><Path d="M6 18c5 2.5 11-.5 12.5-6.5" /><Path d="M6 18c-1.2-.4-2-1.6-2-3 1.6 0 2.6.6 3.4 1.6" /><Path d="M18.5 11.5c1-.4 2.2-1.6 2.8-3-1.6-.4-3 0-4 .8" /></>,
  // Cheese — wedge with holes
  'ing-cheese': <><Path d="M4 17v-5l9-5 7 4v6Z" /><Circle cx="9" cy="13.5" r="1" /><Circle cx="14.5" cy="14.5" r="1" /></>,
  // Milk carton (Lucide "milk")
  'ing-milk': <><Path d="M8 2h8" /><Path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2" /><Path d="M7 15a6.47 6.47 0 0 1 5 0 6.47 6.47 0 0 0 5 0" /></>,
  // Fish (Lucide "fish")
  'ing-fish': <><Path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z" /><Path d="M18 12v.5" /><Path d="M16 17.93a9.77 9.77 0 0 1 0-11.86" /><Path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33" /><Circle cx="16" cy="10" r=".5" /></>,
  // Egg
  'ing-egg': <Path d="M12 22c-3.3 0-6-2.69-6-6 0-4 3-12 6-12s6 8 6 12c0 3.31-2.7 6-6 6Z" />,
  // Poultry — drumstick
  'ing-poultry': <><Path d="M15.45 15.4c-2.13.65-4.3.32-5.7-1.1-2.29-2.27-1.76-6.5 1.17-9.42 2.93-2.93 7.15-3.46 9.42-1.17 1.42 1.41 1.74 3.57 1.1 5.71-1.4-.51-3.26-.02-4.64 1.36-1.38 1.38-1.87 3.23-1.35 4.62z" /><Path d="m11.25 15.6-2.16 2.16a2.5 2.5 0 1 1-4.56 1.73 2.49 2.49 0 0 1-1.41-4.24 2.5 2.5 0 0 1 3.14-.32l2.16-2.16" /></>,
  // Red meat — oval cut of meat with a bone nub
  'ing-meat': <><Path d="M4 12.5c0-4.1 3.8-6.8 8-6.8s8 2.7 8 6.3-3.5 6.8-8 6.8-8-2.2-8-6.3Z" /><Circle cx="8" cy="11.5" r="2.1" /></>,
  // Grain — rice bowl
  'ing-grain': <><Path d="M4 11h16a8 8 0 0 1-16 0Z" /><Path d="M2 11h20" /><Path d="M9 7.5c-.8.6-1.1 1.6-.7 2.5" /><Path d="M12 6c-.8.6-1.1 1.6-.7 2.5" /><Path d="M15 7.5c-.8.6-1.1 1.6-.7 2.5" /></>,
  // Pasta — noodle bowl with strands
  'ing-pasta': <><Path d="M4 12h16a8 8 0 0 1-16 0Z" /><Path d="M2 12h20" /><Path d="M8 12V6" /><Path d="M12 12V5" /><Path d="M16 12V6" /></>,
  // Flour — bag with folded top
  'ing-flour': <><Path d="M7 9h10l-1 11a1.5 1.5 0 0 1-1.5 1.4H9.5A1.5 1.5 0 0 1 8 20Z" /><Path d="M8.5 9c0-2.8 1.2-5 3.5-5s3.5 2.2 3.5 5" /><Path d="M9.5 13.5h5" /></>,
  // Nut — walnut halves
  'ing-nut': <><Path d="M12 3c4 0 7 3.8 7 8.5S16 21 12 21 5 16.2 5 11.5 8 3 12 3Z" /><Path d="M12 3.5v17" /><Path d="M8.5 8.5c2 1.6 5 1.6 7 0" /><Path d="M8.5 15.5c2-1.6 5-1.6 7 0" /></>,
  // Can / tin — cylinder
  'ing-can': <><Path d="M5 6c0-1.4 3.1-2.5 7-2.5S19 4.6 19 6s-3.1 2.5-7 2.5S5 7.4 5 6Z" /><Path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" /><Path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" /></>,
  // Bottle
  'ing-bottle': <><Path d="M10 2h4v3l1.4 2.4A4 4 0 0 1 16 9.5V20a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9.5a4 4 0 0 1 .6-2.1L10 5z" /><Line x1="8" y1="12" x2="16" y2="12" /></>,
  // Jar — lidded jar
  'ing-jar': <><Rect x="6" y="8" width="12" height="13" rx="2" /><Path d="M7 8V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" /><Path d="M8 5V3.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5V5" /></>,
};
