/**
 * ServingsSelector — controls how the ingredients list is scaled.
 *
 * v3 (2026-06): simplified to a single question — "How many servings?" — with
 * the − N + stepper. The leftover-mode pills (tonight / +lunches / 3-day /
 * freezer batch) were removed: one number the user steps is clearer than a
 * second batching axis, and the scaled total is what they actually think about.
 * Scaling is now a straight servings multiplier (no leftover multiplier).
 *
 * Per-recipe units are preserved (DECISION-014): the heading and the caption
 * under the number are data-driven from `outputUnit` / `outputUnitPlural`, so
 * count-based dishes read "How many burgers?" / "How many loaves?" instead of
 * "servings". Person-equivalent units render as "serving / servings".
 *
 * Haptic on every tap — confirms the action without eyes leaving the pan.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens, fonts } from '../theme/tokens';

type Props = {
  people: number;
  setPeople: (n: number) => void;
  baseServings: number;
  /** DECISION-014 per-recipe unit (singular). E.g. "burger", "serve". */
  outputUnit?: string;
  /** Plural form. Falls back to outputUnit + "s". */
  outputUnitPlural?: string;
  /**
   * Embedded mode — render WITHOUT the standalone card chrome so the control
   * nests at the top of the recipe's "In your pantry" card. The left label
   * becomes a "How many <unit>?" question to match the design.
   */
  embedded?: boolean;
};

/** Pluralise an output unit; explicit plural prop wins, fallback appends "s". */
function pluralise(unit: string, plural: string | undefined, n: number): string {
  if (n === 1) return unit;
  if (plural) return plural;
  return unit + 's';
}

/** Person-equivalent units (the data unit "serve" plus the literal "person"). */
function isPersonUnit(unit: string | undefined): boolean {
  return unit === 'serve' || unit === 'person';
}

/**
 * Caption shown inside the centre cell. Person-equivalent units render as
 * "serving / servings" (the cook's data unit is "serve"). Item units
 * (burger / loaf / cup / tortilla) render verbatim.
 */
function captionFor(unit: string, plural: string | undefined, n: number): string {
  if (isPersonUnit(unit)) return n === 1 ? 'serving' : 'servings';
  return pluralise(unit, plural, n);
}

const MIN_COUNT = 1;
const MAX_COUNT = 20; // hard upper safety clamp.

export function ServingsSelector({
  people,
  setPeople,
  baseServings: _baseServings, // intentionally unused — kept for caller compat
  outputUnit,
  outputUnitPlural,
  embedded = false,
}: Props) {
  // DECISION-014: derive the verb + unit caption from the recipe's authored
  // output_unit. Falls back to "Serves N servings" for legacy recipes.
  const verb = isPersonUnit(outputUnit) || !outputUnit ? 'Serves' : 'Makes';
  const unitCaption = outputUnit
    ? captionFor(outputUnit, outputUnitPlural, people)
    : people === 1 ? 'serving' : 'servings';

  // Embedded heading noun — always plural ("How many burgers?"). Person-units
  // read as "servings".
  const headingNoun = outputUnit
    ? (isPersonUnit(outputUnit) ? 'servings' : pluralise(outputUnit, outputUnitPlural, 2))
    : 'servings';

  const minusDisabled = people <= MIN_COUNT;
  const plusDisabled = people >= MAX_COUNT;

  const step = (delta: number) => {
    const next = Math.max(MIN_COUNT, Math.min(MAX_COUNT, people + delta));
    if (next !== people) {
      Haptics.selectionAsync().catch(() => {});
      setPeople(next);
    }
  };

  const body = (
    <View
      style={
        embedded
          ? { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
          : {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              paddingHorizontal: 14,
              backgroundColor: tokens.bg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.line,
            }
      }
    >
      {/* Left: "How many <unit>?" (embedded) or the verb (standalone) */}
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 13,
          color: embedded ? tokens.ink : tokens.inkSoft,
          lineHeight: 16,
        }}
      >
        {embedded ? `How many ${headingNoun}?` : verb}
      </Text>

      {/* Right: stepper pill */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: tokens.bgDeep,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: tokens.lineDark,
          overflow: 'hidden',
        }}
      >
        <StepperBtn dir="minus" disabled={minusDisabled} onPress={() => step(-1)} />
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: 52,
            height: 40,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: tokens.line,
            gap: 1,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 15,
              color: tokens.ink,
              lineHeight: 16,
              letterSpacing: -0.3,
              fontVariant: ['tabular-nums'],
            }}
          >
            {people}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.sans,
              fontSize: 9,
              color: tokens.muted,
              lineHeight: 11,
              maxWidth: 48,
              textAlign: 'center',
            }}
          >
            {unitCaption}
          </Text>
        </View>
        <StepperBtn dir="plus" disabled={plusDisabled} onPress={() => step(1)} />
      </View>
    </View>
  );

  // Embedded — no card chrome; the parent "In your pantry" card provides it.
  if (embedded) {
    return <View>{body}</View>;
  }

  // Standalone — original card.
  return (
    <View
      style={{
        backgroundColor: tokens.cream,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: tokens.lineDark,
        padding: 18,
        shadowColor: tokens.ink,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      {body}
    </View>
  );
}

/**
 * Compact stepper button — 32×40 inside the stepper-ctrl container.
 * Disabled state: opacity 0.28 + no pointer events (the disabled prop on
 * Pressable handles the latter natively).
 */
function StepperBtn({
  dir,
  onPress,
  disabled,
}: {
  dir: 'plus' | 'minus';
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={dir === 'plus' ? 'Increase count' : 'Decrease count'}
      hitSlop={8}
      android_ripple={
        disabled ? undefined : { color: tokens.primaryLight, borderless: false }
      }
      style={{
        width: 32,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.28 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 17,
          color: tokens.primaryInk,
          lineHeight: 20,
        }}
      >
        {dir === 'plus' ? '+' : '−'}
      </Text>
    </Pressable>
  );
}
