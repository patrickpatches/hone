/**
 * Shop tab — the grocery list as a derived view over meal plan + manual adds.
 *
 * Replaces the old "plan.tsx" combined planner+list. The plan still shows
 * here as a small summary strip at the top, but the centre of gravity is
 * the shopping list: aisle-grouped, source-tracked, smart-merged.
 *
 * Source tracking is the contract:
 *   - Adding a meal pushes its ingredients in with a {kind:'meal'} source.
 *   - Removing a meal strips its source. Rows whose sources end up empty
 *     AND aren't manually_added get dropped.
 *   - Typing an item in the search bar adds it with manually_added=true,
 *     so it survives any later meal-plan churn.
 *
 * UI principles, after world-class app review:
 *   - One sticky search at the top (typed adds, autocomplete from
 *     INGREDIENT_CATALOG, alias resolution).
 *   - Aisle-grouped sections in the entrance-to-checkout walk order.
 *   - Sources NOT decorated inline — the row stays clean. Long-press a
 *     row to see the source breakdown ("Pasta aglio e olio +2 cloves").
 *   - One-tap undo when meal removal silently nukes items.
 *   - Share button exports the list as plain text via expo-sharing.
 *   - Voice add stubbed for v1 (full impl needs expo-speech-recognition).
 *   - Drag-to-reorder aisles deferred — the v0.3.0 implementation used
 *     react-native-draggable-flatlist, whose underlying PanGestureHandler
 *     swallows vertical scroll on the web build (Chrome on Android),
 *     leaving items past the visible viewport unreachable. Reverted to a
 *     plain ScrollView so the list always scrolls. When we revisit
 *     reordering it should sit behind an explicit "reorder" mode toggle.
 *
 * Persistence: every state change writes back via replaceShoppingItems
 * (atomic transaction) so the list survives a relaunch unchanged.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
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
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';

import { tokens, fonts, shadows } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { VersionFooter } from '../../src/components/VersionFooter';
import {
  getAllRecipes,
  getPlannedEntries,
  getShoppingItems,
  replaceShoppingItems,
  type ShoppingItem,
  type ShoppingSource,
} from '../../db/database';
import type { Recipe } from '../../src/data/types';
import {
  INGREDIENT_CATALOG,
  fuzzyMatchCatalog,
  matchedAlias,
  cleanIngredientName,
  normalizeForMatch,
  SHOPPING_SECTION_ORDER,
  SHOPPING_SECTION_LABEL,
  CATEGORY_EMOJI,
  type CatalogEntry,
  type PantryCategory,
} from '../../src/data/pantry-helpers';
import {
  applyMealAdd,
  applyMealRemove,
  addManualItem,
  toggleInCart,
  removeShoppingItem,
  recipesById,
} from '../../src/data/shopping-helpers';
import { scaleIngredient } from '../../src/data/scale';

// ── Constants ────────────────────────────────────────────────────────────────

const UNDO_TIMEOUT_MS = 5500;

// ── Helpers ──────────────────────────────────────────────────────────────────

function sameNorm(a: string, b: string): boolean {
  return normalizeForMatch(a) === normalizeForMatch(b);
}

function formatQuantity(qty: number | null, unit: string | null): string {
  if (qty == null || qty <= 0) return '';
  const rounded = qty < 10 ? Math.round(qty * 10) / 10 : Math.round(qty);
  const num = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
  return unit ? `${num} ${unit}` : num;
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ShopTab() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plannedRecipeIds, setPlannedRecipeIds] = useState<
    { recipeId: string; servings: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Source breakdown sheet
  const [sourceSheetItem, setSourceSheetItem] = useState<ShoppingItem | null>(null);

  // Undo state — when meal removal nukes rows, hold a snapshot for 5.5s.
  const [undoSnapshot, setUndoSnapshot] = useState<{
    list: ShoppingItem[];
    nukedCount: number;
    label: string;
  } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount tracking — setTimeout callbacks must not setState after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const inputRef = useRef<TextInput>(null);

  // ── Load whenever the tab is focused ───────────────────────────────────────
  // useFocusEffect re-runs when the user switches back to this tab so any
  // changes to the meal plan elsewhere reflect here without a manual reload.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        const [shopItems, allRecipes, planned] = await Promise.all([
          getShoppingItems(db),
          getAllRecipes(db),
          getPlannedEntries(db),
        ]);
        if (cancelled) return;
        setRecipes(allRecipes);
        setItems(shopItems);
        setPlannedRecipeIds(
          planned.map((p) => ({ recipeId: p.recipe_id, servings: p.servings })),
        );
        setLoading(false);

        // Reconcile: the plan tab may have changed while we were elsewhere.
        // Walk the planned recipes and apply any meal sources that aren't
        // yet on rows. Walk the shopping rows and strip meal sources whose
        // recipe is no longer planned.
        await reconcile(shopItems, allRecipes, planned);
      }
      load().catch((e) => {
        console.error('shop load failed', e);
        setLoading(false);
      });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db]),
  );

  // ── Reconcile meal plan ↔ shopping list ──────────────────────────────────
  // Pure-ish function: given the current persisted state, computes the
  // correct shopping list and persists it if anything changed.
  const reconcile = useCallback(
    async (
      currentItems: ShoppingItem[],
      allRecipes: Recipe[],
      planned: { recipe_id: string; servings: number }[],
    ) => {
      const recipeMap = recipesById(allRecipes);
      const plannedSet = new Set(planned.map((p) => p.recipe_id));

      let next = currentItems;

      // 1) Strip meal sources for recipes no longer planned.
      const removedRecipeIds = new Set<string>();
      for (const it of next) {
        for (const s of it.sources) {
          if (s.kind === 'meal' && !plannedSet.has(s.recipe_id)) {
            removedRecipeIds.add(s.recipe_id);
          }
        }
      }
      for (const rid of removedRecipeIds) {
        next = applyMealRemove(next, rid, recipeMap);
      }

      // 2) Add any planned meal that isn't represented yet.
      for (const p of planned) {
        const recipe = recipeMap.get(p.recipe_id);
        if (!recipe) continue;
        const alreadyHasIt = next.some((it) =>
          it.sources.some(
            (s) =>
              s.kind === 'meal' && s.recipe_id === p.recipe_id && s.servings === p.servings,
          ),
        );
        if (alreadyHasIt) continue;
        // Either net-new or servings changed — applyMealAdd will replace
        // any prior source for the same recipe and recompute quantities.
        next = applyMealAdd(next, recipe, p.servings, recipeMap);
      }

      // Persist + reflect locally
      const changed =
        next.length !== currentItems.length ||
        next.some((n, i) => n !== currentItems[i]);
      if (changed && mountedRef.current) {
        setItems(next);
        await replaceShoppingItems(db, next).catch((e) =>
          console.error('replaceShoppingItems failed', e),
        );
      }
    },
    [db],
  );

  // ── Persistence helper ─────────────────────────────────────────────────────
  const persist = useCallback(
    (next: ShoppingItem[]) => {
      setItems(next);
      replaceShoppingItems(db, next).catch((e) =>
        console.error('replaceShoppingItems failed', e),
      );
    },
    [db],
  );

  // ── Mutators ───────────────────────────────────────────────────────────────

  const addManual = useCallback(
    (rawName: string, category?: PantryCategory) => {
      const cleaned = cleanIngredientName(rawName);
      if (!cleaned) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      persist(addManualItem(items, cleaned, category));
      setSearch('');
    },
    [items, persist],
  );

  const handleToggleInCart = useCallback(
    (id: string) => {
      Haptics.selectionAsync().catch(() => {});
      persist(toggleInCart(items, id));
    },
    [items, persist],
  );

  const handleRemove = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      persist(removeShoppingItem(items, id));
    },
    [items, persist],
  );

  const clearTicked = useCallback(() => {
    const tickedCount = items.filter((it) => it.in_cart).length;
    if (tickedCount === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    persist(items.filter((it) => !it.in_cart));
  }, [items, persist]);

  // ── Undo (used by the meal-plan bridge in step 11; also exposed here) ─────
  const showUndoToast = useCallback(
    (snapshot: ShoppingItem[], nukedCount: number, label: string) => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      setUndoSnapshot({ list: snapshot, nukedCount, label });
      undoTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setUndoSnapshot(null);
      }, UNDO_TIMEOUT_MS);
    },
    [],
  );

  const undoLast = useCallback(() => {
    if (!undoSnapshot) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    persist(undoSnapshot.list);
    setUndoSnapshot(null);
  }, [undoSnapshot, persist]);

  // ── Autocomplete suggestions ──────────────────────────────────────────────
  const suggestions = useMemo(() => {
    const q = search.trim();
    if (q.length < 2) return { existing: [], catalog: [], allowAddNew: false };
    const ql = q.toLowerCase();
    const existing = items
      .filter((it) => it.name.toLowerCase().includes(ql))
      .slice(0, 3);
    const catalog: { entry: CatalogEntry; alias: string | null }[] = [];
    for (const entry of INGREDIENT_CATALOG) {
      if (catalog.length >= 5) break;
      if (!fuzzyMatchCatalog(entry, q)) continue;
      // Skip entries that already match a row exactly (in_pantry shown above)
      if (items.some((it) => sameNorm(it.name, entry.name))) continue;
      catalog.push({ entry, alias: matchedAlias(entry, q) });
    }
    const exact = INGREDIENT_CATALOG.some((e) => e.name.toLowerCase() === ql);
    const inList = items.some((it) => it.name.toLowerCase() === ql);
    const allowAddNew = !exact && !inList && q.length >= 2;
    return { existing, catalog, allowAddNew };
  }, [search, items]);

  const showDropdown =
    searchFocused &&
    search.trim().length >= 2 &&
    (suggestions.existing.length > 0 ||
      suggestions.catalog.length > 0 ||
      suggestions.allowAddNew);

  // ── Aisle sections (canonical entrance-to-checkout walk order) ────────────
  const sections = useMemo(() => {
    const buckets = new Map<PantryCategory, ShoppingItem[]>();
    for (const cat of SHOPPING_SECTION_ORDER) buckets.set(cat, []);
    for (const it of items) {
      const cat =
        (SHOPPING_SECTION_ORDER as readonly string[]).includes(it.category)
          ? (it.category as PantryCategory)
          : 'Pantry Staples';
      buckets.get(cat)!.push(it);
    }
    // Within each section: in-cart items drop to the bottom (struck-through)
    // so the eye lands on what's still to buy.
    return SHOPPING_SECTION_ORDER
      .map((cat) => ({
        cat,
        label: SHOPPING_SECTION_LABEL[cat],
        emoji: CATEGORY_EMOJI[cat],
        items: (buckets.get(cat) ?? []).sort((a, b) => {
          if (a.in_cart !== b.in_cart) return a.in_cart ? 1 : -1;
          return b.added_at - a.added_at;
        }),
      }))
      .filter((s) => s.items.length > 0);
  }, [items]);

  const totalCount = items.length;
  const tickedCount = items.filter((it) => it.in_cart).length;
  const fromMealsCount = items.filter((it) =>
    it.sources.some((s) => s.kind === 'meal'),
  ).length;
  const manualCount = items.filter((it) => it.manually_added).length;

  // ── Share handler ──────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const lines: string[] = ['Shopping list (Hone)\n'];
    for (const sec of sections) {
      lines.push(`\n${sec.label.toUpperCase()}`);
      for (const it of sec.items) {
        const tick = it.in_cart ? '☑' : '☐';
        const qty = formatQuantity(it.quantity, it.unit);
        lines.push(`  ${tick} ${it.name}${qty ? ' — ' + qty : ''}`);
      }
    }
    const message = lines.join('\n');
    try {
      await Share.share({ message });
    } catch (e) {
      console.warn('Share failed', e);
    }
  }, [sections]);

  const handleVoice = useCallback(() => {
    // Stubbed — full implementation needs expo-speech-recognition (or
    // @react-native-voice/voice). The button stays in the UI so the
    // affordance is discoverable; we just toast a "coming soon" for v1.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
    // Reusing the undo banner for a transient message — it disappears after 5s.
    showUndoToast(items, 0, 'Voice add coming soon');
  }, [items, showUndoToast]);

  // ── Render ────────────────────────────────────────────────────────────────
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
      {/* Sticky top: header + search */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 8,
          backgroundColor: tokens.bg,
          zIndex: 10,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
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
              Cook with what you'll buy
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
                Shop
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
              {totalCount} item{totalCount === 1 ? '' : 's'}
              {tickedCount > 0 ? ` · ${tickedCount} ticked` : ''}
            </Text>
          </View>
          <Pressable
            onPress={handleShare}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Share list"
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed ? tokens.bgDeep : tokens.cream,
              borderWidth: 1,
              borderColor: tokens.lineDark,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 4,
            })}
          >
            <Icon name="external" size={16} color={tokens.inkSoft} />
          </Pressable>
        </View>

        {/* Search bar with mic + clear */}
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
              onBlur={() => setTimeout(() => setSearchFocused(false), 120)}
              placeholder="Add anything — milk, capsicum, toilet paper…"
              placeholderTextColor={tokens.muted}
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              returnKeyType="done"
              onSubmitEditing={() => {
                const q = search.trim();
                if (q.length > 0) addManual(q);
              }}
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
            ) : (
              <Pressable
                onPress={handleVoice}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Voice add"
              >
                <Text style={{ fontSize: 16 }}>🎙️</Text>
              </Pressable>
            )}
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
                ...shadows.cardLifted,
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
                  meta="Already on your list"
                  tagText="On list"
                  tagBg={tokens.sageLight}
                  tagColor={tokens.sageDeep}
                  divider={
                    i < suggestions.existing.length - 1 ||
                    suggestions.catalog.length > 0 ||
                    suggestions.allowAddNew
                  }
                  onPress={() => {
                    setSearch('');
                    Haptics.selectionAsync().catch(() => {});
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
                  onPress={() => addManual(c.entry.name, c.entry.category)}
                />
              ))}
              {suggestions.allowAddNew && (
                <DropdownRow
                  iconBg={tokens.bgDeep}
                  iconColor={tokens.inkSoft}
                  iconChar="＋"
                  name={`Add "${capitalize(search.trim())}" as new`}
                  meta="Will save under Pantry Staples — you can recategorise"
                  tagText="New"
                  tagBg={tokens.bgDeep}
                  tagColor={tokens.inkSoft}
                  divider={false}
                  onPress={() => addManual(search.trim())}
                />
              )}
            </Animated.View>
          )}
        </View>
      </View>

      {totalCount === 0 ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160, paddingTop: 4 }}
        >
          <PlanSummary
            plannedCount={plannedRecipeIds.length}
            fromMeals={fromMealsCount}
            manual={manualCount}
          />
          <View
            style={{
              marginHorizontal: 20,
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
                backgroundColor: tokens.sageLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 26 }}>🛒</Text>
            </View>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 18,
                color: tokens.ink,
                marginBottom: 6,
              }}
            >
              Your list is empty
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
              Type above to add anything, or plan a meal on the Kitchen tab —
              its ingredients land here automatically.
            </Text>
          </View>
          <VersionFooter paddingBottom={32} />
        </ScrollView>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160, paddingTop: 4 }}
        >
          <PlanSummary
            plannedCount={plannedRecipeIds.length}
            fromMeals={fromMealsCount}
            manual={manualCount}
          />
          {sections.map((item) => (
            <Section
              key={item.cat}
              label={item.label}
              emoji={item.emoji}
              items={item.items}
              onToggle={handleToggleInCart}
              onRemove={handleRemove}
              onLongPress={(it) => setSourceSheetItem(it)}
            />
          ))}
          {tickedCount > 0 && (
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 8,
                marginBottom: 16,
              }}
            >
              <Pressable
                onPress={clearTicked}
                style={({ pressed }) => ({
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: pressed ? tokens.bgDeep : 'transparent',
                  borderWidth: 1,
                  borderColor: tokens.lineDark,
                  alignItems: 'center',
                })}
              >
                <Text
                  style={{
                    fontFamily: fonts.sansBold,
                    fontSize: 13,
                    color: tokens.inkSoft,
                  }}
                >
                  Clear {tickedCount} ticked item
                  {tickedCount === 1 ? '' : 's'}
                </Text>
              </Pressable>
            </View>
          )}
          <VersionFooter paddingBottom={32} />
        </ScrollView>
      )}

      {/* Undo toast */}
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
          {undoSnapshot.nukedCount > 0 && (
            <Pressable onPress={undoLast} hitSlop={8}>
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
          )}
        </Animated.View>
      )}

      {/* Source breakdown sheet */}
      <Modal
        visible={sourceSheetItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSourceSheetItem(null)}
      >
        <Pressable
          onPress={() => setSourceSheetItem(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation && e.stopPropagation()}
            style={{
              backgroundColor: tokens.cream,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 24,
              paddingBottom: insets.bottom + 24,
              paddingHorizontal: 20,
            }}
          >
            {sourceSheetItem && (
              <SourceBreakdown
                item={sourceSheetItem}
                recipes={recipes}
                onClose={() => setSourceSheetItem(null)}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────

function PlanSummary({
  plannedCount,
  fromMeals,
  manual,
}: {
  plannedCount: number;
  fromMeals: number;
  manual: number;
}) {
  if (plannedCount === 0 && fromMeals === 0 && manual === 0) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20,
        paddingBottom: 14,
        flexWrap: 'wrap',
      }}
    >
      {plannedCount > 0 && (
        <Chip
          label={`${plannedCount} meal${plannedCount === 1 ? '' : 's'} planned`}
          tint="sage"
        />
      )}
      {fromMeals > 0 && (
        <Chip label={`${fromMeals} from meals`} tint="sage" />
      )}
      {manual > 0 && (
        <Chip label={`${manual} added`} tint="primary" />
      )}
    </View>
  );
}

function Chip({
  label,
  tint,
}: {
  label: string;
  tint: 'sage' | 'primary';
}) {
  const bg = tint === 'sage' ? tokens.sageLight : tokens.primaryLight;
  const fg = tint === 'sage' ? tokens.sageDeep : tokens.primaryDeep;
  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: bg,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 11,
          color: fg,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

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
          style={{ fontFamily: fonts.sansBold, fontSize: 14, color: tokens.ink }}
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

function Section({
  label,
  emoji,
  items,
  onToggle,
  onRemove,
  onLongPress,
}: {
  label: string;
  emoji: string;
  items: ShoppingItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onLongPress: (it: ShoppingItem) => void;
}) {
  return (
    <View style={{ marginTop: 6, marginBottom: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 20,
          paddingVertical: 8,
        }}
      >
        <Text style={{ fontSize: 14 }}>{emoji}</Text>
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: tokens.inkSoft,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 11,
            color: tokens.muted,
          }}
        >
          ({items.length})
        </Text>
      </View>
      <View
        style={{
          marginHorizontal: 20,
          backgroundColor: tokens.cream,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: tokens.line,
          overflow: 'hidden',
          ...shadows.card,
        }}
      >
        {items.map((it, idx) => (
          <ShopRow
            key={it.id}
            item={it}
            isLast={idx === items.length - 1}
            onToggle={() => onToggle(it.id)}
            onRemove={() => onRemove(it.id)}
            onLongPress={() => onLongPress(it)}
          />
        ))}
      </View>
    </View>
  );
}

function ShopRow({
  item,
  isLast,
  onToggle,
  onRemove,
  onLongPress,
}: {
  item: ShoppingItem;
  isLast: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onLongPress: () => void;
}) {
  const qty = formatQuantity(item.quantity, item.unit);
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(140)}
      layout={LinearTransition.duration(180)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 56,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: tokens.line,
        opacity: item.in_cart ? 0.55 : 1,
      }}
    >
      <Pressable
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.in_cart }}
        accessibilityLabel={`${item.in_cart ? 'Untick' : 'Tick'} ${item.name}`}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: item.in_cart ? tokens.sage : tokens.lineDark,
          backgroundColor: item.in_cart ? tokens.sage : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {item.in_cart && (
          <Text style={{ color: tokens.ink, fontSize: 13, fontWeight: '900' }}>
            ✓
          </Text>
        )}
      </Pressable>
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={400}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 14,
              color: tokens.ink,
              textDecorationLine: item.in_cart ? 'line-through' : 'none',
            }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {qty ? (
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 12,
                color: tokens.muted,
                textDecorationLine: item.in_cart ? 'line-through' : 'none',
              }}
            >
              {qty}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onRemove}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name}`}
        style={({ pressed }) => ({
          padding: 6,
          opacity: pressed ? 0.4 : 0.5,
        })}
      >
        <Icon name="x" size={14} color={tokens.ink} />
      </Pressable>
    </Animated.View>
  );
}

function SourceBreakdown({
  item,
  recipes,
  onClose,
}: {
  item: ShoppingItem;
  recipes: Recipe[];
  onClose: () => void;
}) {
  const recipeMap = useMemo(() => recipesById(recipes), [recipes]);
  const mealSources = item.sources.filter(
    (s): s is Extract<ShoppingSource, { kind: 'meal' }> => s.kind === 'meal',
  );
  const isManual = item.sources.some((s) => s.kind === 'manual');
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 22,
            color: tokens.ink,
          }}
        >
          {item.name}
        </Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <Icon name="x" size={16} color={tokens.muted} />
        </Pressable>
      </View>
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: tokens.muted,
          marginBottom: 10,
        }}
      >
        Where this came from
      </Text>
      {mealSources.length === 0 && !isManual && (
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: tokens.muted }}>
          No active sources.
        </Text>
      )}
      {mealSources.map((s, i) => {
        const recipe = recipeMap.get(s.recipe_id);
        if (!recipe) return null;
        const ing = recipe.ingredients.find(
          (x) =>
            normalizeForMatch(x.name) === normalizeForMatch(item.name) &&
            (x.unit ?? '') === (item.unit ?? ''),
        );
        const contribution = ing
          ? scaleIngredient(ing, s.servings, recipe.base_servings)
          : 0;
        return (
          <View
            key={`${s.recipe_id}-${i}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: tokens.line,
              gap: 10,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: tokens.sage,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 14,
                  color: tokens.ink,
                }}
                numberOfLines={1}
              >
                {recipe.title}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  color: tokens.muted,
                  marginTop: 2,
                }}
              >
                +{formatQuantity(contribution, item.unit) || `${contribution}`}{' '}
                · {s.servings} serving{s.servings === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        );
      })}
      {isManual && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderTopWidth: mealSources.length > 0 ? 1 : 0,
            borderTopColor: tokens.line,
            gap: 10,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: tokens.primary,
            }}
          />
          <Text
            style={{
              flex: 1,
              fontFamily: fonts.sansBold,
              fontSize: 14,
              color: tokens.ink,
            }}
          >
            You added this manually
          </Text>
        </View>
      )}
    </View>
  );
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
