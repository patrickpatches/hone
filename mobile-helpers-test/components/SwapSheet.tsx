/**
 * SwapSheet — bottom sheet for selecting an ingredient substitution.
 *
 * Modal slide-up. Shows current ingredient, swap options with quality
 * badges, and a "back to original" row when a swap is already active.
 *
 * Quality badge colours follow the Studio Kitchen palette:
 *   perfect_swap → sage  (calm green)
 *   great_swap   → ochre (warm positive)
 *   good_swap    → bgDeep / inkSoft (neutral)
 *   compromise   → ochreDeep (honest caution, not alarming red)
 */

import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens, fonts } from '../theme/tokens';
import { Icon } from './Icon';

// ── Types (defined locally — not yet in types.ts) ─────────────────────────────

export type SwapQuality = 'perfect_swap' | 'great_swap' | 'good_swap' | 'good' | 'compromise';

export interface Substitution {
  ingredient: string;
  quality: SwapQuality;
  changes: string;
  quantity_note?: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SwapSheetProps {
  visible: boolean;
  ingredientName: string;
  substitutions: Substitution[];
  activeSwapName?: string;
  onSelect: (sub: Substitution | null) => void;
  onClose: () => void;
}

// ── Quality badge config ──────────────────────────────────────────────────────

function badgeConfig(quality: SwapQuality): { label: string; bg: string; text: string } {
  switch (quality) {
    case 'perfect_swap':
      return { label: 'Perfect', bg: tokens.sage, text: '#FFF' };
    case 'great_swap':
      return { label: 'Great swap', bg: tokens.ochre, text: tokens.ink };
    case 'good_swap':
    case 'good':
      return { label: 'Good swap', bg: tokens.bgDeep, text: tokens.inkSoft };
    case 'compromise':
      return { label: 'Tradeoff', bg: '#F5E6C8', text: tokens.ochreDeep };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SwapSheet({
  visible,
  ingredientName,
  substitutions,
  activeSwapName,
  onSelect,
  onClose,
}: SwapSheetProps) {
  const insets = useSafeAreaInsets();
  const isSwapped = Boolean(activeSwapName) && activeSwapName !== ingredientName;
  const displayName = isSwapped ? activeSwapName! : ingredientName;

  const handleSelect = (sub: Substitution | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSelect(sub);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Dim backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(29,25,23,0.48)' }}
        onPress={onClose}
      >
        {/* Sheet panel */}
        <Pressable
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: tokens.cream,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: insets.bottom + 16,
            maxHeight: '80%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 24,
          }}
          onPress={() => {}}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: tokens.line,
              }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: tokens.line,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: tokens.primary,
                  marginBottom: 4,
                }}
              >
                Swap ingredient
              </Text>
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 20,
                  lineHeight: 24,
                  color: tokens.ink,
                }}
                numberOfLines={2}
              >
                {displayName}
              </Text>
              {isSwapped && (
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 12,
                    color: tokens.muted,
                    marginTop: 2,
                  }}
                >
                  Original: {ingredientName}
                </Text>
              )}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close swap sheet"
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: tokens.bgDeep,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="x" size={15} color={tokens.ink} />
            </Pressable>
          </View>

          {/* Options */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
          >
            {isSwapped && (
              <SwapOption
                name={ingredientName}
                reason="The original recipe ingredient."
                qualityBadge={{ label: 'Original', bg: tokens.line, text: tokens.inkSoft }}
                isActive={false}
                isOriginal
                onPress={() => handleSelect(null)}
              />
            )}

            {substitutions.map((sub, idx) => {
              const badge = badgeConfig(sub.quality);
              const isActive = sub.ingredient === activeSwapName;
              return (
                <SwapOption
                  key={idx}
                  name={sub.ingredient}
                  reason={sub.changes}
                  quantityNote={sub.quantity_note}
                  qualityBadge={badge}
                  isActive={isActive}
                  onPress={() => handleSelect(sub)}
                />
              );
            })}

            {substitutions.length === 0 && !isSwapped && (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 18,
                    color: tokens.muted,
                    marginBottom: 8,
                  }}
                >
                  No swaps on file yet
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 13,
                    color: tokens.muted,
                    textAlign: 'center',
                  }}
                >
                  We haven't researched substitutions for this ingredient yet.
                </Text>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Single option row ─────────────────────────────────────────────────────────

function SwapOption({
  name,
  reason,
  quantityNote,
  qualityBadge,
  isActive,
  isOriginal,
  onPress,
}: {
  name: string;
  reason: string;
  quantityNote?: string;
  qualityBadge: { label: string; bg: string; text: string };
  isActive: boolean;
  isOriginal?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Swap to ${name}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: isActive
          ? tokens.sageLight
          : pressed
            ? tokens.bgDeep
            : 'transparent',
        gap: 14,
      })}
    >
      {/* Active indicator */}
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: isActive ? tokens.sage : tokens.line,
          backgroundColor: isActive ? tokens.sage : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
          flexShrink: 0,
        }}
      >
        {isActive && <Icon name="check" size={10} color="#FFF" />}
      </View>

      {/* Text */}
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 14,
              color: isOriginal ? tokens.muted : tokens.ink,
              flexShrink: 1,
            }}
          >
            {name}
          </Text>
          <View
            style={{
              backgroundColor: qualityBadge.bg,
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 10,
                color: qualityBadge.text,
                letterSpacing: 0.3,
              }}
            >
              {qualityBadge.label}
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 13,
            lineHeight: 18,
            color: tokens.inkSoft,
          }}
        >
          {reason}
        </Text>

        {quantityNote && (
          <Text
            style={{
              fontFamily: fonts.displayItalic,
              fontStyle: 'italic',
              fontSize: 12,
              color: tokens.ochre,
            }}
          >
            {quantityNote}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
