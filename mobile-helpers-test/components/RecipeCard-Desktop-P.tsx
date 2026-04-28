/**
 * RecipeCard — the primary unit of the Home screen.
 *
 * v2: Pastel-retro design.
 *   - Hero overlay buttons now use FULLY OPAQUE backgrounds — no more
 *     rgba semi-transparency that fails on light hero images. Each button
 *     has its own colour: white pill for back/inactive heart, rose for
 *     active heart, sky for add-to-plan.
 *   - Difficulty chip is colour-coded: sage/Easy, butter/Intermediate,
 *     peach/Involved — gives the card instant scannable personality.
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
  onAddToPlan?: (recipe: Recipe) => void;
};

const DIFFICULTY_STYLE: Record<string, { bg: string; text: string }> = {
  Easy:         { bg: tokens.sageLight,   text: tokens.sage },
  Intermediate: { bg: tokens.butterLight, text: tokens.butter },
  Involved:     { bg: tokens.peachLight,  text: tokens.peach },
};

export function RecipeCard({ recipe, onPress, favorite = false, onToggleFavorite, onAddToPlan }: Props) {
  const gradient = recipe.hero_fallback ?? ['#3D342C', '#8B7968', '#D9CEBB'];

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

  const diffStyle = DIFFICULTY_STYLE[recipe.difficulty] ?? { bg: tokens.bgDeep, text: tokens.inkSoft };

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress(recipe);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${recipe.title}. ${recipe.tagline}. ${recipe.time_min} minutes. ${recipe.difficulty}.`}
      style={({ pressed }) => ({
        backgroundColor: tokens.cream,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: tokens.line,
        overflow: 'hidden',
        opacity: pressed ? 0.93 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      {/* Hero */}
      <View style={{ height: 180, backgroundColor: gradient[0], position: 'relative', overflow: 'hidden' }}>
        {recipe.hero_url ? (
          <Image
            source={{ uri: recipe.hero_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: gradient[0] }} />
            <View style={{ flex: 1, backgroundColor: gradient[1] }} />
            <View style={{ flex: 1, backgroundColor: gradient[2] }} />
            {recipe.emoji ? (
              <Text style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 44, opacity: 0.9 }}>
                {recipe.emoji}
              </Text>
            ) : null}
          </View>
        )}

        {/* ── Top-right buttons — fully opaque, always visible ── */}
        <View style={{ position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 8 }}>
          {onAddToPlan ? (
            <Pressable
              onPress={handleAddToPlan}
              accessibilityRole="button"
              accessibilityLabel={`Add ${recipe.title} to meal plan`}
              hitSlop={12}
              style={({ pressed }) => ({
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: pressed ? tokens.skyDeep : tokens.sky,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18, shadowRadius: 4, elevation: 3,
              })}
            >
              <Icon name="calendar" size={16} color="#fff" />
            </Pressable>
          ) : null}

          {onToggleFavorite ? (
            <Pressable
              onPress={handleFavorite}
              accessibilityRole="button"
              accessibilityLabel={favorite ? 'Unfavourite' : 'Favourite'}
              hitSlop={12}
              style={({ pressed }) => ({
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: favorite
                  ? (pressed ? tokens.roseDeep : tokens.rose)
                  : (pressed ? tokens.bgDeep : '#FFFFFF'),
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18, shadowRadius: 4, elevation: 3,
              })}
            >
              <Icon
                name="heart"
                size={17}
                color={favorite ? '#fff' : tokens.inkSoft}
                fill={favorite ? '#fff' : 'none'}
              />
            </Pressable>
          ) : null}
        </View>

        {/* Difficulty chip — colour-coded by difficulty */}
        <View
          style={{
            position: 'absolute', bottom: 10, left: 10,
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: diffStyle.bg,
          }}
        >
          <Text style={{
            fontSize: 10, fontFamily: fonts.sansBold,
            color: diffStyle.text,
            letterSpacing: 0.6, textTransform: 'uppercase',
          }}>
            {recipe.difficulty}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={{ padding: 16 }}>
        <Text
          style={{ fontSize: 20, fontFamily: fonts.display, color: tokens.ink, lineHeight: 24 }}
          numberOfLines={2}
        >
          {recipe.title}
        </Text>
        <Text
          style={{ marginTop: 4, fontSize: 13, fontFamily: fonts.displayItalic, fontStyle: 'italic', color: tokens.inkSoft, lineHeight: 18 }}
          numberOfLines={2}
        >
          {recipe.tagline}
        </Text>

        {/* Meta row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <MetaPill icon="clock" label={`${recipe.time_min} min`} bg={tokens.bgDeep} />
          <MetaPill icon="users" label={`${recipe.base_servings}`} bg={tokens.bgDeep} />
          {recipe.source ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="external" size={11} color={tokens.peach} />
              <Text style={{
                fontSize: 11, fontFamily: fonts.sansBold,
                color: tokens.peach,
                textTransform: 'uppercase', letterSpacing: 0.5,
              }} numberOfLines={1}>
                {recipe.source.chef}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function MetaPill({ icon, label, bg }: { icon: 'clock' | 'users'; label: string; bg: string }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 999,
    }}>
      <Icon name={icon} size={11} color={tokens.muted} />
      <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: tokens.muted }}>{label}</Text>
    </View>
  );
}
