/**
 * Pantry — search-first redesign (2026-04-28).
 *
 * Shifts the pantry from a category-walled SectionList of toggles to a
 * search-first model. Why:
 *   - Recall beats recognition once an option set passes ~7 items
 *     (Miller's Law). The previous build pre-seeded 100+ ingredients
 *     and asked the user to scroll-and-tick — wrong end of the trade.
 *   - The mental model "I just bought milk" → type "milk" → tap is one
 *     action, not three. Bulk grocery put-away is the dominant use case.
 *
 * Design (top → bottom):
 *   1. Sticky search with autocomplete dropdown. Priority order:
 *      already-in-pantry → AU staple catalog → "Add 'X' as new" escape.
 *      Aliases work (cilantro→Coriander, bell pepper→Capsicum).
 *   2. Quick-action pills: bulk add and add-staples shortcut.
 *   3. Wrapping pill cloud — your pantry. Recently-added first; freshly
 *      added pills flash in terracotta and decay back to sage after 1.5s.
 *      Cap at 14 visible with "Show all".
 *   4. "One ingredient unlocks more" card — surfaces the single ingredient
 *      that appears in the most near-miss recipes. Shopping intelligence,
 *      not just filtering.
 *   5. Closest-matches carousel — top 6 recipes ranked by % match. Each
 *      card has tappable missing-ingredient chips that drop into a
 *      shopping list (in-memory for now; promote to DB later).
 *
 * No auto-seed — pantry starts empty and grows from search. Existing
 * users with seeded `have_it=false` rows just won't see them; the new
 * model treats "in pantry" = "row exists with have_it=true".
 *
 * Data layer untouched: still uses upsertPantryItem / deletePantryItem
 * and scoreRecipeAgainstPantry. Aliases bridge the old normalizer.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
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
  categorizeIngredient,
  cleanIngredientName,
  normalizeForMatch,
  scoreRecipeAgainstPantry,
  INGREDIENT_CATALOG,
  fuzzyMatchCatalog,
  matchedAlias,
} from '../../src/data/pantry-helpers';
import type {
  CatalogEntry,
  PantryCategory,
  RecipeMatchResult,
} from '../../src/data/pantry-helpers';

// ── Constants ────────────────────────────────────────────────────────────────

const FRESH_DURATION_MS = 1500; // pill "fresh" decay
const PILL_CAP = 14; // collapse to "show all" past this
const TOP_MATCHES = 6;
const UNLOCK_MIN_PANTRY = 2;
const UNLOCK_MIN_COUNT = 2;

// ── Helpers ──────────────────────────────────────────────────────────────────

function pantryId(name: string): string {
  return (
    'pantry-' +
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)
  );
}

function sameNorm(a: string, b: string): boolean {
  return normalizeForMatch(a) === normalizeForMatch(b);
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function PantryTab() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Recently-added: maps id → addedAt for sort + fresh decay.
  const [addedAt, setAddedAt] = useState<Record<string, number>>({});
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  // In-memory shopping list — the "tap a missing chip" target.
  // Long-term this lives in the DB so it survives a relaunch; for now it
  // only persists within the session. Tracked in BUGS.md as follow-up.
  const [shopping, setShopping] = useState<Set<string>>(new Set());

  const inputRef = useRef<TextInput>(null);
  // Track mount state — setTimeout callbacks must not setState after unmount,
  // or React fires a 'state update on unmounted component' warning.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [items, allRecipes] = await Promise.all([
        getPantryItems(db),
        getAllRecipes(db),
      ]);
      if (cancelled) return;
      // New model: only items with have_it=true count as "in pantry".
      // Legacy seeded items with have_it=false stay invisible.
      setPantryItems(items.filter((i) => i.have_it));
      setRecipes(allRecipes);
      setLoading(false);
    }
    load().catch((e) => {
      console.error('pantry load failed', e);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  // ── Sort: recently-added first, then alphabetical ──────────────────────────
  const sortedPantry = useMemo(() => {
    const copy = [...pantryItems];
    copy.sort((a, b) => {
      const ta = addedAt[a.id] ?? 0;
      const tb = addedAt[b.id] ?? 0;
      if (ta !== tb) return tb - ta;
      return a.name.localeCompare(b.name);
    });
    return copy;
  }, [pantryItems, addedAt]);

  const visiblePills = showAll ? sortedPantry : sortedPantry.slice(0, PILL_CAP);
  const hiddenCount = sortedPantry.length - visiblePills.length;

  // ── Recipe match scoring (memoised once per pantry change) ─────────────────
  const matchResults = useMemo<RecipeMatchResult[]>(() => {
    if (!recipes.length) return [];
    return recipes.map((r) => scoreRecipeAgainstPantry(r, pantryItems));
  }, [recipes, pantryItems]);

  const ranked = useMemo(() => {
    if (!pantryItems.length) return [];
    return matchResults
      .filter((m) => m.haveCount > 0)
      .sort((a, b) => b.score - a.score || a.totalCount - b.totalCount)
      .slice(0, TOP_MATCHES);
  }, [matchResults, pantryItems.length]);

  const fullMatches = ranked.filter(
    (m) => m.haveCount === m.totalCount,
  ).length;

  // ── Unlock — single ingredient that surfaces in the most near-misses ──────
  const unlock = useMemo(() => {
    if (pantryItems.length < UNLOCK_MIN_PANTRY) return null;
    const counts = new Map<string, number>();
    for (const m of matchResults) {
      const missing = m.totalCount - m.haveCount;
      if (missing === 0 || missing > 3) continue;
      for (const name of m.missingNames) {
        const key = cleanIngredientName(name).toLowerCase();
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    let best: { name: string; count: number } | null = null;
    for (const [name, count] of counts) {
      if (!best || count > best.count) best = { name, count };
    }
    if (!best || best.count < UNLOCK_MIN_COUNT) return null;
    return best;
  }, [matchResults, pantryItems.length]);

  // ── Autocomplete suggestions ───────────────────────────────────────────────
  const suggestions = useMemo(() => {
    const q = search.trim();
    if (q.length < 2) {
      return { existing: [], catalog: [], allowAddNew: false };
    }
    const ql = q.toLowerCase();

    const existing = pantryItems
      .filter((p) => p.name.toLowerCase().includes(ql))
      .slice(0, 3);

    const catalog: { entry: CatalogEntry; alias: string | null }[] = [];
    for (const entry of INGREDIENT_CATALOG) {
      if (catalog.length >= 5) break;
      if (!fuzzyMatchCatalog(entry, q)) continue;
      // Skip catalog entries already present in pantry.
      if (pantryItems.some((p) => sameNorm(p.name, entry.name))) continue;
      catalog.push({ entry, alias: matchedAlias(entry, q) });
    }

    const exactInCatalog = INGREDIENT_CATALOG.some(
      (e) => e.name.toLowerCase() === ql,
    );
    const exactInPantry = pantryItems.some(
      (p) => p.name.toLowerCase() === ql,
    );
    const allowAddNew = !exactInCatalog && !exactInPantry && q.length >= 2;

    return { existing, catalog, allowAddNew };
  }, [search, pantryItems]);

  const showDropdown =
    searchFocused &&
    search.trim().length >= 2 &&
    (suggestions.existing.length > 0 ||
      suggestions.catalog.length > 0 ||
      suggestions.allowAddNew);

  // ── Mutators ───────────────────────────────────────────────────────────────
  const addByName = useCallback(
    async (rawName: string, category?: PantryCategory) => {
      const clean = cleanIngredientName(rawName);
      if (!clean) return;
      // Don't double-add — flash existing pill instead.
      const existing = pantryItems.find((p) => sameNorm(p.name, clean));
      if (existing) {
        Haptics.selectionAsync().catch(() => {});
        const id = existing.id;
        setFreshIds((prev) => new Set(prev).add(id));
        setTimeout(() => {
          if (!mountedRef.current) return;
          setFreshIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, FRESH_DURATION_MS);
        setSearch('');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const id = pantryId(clean);
      const item: PantryItem = {
        id,
        name: clean,
        category: category ?? categorizeIngredient(clean),
        quantity: null,
        unit: null,
        have_it: true,
      };
      setPantryItems((prev) => [item, ...prev]);
      setAddedAt((prev) => ({ ...prev, [id]: Date.now() }));
      setFreshIds((prev) => new Set(prev).add(id));
      setSearch('');
      // Persist after state update — UI feels instant.
      upsertPantryItem(db, item).catch((e) =>
        console.error('upsertPantryItem failed', e),
      );
      setTimeout(() => {
        if (!mountedRef.current) return;
        setFreshIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, FRESH_DURATION_MS);
    },
    [db, pantryItems],
  );

  const removeItem = useCallback(
    async (item: PantryItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setPantryItems((prev) => prev.filter((p) => p.id !== item.id));
      // Drop addedAt + freshIds entries for this id so they don't accumulate
      // over long sessions of adds-and-removes.
      setAddedAt((prev) => {
        if (!(item.id in prev)) return prev;
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setFreshIds((prev) => {
        if (!prev.has(item.id)) return prev;
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      deletePantryItem(db, item.id).catch((e) =>
        console.error('deletePantryItem failed', e),
      );
    },
    [db],
  );

  const toggleShopping = useCallback((name: string) => {
    Haptics.selectionAsync().catch(() => {});
    setShopping((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const bulkAddStaples = useCallback(async () => {
    // "Just shopped" demo: add a typical AU weekly haul. Skips items already there.
    const haul: { name: string; category: PantryCategory }[] = [
      { name: 'Chicken thigh', category: 'Proteins' },
      { name: 'Brown onion', category: 'Produce' },
      { name: 'Garlic', category: 'Produce' },
      { name: 'Lemon', category: 'Produce' },
      { name: 'Olive oil', category: 'Pantry Staples' },
      { name: 'Salt', category: 'Spices & Seasonings' },
      { name: 'Black pepper', category: 'Spices & Seasonings' },
      { name: 'Eggs', category: 'Dairy & Eggs' },
    ];
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    for (const item of haul) {
      const dup = pantryItems.some((p) => sameNorm(p.name, item.name));
      if (dup) continue;
      // Stagger so the pop animation reads as a sequence
      await new Promise((r) => setTimeout(r, 90));
      await addByName(item.name, item.category);
    }
  }, [pantryItems, addByName]);

  // ── Render ─────────────────────────────────────────────────────────────────

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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Sticky top: header + search ─────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 8,
          backgroundColor: tokens.bg,
          zIndex: 10,
        }}
      >
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
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 36,
            lineHeight: 40,
            color: tokens.ink,
          }}
        >
          Your{' '}
          <Text
            style={{
              fontFamily: fonts.displayItalic,
              fontStyle: 'italic',
              color: tokens.sage,
            }}
          >
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
          {pantryItems.length} ingredient
          {pantryItems.length === 1 ? '' : 's'} stocked
        </Text>

        {/* Search bar */}
        <View style={{ marginTop: 14, position: 'relative' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: tokens.cream,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: searchFocused ? tokens.primary : tokens.lineDark,
              paddingHorizontal: 14,
              paddingVertical: 14,
              gap: 10,
            }}
          >
            <Icon name="search" size={16} color={tokens.muted} />
            <TextInput
              ref={inputRef}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() =>
                // Delay so a tap on a dropdown row registers before blur hides it.
                setTimeout(() => setSearchFocused(false), 120)
              }
              placeholder="Search or add an ingredient…"
              placeholderTextColor={tokens.muted}
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              style={{
                flex: 1,
                fontFamily: fonts.sans,
                fontSize: 15,
                color: tokens.ink,
                padding: 0,
              }}
            />
            {search ? (
              <Pressable onPress={() => setSearch('')} hitSlop={10}>
                <Icon name="x" size={14} color={tokens.muted} />
              </Pressable>
            ) : null}
          </View>

          {/* Autocomplete dropdown */}
          {showDropdown && (
            <Animated.View
              entering={FadeIn.duration(140)}
              exiting={FadeOut.duration(100)}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 8,
                backgroundColor: tokens.cream,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: tokens.line,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 8,
                overflow: 'hidden',
                zIndex: 20,
              }}
            >
              {suggestions.existing.map((p, i) => (
                <DropdownRow
                  key={`have-${p.id}`}
                  iconBg={tokens.sageLight}
                  iconColor={tokens.sage}
                  iconChar="✓"
                  name={p.name}
                  meta="Already in your pantry"
                  tagText="In pantry"
                  tagBg={tokens.sageLight}
                  tagColor={tokens.sageDeep}
                  divider={i < suggestions.existing.length - 1 ||
                    suggestions.catalog.length > 0 ||
                    suggestions.allowAddNew}
                  onPress={() => {
                    addByName(p.name);
                  }}
                />
              ))}
              {suggestions.catalog.map((c, i) => (
                <DropdownRow
                  key={`add-${c.entry.name}`}
                  iconBg={tokens.primaryLight}
                  iconColor={tokens.primary}
                  iconChar="+"
                  name={c.entry.name}
                  meta={c.alias ? `Also known as ${c.alias}` : c.entry.category}
                  tagText="Add"
                  tagBg={tokens.primaryLight}
                  tagColor={tokens.primaryDeep}
                  divider={
                    i < suggestions.catalog.length - 1 || suggestions.allowAddNew
                  }
                  onPress={() => addByName(c.entry.name, c.entry.category)}
                />
              ))}
              {suggestions.allowAddNew && (
                <DropdownRow
                  iconBg={tokens.bgDeep}
                  iconColor={tokens.inkSoft}
                  iconChar="＋"
                  name={`Add "${capitalize(search.trim())}" as new`}
                  meta="Not in our staples list — we'll add it for you"
                  tagText="New"
                  tagBg={tokens.bgDeep}
                  tagColor={tokens.inkSoft}
                  divider={false}
                  onPress={() => addByName(search.trim())}
                />
              )}
            </Animated.View>
          )}
        </View>
      </View>

      {/* ── Scrollable body ─────────────────────────────────────────── */}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 8 }}
      >
        {/* Quick actions */}
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            paddingHorizontal: 20,
            marginBottom: 14,
          }}
        >
          <QuickPill
            icon="🛒"
            label="Just back from the shops"
            onPress={bulkAddStaples}
          />
          <QuickPill
            icon="⚡"
            label="Add staples"
            onPress={() => inputRef.current?.focus()}
          />
        </View>

        {/* Pantry pill cloud */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            backgroundColor: tokens.cream,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: tokens.line,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              paddingHorizontal: 18,
              paddingTop: 14,
              paddingBottom: 6,
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
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
              In your pantry
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted }}>
              {pantryItems.length} item{pantryItems.length === 1 ? '' : 's'}
            </Text>
          </View>

          {pantryItems.length === 0 ? (
            <View
              style={{
                paddingVertical: 24,
                paddingHorizontal: 18,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  color: tokens.muted,
                  marginBottom: 6,
                }}
              >
                ↑
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  color: tokens.muted,
                  textAlign: 'center',
                  lineHeight: 18,
                }}
              >
                Type above to add your first ingredient.{'\n'}
                We&apos;ll suggest as you type.
              </Text>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                paddingHorizontal: 18,
                paddingTop: 6,
                paddingBottom: 16,
              }}
            >
              {visiblePills.map((it) => (
                <Pill
                  key={it.id}
                  item={it}
                  fresh={freshIds.has(it.id)}
                  onRemove={() => removeItem(it)}
                />
              ))}
            </View>
          )}

          {hiddenCount > 0 && (
            <Pressable
              onPress={() => setShowAll(true)}
              style={({ pressed }) => ({
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: tokens.line,
                backgroundColor: pressed ? tokens.bgDeep : 'transparent',
              })}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 12,
                  color: tokens.inkSoft,
                  textAlign: 'center',
                }}
              >
                Show all {sortedPantry.length}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Unlock card */}
        {unlock && (
          <Pressable
            onPress={() => toggleShopping(unlock.name)}
            style={({ pressed }) => ({
              marginHorizontal: 20,
              marginBottom: 16,
              padding: 16,
              borderRadius: 18,
              backgroundColor: pressed ? tokens.primaryDeep : tokens.primary,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              shadowColor: tokens.primaryDeep,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.22,
              shadowRadius: 12,
              elevation: 4,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 22 }}>🔑</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.78)',
                  marginBottom: 3,
                }}
              >
                One ingredient unlocks more
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 15,
                  color: '#FFF',
                  lineHeight: 19,
                }}
              >
                Pick up{' '}
                <Text style={{ textDecorationLine: 'underline' }}>
                  {unlock.name}
                </Text>{' '}
                → {unlock.count} more recipe{unlock.count === 1 ? '' : 's'}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)' }}>
              {shopping.has(unlock.name) ? '✓' : '→'}
            </Text>
          </Pressable>
        )}

        {/* Closest matches carousel */}
        {ranked.length > 0 && (
          <View>
            <View
              style={{
                paddingHorizontal: 20,
                paddingBottom: 10,
                flexDirection: 'row',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 11,
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                  color: tokens.inkSoft,
                }}
              >
                {fullMatches > 0 ? 'Ready to cook' : 'Closest matches'}
              </Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted }}>
                {fullMatches > 0
                  ? `${fullMatches} ready · ${ranked.length - fullMatches} close`
                  : `${ranked.length} dish${ranked.length === 1 ? '' : 'es'} · ranked by match`}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={272}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {ranked.map((m) => (
                <RecipeMatchCard
                  key={m.recipe.id}
                  match={m}
                  shopping={shopping}
                  onOpenRecipe={() => router.push(`/recipe/${m.recipe.id}`)}
                  onToggleShopping={toggleShopping}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function DropdownRow({
  iconBg,
  iconColor,
  iconChar,
  name,
  meta,
  tagText,
  tagBg,
  tagColor,
  divider,
  onPress,
}: {
  iconBg: string;
  iconColor: string;
  iconChar: string;
  name: string;
  meta: string;
  tagText: string;
  tagBg: string;
  tagColor: string;
  divider: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: tokens.line,
        backgroundColor: pressed ? tokens.bgDeep : 'transparent',
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: iconBg,
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '700', color: iconColor }}>
          {iconChar}
        </Text>
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
          {name}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 11,
            color: tokens.muted,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {meta}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: tagBg,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 6,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 10,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: tagColor,
          }}
        >
          {tagText}
        </Text>
      </View>
    </Pressable>
  );
}

function QuickPill({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 9,
        paddingHorizontal: 14,
        backgroundColor: pressed ? tokens.bgDeep : tokens.cream,
        borderWidth: 1,
        borderColor: tokens.lineDark,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      })}
    >
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 12,
          color: tokens.inkSoft,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Pill({
  item,
  fresh,
  onRemove,
}: {
  item: PantryItem;
  fresh: boolean;
  onRemove: () => void;
}) {
  const bg = fresh ? tokens.primaryLight : tokens.sageLight;
  const fg = fresh ? tokens.primaryDeep : tokens.sageDeep;
  const xBg = fresh ? 'rgba(184,109,69,0.18)' : 'rgba(77,128,112,0.18)';
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(140)}
      layout={LinearTransition.duration(180)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 9,
        paddingHorizontal: 14,
        backgroundColor: bg,
        borderRadius: 999,
        minHeight: 36,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 13,
          color: fg,
        }}
      >
        {item.name}
      </Text>
      <Pressable
        onPress={onRemove}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name}`}
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          backgroundColor: xBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 2,
          marginRight: -4,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontFamily: fonts.sansBold,
            color: fg,
            lineHeight: 13,
          }}
        >
          ×
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function RecipeMatchCard({
  match,
  shopping,
  onOpenRecipe,
  onToggleShopping,
}: {
  match: RecipeMatchResult;
  shopping: Set<string>;
  onOpenRecipe: () => void;
  onToggleShopping: (name: string) => void;
}) {
  const pct = match.totalCount > 0
    ? Math.round((match.haveCount / match.totalCount) * 100)
    : 0;
  const ringColor =
    pct === 100 ? tokens.sage : pct >= 70 ? tokens.ochre : tokens.primary;
  const ringBg =
    pct === 100
      ? tokens.sageLight
      : pct >= 70
      ? 'rgba(196,160,90,0.20)'
      : tokens.primaryLight;
  const allReady = match.totalCount === match.haveCount;
  return (
    <Pressable
      onPress={onOpenRecipe}
      style={({ pressed }) => ({
        width: 260,
        backgroundColor: tokens.cream,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: tokens.line,
        overflow: 'hidden',
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {/* Photo + percentage ring */}
      <View
        style={{
          height: 130,
          backgroundColor: tokens.bgDeep,
          position: 'relative',
        }}
      >
        {match.recipe.hero_url ? (
          <Image
            source={{ uri: match.recipe.hero_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 38 }}>{match.recipe.emoji ?? '🍳'}</Text>
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: ringBg,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.sansXBold,
              fontSize: 13,
              color: ringColor,
            }}
          >
            {pct}%
          </Text>
        </View>
        {!allReady && (
          <View
            style={{
              position: 'absolute',
              bottom: 10,
              left: 10,
              backgroundColor: 'rgba(29,25,23,0.7)',
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 10,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: '#FFF',
              }}
            >
              Missing {match.totalCount - match.haveCount} of {match.totalCount}
            </Text>
          </View>
        )}
      </View>
      {/* Body */}
      <View style={{ padding: 14 }}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 15,
            lineHeight: 19,
            color: tokens.ink,
            marginBottom: 8,
          }}
          numberOfLines={2}
        >
          {match.recipe.title}
        </Text>
        {allReady ? (
          <View
            style={{
              alignSelf: 'flex-start',
              paddingVertical: 7,
              paddingHorizontal: 12,
              backgroundColor: tokens.sageLight,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 12,
                color: tokens.sageDeep,
              }}
            >
              ✓ Tap to cook
            </Text>
          </View>
        ) : (
          <View>
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 10,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: tokens.muted,
                marginBottom: 6,
              }}
            >
              Tap to add to shopping list
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {match.missingNames.map((name) => {
                const added = shopping.has(name);
                return (
                  <Pressable
                    key={name}
                    onPress={() => onToggleShopping(name)}
                    style={({ pressed }) => ({
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      backgroundColor: added ? tokens.sageLight : tokens.bgDeep,
                      borderWidth: 1,
                      borderColor: added ? 'transparent' : tokens.lineDark,
                      borderStyle: added ? 'solid' : 'dashed',
                      borderRadius: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.sansBold,
                        fontSize: 11,
                        color: added ? tokens.sageDeep : tokens.inkSoft,
                      }}
                    >
                      {added ? '✓' : '+'}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.sansBold,
                        fontSize: 12,
                        color: added ? tokens.sageDeep : tokens.inkSoft,
                      }}
                    >
                      {name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ── Tiny utils ───────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
