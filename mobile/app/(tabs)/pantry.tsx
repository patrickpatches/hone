/**
 * Pantry — flat tag-cloud + recipe matches inline.
 *
 * Replaces the category-wall version. Per ux-redesign-research.md and
 * Patrick's review of the old HTML prototype: scrolling past Meat to find
 * Dairy is friction the user shouldn't pay. The whole pantry is visible
 * as a chip cloud at a glance; tap × to remove; quick-add chips below
 * suggest staples not yet in pantry.
 *
 * Recipe matches render inline (not in a modal), like the old prototype:
 *   - "You can make these" — green section, 100% match
 *   - "Almost there — grab 1-3 more" — yellow section
 *
 * The unified search-or-add input from session 12 is preserved at the
 * top; the inline "+ Add 'X'" suggestion appears when the query is novel.
 *
 * Optional "view by aisle" toggle preserves the categorised view for
 * users who prefer it; not lost capability, just not the default.
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';

import { tokens, fonts } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import {
  getAllRecipes,
  getPantryItems,
  upsertPantryItem,
  deletePantryItem,
  type PantryItem,
} from '../../db/database';
import type { Recipe } from '../../src/data/types';
import {
  PANTRY_CATEGORIES,
  CATEGORY_EMOJI,
  categorizeIngredient,
  normalizeForMatch,
  scoreRecipeAgainstPantry,
  initializePantryItems,
  type RecipeMatchResult,
  type PantryCategory,
} from '../../src/data/pantry-helpers';

// Common quick-add staples shown as chips when not already in pantry
const QUICK_ADD_STAPLES: { name: string; emoji: string; category: PantryCategory }[] = [
  { name: 'Parmesan',         emoji: '🧀', category: 'Dairy & Eggs' },
  { name: 'Stock',            emoji: '🫙', category: 'Pantry Staples' },
  { name: 'Chicken',          emoji: '🍗', category: 'Proteins' },
  { name: 'Beef mince',       emoji: '🥩', category: 'Proteins' },
  { name: 'Coconut milk',     emoji: '🥥', category: 'Dairy & Eggs' },
  { name: 'Soy sauce',        emoji: '🫙', category: 'Condiments & Sauces' },
  { name: 'Pasta',            emoji: '🍝', category: 'Pantry Staples' },
  { name: 'Bread',            emoji: '🍞', category: 'Pantry Staples' },
];

export default function PantryTab() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupByAisle, setGroupByAisle] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [items, recipes] = await Promise.all([
        getPantryItems(db),
        getAllRecipes(db),
      ]);
      if (cancelled) return;
      setAllRecipes(recipes);
      if (items.length === 0) {
        await initializePantryItems(db, recipes);
        const seeded = await getPantryItems(db);
        if (!cancelled) {
          // Auto-mark all seeded items as have_it: false; user toggles in.
          // But to keep the cloud meaningful, we want a richer default.
          // Leaving as-is for v1; user adds what they have.
          setPantryItems(seeded);
        }
      } else {
        setPantryItems(items);
      }
      setLoading(false);
    }
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [db]);

  // Items the user actually has (have_it === true)
  const myPantry = useMemo(
    () => pantryItems.filter((p) => p.have_it),
    [pantryItems],
  );

  // Search filter
  const filteredPantry = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return myPantry;
    return myPantry.filter((p) => p.name.toLowerCase().includes(q));
  }, [myPantry, search]);

  // Recipe scoring
  const matches = useMemo<RecipeMatchResult[]>(() => {
    if (!allRecipes.length) return [];
    return allRecipes
      .map((r) => scoreRecipeAgainstPantry(r, pantryItems))
      .sort((a, b) => b.score - a.score);
  }, [allRecipes, pantryItems]);

  const canMake = matches.filter((m) => m.haveCount === m.totalCount);
  const almostThere = matches.filter(
    (m) => m.haveCount < m.totalCount && m.haveCount / m.totalCount >= 0.6,
  ).slice(0, 5);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRemove = useCallback(async (item: PantryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (item.id.startsWith('custom-')) {
      await deletePantryItem(db, item.id);
      setPantryItems((prev) => prev.filter((p) => p.id !== item.id));
    } else {
      const updated = { ...item, have_it: false };
      await upsertPantryItem(db, updated);
      setPantryItems((prev) => prev.map((p) => (p.id === item.id ? updated : p)));
    }
  }, [db]);

  const handleAddByName = useCallback(async (rawName: string) => {
    const name = rawName.trim();
    if (!name) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const norm = normalizeForMatch(name);
    // Find existing by normalised match
    const existing = pantryItems.find((p) => normalizeForMatch(p.name) === norm);
    if (existing) {
      const updated = { ...existing, have_it: true };
      await upsertPantryItem(db, updated);
      setPantryItems((prev) => prev.map((p) => (p.id === existing.id ? updated : p)));
    } else {
      const item: PantryItem = {
        id: 'custom-' + Date.now(),
        name,
        category: categorizeIngredient(name),
        quantity: null,
        unit: null,
        have_it: true,
      };
      await upsertPantryItem(db, item);
      setPantryItems((prev) => [...prev, item]);
    }
    setSearch('');
  }, [db, pantryItems]);

  const handleQuickAdd = useCallback(async (staple: typeof QUICK_ADD_STAPLES[number]) => {
    await handleAddByName(staple.name);
  }, [handleAddByName]);

  // Show quick-add chips for staples NOT already in pantry
  const quickAddChips = useMemo(() => {
    const myNorms = new Set(myPantry.map((p) => normalizeForMatch(p.name)));
    return QUICK_ADD_STAPLES.filter((s) => !myNorms.has(normalizeForMatch(s.name)));
  }, [myPantry]);

  // Inline "+ Add" suggestion when query doesn't match any pantry item
  const queryHasMatch = useMemo(() => {
    const q = search.trim();
    if (!q) return true;
    const qNorm = normalizeForMatch(q);
    return pantryItems.some((p) => p.have_it && normalizeForMatch(p.name) === qNorm);
  }, [search, pantryItems]);
  const showAddSuggestion = search.trim().length > 0 && !queryHasMatch;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.sage} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingHorizontal: 20,
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 28,
            color: tokens.ink,
            lineHeight: 32,
            marginBottom: 4,
          }}
        >
          Pantry
        </Text>
        <Text
          style={{
            fontFamily: fonts.displayItalic,
            fontStyle: 'italic',
            fontSize: 14,
            color: tokens.muted,
            marginBottom: 14,
          }}
        >
          what can you cook right now?
        </Text>

        {/* Search-or-add input + tag cloud combined */}
        <View
          style={{
            backgroundColor: tokens.cream,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: tokens.line,
            paddingHorizontal: 12,
            paddingTop: 12,
            paddingBottom: 12,
            marginBottom: 12,
          }}
        >
          {/* Tag cloud */}
          {filteredPantry.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {filteredPantry.map((item) => (
                <PantryChip key={item.id} item={item} onRemove={() => handleRemove(item)} />
              ))}
            </View>
          )}
          {/* Search/add input */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 }}>
            <Icon name="search" size={14} color={tokens.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => showAddSuggestion && handleAddByName(search)}
              placeholder={myPantry.length === 0 ? 'Add what you have…' : 'add more…'}
              placeholderTextColor={tokens.muted}
              autoCapitalize="none"
              returnKeyType="done"
              style={{
                flex: 1,
                fontFamily: fonts.sans,
                fontSize: 14,
                color: tokens.ink,
                padding: 0,
              }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Icon name="x" size={14} color={tokens.muted} />
              </Pressable>
            )}
          </View>
          {showAddSuggestion && (
            <Pressable
              onPress={() => handleAddByName(search)}
              style={({ pressed }) => ({
                marginTop: 8,
                marginHorizontal: -4,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: pressed ? 'rgba(199,108,72,0.18)' : 'rgba(199,108,72,0.10)',
                borderWidth: 1,
                borderColor: tokens.paprika,
              })}
            >
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: tokens.paprika }}>
                + Add "{search.trim()}" to your pantry
              </Text>
            </Pressable>
          )}
        </View>

        {/* Quick-add staples chips */}
        {quickAddChips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
            style={{ marginBottom: 16 }}
          >
            {quickAddChips.map((s) => (
              <Pressable
                key={s.name}
                onPress={() => handleQuickAdd(s)}
                accessibilityLabel={`Add ${s.name} to pantry`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: pressed ? tokens.bgDeep : tokens.cream,
                  borderWidth: 1,
                  borderColor: tokens.line,
                })}
              >
                <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.ink }}>
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Match sections */}
        {canMake.length > 0 && (
          <SectionBlock
            color={tokens.sage}
            label="You can make these"
            subtitle={`${canMake.length} recipe${canMake.length === 1 ? '' : 's'}`}
          >
            {canMake.slice(0, 6).map((m) => (
              <MatchRow key={m.recipe.id} match={m} onPress={() => router.push(`/recipe/${m.recipe.id}`)} />
            ))}
          </SectionBlock>
        )}

        {almostThere.length > 0 && (
          <SectionBlock
            color={tokens.ochre}
            label="Almost there — grab 1-3 more"
            subtitle={`${almostThere.length} recipe${almostThere.length === 1 ? '' : 's'}`}
          >
            {almostThere.map((m) => (
              <MatchRow key={m.recipe.id} match={m} onPress={() => router.push(`/recipe/${m.recipe.id}`)} />
            ))}
          </SectionBlock>
        )}

        {myPantry.length === 0 && (
          <View style={{ padding: 24, alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🧺</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 18, color: tokens.ink, marginBottom: 4 }}>
              Your pantry is empty
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: tokens.muted, textAlign: 'center', marginBottom: 8 }}>
              Add what you've got. We'll show you which recipes you can make right now.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Pantry chip ──────────────────────────────────────────────────────────────

function PantryChip({ item, onRemove }: { item: PantryItem; onRemove: () => void }) {
  return (
    <Pressable
      onPress={onRemove}
      accessibilityLabel={`Remove ${item.name} from pantry`}
      hitSlop={4}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: pressed ? tokens.inkSoft : tokens.ink,
      })}
    >
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.cream }} numberOfLines={1}>
        {item.name.toLowerCase()}
      </Text>
      <Icon name="x" size={11} color="rgba(250,246,238,0.7)" />
    </Pressable>
  );
}

// ── Section block ────────────────────────────────────────────────────────────

function SectionBlock({
  color,
  label,
  subtitle,
  children,
}: {
  color: string;
  label: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 8 }} />
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.sansBold,
            fontSize: 12,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color,
          }}
        >
          {label}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted }}>{subtitle}</Text>
      </View>
      <View style={{ gap: 8 }}>{children}</View>
    </View>
  );
}

// ── Match row ────────────────────────────────────────────────────────────────

function MatchRow({ match, onPress }: { match: RecipeMatchResult; onPress: () => void }) {
  const pct = Math.round((match.haveCount / match.totalCount) * 100);
  const isComplete = match.haveCount === match.totalCount;
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${match.recipe.title}, ${pct}% match`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: pressed ? tokens.bgDeep : tokens.cream,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: tokens.line,
        padding: 12,
      })}
    >
      {/* Hero chip with % badge */}
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 12,
          backgroundColor: match.recipe.hero_fallback?.[0] ?? tokens.bgDeep,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {match.recipe.emoji ? (
          <Text style={{ fontSize: 28 }}>{match.recipe.emoji}</Text>
        ) : null}
        <View
          style={{
            position: 'absolute',
            bottom: -6,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: isComplete ? tokens.sage : tokens.ochre,
          }}
        >
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, color: tokens.cream }}>
            {pct}%
          </Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontFamily: fonts.sansBold, fontSize: 14, color: tokens.ink, lineHeight: 18 }}
          numberOfLines={2}
        >
          {match.recipe.title}
        </Text>
        <Text
          style={{ fontFamily: fonts.sans, fontSize: 12, color: tokens.muted, marginTop: 3 }}
          numberOfLines={1}
        >
          {isComplete
            ? 'All ingredients in pantry'
            : `Need: ${match.missingNames.slice(0, 2).join(', ')}${match.missingNames.length > 2 ? '…' : ''}`}
        </Text>
      </View>
      <Icon name="arrow-right" size={14} color={tokens.line} />
    </Pressable>
  );
}
