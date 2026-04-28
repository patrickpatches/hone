/**
 * AddToPlanSheet — pick a day, attach a recipe to the meal plan.
 *
 * Used from anywhere a user might want to plan a meal:
 *   - RecipeCard (Kitchen tab, plus any list view)
 *   - Recipe detail screen (top action bar)
 *   - Future: shopping flow, search results
 *
 * The Plan tab still has its own day-tap → recipe-picker flow for the
 * "fill the whole week" use case. This sheet is the inverse — it answers
 * "I'm looking at a recipe, which day do I want it?" — which is the more
 * natural mental model for daily use.
 *
 * Ergonomics rationale:
 *   - 14-day window (this week + next) — covers the common "planning ahead"
 *     case without making the sheet long enough to need scrolling.
 *   - Today highlighted with the paprika accent so it's the obvious default.
 *   - Days that already have a meal show the meal as a hint and replace
 *     on confirm (with haptic) — never silently overwrite.
 *   - Confirm via single tap. No multi-step "are you sure" — easy to undo
 *     by tapping the same day again or removing from Plan tab.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';

import { tokens, fonts } from '../theme/tokens';
import { Icon } from './Icon';
import {
  getMealPlanForWeek,
  setMealPlanEntry,
  type MealPlanEntry,
} from '../../db/database';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

type Props = {
  visible: boolean;
  recipeId: string;
  recipeTitle: string;
  /** Optional default servings — falls back to 2 if not provided. */
  defaultServings?: number;
  onClose: () => void;
  /** Fired after a successful add — parent can show a toast / refresh state. */
  onAdded?: (date: string) => void;
};

export function AddToPlanSheet({
  visible,
  recipeId,
  recipeTitle,
  defaultServings = 2,
  onClose,
  onAdded,
}: Props) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  // The 14-day window starting from today.
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, [visible]); // recompute when sheet opens

  // Load existing meal-plan entries so we can show "already planned" hints.
  const [existing, setExisting] = useState<Map<string, MealPlanEntry>>(new Map());

  useEffect(() => {
    if (!visible) return;
    const start = days[0];
    const end = days[days.length - 1];
    getMealPlanForWeek(db, toISO(start), toISO(end))
      .then((entries) => {
        const m = new Map<string, MealPlanEntry>();
        for (const e of entries) m.set(e.date, e);
        setExisting(m);
      })
      .catch(console.error);
  }, [db, visible, days]);

  const handlePick = async (date: Date) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const iso = toISO(date);
    const entry: MealPlanEntry = {
      id: `mp-${iso}-${Date.now()}`,
      date: iso,
      recipe_id: recipeId,
      servings: defaultServings,
    };
    await setMealPlanEntry(db, entry);
    onAdded?.(iso);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Scrim */}
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={{ flex: 1, backgroundColor: 'rgba(26,22,18,0.45)' }}
      />

      {/* Sheet */}
      <View
        style={{
          backgroundColor: tokens.bg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 20,
        }}
      >
        {/* Grab handle */}
        <View
          style={{
            alignSelf: 'center',
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: tokens.line,
            marginBottom: 14,
          }}
        />

        {/* Title */}
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: tokens.paprika,
            marginBottom: 4,
          }}
        >
          Add to plan
        </Text>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 22,
            color: tokens.ink,
            marginBottom: 4,
          }}
          numberOfLines={2}
        >
          {recipeTitle}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 12,
            color: tokens.muted,
            marginBottom: 14,
          }}
        >
          Pick a day. Tap again from the Plan tab to remove.
        </Text>

        {/* Day grid */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 6,
          }}
        >
          {days.map((d, i) => {
            const iso = toISO(d);
            const isToday = i === 0;
            const planned = existing.get(iso);

            return (
              <Pressable
                key={iso}
                onPress={() => handlePick(d)}
                accessibilityRole="button"
                accessibilityLabel={`Add to ${DAY_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`}
                style={({ pressed }) => ({
                  width: '23%', // 4 across with 8px gap inside the row
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  backgroundColor: pressed
                    ? tokens.paprikaDeep
                    : isToday
                      ? tokens.paprika
                      : planned
                        ? 'rgba(91,107,71,0.10)'
                        : tokens.cream,
                  borderWidth: 1,
                  borderColor: isToday
                    ? tokens.paprika
                    : planned
                      ? tokens.sage
                      : tokens.line,
                })}
              >
                <Text
                  style={{
                    fontFamily: fonts.sansBold,
                    fontSize: 10,
                    letterSpacing: 0.8,
                    color: isToday ? tokens.cream : tokens.muted,
                  }}
                >
                  {DAY_SHORT[d.getDay()]}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 18,
                    lineHeight: 22,
                    color: isToday ? tokens.cream : tokens.ink,
                    marginTop: 2,
                  }}
                >
                  {d.getDate()}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 9,
                    color: isToday ? 'rgba(250,246,238,0.85)' : tokens.muted,
                    marginTop: 1,
                  }}
                >
                  {MONTH_SHORT[d.getMonth()]}
                </Text>
                {planned && (
                  <View
                    style={{
                      marginTop: 4,
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: tokens.sage,
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Footer hint */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            paddingHorizontal: 4,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: tokens.sage,
            }}
          />
          <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted }}>
            Already has a meal — adding a second one is fine.
          </Text>
        </View>

        {/* Cancel */}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          style={({ pressed }) => ({
            marginTop: 14,
            paddingVertical: 13,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: pressed ? tokens.bgDeep : 'transparent',
            borderWidth: 1,
            borderColor: tokens.line,
          })}
        >
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: tokens.inkSoft }}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
