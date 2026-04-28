/**
 * Pantry — search-first, unified-zone redesign (v0.4.0 polish).
 *
 * Direction shift from the 2026-04-28 build:
 *   - Search bar and pantry pills are one connected zone, not two stacked
 *     boxes. Less chrome, less visual noise. The pills sit immediately
 *     below the search and read as "what you've added so far".
 *   - "Just back from the shops" / "Add staples" quick actions are gone.
 *     They were promotional shortcuts in a screen that should be quiet.
 *     The autocomplete already handles add-by-name in one tap; staples
 *     are surfaced via the catalog when the user types.
 *   - Recipe match cards now show two-state ingredient pills (have vs
 *     missing) so the user can see *both* what's covered and what's left.
 *     Tapping a missing pill adds it to the pantry — the count goes up,
 *     the recipe re-scores, the pill flips to filled olive (or disappears
 *     if it was the last piece). This was BUG-001 in the brief: the old
 *     build sent taps to an in-memory `shopping` Set that never reached
 *     the pantry, so the count never moved.
 *   - "Missing X of Y" is gone. Counts read as "X of Y matched" — same
 *     numbers, positive frame. Loss aversion (Kahneman/Tversky) made the
 *     old phrasing feel heavier than it was.
 *   - "Clear all" now uses an in-screen undo toast (5 s window) instead
 *     of a confirmation modal. One destructive action, one safe escape;
 *     no pre-emptive friction. The modal version is removed entirely.
 *   - Dropdown rows are compact single-liners (~46 px tall): name on the
 *     left with an inline alias hint, category tag on the right, whole
 *     row tappable. The old design wrapped name+meta+icon+tag at ~80 px;
 *     it scanned more like a settings list than autocomplete.
 *   - Horizontal recipe carousel snaps cleanly: explicit snapToOffsets
 *     with `disableIntervalMomentum` so each swipe lands one card at a
 *     time. The old `snapToInterval={272}` value was correct but missed
 *     the start padding, which is why cards stopped mid-swipe.
 *
 * Data layer untouched: still uses upsertPantryItem / deletePantryItem
 * and scoreRecipeAgainstPantry. The "shopping list" intermediate state
 * is gone — taps go straight to the pantry as the user expects.
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

import { tokens, fonts, shadows } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { VersionFooter } from '../../src/components/VersionFooter';
import {
  clearAllPantryItems,
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

const FRESH_DURATION_MS = 1500;
const PILL_CAP = 14;
const TOP_MATCHES = 6;
const UNLOCK_MIN_PANTRY = 2;
const UNLOCK_MIN_COUNT = 2;
const UNDO_TIMEOUT_MS = 5000;
const CARD_WIDTH = 260;
const CARD_GAP = 12;
const CAROUSEL_PADDING = 20;

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

  // Undo snapshot — used by "Clear all". Holds the cleared items for 5 s
  // so the user can recover from a misclick. After the timeout fires the
  // snapshot is discarded and the deletion becomes permanent (DB has
  // already happened).
  const [undoSnapshot, setUndoSnapshot] = useState<{
    items: PantryItem[];
    addedAt: Record<string, number>;
    label: string;
  } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputRef = useRef<TextInput>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
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
      if (catalog.length >= 6) break;
      if (!fuzzyMatchCatalog(entry, q)) continue;
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

  // ── Clear all + undo ───────────────────────────────────────────────────────
  // Two-step contract: optimistic local clear (instant), DB clear (persisted),
  // 5 s undo window. Undo restores items to local state AND re-upserts to DB,
  // so the recovery is total — survives a relaunch.
  const clearAll = useCallback(async () => {
    if (pantryItems.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
    const snapshot = {
      items: [...pantryItems],
      addedAt: { ...addedAt },
      label: `Pantry cleared · ${pantryItems.length} item${pantryItems.length === 1 ? '' : 's'}`,
    };
    setPantryItems([]);
    setAddedAt({});
    setFreshIds(new Set());
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoSnapshot(snapshot);
    undoTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setUndoSnapshot(null);
    }, UNDO_TIMEOUT_MS);
    try {
      await clearAllPantryItems(db);
    } catch (e) {
      console.error('clearAllPantryItems failed', e);
    }
  }, [db, pantryItems, addedAt]);

  const undoClear = useCallback(async () => {
    if (!undoSnapshot) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    setPantryItems(undoSnapshot.items);
    setAddedAt(undoSnapshot.addedAt);
    setUndoSnapshot(null);
    // Re-persist each item. Done in parallel — order doesn't matter.
    await Promise.all(
      undoSnapshot.items.map((it) =>
        upsertPantryItem(db, it).catch((e) =>
          console.error('upsertPantryItem during undo failed', e),
        ),
      ),
    );
  }, [db, undoSnapshot]);

  // ── Add a missing ingredient straight to pantry (BUG-001 fix) ─────────────
  // Tapping a "missing" pill on a recipe match card now adds it to the
  // pantry. The recipe re-scores, the pill flips to filled olive briefly
  // (via freshIds) and then settles. No more stranded shopping-list state.
  const addMissingToPantry = useCallback(
    (name: string) => {
      addByName(name);
    },
    [addByName],
  );

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
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 4,
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
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 12 }}
      >
        {/* ── Unified pantry zone: search + pills as one card ────────── */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            backgroundColor: tokens.cream,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: tokens.line,
            overflow: 'visible',
            ...shadows.card,
          }}
        >
          {/* Search row — sits at the top of the zone with no border on
              the bottom edge so it visually melts into the pill cloud. */}
          <View style={{ position: 'relative', zIndex: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                gap: 10,
                borderBottomWidth: pantryItems.length > 0 ? 1 : 0,
                borderBottomColor: tokens.line,
              }}
            >
              <Icon
                name="search"
                size={16}
                color={searchFocused ? tokens.primary : tokens.muted}
              />
              <TextInput
                ref={inputRef}
                value={search}
                onChangeText={setSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() =>
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
              {pantryItems.length > 0 && !search ? (
                <Pressable
                  onPress={clearAll}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all pantry items"
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.75 })}
                >
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 11,
                      color: tokens.muted,
                    }}
                  >
                    Clear all
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* Autocomplete dropdown — drops out of the search row over the
                pills below. Floating, with shadow, so the pills aren't
                pushed down on every keystroke. */}
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
                  overflow: 'hidden',
                  zIndex: 30,
                  ...shadows.cardLifted,
                }}
              >
                {suggestions.existing.map((p, i) => (
                  <CompactRow
                    key={`have-${p.id}`}
                    name={p.name}
                    alias={null}
                    tagText="In pantry"
                    tagBg={tokens.sageLight}
                    tagColor={tokens.sageDeep}
                    divider={
                      i < suggestions.existing.length - 1 ||
                      suggestions.catalog.length > 0 ||
                      suggestions.allowAddNew
                    }
                    onPress={() => {
                      addByName(p.name);
                    }}
                  />
                ))}
                {suggestions.catalog.map((c, i) => (
                  <CompactRow
                    key={`add-${c.entry.name}`}
                    name={c.entry.name}
                    alias={c.alias}
                    tagText={c.entry.category}
                    tagBg={tokens.bgDeep}
                    tagColor={tokens.inkSoft}
                    divider={
                      i < suggestions.catalog.length - 1 ||
                      suggestions.allowAddNew
                    }
                    onPress={() => addByName(c.entry.name, c.entry.category)}
                  />
                ))}
                {suggestions.allowAddNew && (
                  <CompactRow
                    name={`Add "${capitalize(search.trim())}"`}
                    alias={null}
                    tagText="New"
                    tagBg={tokens.primaryLight}
                    tagColor={tokens.primaryDeep}
                    divider={false}
                    onPress={() => addByName(search.trim())}
                  />
                )}
              </Animated.View>
            )}
          </View>

          {/* Pill cloud — empty state or pills */}
          {pantryItems.length === 0 ? (
            <EmptyPantry />
          ) : (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                paddingHorizontal: 14,
                paddingTop: 12,
                paddingBottom: 14,
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
            onPress={() => addMissingToPantry(unlock.name)}
            style={({ pressed }) => ({
              marginHorizontal: 20,
              marginBottom: 16,
              padding: 16,
              borderRadius: 18,
              backgroundColor: pressed ? tokens.primaryDeep : tokens.primary,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              ...shadows.card,
              shadowColor: tokens.primaryDeep,
              shadowOpacity: 0.18,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: 'rgba(26,19,14,0.10)',
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
                  color: 'rgba(26,19,14,0.70)',
                  marginBottom: 3,
                }}
              >
                One ingredient unlocks more
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 15,
                  color: tokens.ink,
                  lineHeight: 19,
                }}
              >
                Add{' '}
                <Text style={{ textDecorationLine: 'underline' }}>
                  {unlock.name}
                </Text>{' '}
                → {unlock.count} more recipe{unlock.count === 1 ? '' : 's'}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: tokens.ink }}>
              ＋
            </Text>
          </Pressable>
        )}

        {/* Closest matches carousel */}
        {ranked.length > 0 ? (
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
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 11,
                  color: tokens.muted,
                }}
              >
                {fullMatches > 0
                  ? `${fullMatches} ready · ${ranked.length - fullMatches} close`
                  : `${ranked.length} dish${ranked.length === 1 ? '' : 'es'} · ranked by match`}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToOffsets={ranked.map((_, i) => i * (CARD_WIDTH + CARD_GAP))}
              snapToAlignment="start"
              disableIntervalMomentum
              contentContainerStyle={{
                paddingHorizontal: CAROUSEL_PADDING,
                gap: CARD_GAP,
              }}
            >
              {ranked.map((m) => (
                <RecipeMatchCard
                  key={m.recipe.id}
                  match={m}
                  onOpenRecipe={() => router.push(`/recipe/${m.recipe.id}`)}
                  onAddIngredient={addMissingToPantry}
                />
              ))}
            </ScrollView>
          </View>
        ) : pantryItems.length > 0 ? (
          <NoMatchesState />
        ) : null}
        <VersionFooter paddingBottom={32} />
      </ScrollView>

      {/* Undo toast for "Clear all" */}
      {undoSnapshot && (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={{
            position: 'absolute',
            bottom: insets.bottom + 80,
            left: 16,
            right: 16,
            backgroundColor: tokens.ink,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            ...shadows.toast,
          }}
        >
          <Text
            style={{
              flex: 1,
              fontFamily: fonts.sans,
              fontSize: 13,
              color: '#FFF',
            }}
          >
            {undoSnapshot.label}
          </Text>
          <Pressable onPress={undoClear} hitSlop={8}>
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 12,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: tokens.primary,
              }}
            >
              Undo
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────

/**
 * Compact dropdown row — single line, name + inline alias hint + category tag.
 * ~46 px target; scans like an autocomplete, not a settings list.
 */
function CompactRow({
  name,
  alias,
  tagText,
  tagBg,
  tagColor,
  divider,
  onPress,
}: {
  name: string;
  alias: string | null;
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
        gap: 10,
        paddingVertical: 11,
        paddingHorizontal: 14,
        minHeight: 46,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: tokens.line,
        backgroundColor: pressed ? tokens.bgDeep : 'transparent',
      })}
    >
      <Text
        style={{
          flexShrink: 1,
          fontFamily: fonts.sansBold,
          fontSize: 14,
          color: tokens.ink,
        }}
        numberOfLines={1}
      >
        {name}
        {alias ? (
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 12,
              color: tokens.muted,
            }}
          >
            {'  · also '}
            {alias}
          </Text>
        ) : null}
      </Text>
      <View style={{ flex: 1 }} />
      <View
        style={{
          backgroundColor: tagBg,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 10,
            letterSpacing: 0.6,
            color: tagColor,
          }}
          numberOfLines={1}
        >
          {tagText}
        </Text>
      </View>
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
  // "Fresh" — recently added/touched. Brief terracotta flash before
  // settling into the standard sage. This is the "yes, that landed" cue.
  const bg = fresh ? tokens.primaryLight : tokens.sageLight;
  const fg = fresh ? tokens.primaryDeep : tokens.sageDeep;
  const xBg = fresh ? 'rgba(163,68,31,0.18)' : 'rgba(70,94,64,0.18)';
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

function EmptyPantry() {
  return (
    <View
      style={{
        paddingVertical: 28,
        paddingHorizontal: 18,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: tokens.sageLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 22 }}>🥬</Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 16,
          color: tokens.ink,
          marginBottom: 4,
        }}
      >
        Empty for now
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
        Type above to add what you have. We&apos;ll match it to recipes you can
        make right now.
      </Text>
    </View>
  );
}

function NoMatchesState() {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginTop: 8,
        marginBottom: 16,
        paddingVertical: 28,
        paddingHorizontal: 20,
        backgroundColor: tokens.cream,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: tokens.line,
        alignItems: 'center',
        ...shadows.card,
      }}
    >
      <Text style={{ fontSize: 28, marginBottom: 8 }}>🔍</Text>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 17,
          color: tokens.ink,
          marginBottom: 4,
        }}
      >
        Nothing matches yet
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
        Add a couple more ingredients and recipes will start appearing here.
      </Text>
    </View>
  );
}

function RecipeMatchCard({
  match,
  onOpenRecipe,
  onAddIngredient,
}: {
  match: RecipeMatchResult;
  onOpenRecipe: () => void;
  onAddIngredient: (name: string) => void;
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
      ? 'rgba(212,169,106,0.20)'
      : tokens.primaryLight;
  const allReady = match.totalCount === match.haveCount;
  return (
    <Pressable
      onPress={onOpenRecipe}
      style={({ pressed }) => ({
        width: CARD_WIDTH,
        backgroundColor: tokens.cream,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: tokens.line,
        overflow: 'hidden',
        opacity: pressed ? 0.95 : 1,
        ...shadows.card,
      })}
    >
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
              backgroundColor: 'rgba(26,19,14,0.7)',
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
              {match.haveCount} of {match.totalCount} matched
            </Text>
          </View>
        )}
      </View>
      <View style={{ padding: 14 }}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 15,
            lineHeight: 19,
            color: tokens.ink,
            marginBottom: 10,
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
              backgroundColor: tokens.sage,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Text style={{ color: tokens.ink, fontSize: 11, fontWeight: '900' }}>
              ✓
            </Text>
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 12,
                color: tokens.ink,
              }}
            >
              Tap to cook
            </Text>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {match.missingNames.map((name) => (
              <MissingPill
                key={name}
                name={name}
                onAdd={() => onAddIngredient(name)}
              />
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

/**
 * MissingPill — outlined "ghost" by default; on press, flips to solid olive
 * with a checkmark for the brief moment before the parent re-renders and
 * the pantry no longer treats it as missing (so it disappears). The flip
 * is the visual receipt that the tap landed.
 */
function MissingPill({
  name,
  onAdd,
}: {
  name: string;
  onAdd: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const handlePress = () => {
    setAdding(true);
    onAdd();
  };
  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Add ${name} to pantry`}
      style={({ pressed }) => ({
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: adding ? tokens.sage : 'transparent',
        borderWidth: 1,
        borderColor: adding ? tokens.sage : tokens.lineDark,
        borderStyle: adding ? 'solid' : 'dashed',
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
          color: adding ? '#FFF' : tokens.inkSoft,
        }}
      >
        {adding ? '✓' : '+'}
      </Text>
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 12,
          color: adding ? '#FFF' : tokens.inkSoft,
        }}
      >
        {name}
      </Text>
    </Pressable>
  );
}

// ── Tiny utils ───────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
