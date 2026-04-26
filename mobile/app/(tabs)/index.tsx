/**
 * Kitchen (Home) — matches hone.html Home component exactly.
 *
 * - Sticky parchment header: "Hone" title + italic tagline + Saved button
 * - Search bar: cardBg with inkFaint search icon
 * - Cuisine chips: paprika when active (#C4422A)
 * - Type chips: ink when active (#1C1712)
 * - Recipe grid: single column RecipeCards
 *
 * Plan is a simple toggle — exactly as in hone.html. No calendar sheet.
 * BUG-002 fix: keyboardShouldPersistTaps="handled" on FlatList.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import type { Recipe } from '../../src/data/types';
import {
  getAllRecipes,
  getFavoriteIds,
  toggleFavorite,
  getPlannedRecipeIds,
  togglePlannedRecipe,
} from '../../db/database';
import { RecipeCard } from '../../src/components/RecipeCard';
import { Icon } from '../../src/components/Icon';
import { tokens, fonts } from '../../src/theme/tokens';

// ── Taxonomy ──────────────────────────────────────────────────────────────────

const CUISINES = [
  { id: 'levantine',  label: 'Levantine',   emoji: '🫙' },
  { id: 'indian',     label: 'Indian',       emoji: '🍛' },
  { id: 'malaysian',  label: 'Malaysian',    emoji: '🍜' },
  { id: 'japanese',   label: 'Japanese',     emoji: '🍱' },
  { id: 'thai',       label: 'Thai',         emoji: '🌶️' },
  { id: 'italian',    label: 'Italian',      emoji: '🍝' },
  { id: 'french',     label: 'French',       emoji: '🥐' },
  { id: 'american',   label: 'American',     emoji: '🍔' },
  { id: 'australian', label: 'Australian',   emoji: '🦘' },
  { id: 'mexican',    label: 'Mexican',      emoji: '🌮' },
];

const TYPES = [
  { id: 'burgers',      label: 'Burgers' },
  { id: 'chicken',      label: 'Chicken' },
  { id: 'seafood',      label: 'Seafood' },
  { id: 'beef',         label: 'Beef' },
  { id: 'lamb',         label: 'Lamb' },
  { id: 'vegetarian',   label: 'Vegetarian' },
  { id: 'pasta',        label: 'Pasta & Noodles' },
  { id: 'soups',        label: 'Soups & Stews' },
  { id: 'salads',       label: 'Salads' },
  { id: 'baking',       label: 'Baking & Bread' },
];

// ── Filter / search logic ─────────────────────────────────────────────────────

function matchesCuisine(recipe: Recipe, cuisine: string): boolean {
  const cats = recipe.categories as any;
  if (!cats) return false;
  return (cats.cuisines ?? []).some(
    (c: string) => c.toLowerCase() === cuisine.toLowerCase(),
  );
}

function matchesType(recipe: Recipe, type: string): boolean {
  const cats = recipe.categories as any;
  if (!cats) return false;
  return (cats.types ?? []).some(
    (t: string) => t.toLowerCase() === type.toLowerCase(),
  );
}

function matchesQuery(recipe: Recipe, q: string): boolean {
  if (!q) return true;
  const hay = `${recipe.title} ${recipe.tagline} ${(recipe.categories as any)?.cuisines?.join(' ') ?? ''} ${(recipe.categories as any)?.types?.join(' ') ?? ''}`.toLowerCase();
  return q.toLowerCase().split(' ').every((w) => hay.includes(w));
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CuisineChip({
  item,
  active,
  onPress,
}: {
  item: (typeof CUISINES)[0];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        marginRight: 8,
        backgroundColor: active ? tokens.paprika : tokens.cardBg,
        borderWidth: 1,
        borderColor: active ? tokens.paprika : tokens.line,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 13,
          color: active ? '#FDF9F3' : tokens.inkSoft,
        }}
      >
        {item.emoji} {item.label}
      </Text>
    </Pressable>
  );
}

function TypeChip({
  item,
  active,
  onPress,
}: {
  item: (typeof TYPES)[0];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        marginRight: 8,
        backgroundColor: active ? tokens.ink : tokens.cardBg,
        borderWidth: 1,
        borderColor: active ? tokens.ink : tokens.line,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 13,
          color: active ? '#FDF9F3' : tokens.inkSoft,
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

function EmptyState({
  showFavs,
  hasFilter,
  onClear,
}: {
  showFavs: boolean;
  hasFilter: boolean;
  onClear: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 40, marginBottom: 16 }}>
        {showFavs ? '💛' : '🔍'}
      </Text>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 22,
          color: tokens.ink,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {showFavs ? 'No saved recipes yet' : 'No recipes found'}
      </Text>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 14,
          color: tokens.muted,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        {showFavs
          ? 'Tap the heart on any recipe to save it here.'
          : 'Try a different search or clear the filters.'}
      </Text>
      {hasFilter && (
        <Pressable
          onPress={onClear}
          style={{
            marginTop: 20,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: tokens.paprika,
          }}
        >
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: '#FDF9F3' }}>
            Clear filters
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function FilterHeader({
  query,
  setQuery,
  showFavs,
  setShowFavs,
  cuisine,
  setCuisine,
  type,
  setType,
  recipes,
  onClear,
}: {
  query: string;
  setQuery: (v: string) => void;
  showFavs: boolean;
  setShowFavs: (v: boolean) => void;
  cuisine: string | null;
  setCuisine: (v: string | null) => void;
  type: string | null;
  setType: (v: string | null) => void;
  recipes: Recipe[];
  onClear: () => void;
}) {
  const hasFilter = !!(query || showFavs || cuisine || type);
  return (
    <View>
      {/* Search bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: tokens.cardBg,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: tokens.line,
          marginBottom: 14,
        }}
      >
        <Icon name="search" size={16} color={tokens.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search recipes…"
          placeholderTextColor={tokens.muted}
          style={{
            flex: 1,
            marginLeft: 8,
            fontFamily: fonts.sans,
            fontSize: 15,
            color: tokens.ink,
          }}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Icon name="x" size={16} color={tokens.muted} />
          </Pressable>
        )}
      </View>

      {/* Saved + Clear row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 }}>
        <Pressable
          onPress={() => { Haptics.selectionAsync().catch(() => {}); setShowFavs(!showFavs); }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: showFavs ? tokens.paprika : tokens.cardBg,
            borderWidth: 1,
            borderColor: showFavs ? tokens.paprika : tokens.line,
          }}
        >
          <Icon name="heart" size={13} color={showFavs ? '#FDF9F3' : tokens.inkSoft} fill={showFavs} />
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: showFavs ? '#FDF9F3' : tokens.inkSoft }}>
            Saved
          </Text>
        </Pressable>

        {hasFilter && (
          <Pressable
            onPress={onClear}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: tokens.paprikaLight,
              borderWidth: 1,
              borderColor: tokens.paprika,
            }}
          >
            <Icon name="x" size={12} color={tokens.paprika} />
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: tokens.paprika }}>
              Clear
            </Text>
          </Pressable>
        )}

        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: tokens.muted, marginLeft: 'auto' as any }}>
          {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Cuisine chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
        {CUISINES.map((c) => (
          <CuisineChip
            key={c.id}
            item={c}
            active={cuisine === c.id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setCuisine(cuisine === c.id ? null : c.id);
            }}
          />
        ))}
      </ScrollView>

      {/* Type chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {TYPES.map((t) => (
          <TypeChip
            key={t.id}
            item={t}
            active={type === t.id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setType(type === t.id ? null : t.id);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function KitchenScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [plannedIds, setPlannedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filter state
  const [query, setQuery] = useState('');
  const [showFavs, setShowFavs] = useState(false);
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);

  const hasActiveFilter = !!(query || showFavs || cuisine || type);

  const loadData = useCallback(async () => {
    const [recipes, favIds, planIds] = await Promise.all([
      getAllRecipes(db),
      getFavoriteIds(db),
      getPlannedRecipeIds(db),
    ]);
    setAllRecipes(recipes);
    setFavoriteIds(new Set(favIds));
    setPlannedIds(new Set(planIds));
    setLoading(false);
  }, [db]);

  useEffect(() => { loadData(); }, [loadData]);

  // Refresh planned state when tab is focused (e.g. toggled from recipe detail)
  useFocusEffect(
    useCallback(() => {
      getPlannedRecipeIds(db).then((ids) => setPlannedIds(new Set(ids)));
      getFavoriteIds(db).then((ids) => setFavoriteIds(new Set(ids)));
    }, [db]),
  );

  const clearAll = useCallback(() => {
    setQuery('');
    setShowFavs(false);
    setCuisine(null);
    setType(null);
  }, []);

  const handleToggleFavorite = useCallback(async (recipeId: string) => {
    Haptics.selectionAsync().catch(() => {});
    await toggleFavorite(db, recipeId);
    const ids = await getFavoriteIds(db);
    setFavoriteIds(new Set(ids));
  }, [db]);

  const handleTogglePlan = useCallback(async (recipe: Recipe) => {
    Haptics.selectionAsync().catch(() => {});
    await togglePlannedRecipe(db, recipe.id, recipe.base_servings);
    const ids = await getPlannedRecipeIds(db);
    setPlannedIds(new Set(ids));
  }, [db]);

  const recipes = useMemo(() => {
    let list = allRecipes;
    if (showFavs) list = list.filter((r) => favoriteIds.has(r.id));
    if (cuisine) list = list.filter((r) => matchesCuisine(r, cuisine));
    if (type) list = list.filter((r) => matchesType(r, type));
    if (query) list = list.filter((r) => matchesQuery(r, query));
    return list;
  }, [allRecipes, favoriteIds, showFavs, cuisine, type, query]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={tokens.paprika} />
      </View>
    );
  }

  return (
    <>
      {/* Sticky header */}
      <View
        style={{
          backgroundColor: tokens.bg,
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: tokens.line,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 28,
            color: tokens.ink,
            letterSpacing: -0.5,
          }}
        >
          Kitchen
        </Text>
        <Text
          style={{
            fontFamily: fonts.displayItalic,
            fontSize: 14,
            color: tokens.muted,
            marginTop: 2,
          }}
        >
          cook like a chef, every night.
        </Text>
      </View>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 100,
        }}
        style={{ flex: 1, backgroundColor: tokens.bg }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <FilterHeader
            query={query}
            setQuery={setQuery}
            showFavs={showFavs}
            setShowFavs={setShowFavs}
            cuisine={cuisine}
            setCuisine={setCuisine}
            type={type}
            setType={setType}
            recipes={recipes}
            onClear={clearAll}
          />
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 16 }}>
            <RecipeCard
              recipe={item}
              isFavorite={favoriteIds.has(item.id)}
              isPlanned={plannedIds.has(item.id)}
              onPress={() => router.push(`/recipe/${item.id}`)}
              onFavorite={() => handleToggleFavorite(item.id)}
              onPlan={() => handleTogglePlan(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            showFavs={showFavs}
            hasFilter={hasActiveFilter}
            onClear={clearAll}
          />
        }
      />
    </>
  );
}
