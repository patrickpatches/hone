/**
 * AddToPlanSheet — one-tap confirm.
 *
 * The old 14-day calendar picker was the wrong abstraction (per
 * ux-redesign-research.md). Plan & Shop is now a flat list of selected
 * meals; no day matters. This sheet collapses to a single confirm:
 * tap + on a recipe → tiny sheet appears → tap "Add to plan" → done.
 *
 * The date column on MealPlanEntry is preserved (today's ISO) for any
 * future "schedule for X" feature, but it's not surfaced anywhere.
 */
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';

import { tokens, fonts } from '../theme/tokens';
import { Icon } from './Icon';
import { setMealPlanEntry, type MealPlanEntry } from '../../db/database';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

type Props = {
  visible: boolean;
  recipeId: string;
  recipeTitle: string;
  defaultServings?: number;
  onClose: () => void;
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

  const handleConfirm = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const iso = todayISO();
    const entry: MealPlanEntry = {
      id: `mp-${recipeId}-${Date.now()}`,
      date: iso,
      recipe_id: recipeId,
      servings: defaultServings,
    };
    await setMealPlanEntry(db, entry);
    onAdded?.(iso);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close"
        style={{ flex: 1, backgroundColor: 'rgba(26,22,18,0.45)' }}
      />
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
            width: 36, height: 4, borderRadius: 2,
            backgroundColor: tokens.line,
            marginBottom: 18,
          }}
        />
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 11, letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: tokens.paprika,
            marginBottom: 4,
          }}
        >
          Add to your plan
        </Text>
        <Text
          style={{ fontFamily: fonts.display, fontSize: 22, color: tokens.ink, marginBottom: 6 }}
          numberOfLines={2}
        >
          {recipeTitle}
        </Text>
        <Text
          style={{ fontFamily: fonts.sans, fontSize: 13, color: tokens.muted, marginBottom: 18 }}
        >
          Goes to <Text style={{ fontFamily: fonts.sansBold, color: tokens.ink }}>Plan & Shop</Text>. Shopping list updates automatically. Remove anytime.
        </Text>

        <Pressable
          onPress={handleConfirm}
          accessibilityLabel="Confirm add to plan"
          style={({ pressed }) => ({
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: pressed ? tokens.paprikaDeep : tokens.paprika,
          })}
        >
          <Icon name="plus" size={18} color={tokens.cream} />
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: tokens.cream }}>
            Add to plan
          </Text>
        </Pressable>

        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            marginTop: 10,
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: pressed ? tokens.bgDeep : 'transparent',
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
