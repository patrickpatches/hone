/**
 * ServingsSelector — controls how the ingredients list is scaled.
 *
 * v2.2 visual polish (2026-05-09 — Designer prototype): consolidates the
 * count display into a single pill. Verb ("Serves" / "Makes") sits on the
 * left of the row; the stepper itself contains both the number and the
 * unit label, stacked vertically in the centre cell. Drops the previous
 * top-line header ("HOW MANY BURGERS") and the right-aligned redundant
 * "Makes N portions" block — count appeared twice and the user only ever
 * thinks about the one number they're stepping.
 *
 * Reference: docs/prototypes/recipe-detail-v2.2.html
 *
 * v2 (2026-05-08, DECISION-014): per-recipe units. "Makes 4 burgers" /
 * "Serves 4 portions" / "Makes 1 loaf" — wording is data-driven from
 * `outputUnit` / `outputUnitPlural`. Backwards-compatible: when those
 * props are absent the component falls back to "people / portions".
 *
 * Ingredient scaling math is unchanged. The leftover-mode pills still
 * tell the user the consequence ("+1 lunch tomorrow", etc.) but the
 * scaled total no longer renders as a second visible number — the mode
 * pill copy + the recipe-aware extra_for_tomorrow_label do that work.
 *
 * Haptic on every tap — confirms the action without eyes leaving the pan.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens, fonts } from '../theme/tokens';
import {
  LEFTOVER_OPTIONS,
  leftoverById,
  type LeftoverModeId,
} from '../data/scale';

type Props = {
  people: number;
  setPeople: (n: number) => void;
  leftoverKey: LeftoverModeId;
  setLeftoverKey: (k: LeftoverModeId) => void;
  baseServings: number;
  /** DECISION-014 per-recipe unit (singular). E.g. "burger", "serve". */
  outputUnit?: string;
  /** Plural form. Falls back to outputUnit + "s". */
  outputUnitPlural?: string;
  /** Recipe-aware label for the leftover-mode hint. */
  extraForTomorrowLabel?: string;
  /**
   * Embedded mode — render WITHOUT the standalone card chrome so the control
   * nests at the top of the recipe's "In your pantry" card (Recipe Page Design
   * — servings + pantry unified into one card). The left label becomes a
   * "How many <unit>?" question to match the design.
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
 * "person / people" (the cook's data is "serve" but the user thinks in
 * people). Item units (burger / loaf / cup / tortilla) render verbatim.
 */
function captionFor(unit: string, plural: string | undefined, n: number): string {
  if (isPersonUnit(unit)) return n === 1 ? 'person' : 'people';
  return pluralise(unit, plural, n);
}

const MIN_COUNT = 1;
const MAX_COUNT = 20; // hard upper safety clamp — visible disabled state at max is
                     //   gated on per-recipe `output_max` (not yet in schema).

export function ServingsSelector({
  people,
  setPeople,
  leftoverKey,
  setLeftoverKey,
  baseServings: _baseServings, // intentionally unused — leftover hint uses options, not totals
  outputUnit,
  outputUnitPlural,
  extraForTomorrowLabel,
  embedded = false,
}: Props) {
  const option = leftoverById(leftoverKey);

  // DECISION-014: derive the verb + unit caption from the recipe's authored
  // output_unit. Falls back to "Serves N people" for legacy un-migrated recipes.
  const verb = isPersonUnit(outputUnit) || !outputUnit ? 'Serves' : 'Makes';
  const unitCaption = outputUnit
    ? captionFor(outputUnit, outputUnitPlural, people)
    : people === 1 ? 'person' : 'people';

  // Embedded heading noun — always plural ("How many burgers?"). Person-units
  // read as "people".
  const headingNoun = outputUnit
    ? (isPersonUnit(outputUnit) ? 'people' : pluralise(outputUnit, outputUnitPlural, 2))
    : 'people';

  const minusDisabled = people <= MIN_COUNT;
  const plusDisabled = people >= MAX_COUNT;

  const step = (delta: number) => {
    const next = Math.max(MIN_COUNT, Math.min(MAX_COUNT, people + delta));
    if (next !== people) {
      Haptics.selectionAsync().catch(() => {});
      setPeople(next);
    }
  };

  const pickMode = (id: LeftoverModeId) => {
    if (id === leftoverKey) return;
    Haptics.selectionAsync().catch(() => {});
    setLeftoverKey(id);
  };

  const body = (
    <>
      {/* Servings row. Embedded (inside the pantry card) → plain heading +
          stepper to match the Recipe Page Design. Standalone → the recessed
          v2.2 pill. Centre cell of the stepper holds the stacked number +
          unit caption in both modes. */}
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

      {/* Mode pills — leftover scaling options. Layout unchanged from v2.1. */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
        {LEFTOVER_OPTIONS.map((opt) => {
          const active = opt.id === leftoverKey;
          return (
            <Pressable
              key={opt.id}
              onPress={() => pickMode(opt.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={opt.label}
              style={{
                paddingHorizontal: 13,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? tokens.primary : 'transparent',
                borderWidth: 2,
                borderColor: active ? tokens.primary : tokens.line,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 11,
                  color: active ? tokens.ink : tokens.inkSoft,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Mode hint — recipe-aware when out of "tonight" mode and the recipe
          has its own extra_for_tomorrow_label authored. */}
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 11,
          color: tokens.muted,
          marginTop: 10,
          lineHeight: 15,
        }}
      >
        {leftoverKey !== 'tonight' && extraForTomorrowLabel
          ? extraForTomorrowLabel
          : option.hint}
      </Text>
    </>
  );

  // Embedded — no card chrome; the parent "In your pantry" card provides it.
  if (embedded) {
    return <View>{body}</View>;
  }

  // Standalone — original v2.2 card.
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
 * Compact stepper button for the v2.2 pill — 32×40 inside the stepper-ctrl
 * container. Disabled state per Designer spec: opacity 0.28 + no pointer
 * events (the disabled prop on Pressable handles the latter natively).
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
