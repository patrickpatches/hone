/**
 * ServingsSelector — the control that determines how the Ingredients list
 * below it is scaled.
 *
 * Design decisions:
 *   - Stepper stays in the bottom-half of the screen (Fitts's Law on a
 *     one-handed phone grip). The parent decides vertical placement; the
 *     component itself is just a compact row.
 *   - The three leftover modes sit as pill chips rather than a dropdown
 *     (native <select> on web + Picker on RN is ugly and forces a modal;
 *     three visible pills cost 30-ish pixels and remove a tap.)
 *   - The hint text changes per mode — it teaches the user what each mode
 *     actually means the first time they tap it, then becomes ignorable.
 *
 * Why not store this in global state? Because the selection is meaningful
 * only in the Recipe Detail context. The Plan screen has its own per-
 * recipe entries that carry their own `people` + `leftoverKey`.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens, fonts } from '../theme/tokens';
import { Icon } from './Icon';
import {
  LEFTOVER_OPTIONS,
  leftoverById,
  totalPortionsFor,
  type LeftoverModeId,
} from '../data/scale';

type Props = {
  people: number;
  setPeople: (n: number) => void;
  leftoverKey: LeftoverModeId;
  setLeftoverKey: (k: LeftoverModeId) => void;
  baseServings: number;
};

export function ServingsSelector({
  people,
  setPeople,
  leftoverKey,
  setLeftoverKey,
  baseServings,
}: Props) {
  const option = leftoverById(leftoverKey);
  const totalPortions = totalPortionsFor(option, people, baseServings);
  const factor = totalPortions / baseServings;
  const scaledBadge =
    factor === 1
      ? 'At author’s proportions'
      : factor > 1
        ? `Scaled up ${factor.toFixed(factor < 2 ? 1 : 0)}×`
        : `Scaled down ${factor.toFixed(1)}×`;

  const step = (delta: number) => {
    const next = Math.max(1, Math.min(20, people + delta));
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

  return (
    <View
      style={{
        backgroundColor: tokens.cream,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: tokens.line,
        padding: 16,
      }}
    >
      {/* Header row — label + scaling badge */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 10,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: tokens.muted,
          }}
        >
          How many people
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 11,
            color: factor === 1 ? tokens.sage : tokens.paprika,
          }}
        >
          {scaledBadge}
        </Text>
      </View>

      {/* Stepper row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <StepperButton dir="minus" disabled={people <= 1} onPress={() => step(-1)} />
        <View style={{ alignItems: 'center', minWidth: 80 }}>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 42,
              lineHeight: 48,
              color: tokens.ink,
              // tabular numbers so the glyph doesn't shift as count changes
              fontVariant: ['tabular-nums'],
            }}
          >
            {people}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 11,
              color: tokens.muted,
              marginTop: -2,
            }}
          >
            {people === 1 ? 'person' : 'people'}
          </Text>
        </View>
        <StepperButton dir="plus" disabled={people >= 20} onPress={() => step(1)} />

        {/* Right-hand total portions */}
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: tokens.muted,
            }}
          >
            Makes
          </Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 22,
              color: tokens.ink,
              fontVariant: ['tabular-nums'],
            }}
          >
            {totalPortions}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 10,
              color: tokens.muted,
            }}
          >
            portions
          </Text>
        </View>
      </View>

      {/* Mode pills */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
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
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? tokens.ink : 'transparent',
                borderWidth: 1.5,
                borderColor: active ? tokens.ink : tokens.line,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 11,
                  color: active ? tokens.cream : tokens.inkSoft,
                }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Mode hint — teaches on first interaction, ignorable after */}
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 11,
          color: tokens.muted,
          marginTop: 10,
          lineHeight: 15,
        }}
      >
        {option.hint}
      </Text>
    </View>
  );
}

function StepperButton({
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
      accessibilityLabel={dir === 'plus' ? 'Add a person' : 'Remove a person'}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: disabled
          ? tokens.bgDeep
          : pressed
            ? tokens.bgDeep
            : tokens.bg,
        borderWidth: 1.5,
        borderColor: disabled ? tokens.line : tokens.ink,
        opacity: disabled ? 0.4 : 1,
      })}
    >
      <Icon name={dir} size={18} color={tokens.ink} />
    </Pressable>
  );
}
