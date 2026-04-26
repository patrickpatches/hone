/**
 * Kitchen (Home) — matches hone.html Home component exactly.
 *
 * - Sticky parchment header: "Hone" title + italic tagline + Saved button
 * - Search bar: cardBg with inkFaint search icon
 * - Cuisine chips: paprika when active (#C4422A)
 * - Type chips: ink when active (#1C1712)
 * - Recipe grid: single column RecipeCards
 *
 * BUG-002 fix: keyboardShouldPersistTaps="handled" on FlatList.
 * AddToPlanSheet rendered outside FlatList to avoid Modal-in-footer instability.
 */
import React, { useEffect, useMemo, useState } from 'react';
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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import type { Recipe } from '../../src/data/types';
import { getAllRecipes, getFavoriteIds, toggleFavorite } from '../../db/database';
import { RecipeCard } from '../../src/components/RecipeCard';
import { AddToPlanSheet } from '../../src/components/AddToPlanSheet';
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
  { id: 'filipino',   label: 'Filipino',     emoji: '🍚' },
];

const TYPES = [
  { id: 'burgers',    label: 'Burgers',        emoji: '🍔' },
  { id: 'chicken',    label: 'Chicken',         emoji: '🍗' },
  { id: 'seafood',    label: 'Seafood',         emoji: '🦐' },
  { id: 'beef',       label: 'Beef',            emoji: '🥩' },
  { id: 'lamb',       label: 'Lamb',            emoji: '🐑' },
  { id: 'vegetarian', label: 'Vegetarian',      emoji: '🌱' },
  { id: 'pasta',      label: 'Pasta & Noodles', emoji: '🍝' },
  { id: 'soups',      label: 'Soups & Stews',   emoji: '🍲' },
  { id: 'salads',     label: 'Salads',          emoji: '🥗' },
  { id: 'baking',     label: 'Baking & Bread',  emoji: '🍞' },
  { id: 'eggs',       label: 'Eggs',            emoji: '🥚' },
];

// ── List header ───────────────────────────────────────────────────────────────

function ListHeader({
  recipeCount,
  search,
  setSearch,
  showFavs,
  setShowFavs,
  cuisine,
  setCuisine,
  type,
  setType,
  recipes,
  onClear,
}: {
  recipeCount: number;
  search: string;
  setSearch: (s: string) => void;
  showFavs: boolean;
  setShowFavs: (v: boolean) => void;
  cuisine: string | null;
  setCuisine: (c: string | null) => void;
  type: string | null;
  setType: (t: string | null) => void;
  recipes: Recipe[];
  onClear: () => void;
}) {
  const isSearching = search.length > 0;
  const hasFilter = !!(cuisine || type || showFavs);

  return (
    <View
      style={{
        backgroundColor: tokens.bg,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: tokens.line,
        marginHorizontal: -20,
        paddingHorizontal: 20,
        marginBottom: 16,
      }}
    >
      {/* Title row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
        <View>
          <Text
            style={{
              fontFamily: fonts.displayBold,
              fontSize: 34,
              lineHeight: 36,
              letterSpacing: -0.9,
              color: tokens.ink,
            }}
          >
            Hone
          </Text>
          <Text
            style={{
              fontFamily: fonts.displayItalic ?? fonts.display,
              fontSize: 13,
              color: tokens.inkSoft,
              marginTop: 5,
            }}
          >
            cook like a chef, every night.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {hasFilter && (
            <Pressable
              onPress={onClear}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: pressed ? tokens.lineDark : tokens.line,
              })}
            >
              <Icon name="x" size={11} color={tokens.inkSoft} />
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: tokens.inkSoft }}>
                Clear
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => { Haptics.selectionAsync().catch(() => {}); setShowFavs(!showFavs); }}
            accessibilityLabel={showFavs ? 'Show all recipes' : 'Show saved only'}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: showFavs ? tokens.paprika : tokens.cardBg,
              borderWidth: 1,
              borderColor: showFavs ? tokens.paprika : tokens.line,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Icon name="heart" size={13} color={showFavs ? '#FDF9F3' : tokens.ink} fill={showFavs} />
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 11,
                color: showFavs ? '#FDF9F3' : tokens.ink,
              }}
            >
              Saved
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Search bar */}
      <View style={{ position: 'relative', marginBottom: 12 }}>
        <View style={{ position: 'absolute', left: 12, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 }}>
          <Icon name="search" size={16} color={tokens.muted} />
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search dishes, chefs, or ingredients…"
          placeholderTextColor={tokens.muted}
          style={{
            fontFamily: fonts.sans,
            fontSize: 14,
            color: tokens.ink,
            backgroundColor: tokens.cardBg,
            borderWidth: 1,
            borderColor: tokens.line,
            borderRadius: 14,
            paddingLeft: 40,
            paddingRight: search ? 40 : 14,
            paddingVertical: 12,
          }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {!!search && (
          <Pressable
            onPress={() => setSearch('')}
            style={{
              position: 'absolute',
              right: 10,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              padding: 4,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: tokens.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="x" size={11} color={tokens.inkSoft} />
            </View>
          </Pressable>
        )}
      </View>

      {/* Filters — only show when not searching (matches hone.html) */}
      {!isSearching && (
        <>
          {/* By cuisine */}
          <View style={{ marginBottom: 10 }}>
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 10,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: tokens.muted,
                marginBottom: 8,
              }}
            >
              By cuisine
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
              style={{ marginHorizontal: -20 }}
              contentInset={{ left: 20, right: 20 }}
              contentOffset={{ x: -20, y: 0 }}
            >
              <View style={{ width: 20 }} />
              {CUISINES.filter((c) =>
                recipes.some((r) => r.categories?.cuisines?.includes(c.id as any))
              ).map((c) => {
                const active = cuisine === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setCuisine(active ? null : c.id);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 999,
                      backgroundColor: active
                        ? tokens.paprika
                        : pressed
                        ? tokens.bgDeep
                        : tokens.cardBg,
                      borderWidth: 1,
                      borderColor: active ? tokens.paprika : tokens.line,
                      shadowColor: tokens.paprika,
                      shadowOpacity: active ? 0.25 : 0,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: active ? 3 : 0,
                    })}
                  >
                    <Text style={{ fontSize: 13 }}>{c.emoji}</Text>
                    <Text
                      style={{
                        fontFamily: fonts.sansBold,
                        fontSize: 11,
                        color: active ? '#FDF9F3' : tokens.muted,
                      }}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
              <View style={{ width: 20 }} />
            </ScrollView>
          </View>

          {/* By type */}
          <View>
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 10,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: tokens.muted,
                marginBottom: 8,
              }}
            >
              By type
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
              style={{ marginHorizontal: -20 }}
              contentInset={{ left: 20, right: 20 }}
              contentOffset={{ x: -20, y: 0 }}
            >
              <View style={{ width: 20 }} />
              {TYPES.filter((t) =>
                recipes.some((r) => r.categories?.types?.includes(t.id as any))
              ).map((t) => {
                const active = type === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setType(active ? null : t.id);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 999,
                      backgroundColor: active
                        ? tokens.ink
                        : pressed
                        ? tokens.bgDeep
                        : tokens.cardBg,
                      borderWidth: 1,
                      borderColor: active ? tokens.ink : tokens.line,
                      shadowColor: tokens.ink,
                      shadowOpacity: active ? 0.18 : 0,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: active ? 3 : 0,
                    })}
                  >
                    <Text style={{ fontSize: 13 }}>{t.emoji}</Text>
                    <Text
                      style={{
                        fontFamily: fonts.sansBold,
                        fontSize: 11,
                        color: active ? '#FDF9F3' : tokens.muted,
                      }}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
              <View style={{ width: 20 }} />
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

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
    <View style={{ paddingVertical: 80, alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: 14 }}>
        {showFavs ? '💛' : '🔍'}
      </Text>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 20,
          color: tokens.ink,
          marginBottom: 6,
        }}
      >
        {showFavs ? 'Nothing saved yet' : 'No results'}
      </Text>
      <Text
        style={{
          fontFamily: fonts.displayItalic ?? fonts.display,
          fontSize: 13,
          color: tokens.muted,
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        {showFavs
          ? 'Tap the heart on a recipe to save it here'
          : 'Try different filters or search terms'}
      </Text>
      {hasFilter && (
        <Pressable
          onPress={onClear}
          style={({ pressed }) => ({
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: pressed ? tokens.paprikaDeep : tokens.paprika,
          })}
        >
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: '#FDF9F3' }}>
            Clear all filters
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function KitchenHome() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [search,      setSearch]      = useState('');
  const [recipes,     setRecipes]     = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading,     setLoading]     = useState(true);
  const [showFavs,    setShowFavs]    = useState(false);
  const [cuisine,     setCuisine]     = useState<string | null>(null);
  const [type,        setType]        = useState<string | null>(null);
  const [planTarget,  setPlanTarget]  = useState<Recipe | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [all, favs] = await Promise.all([getAllRecipes(db), getFavoriteIds(db)]);
        if (!cancelled) {
          setRecipes(all);
          setFavoriteIds(favs);
          setLoading(false);
        }
      } catch (err) {
        console.error('KitchenHome load error:', err);
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [db]);

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavorite(db, id);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (err) {
      console.error('toggleFavorite error:', err);
    }
  };

  const results = useMemo(() => {
    let list = recipes;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.tagline.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)) ||
          (r.source?.chef ?? '').toLowerCase().includes(q),
      );
    }
    if (showFavs)  list = list.filter((r) => favoriteIds.has(r.id));
    if (cuisine) {
      const c = cuisine as import('../../src/data/types').CuisineId;
      list = list.filter((r) => r.categories?.cuisines?.includes(c));
    }
    if (type) {
      const t = type as import('../../src/data/types').TypeId;
      list = list.filter((r) => r.categories?.types?.includes(t));
    }
    return list;
  }, [recipes, search, showFavs, cuisine, type, favoriteIds]);

  const hasActiveFilter = showFavs || cuisine !== null || type !== null || search.trim() !== '';

  const clearAll = () => {
    setSearch('');
    setShowFavs(false);
    setCuisine(null);
    setType(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.paprika} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={results}
        keyExtractor={(r) => r.id}
        // BUG-002 fix
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 140,
          backgroundColor: tokens.bg,
        }}
        style={{ backgroundColor: tokens.bg }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ListHeader
            recipeCount={recipes.length}
            search={search}
            setSearch={setSearch}
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
              isPlanned={false}
              onPress={() => router.push(`/recipe/${item.id}`)}
              onFavorite={() => handleToggleFavorite(item.id)}
              onPlan={() => setPlanTarget(item)}
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
      {/* AddToPlanSheet OUTSIDE FlatList to prevent Modal-in-footer instability */}
      {planTarget && (
        <AddToPlanSheet
          recipe={planTarget}
          onClose={() => setPlanTarget(null)}
        />
      )}
    </>
  );
}
