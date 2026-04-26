/**
 * RecipeCard — matches hone.html RecipeCard exactly.
 *
 * Hero buttons use rgba(0,0,0,0.55) dark backgrounds — cream icons are
 * always legible regardless of the photo behind them. This is the correct
 * fix for BUG-001: dark on dark, not light on light.
 *
 * Layout:
 *   - 192px hero with bottom gradient (transparent → rgba(0,0,0,0.55))
 *   - Top-right: heart + plan buttons — dark pill/circle with cream icons
 *   - Bottom-left: chef name in paprika pill
 *   - Below hero: title (Fraunces), tagline (Fraunces italic), meta row
 */
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { tokens, fonts } from '../theme/tokens';
import { Icon } from './Icon';
import type { Recipe } from '../data/types';

type Props = {
  recipe: Recipe;
  isFavorite: boolean;
  isPlanned: boolean;
  onPress: () => void;
  onFavorite: () => void;
  onPlan: () => void;
  searchQuery?: string;
};

function fmtTime(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function RecipeCard({
  recipe,
  isFavorite,
  isPlanned,
  onPress,
  onFavorite,
  onPlan,
}: Props) {
  const [imgError, setImgError] = React.useState(false);
  const hasImg = !imgError && !!recipe.hero_url;

  const chefName = recipe.source?.chef ?? null;
  const cuisineLabel =
    recipe.categories?.cuisines?.[0]
      ? recipe.categories.cuisines[0].charAt(0).toUpperCase() +
        recipe.categories.cuisines[0].slice(1)
      : null;
  const typeLabel =
    recipe.categories?.types?.[0]
      ? recipe.categories.types[0].charAt(0).toUpperCase() +
        recipe.categories.types[0].slice(1)
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: tokens.cardBg,
        borderWidth: 1,
        borderColor: tokens.line,
        shadowColor: tokens.ink,
        shadowOpacity: 0.07,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        opacity: pressed ? 0.95 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <View style={{ height: 192, backgroundColor: recipe.hero_color ?? tokens.bgDeep }}>
        {hasImg ? (
          <Image
            source={{ uri: recipe.hero_url! }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: recipe.hero_color
                ? recipe.hero_color + '66'
                : tokens.bgDeep,
            }}
          >
            <Text style={{ fontSize: 52 }}>{recipe.emoji ?? '🍽️'}</Text>
          </View>
        )}

        {/* Bottom scrim — dark overlay at base so chef pill + title stay readable */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 72,
            backgroundColor: 'rgba(0,0,0,0.52)',
          }}
          pointerEvents="none"
        />

        {/* Top-right: heart + plan */}
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            flexDirection: 'row',
            gap: 6,
          }}
        >
          {/* Heart */}
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onFavorite(); }}
            accessibilityLabel={isFavorite ? 'Remove from saved' : 'Save recipe'}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(0,0,0,0.52)',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Icon
              name={isFavorite ? 'heart' : 'heart'}
              size={15}
              color={isFavorite ? tokens.paprika : '#FDF9F3'}
              fill={isFavorite}
            />
          </Pressable>

          {/* Plan pill */}
          <Pressable
            onPress={(e) => { e.stopPropagation?.(); onPlan(); }}
            accessibilityLabel={isPlanned ? 'Remove from plan' : 'Add to plan'}
            style={({ pressed }) => ({
              height: 36,
              paddingHorizontal: 10,
              borderRadius: 18,
              backgroundColor: isPlanned
                ? tokens.sage + 'E6'
                : 'rgba(0,0,0,0.52)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Icon
              name={isPlanned ? 'check' : 'plus'}
              size={11}
              color="#FDF9F3"
            />
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 11,
                color: '#FDF9F3',
                letterSpacing: 0.2,
              }}
            >
              {isPlanned ? 'In plan' : 'Plan'}
            </Text>
          </Pressable>
        </View>

        {/* Bottom-left: chef attribution pill */}
        {chefName && (
          <View style={{ position: 'absolute', bottom: 8, left: 12 }}>
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 10,
                color: '#FDF9F3',
                backgroundColor: tokens.paprika,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 999,
                letterSpacing: 0.2,
                overflow: 'hidden',
              }}
            >
              {chefName}
            </Text>
          </View>
        )}
      </View>

      {/* ── Card body ───────────────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.display,
            fontSize: 17,
            lineHeight: 21,
            letterSpacing: -0.2,
            color: tokens.ink,
          }}
        >
          {recipe.title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.displayItalic ?? fonts.display,
            fontSize: 13,
            color: tokens.inkSoft,
            marginTop: 3,
          }}
        >
          {recipe.tagline}
        </Text>

        {/* Meta row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="clock" size={12} color={tokens.muted} />
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, color: tokens.muted }}>
              {fmtTime(recipe.time_min)}
            </Text>
          </View>
          <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: tokens.lineDark }} />
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, color: tokens.muted, textTransform: 'capitalize' }}>
            {recipe.difficulty}
          </Text>
          {cuisineLabel && (
            <>
              <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: tokens.lineDark }} />
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, color: tokens.muted }}>
                {cuisineLabel}
              </Text>
            </>
          )}
          {typeLabel && (
            <>
              <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: tokens.lineDark }} />
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, color: tokens.muted }}>
                {typeLabel}
              </Text>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}
