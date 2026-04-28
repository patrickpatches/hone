/**
 * RecipeCard — the primary unit of the Kitchen screen.
 *
 * Studio Kitchen palette: warm linen card, dusty terracotta accent.
 * Rounded corners, soft shadow. Image fallback uses the recipe's
 * three-band colour spec so photoless cards still have identity.
 *
 * Tap target covers the whole card (Fitts's Law — wet fingers).
 * Time + difficulty + chef attribution are the three scan-level
 * questions users actually ask before tapping in.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import type { Recipe } from '../data/types';
import { tokens, fonts, shadows } from '../theme/tokens';
import { Icon } from './Icon';

type Props = {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  favorite?: boolean;
  onToggleFavorite?: (recipeId: string) => void;
  isPlanned?: boolean;
};

export function RecipeCard({
  recipe,
  onPress,
  favorite = false,
  onToggleFavorite,
  isPlanned = false,
}: Props) {
  const gradient = recipe.hero_fallback ?? [tokens.ink, tokens.warmBrown, tokens.bgDeep];

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress(recipe);
  };

  const handleFavorite = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggleFavorite?.(recipe.id);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${recipe.title}. ${recipe.tagline}. ${recipe.time_min} minutes. ${recipe.difficulty}.`}
      style={({ pressed }) => ({
        backgroundColor: tokens.cream,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: tokens.lineDark,
        overflow: 'hidden',
        opacity: pressed ? 0.93 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
        ...shadows.card,
      })}
    >
      {/* Hero image / gradient fallback */}
      <View style={{ height: 190, overflow: 'hidden' }}>
        {recipe.hero_url ? (
          <Image
            source={{ uri: recipe.hero_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={220}
          />
        ) : (
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <View style={{ flex: 1, backgroundColor: gradient[0] }} />
            <View style={{ flex: 1, backgroundColor: gradient[1] }} />
            <View style={{ flex: 1, backgroundColor: gradient[2] }} />
            {recipe.emoji ? (
              <Text
                style={{
                  position: 'absolute',
                  bottom: 14,
                  right: 16,
                  fontSize: 48,
                  opacity: 0.88,
                }}
              >
                {recipe.emoji}
              </Text>
            ) : null}
          </View>
        )}

        {/* Favourite toggle — top right */}
        {onToggleFavorite ? (
          <Pressable
            onPress={handleFavorite}
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Remove from favourites' : 'Add to favourites'}
            hitSlop={14}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: 'rgba(26,19,14,0.42)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              name="heart"
              size={17}
              color={favorite ? tokens.primary : '#FFFFFF'}
              fill={favorite ? tokens.primary : 'none'}
            />
          </Pressable>
        ) : null}

        {/* Planned badge — top left */}
        {isPlanned ? (
          <View
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: tokens.sage,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Icon name="check" size={10} color={tokens.ink} />
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 10,
                color: tokens.ink,
                letterSpacing: 0.3,
              }}
            >
              Planned
            </Text>
          </View>
        ) : null}

        {/* Difficulty chip — bottom left */}
        <View
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.9)',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontFamily: fonts.sansBold,
              color: tokens.ink,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {recipe.difficulty}
          </Text>
        </View>
      </View>

      {/* Card body */}
      <View style={{ padding: 16, paddingTop: 14 }}>
        <Text
          style={{
            fontSize: 20,
            fontFamily: fonts.display,
            color: tokens.ink,
            lineHeight: 25,
          }}
          numberOfLines={2}
        >
          {recipe.title}
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontSize: 13,
            fontFamily: fonts.sans,
            color: tokens.inkSoft,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {recipe.tagline}
        </Text>

        {/* Meta row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            marginTop: 12,
          }}
        >
          <MetaChip icon="clock" label={`${recipe.time_min} min`} />
          <MetaChip icon="users" label={`${recipe.base_servings}`} />
          {recipe.source ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="external" size={12} color={tokens.primary} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: fonts.sansBold,
                  color: tokens.primary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
                numberOfLines={1}
              >
                {recipe.source.chef}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function MetaChip({ icon, label }: { icon: 'clock' | 'users'; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name={icon} size={12} color={tokens.muted} />
      <Text style={{ fontSize: 12, fontFamily: fonts.sans, color: tokens.muted }}>
        {label}
      </Text>
    </View>
  );
}
