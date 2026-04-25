/**
 * RecipeCard — the primary unit of the Home screen.
 *
 * Design decisions (tied to competitive-analysis.md):
 *   - Source/chef attribution is visible on the card, not buried in detail
 *     (Rule #2 — no attribution laundering).
 *   - Tall image area with fallback gradient — because real photos ship late
 *     and we don't silently render a white square when a photo is missing.
 *     The gradient uses the `hero_fallback` three-colour spec from the recipe,
 *     so even a photoless card carries the recipe's visual identity.
 *   - Tap target ≥ 56dp — hitting the whole card is easier than a tiny
 *     "view" button. Fitts's Law: effective tap area shrinks with wet fingers.
 *   - Time + difficulty + servings shown — these are the three scan-level
 *     questions users actually ask ("can I cook this tonight?").
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import type { Recipe } from '../data/types';
import { tokens, fonts } from '../theme/tokens';
import { Icon } from './Icon';

type Props = {
  recipe: Recipe;
  onPress: (recipe: Recipe) => void;
  favorite?: boolean;
  onToggleFavorite?: (recipeId: string) => void;
  /** Optional - if supplied, a calendar button appears on the hero next to
   *  the favourite, opening Add-to-plan for this recipe. Parent owns sheet state. */
  onAddToPlan?: (recipe: Recipe) => void;
};

export function RecipeCard({ recipe, onPress, favorite = false, onToggleFavorite, onAddToPlan }: Props) {
  const gradient = recipe.hero_fallback ?? ['#3D342C', '#8B7968', '#D9CEBB'];

  const handlePress = () => {
    // Subtle confirmation — rule: haptics when hands are busy.
    Haptics.selectionAsync().catch(() => {
      /* haptics unsupported on web or some devices — fall through */
    });
    onPress(recipe);
  };

  const handleFavorite = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggleFavorite?.(recipe.id);
  };

  const handleAddToPlan = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onAddToPlan?.(recipe);
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
        borderColor: tokens.line,
        overflow: 'hidden',
        opacity: pressed ? 0.92 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      {/* Hero image / gradient fallback */}
      <View
        style={{
          height: 180,
          backgroundColor: gradient[0],
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {recipe.hero_url ? (
          <Image
            source={{ uri: recipe.hero_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
            // Blur placeholder would go here in production
          />
        ) : (
          // Three-band diagonal gradient stand-in — paints the recipe's colour
          // without pretending to be a photo. Honest about the missing image.
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: gradient[0] }} />
            <View style={{ flex: 1, backgroundColor: gradient[1] }} />
            <View style={{ flex: 1, backgroundColor: gradient[2] }} />
            {recipe.emoji ? (
              <Text
                style={{
                  position: 'absolute',
                  bottom: 14,
                  right: 16,
                  fontSize: 44,
                  opacity: 0.9,
                }}
              >
                {recipe.emoji}
              </Text>
            ) : null}
          </View>
        )}

        {/* Favourite toggle — top right, large enough to hit with a thumb */}
        {onToggleFavorite ? (
          <Pressable
            onPress={handleFavorite}
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Unfavourite' : 'Favourite'}
            hitSlop={12}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(26,22,18,0.45)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              name="heart"
              size={18}
              color={favorite ? tokens.paprika : tokens.cream}
              fill={favorite ? tokens.paprika : 'none'}
            />
          </Pressable>
        ) : null}

        {onAddToPlan ? (
          <Pressable
            onPress={handleAddToPlan}
            accessibilityRole="button"
            accessibilityLabel={`Add ${recipe.title} to meal plan`}
            hitSlop={12}
            style={{
              position: 'absolute',
              top: 12,
              right: onToggleFavorite ? 56 : 12,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(26,22,18,0.45)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="plus" size={20} color={tokens.cream} />
          </Pressable>
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
            backgroundColor: 'rgba(250,246,238,0.92)',
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

      {/* Body */}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 20,
            fontFamily: fonts.display,
            color: tokens.ink,
            lineHeight: 24,
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
          <Meta icon="clock" label={`${recipe.time_min} min`} />
          <Meta icon="users" label={recipe.yield_unit ? `${recipe.base_servings} ${pluralizeUnit(recipe.yield_unit, recipe.base_servings)}` : `${recipe.base_servings}`} />
          {recipe.source ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="external" size={12} color={tokens.paprika} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: fonts.sansBold,
                  color: tokens.paprika,
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

function Meta({ icon, label }: { icon: 'clock' | 'users'; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name={icon} size={12} color={tokens.muted} />
      <Text style={{ fontSize: 12, fontFamily: fonts.sans, color: tokens.muted }}>
        {label}
      </Text>
    </View>
  );
}


/**
 * Pluralize a yield unit for display. Stored in singular form on the recipe;
 * the UI pluralizes when count != 1 ("loaf" → "loaves", "tortilla" → "tortillas").
 * Handles the common irregular plurals we have (loaf → loaves) plus regular
 * rules (-y → -ies, -s/-x/-z/-sh/-ch → -es, default + s).
 */
function pluralizeUnit(word: string, count: number): string {
  if (count === 1) return word;
  if (word === 'loaf') return 'loaves';
  if (word === 'wolf') return 'wolves';
  if (word === 'leaf') return 'leaves';
  if (word === 'starter feed') return 'starter feeds';
  if (word.endsWith('y') && !/[aeiou]/.test(word[word.length - 2] ?? '')) {
    return word.slice(0, -1) + 'ies';
  }
  if (/(s|x|z|sh|ch)$/.test(word)) return word + 'es';
  return word + 's';
}
