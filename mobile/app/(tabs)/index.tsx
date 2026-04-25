/**
 * Kitchen (Home) — the anchor screen.
 *
 * Filtering is dual-axis:
 *   1. Mood chips — All / Quick (≤30 min) / Weekend (≥90 min or Involved) /
 *      Favourites / Yours (user-added)
 *   2. Cuisine + Type horizontal scrollers (collapsed by default, expandable)
 *
 * All filtering is client-side against the in-memory recipe list. No network
 * calls. Recipe objects already carry categories: { cuisines[], types[] }.
 *
 * Design rationale:
 *   - Mood chips live above the cuisine/type rows because they answer
 *     "what am I up for tonight" before "what cuisine do I want" — the
 *     former is a faster, more instinctive decision.
 *   - Cuisine and type rows are always visible (not behind a button) because
 *     hiding them costs a tap on a screen users visit every session.
 *   - Active filters are dismissible via an × chip so users never get stuck
 *     in a zero-results state without knowing how to escape.
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

const CUISINES: { id: string; label: string; emoji: string }[] = [
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

const TYPES: { id: string; label: string; emoji: string }[] = [
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

type MoodFilter = 'all' | 'quick' | 'weekend' | 'favourites' | 'yours';

const MOOD_CHIPS: { id: MoodFilter; label: string }[] = [
  { id: 'all',        label: 'All'        },
  { id: 'quick',      label: 'Quick'      },
  { id: 'weekend',    label: 'Weekend'    },
  { id: 'favourites', label: 'Favourites' },
  { id: 'yours',      label: 'Yours'      },
];

// ── Main screen ───────────────────────────────────────────────────────────────

export default function KitchenHome() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [search,      setSearch]      = useState('');
  const [recipes,     setRecipes]     = useState<Recipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading,     setLoading]     = useState(true);
  const [mood,        setMood]        = useState<MoodFilter>('all');
  const [cuisine,     setCuisine]     = useState<string | null>(null);
  const [type,        setType]        = useState<string | null>(null);

  // Add-to-plan sheet state - one shared sheet across all cards.
  // null = closed; otherwise the recipe currently being planned.
  const [planTarget, setPlanTarget]   = useState<Recipe | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [all, favs] = await Promise.all([getAllRecipes(db), getFavoriteIds(db)]);
      if (!cancelled) {
        setRecipes(all);
        setFavoriteIds(favs);
        setLoading(false);
      }
    }
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [db]);

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(db, id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Combined filter ────────────────────────────────────────────────────────

  const results = useMemo(() => {
    let list = recipes;

    // Search
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

    // Mood
    if (mood === 'quick') {
      list = list.filter((r) => r.time_min <= 30);
    } else if (mood === 'weekend') {
      list = list.filter(
        (r) => r.time_min >= 90 || r.difficulty === 'Involved',
      );
    } else if (mood === 'favourites') {
      list = list.filter((r) => favoriteIds.has(r.id));
    } else if (mood === 'yours') {
      list = list.filter((r) => r.user_added);
    }

    // Cuisine — cast to CuisineId because values come from the CUISINES
    // constant which only contains valid IDs.
    if (cuisine) {
      const c = cuisine as import('../../src/data/types').CuisineId;
      list = list.filter((r) => r.categories?.cuisines?.includes(c));
    }

    // Type
    if (type) {
      const t = type as import('../../src/data/types').TypeId;
      list = list.filter((r) => r.categories?.types?.includes(t));
    }

    return list;
  }, [recipes, search, mood, cuisine, type, favoriteIds]);

  const hasActiveFilter = mood !== 'all' || cuisine !== null || type !== null || search.trim() !== '';

  const clearAll = () => {
    setSearch('');
    setMood('all');
    setCuisine(null);
    setType(null);
  };

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
        <ActivityIndicator color={tokens.paprika} />
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{
        paddingTop: insets.top + 24,
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
          mood={mood}
          setMood={(m) => {
            Haptics.selectionAsync().catch(() => {});
            setMood(m);
          }}
          cuisine={cuisine}
          setCuisine={(c) => {
            Haptics.selectionAsync().catch(() => {});
            setCuisine(c);
          }}
          type={type}
          setType={(t) => {
            Haptics.selectionAsync().catch(() => {});
            setType(t);
          }}
          hasActiveFilter={hasActiveFilter}
          onClearAll={clearAll}
        />
      }
      renderItem={({ item }) => (
        <View style={{ marginBottom: 16 }}>
          <RecipeCard
            recipe={item}
            onPress={(r) => router.push(`/recipe/${r.id}`)}
            favorite={favoriteIds.has(item.id)}
            onToggleFavorite={handleToggleFavorite}
            onAddToPlan={(r) => setPlanTarget(r)}
          />
        </View>
      )}
      ListEmptyComponent={
        <EmptyState hasFilter={hasActiveFilter} onClear={clearAll} />
      }
      ListFooterComponent={
        planTarget ? (
          <AddToPlanSheet
            visible={planTarget !== null}
            recipeId={planTarget.id}
            recipeTitle={planTarget.title}
            defaultServings={planTarget.base_servings}
            onClose={() => setPlanTarget(null)}
          />
        ) : null
      }
    />
  );
}

// ── List header ───────────────────────────────────────────────────────────────

function ListHeader({
  recipeCount,
  search,
  setSearch,
  mood,
  setMood,
  cuisine,
  setCuisine,
  type,
  setType,
  hasActiveFilter,
  onClearAll,
}: {
  recipeCount: number;
  search: string;
  setSearch: (s: string) => void;
  mood: MoodFilter;
  setMood: (m: MoodFilter) => void;
  cuisine: string | null;
  setCuisine: (c: string | null) => void;
  type: string | null;
  setType: (t: string | null) => void;
  hasActiveFilter: boolean;
  onClearAll: () => void;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      {/* Hero — compressed: one line, no kicker, count moves below the search */}
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 28,
          lineHeight: 32,
          color: tokens.ink,
        }}
      >
        What are you{' '}
        <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic' }}>
          cooking
        </Text>?
      </Text>

      {/* Search */}
      <View
        style={{
          marginTop: 20,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 16,
          backgroundColor: tokens.cream,
          borderWidth: 1,
          borderColor: tokens.line,
          gap: 10,
        }}
      >
        <Icon name="search" size={16} color={tokens.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="What are you in the mood for?"
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
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Icon name="x" size={14} color={tokens.muted} />
          </Pressable>
        ) : null}
      </View>

      {/* Recipe count — quiet line under the search */}
      <Text style={{ marginTop: 8, fontFamily: fonts.sans, fontSize: 12, color: tokens.muted }}>
        {recipeCount} recipes · chef-inspired, honestly adapted
      </Text>

      {/* Mood chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingTop: 16 }}
      >
        {MOOD_CHIPS.map((chip) => {
          const active = mood === chip.id;
          return (
            <Pressable
              key={chip.id}
              onPress={() => setMood(chip.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? tokens.paprika : pressed ? tokens.bgDeep : 'transparent',
                borderWidth: 1.5,
                borderColor: active ? tokens.paprika : tokens.line,
              })}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 12,
                  color: active ? tokens.cream : tokens.inkSoft,
                }}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Cuisine row */}
      <CategoryRow
        label="Cuisine"
        items={CUISINES}
        selected={cuisine}
        onSelect={(id) => setCuisine(id === cuisine ? null : id)}
      />

      {/* Type row */}
      <CategoryRow
        label="Type"
        items={TYPES}
        selected={type}
        onSelect={(id) => setType(id === type ? null : id)}
      />

      {/* Active-filter chip rail. One × chip per applied filter so the
          escape hatch is obvious, plus "Clear all" when more than one is on.
          Coloured paprika fill (not subtle border-only) so it reads as an
          action, not a label. */}
      {hasActiveFilter && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingTop: 12 }}
        >
          {search.trim() !== '' && (
            <FilterChip
              label={`"${search.trim().slice(0, 20)}"`}
              onClear={() => setSearch('')}
            />
          )}
          {mood !== 'all' && (
            <FilterChip
              label={MOOD_CHIPS.find((c) => c.id === mood)?.label ?? mood}
              onClear={() => setMood('all')}
            />
          )}
          {cuisine && (
            <FilterChip
              label={CUISINES.find((c) => c.id === cuisine)?.label ?? cuisine}
              onClear={() => setCuisine(null)}
            />
          )}
          {type && (
            <FilterChip
              label={TYPES.find((t) => t.id === type)?.label ?? type}
              onClear={() => setType(null)}
            />
          )}
          {([search.trim() !== '', mood !== 'all', cuisine !== null, type !== null].filter(Boolean).length > 1) && (
            <Pressable
              onPress={onClearAll}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: pressed ? tokens.inkSoft : tokens.ink,
              })}
            >
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.cream }}>
                Clear all
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// Single chip, paprika fill, × icon prefix. Tap clears just this filter.
function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Pressable
      onPress={onClear}
      accessibilityRole="button"
      accessibilityLabel={`Clear ${label} filter`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: pressed ? tokens.paprikaDeep : tokens.paprika,
      })}
    >
      <Icon name="x" size={12} color={tokens.cream} />
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.cream }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Category row ──────────────────────────────────────────────────────────────

function CategoryRow({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: { id: string; label: string; emoji: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: tokens.muted,
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {items.map((item) => {
          const active = selected === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Filter by ${item.label}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: active
                  ? tokens.ink
                  : pressed
                    ? tokens.bgDeep
                    : tokens.cream,
                borderWidth: 1,
                borderColor: active ? tokens.ink : tokens.line,
              })}
            >
              <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 12,
                  color: active ? tokens.cream : tokens.inkSoft,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  hasFilter,
  onClear,
}: {
  hasFilter: boolean;
  onClear: () => void;
}) {
  return (
    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
      <Text style={{ fontSize: 40, marginBottom: 8 }}>🍽️</Text>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 18,
          color: tokens.ink,
          marginBottom: 4,
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
          marginBottom: 16,
        }}
      >
        {hasFilter
          ? 'No recipes match those filters.'
          : 'Try a different search.'}
      </Text>
      {hasFilter && (
        <Pressable
          onPress={onClear}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: pressed ? tokens.paprikaDeep : tokens.paprika,
          })}
        >
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 13,
              color: tokens.cream,
            }}
          >
            Clear filters
          </Text>
        </Pressable>
      )}
    </View>
  );
}
