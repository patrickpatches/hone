/**
 * Kitchen — the anchor tab.
 *
 * Editorial direction (locked 2026-05-10, prototype:
 * docs/prototypes/kitchen-editorial-v1.html). Replaces the previous layout
 * (hero headline + mode chips + cuisine pill row + card grid) with:
 *
 *   header (day/time + 'hone.' wordmark + avatar)
 *   ↓
 *   gold-bordered search bar
 *   ↓
 *   hero card  — tonight's planned recipe if any, else top of active filter
 *   ↓
 *   "Browse by cuisine" + horizontal category tiles  (All + 8 cuisines)
 *   ↓
 *   recipe list as full-width rows (58×58 thumb + cuisine tag + title + meta)
 *
 * Why rows instead of cards: at the 16-recipe launch scale, the hero card
 * already gives one big visual anchor. The list below is for scanning, not
 * browsing — rows compress the vertical space so users can see 5-6 titles
 * at once instead of 1.5 cards.
 *
 * Why a single gold accent: the introduced `tokens.gold` (#F2CC2A) is the
 * one editorial cue — period in 'hone.', search border, cuisine tag, active
 * tile, planned/tonight badges. Anything else (chef name, time, difficulty)
 * stays muted so the gold reads as the eyebrow of the page.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Image } from 'expo-image';
import type { Recipe, CuisineId } from '../../src/data/types';
import {
  getActiveRecipes,
  getFavoriteIds,
  getPlannedRecipeIds,
} from '../../db/database';
import { Icon } from '../../src/components/Icon';
import { tokens, fonts, shadows } from '../../src/theme/tokens';

// ────────────────────────────────────────────────────────────────────────────
// Categories (Editorial direction — Designer-locked list of 8 + All)
// ────────────────────────────────────────────────────────────────────────────

type CategoryId = 'all' | CuisineId;

interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
}

// Every CuisineId gets a tile. The visibleCategories filter below trims to
// the ones that actually have ≥1 launch recipe so empty tiles never render.
// To add a new tile, extend CuisineId in types.ts; the entry here keeps the
// label + emoji synced.
const CATEGORIES: Category[] = [
  { id: 'all',         label: 'All',         emoji: '🍽️' },
  { id: 'australian',  label: 'Australian',  emoji: '🇦🇺' },
  { id: 'levantine',   label: 'Levantine',   emoji: '🫒' },
  { id: 'palestinian', label: 'Palestinian', emoji: '🇵🇸' },
  { id: 'italian',     label: 'Italian',     emoji: '🇮🇹' },
  { id: 'indian',      label: 'Indian',      emoji: '🇮🇳' },
  { id: 'thai',        label: 'Thai',        emoji: '🇹🇭' },
  { id: 'american',    label: 'American',    emoji: '🇺🇸' },
  { id: 'mexican',     label: 'Mexican',     emoji: '🇲🇽' },
  { id: 'french',      label: 'French',      emoji: '🇫🇷' },
  { id: 'japanese',    label: 'Japanese',    emoji: '🇯🇵' },
  { id: 'malaysian',   label: 'Malaysian',   emoji: '🇲🇾' },
  { id: 'filipino',    label: 'Filipino',    emoji: '🇵🇭' },
  { id: 'chinese',     label: 'Chinese',     emoji: '🇨🇳' },
  { id: 'german',      label: 'German',      emoji: '🇩🇪' },
  { id: 'british',     label: 'British',     emoji: '🇬🇧' },
];

// Display labels for cuisines used outside CATEGORIES (e.g. cuisine tags)
const CUISINE_LABELS: Record<CuisineId, string> = {
  levantine:    'Levantine',
  palestinian:  'Palestinian',
  indian:       'Indian',
  malaysian:    'Malaysian',
  japanese:     'Japanese',
  thai:         'Thai',
  italian:      'Italian',
  french:       'French',
  american:     'American',
  australian:   'Australian',
  mexican:      'Mexican',
  filipino:     'Filipino',
  chinese:      'Chinese',
  german:       'German',
  british:      'British',
};

// ────────────────────────────────────────────────────────────────────────────
// Day / time-of-day greeting — drives the line above the wordmark.
// ────────────────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayTimeLabel(now: Date = new Date()): string {
  const day = DAY_NAMES[now.getDay()];
  const h = now.getHours();
  const period = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  return `${day} ${period}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers — cuisine label, time-of-day, recipe meta
// ────────────────────────────────────────────────────────────────────────────

function recipeCuisineLabel(recipe: Recipe): string {
  const cuisines = recipe.categories?.cuisines ?? [];
  if (cuisines.length === 0) return '';
  const first = cuisines[0]!;
  return CUISINE_LABELS[first] ?? first;
}

/**
 * "Australian · Beef" style line for the hero. Uses the first cuisine and the
 * first type. Falls back to just the cuisine if no type exists.
 */
function recipeHeroEyebrow(recipe: Recipe): string {
  const cuisine = recipeCuisineLabel(recipe);
  const types = recipe.categories?.types ?? [];
  const firstType = types[0];
  if (!cuisine && !firstType) return '';
  if (!firstType) return cuisine;
  // Capitalise the type id (e.g. 'beef' -> 'Beef')
  const t = firstType.charAt(0).toUpperCase() + firstType.slice(1);
  return cuisine ? `${cuisine} · ${t}` : t;
}

// User initial — Patrick.
const USER_INITIAL = 'P';

// ────────────────────────────────────────────────────────────────────────────
// Screen
// ────────────────────────────────────────────────────────────────────────────

export default function KitchenHome() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [search, setSearch]           = useState('');
  const [recipes, setRecipes]         = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [plannedIds, setPlannedIds]   = useState<Set<string>>(new Set());
  const [loading, setLoading]         = useState(true);
  const [category, setCategory]       = useState<CategoryId>('all');

  // Initial load
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [all, favs, planned] = await Promise.all([
        getActiveRecipes(db),
        getFavoriteIds(db),
        getPlannedRecipeIds(db),
      ]);
      if (!cancelled) {
        setRecipes(all);
        setFavoriteIds(favs);
        setPlannedIds(planned);
        setLoading(false);
      }
    }
    load().catch((e) => console.error('Kitchen load failed', e));
    return () => { cancelled = true; };
  }, [db]);

  // Refresh plan state when tab is focused (keep in sync with Plan/Recipe toggles)
  useFocusEffect(
    React.useCallback(() => {
      getPlannedRecipeIds(db).then(setPlannedIds).catch((e) =>
        console.error('plan refresh failed', e),
      );
    }, [db]),
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Derived
  // ──────────────────────────────────────────────────────────────────────────

  // Which categories actually have content — hide the empty ones.
  const availableCategoryIds = useMemo<Set<CategoryId>>(() => {
    const seen = new Set<CategoryId>(['all']);
    for (const r of recipes) {
      for (const c of r.categories?.cuisines ?? []) seen.add(c);
    }
    return seen;
  }, [recipes]);

  const visibleCategories = CATEGORIES.filter((c) => availableCategoryIds.has(c.id));

  // Filter + search. Ingredient search stays from the previous Kitchen.
  const results = useMemo(() => recipes.filter((r) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hit =
        r.title.toLowerCase().includes(q) ||
        r.tagline.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        (r.source?.chef ?? '').toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q));
      if (!hit) return false;
    }
    if (category === 'all') return true;
    return r.categories?.cuisines.includes(category as CuisineId) ?? false;
  }), [recipes, search, category]);

  // Hero recipe — build #121: rotating slideshow through the active filter's results.
  //   1. heroIdx is the position within `heroPool` (results, with any planned recipe pinned at index 0).
  //   2. Auto-advance every HERO_ROTATE_MS while results.length >= 2.
  //   3. Reset heroIdx to 0 whenever the active filter changes.
  //
  // Note: Patrick's earlier "Tonight" semantics put a planned recipe ahead of the filtered list as a
  // global pin. We keep that — the planned recipe (if any) goes at slot 0 of the pool — but slots
  // 1..N cycle through the active filter so the user sees the whole shelf, not just one card.
  const HERO_ROTATE_MS = 8000;

  const heroPool = useMemo<Recipe[]>(() => {
    const planned = recipes.find((r) => plannedIds.has(r.id));
    if (!planned) return results;
    // If the planned recipe is already in results (e.g. filter matches it), keep it where it is;
    // otherwise prepend it so "tonight" always opens the slideshow.
    if (results.some((r) => r.id === planned.id)) return results;
    return [planned, ...results];
  }, [recipes, plannedIds, results]);

  const [heroIdx, setHeroIdx] = useState(0);

  // Reset to slot 0 when the filter changes or the pool shrinks.
  useEffect(() => {
    setHeroIdx(0);
  }, [category, search, heroPool.length]);

  // Auto-rotate every HERO_ROTATE_MS when there are 2+ recipes in the pool.
  useEffect(() => {
    if (heroPool.length < 2) return;
    const id = setInterval(() => {
      setHeroIdx((i) => (i + 1) % heroPool.length);
    }, HERO_ROTATE_MS);
    return () => clearInterval(id);
  }, [heroPool.length]);

  const heroRecipe = heroPool.length > 0 ? heroPool[heroIdx % heroPool.length] : undefined;
  const heroIsPlanned = !!heroRecipe && plannedIds.has(heroRecipe.id);

  // Recipes shown in the list — keep the hero in the list too (Patrick's #121 ask).
  // Reads more naturally: tonight's Butter Chicken sits in the Indian section AND in the hero.
  const listResults = results;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={tokens.primaryInk} />
      </View>
    );
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: insets.top + 10,
        paddingBottom: 140,
        backgroundColor: tokens.bg,
      }}
      style={{ backgroundColor: tokens.bg }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HEADER — day/time + wordmark + avatar ─────────────────────────── */}
      <View
        style={{
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 11,
              color: tokens.muted,
              letterSpacing: 0.3,
              marginBottom: 1,
            }}
          >
            {dayTimeLabel()}
          </Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 23,
              color: tokens.ink,
              letterSpacing: -0.3,
              lineHeight: 28,
            }}
          >
            tucker <Text style={{ color: tokens.primary }}>&</Text> spice
            <Text style={{ color: tokens.gold }}>.</Text>
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Profile and settings"
          hitSlop={10}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: tokens.cream,
            borderWidth: 1.5,
            borderColor: tokens.lineDark,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 2,
          }}
        >
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.inkSoft }}>
            {USER_INITIAL}
          </Text>
        </Pressable>
      </View>

      {/* ── SEARCH — gold border ──────────────────────────────────────────── */}
      <View
        style={{
          marginHorizontal: 18,
          marginTop: 12,
          paddingHorizontal: 13,
          paddingVertical: 10,
          borderRadius: 13,
          backgroundColor: tokens.cream,
          borderWidth: 1.5,
          borderColor: tokens.gold,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Icon name="search" size={14} color={tokens.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search recipes or ingredients…"
          placeholderTextColor={tokens.muted}
          style={{
            flex: 1,
            color: tokens.ink,
            fontFamily: fonts.sans,
            fontSize: 13,
            padding: 0,
          }}
          returnKeyType="search"
          accessibilityLabel="Search"
        />
        {search ? (
          <Pressable
            onPress={() => setSearch('')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Icon name="x" size={14} color={tokens.muted} />
          </Pressable>
        ) : null}
      </View>

      {/* ── HERO CARD ─────────────────────────────────────────────────────── */}
      {heroRecipe ? (
        <Pressable
          onPress={() => router.push(`/recipe/${heroRecipe.id}` as never)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${heroRecipe.title}`}
          style={{
            marginHorizontal: 18,
            marginTop: 14,
            height: 178,
            borderRadius: 20,
            overflow: 'hidden',
            ...shadows.card,
          }}
        >
          <HeroBackground recipe={heroRecipe} />
          {/* Gradient — top transparent → 88% bottom */}
          <View
            style={{
              position: 'absolute',
              left: 0, right: 0, top: 0, bottom: 0,
              backgroundColor: 'rgba(15,15,15,0.55)',
            }}
          />

          {/* Top-right badge */}
          <View
            style={{
              position: 'absolute',
              top: 12, right: 12,
              backgroundColor: 'rgba(15,15,15,0.68)',
              borderWidth: 1,
              borderColor: heroIsPlanned
                ? 'rgba(242,204,42,0.4)'
                : tokens.lineDark,
              borderRadius: 8,
              paddingHorizontal: 9, paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 9,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: heroIsPlanned ? tokens.gold : tokens.inkSoft,
              }}
            >
              {heroIsPlanned ? 'Tonight' : recipeCuisineLabel(heroRecipe) || 'Featured'}
            </Text>
          </View>

          {/* Bottom content */}
          <View
            style={{
              position: 'absolute',
              left: 0, right: 0, bottom: 0,
              padding: 14,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 10,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: tokens.gold,
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {recipeHeroEyebrow(heroRecipe)}
            </Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 19,
                color: tokens.ink,
                lineHeight: 22,
                marginBottom: 6,
              }}
              numberOfLines={2}
            >
              {heroRecipe.title}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {heroRecipe.source?.chef ? (
                  <>
                    <Text style={metaText} numberOfLines={1}>
                      {heroRecipe.source.chef}
                    </Text>
                    <Text style={metaDot}>·</Text>
                  </>
                ) : null}
                <Text style={metaText}>{heroRecipe.time_min} min</Text>
                <Text style={metaDot}>·</Text>
                <Text style={metaText}>{heroRecipe.difficulty}</Text>
              </View>
              <View
                style={{
                  backgroundColor: tokens.primary,
                  borderRadius: 9,
                  paddingHorizontal: 11,
                  paddingVertical: 5,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.sansBold,
                    fontSize: 10,
                    color: tokens.onPrimary,
                    letterSpacing: 0.2,
                  }}
                >
                  {heroIsPlanned ? 'Cook →' : 'Plan +'}
                </Text>
              </View>
            </View>
          </View>
          {/* Pagination dots — build #121 slideshow indicator. Only renders when 2+ recipes in pool. */}
          {heroPool.length >= 2 ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0, right: 0, bottom: 10,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 5,
              }}
            >
              {heroPool.slice(0, Math.min(heroPool.length, 8)).map((r, i) => {
                const isActive = i === (heroIdx % heroPool.length);
                // When heroPool has more than 8 recipes, fold the trailing positions into the last dot
                // so the row never overflows. Active still highlights correctly inside the visible 8.
                const showActive = isActive || (heroPool.length > 8 && i === 7 && heroIdx >= 7);
                return (
                  <View
                    key={r.id}
                    style={{
                      width: showActive ? 14 : 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: showActive ? tokens.gold : 'rgba(245,242,236,0.45)',
                    }}
                  />
                );
              })}
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {/* ── CATEGORY TILES ────────────────────────────────────────────────── */}
      <Text
        style={{
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: 8,
          fontFamily: fonts.sansBold,
          fontSize: 11,
          color: tokens.inkSoft,
          letterSpacing: 0.3,
        }}
      >
        Browse by cuisine
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 9, paddingHorizontal: 18, paddingBottom: 4 }}
        keyboardShouldPersistTaps="handled"
      >
        {visibleCategories.map((cat) => {
          const active = cat.id === category;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setCategory(cat.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={cat.label}
              style={{
                width: 62,
                paddingTop: 9,
                paddingBottom: 7,
                paddingHorizontal: 4,
                backgroundColor: active ? tokens.primary : tokens.cream,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: active ? tokens.primary : tokens.lineDark,
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 20, lineHeight: 22 }}>{cat.emoji}</Text>
              <Text
                style={{
                  fontFamily: active ? fonts.sansBold : fonts.sans,
                  fontSize: 9,
                  textAlign: 'center',
                  color: active ? tokens.onPrimary : tokens.inkSoft,
                  lineHeight: 11,
                }}
                numberOfLines={1}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── RECIPE LIST HEADER ─────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 18,
          paddingTop: 14,
          paddingBottom: 10,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 12,
            color: tokens.ink,
          }}
        >
          {category === 'all' ? 'All recipes' : CUISINE_LABELS[category as CuisineId] ?? 'Recipes'}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted }}>
          {results.length} {results.length === 1 ? 'recipe' : 'recipes'}
        </Text>
      </View>

      {/* ── RECIPE ROWS ────────────────────────────────────────────────────── */}
      {listResults.length > 0 ? (
        <View style={{ paddingHorizontal: 18, gap: 8 }}>
          {listResults.map((r) => (
            <RecipeRow
              key={r.id}
              recipe={r}
              isPlanned={plannedIds.has(r.id)}
              isFavorite={favoriteIds.has(r.id)}
              onPress={() => router.push(`/recipe/${r.id}` as never)}
            />
          ))}
        </View>
      ) : (
        <View
          style={{
            marginHorizontal: 18,
            marginTop: 12,
            paddingVertical: 32,
            paddingHorizontal: 24,
            backgroundColor: tokens.cream,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: tokens.lineDark,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: fonts.display, fontSize: 16, color: tokens.ink, marginBottom: 4 }}>
            Nothing here yet
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 12,
              color: tokens.muted,
              textAlign: 'center',
              lineHeight: 17,
              maxWidth: 240,
            }}
          >
            Clear the search or pick a different cuisine to see more.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// HeroBackground — recipe.hero_url with image fallback to gradient bands
// ────────────────────────────────────────────────────────────────────────────

function HeroBackground({ recipe }: { recipe: Recipe }) {
  // Build #113 — render hero_url as a real Image when set; fall back to the
  // gradient-bands + emoji combo when it's absent. Previously the Hero card
  // ALWAYS rendered the gradient even when a CC-approved photo URL was
  // available, so Patrick saw flat colour cards instead of the Carbonara /
  // Falafel / Pavlova hero photos that had been wired into seed-recipes.ts.
  if (recipe.hero_url) {
    return (
      <View style={{ position: 'absolute', inset: 0 as unknown as number, width: '100%', height: '100%' }}>
        <Image
          source={{ uri: recipe.hero_url }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={220}
        />
      </View>
    );
  }
  const bands = recipe.hero_fallback ?? [tokens.bgDeep, tokens.cream, tokens.bgDeep];
  return (
    <View style={{ position: 'absolute', inset: 0 as unknown as number, width: '100%', height: '100%' }}>
      <View style={{ flex: 1, backgroundColor: bands[0] }} />
      <View style={{ flex: 1, backgroundColor: bands[1] }} />
      <View style={{ flex: 1, backgroundColor: bands[2] }} />
      {recipe.emoji ? (
        <Text
          style={{
            position: 'absolute',
            bottom: 40, right: 18,
            fontSize: 64,
            opacity: 0.22,
          }}
        >
          {recipe.emoji}
        </Text>
      ) : null}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// RecipeRow — list row per the Editorial spec
// ────────────────────────────────────────────────────────────────────────────

function RecipeRow({
  recipe,
  isPlanned,
  isFavorite: _isFavorite,
  onPress,
}: {
  recipe: Recipe;
  isPlanned: boolean;
  isFavorite: boolean;
  onPress: () => void;
}) {
  const cuisine = recipeCuisineLabel(recipe);
  const bands = recipe.hero_fallback ?? [tokens.bgDeep, tokens.cream, tokens.bgDeep];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${recipe.title}. ${recipe.time_min} minutes. ${recipe.difficulty}.`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: tokens.cream,
        borderRadius: 14,
        padding: 11,
        borderWidth: 1,
        borderColor: tokens.line,
      }}
    >
      {/* Thumbnail */}
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: 10,
          overflow: 'hidden',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {recipe.hero_url ? (
          <Image
            source={{ uri: recipe.hero_url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            transition={180}
          />
        ) : (
          <>
            <View style={{ flex: 1, alignSelf: 'stretch', backgroundColor: bands[0] }} />
            <View style={{ flex: 1, alignSelf: 'stretch', backgroundColor: bands[1] }} />
            <View style={{ flex: 1, alignSelf: 'stretch', backgroundColor: bands[2] }} />
            {recipe.emoji ? (
              <Text
                style={{
                  position: 'absolute',
                  fontSize: 26,
                  opacity: 0.92,
                }}
              >
                {recipe.emoji}
              </Text>
            ) : null}
          </>
        )}
      </View>

      {/* Body */}
      <View style={{ flex: 1, minWidth: 0 }}>
        {cuisine ? (
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 9,
              color: tokens.gold,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              marginBottom: 3,
            }}
            numberOfLines={1}
          >
            {cuisine}
          </Text>
        ) : null}
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 14,
            color: tokens.ink,
            lineHeight: 17,
            marginBottom: 4,
          }}
          numberOfLines={1}
        >
          {recipe.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          {recipe.source?.chef ? (
            <>
              <Text style={metaSmall} numberOfLines={1}>
                {recipe.source.chef}
              </Text>
              <Text style={metaSmallDot}>·</Text>
            </>
          ) : null}
          <Text style={metaSmall}>{recipe.time_min} min</Text>
          <Text style={metaSmallDot}>·</Text>
          <Text style={metaSmall}>{recipe.difficulty}</Text>
          {isPlanned ? (
            <View
              style={{
                marginLeft: 4,
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 20,
                backgroundColor: tokens.goldDim,
                borderWidth: 1,
                borderColor: 'rgba(242,204,42,0.3)',
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 8.5,
                  color: tokens.gold,
                  letterSpacing: 0.2,
                }}
              >
                Planned
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Chevron */}
      <Text style={{ fontSize: 16, color: tokens.muted, fontFamily: fonts.sans }}>›</Text>
    </Pressable>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Shared text styles
// ────────────────────────────────────────────────────────────────────────────

const metaText = {
  fontFamily: fonts.sans,
  fontSize: 10,
  color: 'rgba(245,239,232,0.65)',
};
const metaDot = {
  fontFamily: fonts.sans,
  fontSize: 10,
  color: 'rgba(245,239,232,0.25)',
};
const metaSmall = {
  fontFamily: fonts.sans,
  fontSize: 10,
  color: tokens.muted,
};
const metaSmallDot = {
  fontFamily: fonts.sans,
  fontSize: 10,
  color: tokens.lineDark as unknown as string,
};
