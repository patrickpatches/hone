/**
 * Icon — inline SVG icon set.
 *
 * Ported from the HTML prototype (Lucide-style, 2px stroke, round caps/joins).
 * We keep the full set in one file because: (a) this is a small app, (b) tree-
 * shaking SVG per icon is not worth the ceremony, (c) having every icon in one
 * place makes visual consistency easier to maintain.
 *
 * Add an icon by adding a key to PATHS and listing it in IconName.
 */
import React from 'react';
import Svg, {
  Circle,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  type SvgProps,
} from 'react-native-svg';
import { tokens } from '../theme/tokens';

export type IconName =
  | 'search'
  | 'plus'
  | 'minus'
  | 'x'
  | 'check'
  | 'arrow-left'
  | 'arrow-right'
  | 'clock'
  | 'users'
  | 'flame'
  | 'external'
  | 'heart'
  | 'cart'
  | 'chef'
  | 'home'
  | 'sparkles'
  | 'alert'
  | 'play'
  | 'pause'
  | 'trash'
  | 'check-circle'
  | 'swap'
  | 'arrow-down'
  | 'arrow-up'
  | 'calendar'
  | 'plus-circle';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  fill?: string;
} & Omit<SvgProps, 'children'>;

export function Icon({
  name,
  size = 18,
  color = tokens.ink,
  fill = 'none',
  ...rest
}: Props) {
  const p = PATHS[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {p}
    </Svg>
  );
}

// prettier-ignore
const PATHS: Record<IconName, React.ReactNode> = {
  'search': <><Circle cx="11" cy="11" r="8" /><Path d="m21 21-4.3-4.3" /></>,
  'plus': <><Path d="M5 12h14" /><Path d="M12 5v14" /></>,
  'minus': <Path d="M5 12h14" />,
  'x': <><Path d="M18 6 6 18" /><Path d="m6 6 12 12" /></>,
  'check': <Path d="M20 6 9 17l-5-5" />,
  'arrow-left': <><Path d="m12 19-7-7 7-7" /><Path d="M19 12H5" /></>,
  'arrow-right': <><Path d="m12 5 7 7-7 7" /><Path d="M5 12h14" /></>,
  'clock': <><Circle cx="12" cy="12" r="10" /><Polyline points="12 6 12 12 16 14" /></>,
  'users': <><Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><Circle cx="9" cy="7" r="4" /><Path d="M22 21v-2a4 4 0 0 0-3-3.87" /><Path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  'flame': <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  'external': <><Path d="M15 3h6v6" /><Path d="M10 14 21 3" /><Path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
  'heart': <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />,
  'cart': <><Circle cx="8" cy="21" r="1" /><Circle cx="19" cy="21" r="1" /><Path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></>,
  'chef': <><Path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" /><Line x1="6" x2="18" y1="17" y2="17" /></>,
  'home': <><Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" /></>,
  'sparkles': <Path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />,
  'alert': <><Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><Path d="M12 9v4" /><Path d="M12 17h.01" /></>,
  'play': <Polygon points="6 3 20 12 6 21 6 3" />,
  'pause': <><Rect x="6" y="4" width="4" height="16" /><Rect x="14" y="4" width="4" height="16" /></>,
  'trash': <><Path d="M3 6h18" /><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  'check-circle': <><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Polyline points="22 4 12 14.01 9 11.01" /></>,
  'swap': <><Path d="M7 16V4m0 0L3 8m4-4 4 4" /><Path d="M17 8v12m0 0 4-4m-4 4-4-4" /></>,
  'arrow-down': <><Path d="M12 5v14" /><Path d="m19 12-7 7-7-7" /></>,
  'arrow-up': <><Path d="M12 19V5" /><Path d="m5 12 7-7 7 7" /></>,
  'calendar': <><Rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><Line x1="16" x2="16" y1="2" y2="6" /><Line x1="8" x2="8" y1="2" y2="6" /><Line x1="3" x2="21" y1="10" y2="10" /></>,
  'plus-circle': <><Circle cx="12" cy="12" r="10" /><Line x1="12" x2="12" y1="8" y2="16" /><Line x1="8" x2="16" y1="12" y2="12" /></>,
};
