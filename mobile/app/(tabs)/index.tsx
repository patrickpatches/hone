/**
 * Kitchen (Home) — the anchor screen. v2 pastel-retro.
 *
 * BUG-002 fix: added keyboardShouldPersistTaps="handled" to the FlatList
 * so focus on the search TextInput never gets intercepted by the scroll
 * gesture system — the most common cause of "tap TextInput → crash/dismiss"
 * in React Native FlatLists.
 *
 * Design v2:
 *   - Mood chips now carry their own pastel colour when active, rather than
 *     all using the same paprika red. Quick=butter, Weekend=lavender,
 *     Favourites=rose, Yours=sky.
 *   - Cuisine chips use sage when active, Type chips use peach.
 *   - Clear-filters chip is now coloured (rose) so it's actually visible.
 *   - Search bar border highlights in peach on active filter state.
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

type MoodChip = {
  id: MoodFilter;
  label: string;
  activeBg: string;
  activeText: string;
};

const MOOD_CHIPS: MoodChip[] = [
  { id: 'all',        label: 'All',        activeBg: tokens.ink,      activeText: tokens.cream },
  { id: 'quick',      label: 'Quick',      activeBg: tokens.butter,   activeText: '#fff' },
  { id: 'weekend',    label: 'Weekend',    activeBg: tokens.lavender, activeText: '#fff' },
  { id: 'favourites', label: 'Favourites', activeBg: tokens.rose,     activeText: '#fff' },
  { id: 'yours',      label: 'Yours',      activeBg: tokens.sky,      activeText: '#fff' },
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
    if (mood === 'quick')      list = list.filter((r) => r.time_min <= 30);
    else if (mood === 'weekend') list = list.filter((r) => r.time_min >= 90 || r.difficulty === 'Involved');
    else if (mood === 'favourites') list = list.filter((r) => favoriteIds.has(r.id));
    else if (mood === 'yours') list = list.filter((r) => r.user_added);
    if (cuisine) {
      const c = cuisine as import('../../src/data/types').CuisineId;
      list = list.filter((r) => r.categories?.cuisines?.includes(c));
    }
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
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.peach} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={results}
        keyExtractor={(r) => r.id}
        // BUG-002 fix: without this, tapping a TextInput inside the list
        // header can get swallowed by the scroll responder and cause a
        // focus failure (or crash on some RN versions).
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
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
            setMood={(m) => { Haptics.selectionAsync().catch(() => {}); setMood(m); }}
            cuisine={cuisine}
            setCuisine={(c) => { Haptics.selectionAsync().catch(() => {}); setCuisine(c); }}
            type={type}
            setType={(t) => { Haptics.selectionAsync().catch(() => {}); setType(t); }}
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
        ListEmptyComponent={<EmptyState hasFilter={hasActiveFilter} onClear={clearAll} />}
      />

      {/* Render plan sheet outside FlatList to avoid modal-in-footer issues */}
      {planTarget ? (
        <AddToPlanSheet
          visible
          recipeId={planTarget.id}
          recipeTitle={planTarget.title}
          defaultServings={planTarget.base_servings}
          onClose={() => setPlanTarget(null)}
        />
      ) : null}
    </>
  );
}

// ── List header ───────────────────────────────────────────────────────────────

function ListHeader({
  recipeCount, search, setSearch,
  mood, setMood, cuisine, setCuisine, type, setType,
  hasActiveFilter, onClearAll,
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
      {/* Kicker */}
      <Text style={{
        fontFamily: fonts.sansBold, fontSize: 11,
        letterSpacing: 2, textTransform: 'uppercase',
        color: tokens.peach, marginBottom: 4,
      }}>
        A cooking companion
      </Text>

      {/* Hero headline */}
      <Text style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 40, color: tokens.ink }}>
        What are you{'\n'}
        <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic' }}>cooking</Text>
        {' '}tonight?
      </Text>

      <Text style={{ marginTop: 6, fontFamily: fonts.sans, fontSize: 12, color: tokens.muted }}>
        {recipeCount} recipes · chef-inspired, honestly adapted
      </Text>

      {/* Search bar */}
      <View style={{
        marginTop: 18,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 11,
        borderRadius: 16,
        backgroundColor: tokens.cream,
        borderWidth: 1.5,
        borderColor: search ? tokens.peach : tokens.line,
        gap: 10,
      }}>
        <Icon name="search" size={16} color={search ? tokens.peach : tokens.muted} />
        <TextInput
          value={search}
          onChangeText={(text) => {
            try { setSearch(text); } catch (e) { console.error('search error', e); }
          }}
          placeholder="Search recipes, chefs, ingredients..."
          placeholderTextColor={tokens.muted}
          style={{
            flex: 1, color: tokens.ink,
            fontFamily: fonts.sans, fontSize: 14, padding: 0,
          }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
            <Icon name="x" size={14} color={tokens.muted} />
          </Pressable>
        ) : null}
      </View>

      {/* Mood chips — each with its own pastel active colour */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 14 }}>
        {MOOD_CHIPS.map((chip) => {
          const active = mood === chip.id;
          return (
            <Pressable
              key={chip.id}
              onPress={() => setMood(chip.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? chip.activeBg : pressed ? tokens.bgDeep : tokens.cream,
                borderWidth: 1.5,
                borderColor: active ? chip.activeBg : tokens.line,
              })}
            >
              <Text style={{
                fontFamily: fonts.sansBold, fontSize: 12,
                color: active ? chip.activeText : tokens.inkSoft,
              }}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Cuisine row — sage when active */}
      <CategoryRow label="Cuisine" items={CUISINES} selected={cuisine} activeColor={tokens.sage} onSelect={(id) => setCuisine(id === cuisine ? null : id)} />

      {/* Type row — peach when active */}
      <CategoryRow label="Type" items={TYPES} selected={type} activeColor={tokens.peach} onSelect={(id) => setType(id === type ? null : id)} />

      {/* Clear filter — rose pill so it stands out */}
      {hasActiveFilter && (
        <Pressable
          onPress={onClearAll}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
          style={({ pressed }) => ({
            marginTop: 12, alignSelf: 'flex-start',
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 14, paddingVertical: 7,
            borderRadius: 999,
            backgroundColor: pressed ? tokens.roseDeep : tokens.rose,
          })}
        >
          <Icon name="x" size={11} color="#fff" />
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: '#fff' }}>Clear filters</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Category row ──────────────────────────────────────────────────────────────

function CategoryRow({
  label, items, selected, activeColor, onSelect,
}: {
  label: string;
  items: { id: string; label: string; emoji: string }[];
  selected: string | null;
  activeColor: string;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{
        fontFamily: fonts.sansBold, fontSize: 10,
        letterSpacing: 1.5, textTransform: 'uppercase',
        color: tokens.muted, marginBottom: 8,
      }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
                flexDirection: 'row', alignItems: 'center', gap: 6,
                paddingHorizontal: 12, paddingVertical: 7,
                borderRadius: 12,
                backgroundColor: active ? activeColor : pressed ? tokens.bgDeep : tokens.cream,
                borderWidth: 1,
                borderColor: active ? activeColor : tokens.line,
              })}
            >
              <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
              <Text style={{
                fontFamily: fonts.sansBold, fontSize: 12,
                color: active ? '#fff' : tokens.inkSoft,
              }}>
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

function EmptyState({ hasFilter, onClear }: { hasFilter: boolean; onClear: () => void }) {
  return (
    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
      <Text style={{ fontSize: 40, marginBottom: 8 }}>🍽️</Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 18, color: tokens.ink, marginBottom: 4 }}>
        Nothing matches
      </Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: tokens.muted, textAlign: 'center', marginBottom: 16 }}>
        {hasFilter ? 'No recipes match those filters.' : 'Try a different search.'}
      </Text>
      {hasFilter && (
        <Pressable
          onPress={onClear}
          style={({ pressed }) => ({
            paddingHorizontal: 18, paddingVertical: 11,
            borderRadius: 999,
            backgroundColor: pressed ? tokens.roseDeep : tokens.rose,
          })}
        >
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: '#fff' }}>Clear filters</Text>
        </Pressable>
      )}
    </View>
  );
}
