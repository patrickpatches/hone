/**
 * Pantry — "cook with what you have."
 *
 * Ingredients auto-seeded from recipes + common staples.
 * Toggle what you have; app scores every recipe against the pantry.
 *
 * Design decisions:
 *   - Toggle sits right side — right-thumb reach zone (90% of users)
 *   - Minimum 52dp row height — oily/damp fingers need the area
 *   - Category headers use bgDeep to signal hierarchy without clutter
 *   - "Can cook" summary at top drives discovery without a separate tab
 *   - Search scoped to pantry items, not recipes
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
} from '../../db/database';
import type { PantryItem } from '../../db/database';
import type { Recipe } from '../../src/data/types';
import {
  PANTRY_CATEGORIES,
  CATEGORY_EMOJI,
  categorizeIngredient,
  normalizeForMatch,
  cleanIngredientName,
  scoreRecipeAgainstPantry,
  initializePantryItems,
} from '../../src/data/pantry-helpers';
import type { RecipeMatchResult } from '../../src/data/pantry-helpers';

type Section = { title: string; emoji: string; data: PantryItem[] };

// ── Animated toggle (Reanimated for smooth 60fps) ─────────────────────────────

function PantryToggle({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 180 });
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [tokens.lineDark, tokens.sage],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 20 }],
  }));

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={8}
      style={{ justifyContent: 'center' }}
    >
      <Animated.View
        style={[
          trackStyle,
          {
            width: 46,
            height: 26,
            borderRadius: 13,
            padding: 2,
          },
        ]}
      >
        <Animated.View
          style={[
            thumbStyle,
            {
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#FFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 2,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PantryTab() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [allRecipes, setAllRecipes]   = useState<Recipe[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [addName, setAddName]         = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load
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
        if (!cancelled) setPantryItems(seeded);
      } else {
        setPantryItems(items);
      }
      setLoading(false);
    }
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [db]);

  // Recipe match scoring
  const matchResults = useMemo<RecipeMatchResult[]>(() => {
    if (!allRecipes.length) return [];
    return allRecipes
      .map((r) => scoreRecipeAgainstPantry(r, pantryItems))
      .sort((a, b) => b.score - a.score);
  }, [allRecipes, pantryItems]);

  const canMakeCount = matchResults.filter((m) => m.haveCount === m.totalCount).length;
  const topMatches   = matchResults.slice(0, 5);

  // Toggle handler
  const handleToggle = useCallback(
    async (item: PantryItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const updated = { ...item, have_it: !item.have_it };
      await upsertPantryItem(db, updated);
      setPantryItems((prev) =>
        prev.map((p) => (p.id === item.id ? updated : p)),
      );
    },
    [db],
  );

  // Delete handler
  const handleDelete = useCallback(
    async (item: PantryItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await deletePantryItem(db, item.id);
      setPantryItems((prev) => prev.filter((p) => p.id !== item.id));
    },
    [db],
  );

  // Add item
  const handleAdd = useCallback(
    async (name: string) => {
      const clean = cleanIngredientName(name.trim());
      if (!clean) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const item: PantryItem = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: clean,
        category: categorizeIngredient(clean),
        quantity: null,
        unit: null,
        have_it: true,
      };
      await upsertPantryItem(db, item);
      setPantryItems((prev) => [...prev, item]);
      setAddName('');
      setShowSuggestions(false);
    },
    [db],
  );

  // Sections
  const sections = useMemo<Section[]>(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? pantryItems.filter((p) => p.name.toLowerCase().includes(q))
      : pantryItems;

    return PANTRY_CATEGORIES.map((cat) => ({
      title: cat,
      emoji: CATEGORY_EMOJI[cat] ?? '🥫',
      data: filtered.filter((p) => p.category === cat),
    })).filter((s) => s.data.length > 0);
  }, [pantryItems, search]);

  const haveCount = pantryItems.filter((p) => p.have_it).length;

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: 140,
        }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
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
              Cook with what you have
            </Text>

            {/* Headline */}
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 36,
                lineHeight: 40,
                color: tokens.ink,
              }}
            >
              Your{' '}
              <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic', color: tokens.sage }}>
                Pantry
              </Text>
            </Text>

            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 12,
                color: tokens.muted,
                marginTop: 6,
              }}
            >
              {haveCount} of {pantryItems.length} items stocked
            </Text>

            {/* Can cook banner */}
            {canMakeCount > 0 && (
              <Pressable
                onPress={() => setShowSuggestions(true)}
                style={({ pressed }) => ({
                  marginTop: 16,
                  backgroundColor: pressed ? tokens.sageDeep : tokens.sage,
                  borderRadius: 16,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                })}
              >
                <Text style={{ fontSize: 22 }}>🍳</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.sansBold,
                      fontSize: 14,
                      color: '#FFF',
                    }}
                  >
                    You can make {canMakeCount} recipe{canMakeCount !== 1 ? 's' : ''} right now
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.82)',
                      marginTop: 2,
                    }}
                  >
                    Tap to see what you can cook tonight
                  </Text>
                </View>
                <Icon name="arrow-right" size={16} color="#FFF" />
              </Pressable>
            )}

            {/* Top matches (partial) */}
            {canMakeCount === 0 && topMatches.length > 0 && (
              <View
                style={{
                  marginTop: 16,
                  backgroundColor: tokens.cream,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: tokens.lineDark,
                  overflow: 'hidden',
                  shadowColor: tokens.ink,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: tokens.line,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.sansBold,
                      fontSize: 10,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      color: tokens.muted,
                    }}
                  >
                    Closest matches
                  </Text>
                </View>
                {topMatches.map((m, idx) => {
                  const pct = Math.round((m.haveCount / m.totalCount) * 100);
                  return (
                    <Pressable
                      key={m.recipe.id}
                      onPress={() => router.push(`/recipe/${m.recipe.id}`)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        gap: 12,
                        backgroundColor: pressed ? tokens.bgDeep : 'transparent',
                        borderBottomWidth: idx < topMatches.length - 1 ? 1 : 0,
                        borderBottomColor: tokens.line,
                      })}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: tokens.primaryLight,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: fonts.display, fontSize: 14, color: tokens.primary }}>
                          {pct}%
                        </Text>
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: fonts.sansBold,
                          fontSize: 13,
                          color: tokens.ink,
                        }}
                        numberOfLines={1}
                      >
                        {m.recipe.title}
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.sans,
                          fontSize: 11,
                          color: tokens.muted,
                        }}
                      >
                        {m.missingNames.length} missing
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Add item row */}
            <View
              style={{
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: tokens.cream,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: tokens.lineDark,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  gap: 8,
                }}
              >
                <Icon name="plus" size={15} color={tokens.muted} />
                <TextInput
                  value={addName}
                  onChangeText={setAddName}
                  placeholder="Add an ingredient…"
                  placeholderTextColor={tokens.muted}
                  style={{
                    flex: 1,
                    fontFamily: fonts.sans,
                    fontSize: 14,
                    color: tokens.ink,
                    padding: 0,
                  }}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (addName.trim()) handleAdd(addName);
                  }}
                />
                {addName.trim() ? (
                  <Pressable
                    onPress={() => handleAdd(addName)}
                    style={{
                      backgroundColor: tokens.primary,
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.sansBold,
                        fontSize: 12,
                        color: '#FFF',
                      }}
                    >
                      Add
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Search */}
            <View
              style={{
                marginTop: 10,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: tokens.cream,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: tokens.lineDark,
                paddingHorizontal: 14,
                paddingVertical: 12,
                gap: 8,
              }}
            >
              <Icon name="search" size={15} color={tokens.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Filter pantry items…"
                placeholderTextColor={tokens.muted}
                style={{
                  flex: 1,
                  fontFamily: fonts.sans,
                  fontSize: 14,
                  color: tokens.ink,
                  padding: 0,
                }}
              />
              {search ? (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Icon name="x" size={14} color={tokens.muted} />
                </Pressable>
              ) : null}
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: tokens.bgDeep,
              marginTop: 8,
            }}
          >
            <Text style={{ fontSize: 15 }}>{section.emoji}</Text>
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: tokens.inkSoft,
              }}
            >
              {section.title}
            </Text>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 11,
                color: tokens.muted,
              }}
            >
              ({section.data.filter((p) => p.have_it).length}/{section.data.length})
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <PantryRow
            item={item}
            isLast={index === section.data.length - 1}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      />

      {/* "Can cook" suggestions modal */}
      <Modal
        visible={showSuggestions}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSuggestions(false)}
      >
        <SuggestionsSheet
          matches={matchResults.filter((m) => m.haveCount === m.totalCount)}
          onClose={() => setShowSuggestions(false)}
          onViewRecipe={(id) => {
            setShowSuggestions(false);
            router.push(`/recipe/${id}`);
          }}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ── Pantry row ────────────────────────────────────────────────────────────────

function PantryRow({
  item,
  isLast,
  onToggle,
  onDelete,
}: {
  item: PantryItem;
  isLast: boolean;
  onToggle: (item: PantryItem) => void;
  onDelete: (item: PantryItem) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: tokens.cream,
        paddingHorizontal: 20,
        paddingVertical: 0,
        minHeight: 52,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: tokens.line,
        gap: 12,
      }}
    >
      {/* Name */}
      <Text
        style={{
          flex: 1,
          fontFamily: fonts.sans,
          fontSize: 14,
          color: item.have_it ? tokens.ink : tokens.muted,
          textDecorationLine: item.have_it ? 'none' : 'none',
          paddingVertical: 14,
        }}
        numberOfLines={1}
      >
        {item.name}
      </Text>

      {/* Delete */}
      <Pressable
        onPress={() => onDelete(item)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name}`}
        style={({ pressed }) => ({
          opacity: pressed ? 0.5 : 0.3,
          padding: 4,
        })}
      >
        <Icon name="x" size={14} color={tokens.ink} />
      </Pressable>

      {/* Toggle */}
      <PantryToggle value={item.have_it} onToggle={() => onToggle(item)} />
    </View>
  );
}

// ── Suggestions sheet ─────────────────────────────────────────────────────────

function SuggestionsSheet({
  matches,
  onClose,
  onViewRecipe,
}: {
  matches: RecipeMatchResult[];
  onClose: () => void;
  onViewRecipe: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
        paddingTop: insets.top + 8,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: tokens.line,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: tokens.sage,
              marginBottom: 4,
            }}
          >
            Ready to cook
          </Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 24,
              color: tokens.ink,
            }}
          >
            {matches.length} recipe{matches.length !== 1 ? 's' : ''} you can make
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close suggestions"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: tokens.bgDeep,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="x" size={16} color={tokens.ink} />
        </Pressable>
      </View>

      {/* List */}
      {matches.map((m, idx) => (
        <Pressable
          key={m.recipe.id}
          onPress={() => onViewRecipe(m.recipe.id)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            gap: 14,
            backgroundColor: pressed ? tokens.bgDeep : 'transparent',
            borderBottomWidth: idx < matches.length - 1 ? 1 : 0,
            borderBottomColor: tokens.line,
          })}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: tokens.sageLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="check-circle" size={20} color={tokens.sage} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 14,
                color: tokens.ink,
              }}
              numberOfLines={1}
            >
              {m.recipe.title}
            </Text>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 12,
                color: tokens.muted,
                marginTop: 2,
              }}
            >
              All {m.totalCount} ingredients in your pantry
            </Text>
          </View>
          <Icon name="arrow-right" size={14} color={tokens.line} />
        </Pressable>
      ))}
    </View>
  );
}
