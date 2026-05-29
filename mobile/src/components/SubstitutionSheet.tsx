/**
 * SubstitutionSheet — ingredient swap bottom sheet (build #116 rewrite).
 *
 * Now built on React Native's built-in `Modal` component. Replaces the
 * previous @gorhom/bottom-sheet implementation which had a portal layer
 * that — under load — kept presenting the sheet on stray taps anywhere on
 * the screen, including taps that had nothing to do with the swap UI
 * (cook-mode ingredient ticks reported by Patrick on builds #113–#115).
 *
 * Why the rewrite, not another patch: three rounds of defensive fixes
 * (#114 row-Pressable inert, #115 single dismiss path + 350ms debounce)
 * didn't kill the bug because the bug wasn't in the call sites — it was
 * in the portal layer's lifecycle. Removing the portal entirely is the
 * lowest-risk path to "this never happens again."
 *
 * DECISION-015 quality pills (per Designer's v2 prototype,
 * docs/prototypes/substitution-sheet-v2.html):
 *   green  ✓  Great swap        — works as well or near-as-well
 *   yellow ≈  Some difference   — honest tradeoff
 *   red    ⚠  Noticeable change — works in a pinch, dish genuinely different
 *
 * Every pill carries colour + icon + text label. Never colour alone.
 * accessibilityLabel = "{pill label} — {substitution.changes}".
 *
 * Cook mode: pass inCookMode=true; sheet surfaces switch to cookMode tokens.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens, fonts } from '../theme/tokens';
import type { Ingredient, Substitution } from '../data/types';
import { Icon } from './Icon';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SubstitutionSheetProps {
  ingredient: Ingredient | null;
  visible: boolean;
  activeSwapName?: string;
  inCookMode?: boolean;
  onSwap: (sub: Substitution | null) => void;
  onDismiss: () => void;
}

type Staged = Substitution | 'original' | null;

// ── DECISION-015 v2 pill config ──────────────────────────────────────────────

export interface PillConfig {
  fg: string;
  bg: string;
  border: string;
  icon: string;
  label: string;
}

export const PILL_CONFIG: Record<'green' | 'yellow' | 'red', PillConfig> = {
  green:  { fg: '#5DB870', bg: 'rgba(93,184,112,0.14)',  border: 'rgba(93,184,112,0.42)', icon: '✓', label: 'Great swap' },
  yellow: { fg: '#F2CC2A', bg: 'rgba(242,204,42,0.14)',  border: 'rgba(242,204,42,0.42)', icon: '≈', label: 'Some difference' },
  red:    { fg: '#D4663A', bg: 'rgba(212,102,58,0.14)',  border: 'rgba(212,102,58,0.40)', icon: '⚠', label: 'Noticeable change' },
};

function qualityConfig(quality: Substitution['quality']): PillConfig {
  // Fallback to yellow if an old quality value slips through (defensive net).
  return PILL_CONFIG[quality] ?? PILL_CONFIG.yellow;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SubstitutionSheet({
  ingredient,
  visible,
  activeSwapName,
  inCookMode = false,
  onSwap,
  onDismiss,
}: SubstitutionSheetProps) {
  // We render the Modal only when `visible` is true so there's nothing
  // floating around in the tree intercepting taps when the sheet is
  // closed. That's the entire point of this rewrite vs the @gorhom version.
  const [staged, setStaged] = useState<Staged>(null);
  const slide = useRef(new Animated.Value(0)).current; // 0=offscreen, 1=open
  const backdrop = useRef(new Animated.Value(0)).current;

  const surfaceBg = inCookMode ? tokens.cookMode.cardBg : tokens.cream;
  const divider   = inCookMode ? tokens.cookMode.lineDark : tokens.line;

  useEffect(() => {
    if (visible) {
      setStaged(null);
      Animated.parallel([
        Animated.timing(slide,    { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(backdrop, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      slide.setValue(0);
      backdrop.setValue(0);
    }
  }, [visible, slide, backdrop]);

  const handleConfirm = useCallback(() => {
    if (staged === null) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSwap(staged === 'original' ? null : staged as Substitution);
  }, [staged, onSwap]);

  // The Modal's onRequestClose handles Android hardware back-button.
  const handleRequestClose = useCallback(() => {
    setStaged(null);
    onDismiss();
  }, [onDismiss]);

  if (!ingredient) {
    // Defensive: don't render the Modal at all if there's no ingredient
    // context. Avoids the "stale modal hanging around" failure mode that
    // bit the @gorhom version.
    return null;
  }

  const subs = ingredient.substitutions ?? [];
  const hasActiveSwap = Boolean(activeSwapName) && activeSwapName !== ingredient.name;

  // Build #120 — short fixed-width label so long sub names (e.g. "Aleppo pepper (sweet, mild, fruity)")
  // don't wrap across 3 lines inside the rust pill. The selected radio row above already shows the
  // destination by name; the button just needs to say "do it". accessibilityLabel keeps the full
  // descriptive form for screen readers.
  const confirmLabel = staged === 'original'
    ? 'Restore original'
    : staged !== null
      ? 'Confirm swap'
      : '';
  const confirmAccessibilityLabel = staged === 'original'
    ? `Restore ${ingredient.name}`
    : staged !== null
      ? `Swap to ${(staged as Substitution).ingredient}`
      : '';

  // Slide transform: 600 → 0 as `slide` animates 0 → 1.
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleRequestClose}
    >
      {/* Backdrop. Tap to dismiss. */}
      <Pressable
        onPress={handleRequestClose}
        accessibilityRole="button"
        accessibilityLabel="Close swap sheet"
        style={{
          position: 'absolute',
          left: 0, right: 0, top: 0, bottom: 0,
        }}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            opacity: backdrop,
          }}
        />
      </Pressable>

      {/* Sheet itself. Catches its own touches so taps inside don't
          bubble to the backdrop and dismiss prematurely. */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          maxHeight: '88%',
          backgroundColor: surfaceBg,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          transform: [{ translateY }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 16,
        }}
        pointerEvents="box-none"
      >
        {/* Pull handle */}
        <View
          style={{
            alignSelf: 'center',
            marginTop: 8,
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: tokens.muted,
          }}
        />

        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: divider,
            flexDirection: 'row',
            alignItems: 'flex-start',
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
                marginBottom: 6,
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
              {ingredient.name}
            </Text>
            {hasActiveSwap && (
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  color: tokens.muted,
                  marginTop: 3,
                }}
              >
                Currently using: {activeSwapName}
              </Text>
            )}
          </View>

          <Pressable
            onPress={handleRequestClose}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: tokens.bgDeep,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 12,
            }}
          >
            <Icon name="x" size={15} color={tokens.ink} />
          </Pressable>
        </View>

        {/* Substitution rows */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {hasActiveSwap && (
            <SubRow
              name={ingredient.name}
              description="Restore the original recipe ingredient."
              badge={{ label: 'Original', bg: tokens.line, text: tokens.inkSoft }}
              isStaged={staged === 'original'}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setStaged('original');
              }}
            />
          )}

          {subs.length === 0 && !hasActiveSwap && (
            <View style={{ padding: 28, alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 18, color: tokens.muted, marginBottom: 8 }}>
                No swaps on file yet
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  color: tokens.muted,
                  textAlign: 'center',
                  lineHeight: 19,
                }}
              >
                We haven't researched substitutions for this ingredient yet.
              </Text>
            </View>
          )}

          {subs.map((sub, idx) => {
            const badge = qualityConfig(sub.quality);
            const isStaged =
              staged !== null &&
              staged !== 'original' &&
              (staged as Substitution).ingredient === sub.ingredient;
            return (
              <SubRow
                key={idx}
                name={sub.ingredient}
                description={sub.changes}
                quantityNote={sub.quantity_note}
                hardToFindNote={
                  sub.hard_to_find
                    ? (sub.local_alternative ?? 'May be hard to find in some areas.')
                    : undefined
                }
                badge={badge}
                isStaged={isStaged}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setStaged(sub);
                }}
              />
            );
          })}
        </ScrollView>

        {/* Confirm button — visible once a row is staged */}
        {staged !== null && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 24,
              borderTopWidth: 1,
              borderTopColor: divider,
            }}
          >
            <Pressable
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmAccessibilityLabel}
              android_ripple={{ color: tokens.primaryDeep, borderless: false }}
              style={{ borderRadius: 14 }}
            >
              <View
                style={{
                  backgroundColor: tokens.primary,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: fonts.sansBold,
                    fontSize: 15,
                    color: tokens.onPrimary,
                    letterSpacing: 0.2,
                  }}
                >
                  {confirmLabel}
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

// ── SubRow ────────────────────────────────────────────────────────────────────

function SubRow({
  name,
  description,
  quantityNote,
  hardToFindNote,
  badge,
  isStaged,
  onPress,
}: {
  name: string;
  description: string;
  quantityNote?: string;
  hardToFindNote?: string;
  badge: PillConfig | { label: string; bg: string; text: string };
  isStaged: boolean;
  onPress: () => void;
}) {
  const isV2 = 'icon' in badge && 'fg' in badge;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Select ${name}`}
      android_ripple={{ color: tokens.primaryLight, borderless: false }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: isStaged ? tokens.primaryLight : 'transparent',
        borderLeftWidth: isStaged ? 3 : 0,
        borderLeftColor: tokens.primaryDeep,
        gap: 14,
      }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: isStaged ? tokens.primary : tokens.line,
            backgroundColor: 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
            flexShrink: 0,
          }}
        >
          {isStaged && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.primary }} />
          )}
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 14,
                color: tokens.ink,
                flexShrink: 1,
              }}
            >
              {name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: badge.bg,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderWidth: isV2 ? 1 : 0,
                borderColor: isV2 ? (badge as PillConfig).border : 'transparent',
              }}
              accessible
              accessibilityLabel={isV2 ? `${(badge as PillConfig).label} — ${description}` : (badge as { label: string }).label}
            >
              {isV2 ? (
                <Text style={{ fontSize: 10, color: (badge as PillConfig).fg }}>{(badge as PillConfig).icon}</Text>
              ) : null}
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 10,
                  color: isV2 ? (badge as PillConfig).fg : (badge as { text: string }).text,
                  letterSpacing: 0.3,
                }}
              >
                {badge.label}
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
            {description}
          </Text>

          {quantityNote && (
            <Text
              style={{
                fontFamily: fonts.displayItalic,
                fontStyle: 'italic',
                fontSize: 12,
                color: tokens.ochre,
                marginTop: 2,
              }}
            >
              {quantityNote}
            </Text>
          )}

          {hardToFindNote && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 6,
                marginTop: 4,
                backgroundColor: tokens.bgDeep,
                borderRadius: 8,
                padding: 8,
              }}
            >
              <Icon name="alert" size={12} color={tokens.ochre} />
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  lineHeight: 17,
                  color: tokens.ochre,
                  flex: 1,
                }}
              >
                {hardToFindNote}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
