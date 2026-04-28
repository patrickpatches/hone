/**
 * Kitchen — the anchor tab.
 *
 * Editorial hero, search bar, filter chips, recipe card list.
 * Matches hone.html layout: kicker → headline → recipe count →
 * search → filter chips → cards.
 *
 * BUG-001 FIX: FlatList renders the header as part of the scroll
 * — no separate sticky header to fight with. The list content starts
 * from insets.top so nothing is obscured.
 *
 * BUG-002 FIX: keyboardShouldPersistTaps="handled" so the search bar
 * remains focusable through the FlatList.
 */
import React, { useEffect, useState } from 'react';
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
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { Recipe } from '../../src/data/types';
import {
  getAllRecipes,
  getFavoriteIds,
  toggleFavorite,
  getPlannedRecipeIds,
} from '../../db/database';
import { RecipeCard } from '../../src/components/RecipeCard';
import { Icon } from '../../src/components/Icon';
import { tokens, fonts, shadows } from '../../src/theme/tokens';

type Filter = 'All' | 'Quick' | 'Weekend' | 'Favourites' | 'Yours';

export default function KitchenHome() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [search, setSearch]           = useState('');
  const [recipes, setRecipes]         = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [plannedIds, setPlannedIds]   = useState<Set<string>>(new Set());
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<Filter>('All');

  // Initial load
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [all, favs, planned] = await Promise.all([
        getAllRecipes(db),
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
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [db]);

  // Refresh plan state when tab is focused (keep in sync with Plan tab toggles)
  useFocusEffect(
    React.useCallback(() => {
      getPlannedRecipeIds(db).then(setPlannedIds).catch(console.error);
    }, [db]),
  );

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(db, id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Filter + search
  const results = recipes.filter((r) => {
    // Text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hit =
        r.title.toLowerCase().includes(q) ||
        r.tagline.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        (r.source?.chef ?? '').toLowerCase().includes(q);
      if (!hit) return false;
    }
    // Chip filter
    switch (filter) {
      case 'Quick':       return r.time_min <= 30;
      case 'Weekend':     return r.time_min > 45;
      case 'Favourites':  return favoriteIds.has(r.id);
      case 'Yours':       return r.user_added;
      default:            return true;
    }
  });

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
        <ActivityIndicator color={tokens.primary} />
      </View>
    );
  }

  const FILTERS: Filter[] = ['All', 'Quick', 'Weekend', 'Favourites', 'Yours'];

  return (
    <FlatList
      data={results}
      keyExtractor={(r) => r.id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingHorizontal: 20,
        paddingBottom: 140,
        backgroundColor: tokens.bg,
      }}
      style={{ backgroundColor: tokens.bg }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={{ marginBottom: 20 }}>
          {/* Kicker */}
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: tokens.primary,
              marginBottom: 4,
            }}
          >
            A cooking companion
          </Text>

          {/* Hero headline */}
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 36,
              lineHeight: 40,
              color: tokens.ink,
            }}
          >
            What are you{'\n'}
            <Text
              style={{
                fontFamily: fonts.displayItalic,
                fontStyle: 'italic',
                color: tokens.primary,
              }}
            >
              cooking
            </Text>{' '}
            tonight?
          </Text>

          <Text
            style={{
              marginTop: 8,
              fontFamily: fonts.sans,
              fontSize: 12,
              color: tokens.muted,
            }}
          >
            {recipes.length} recipes · chef-inspired, honestly adapted
          </Text>

          {/* Search bar */}
          <View
            style={{
              marginTop: 20,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 13,
              borderRadius: 16,
              backgroundColor: tokens.cream,
              borderWidth: 1,
              borderColor: tokens.lineDark,
              gap: 10,
              ...shadows.card,
            }}
          >
            <Icon name="search" size={16} color={tokens.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search recipes, chefs, ingredients…"
              placeholderTextColor={tokens.muted}
              style={{
                flex: 1,
                color: tokens.ink,
                fontFamily: fonts.sans,
                fontSize: 14,
                padding: 0,
              }}
              returnKeyType="search"
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

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingTop: 14 }}
            keyboardShouldPersistTaps="handled"
          >
            {FILTERS.map((chip) => {
              const active = filter === chip;
              return (
                <Pressable
                  key={chip}
                  onPress={() => setFilter(chip)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    // Active: solid terracotta with a soft drop. Inactive:
                    // cream pill with a stronger border so the row reads as
                    // a row of equal-weight options rather than one solid
                    // chip floating in space.
                    backgroundColor: active ? tokens.primary : tokens.cream,
                    borderWidth: 1,
                    borderColor: active ? tokens.primary : tokens.lineDark,
                    ...(active ? shadows.card : null),
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.sansBold,
                      fontSize: 12,
                      color: active ? tokens.ink : tokens.inkSoft,
                    }}
                  >
                    {chip}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ marginBottom: 16 }}>
          <RecipeCard
            recipe={item}
            onPress={(r) => router.push(`/recipe/${r.id}`)}
            favorite={favoriteIds.has(item.id)}
            onToggleFavorite={handleToggleFavorite}
            isPlanned={plannedIds.has(item.id)}
          />
        </View>
      )}
      ListEmptyComponent={
        <View
          style={{
            marginTop: 24,
            paddingVertical: 36,
            paddingHorizontal: 24,
            backgroundColor: tokens.cream,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: tokens.line,
            alignItems: 'center',
            ...shadows.card,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: tokens.primaryLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 26 }}>🍽️</Text>
          </View>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 18,
              color: tokens.ink,
              marginBottom: 6,
            }}
          >
            Nothing matches
          </Text>
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 13,
              color: tokens.muted,
              textAlign: 'center',
              lineHeight: 18,
              maxWidth: 260,
            }}
          >
            Try clearing the search or switching the filter to see more.
          </Text>
        </View>
      }
    />
  );
}
