/**
 * Pantry — v0.6.0 (Pantry v3 redesign, 2026-05-03).
 *
 * Changes from v0.5.x:
 *
 *   1. Inline search replaces the full-screen IngredientSearchOverlay modal.
 *      Rationale: augmentation tasks (adding to an existing list) need the list
 *      visible while searching. A full-screen takeover hides the pills context
 *      the user needs to avoid duplicates. Inline keeps the pills frozen above
 *      the autocomplete results.
 *
 *   2. Clear-all confirmation Modal (not Alert — Alert can't be styled for
 *      dark tokens). "Clear all" moved from below the search bar to a low-
 *      prominence trash icon in the screen's title row. Count baked into the
 *      destroy button label so the user knows what they're losing.
 *
 *   3. Match banner now shows concrete numbers ("3 recipes you can cook now ·
 *      6 more within 1–3 ingredients") with a gold "See all" pill CTA. The
 *      ambiguous bare `→` arrow is removed.
 *
 *   4. Carousel snap regression fixed: switched from snapToOffsets (fragile
 *      with dynamic data) to snapToInterval (robust, one constant).
 *
 *   5. Emoji rendered inline with ingredient name in autocomplete results,
 *      not as a separate element that could reflow on narrow screens.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { tokens, fonts, shadows } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { FoodIcon, categoryIconName, ingredientIconName } from '../../src/components/PantryIcons';
import { VersionFooter } from '../../src/components/VersionFooter';
import {
  clearAllPantryItems,
  getActiveRecipes,
  getPantryItems,
  getShoppingItems,
  upsertPantryItem,
  deletePantryItem,
  upsertShoppingItem,
  deleteShoppingItem,
} from '../../db/database';
import type { PantryItem, ShoppingItem } from '../../db/database';
import type { Recipe } from '../../src/data/types';
import {
  categorizeIngredient,
  cleanIngredientName,
  normalizeForMatch,
  scoreRecipeAgainstPantry,
  INGREDIENT_CATALOG,
  SHOPPING_SECTION_LABEL,
  SHOPPING_SECTION_ORDER,
  fuzzyMatchCatalog,
  matchedAlias,
} from '../../src/data/pantry-helpers';
import type {
  PantryCategory,
  CatalogEntry,
  RecipeMatchResult,
} from '../../src/data/pantry-helpers';

// ── Constants ────────────────────────────────────────────────────────────────

const FRESH_DURATION_MS = 1500;
const TOP_MATCHES = 6;
const UNLOCK_MIN_PANTRY = 2;
const UNLOCK_MIN_COUNT = 2;
const UNDO_TIMEOUT_MS = 5000;
const SHOP_UNDO_TIMEOUT_MS = 3000;
const CARD_GAP = 12;
const CAROUSEL_PADDING = 20;
const PEEK_WIDTH = 44; // dp of next card to peek on right

// ── Types ────────────────────────────────────────────────────────────────────

type AutocompleteSection = { title: PantryCategory; data: CatalogEntry[] };

// ── Helpers ──────────────────────────────────────────────────────────────────

function pantryId(name: string): string {
  return (
    'pantry-' +
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)
  );
}

function shopId(name: string): string {
  return (
    'shop-' +
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)
  );
}

function sameNorm(a: string, b: string): boolean {
  return normalizeForMatch(a) === normalizeForMatch(b);
}

// ── Build #122 Pass 1 — countable vs bulk judgment ─────────────────────────
// Bulk staples you'd never count individually (you have flour, not "3 flours")
// show a neutral "Stocked" pill instead of the +/− stepper. Everything else
// defaults to the stepper. Curated set keyed on normalized names; covers the
// launch catalog's bulk items. Safe default = countable (stepper).
const UNCOUNTED_NAMES: ReadonlySet<string> = new Set(
  [
    'salt', 'fine salt', 'sea salt', 'table salt', 'black pepper', 'white pepper',
    'olive oil', 'vegetable oil', 'sesame oil', 'cooking oil', 'oil',
    'plain flour', 'bread flour', 'self raising flour', 'flour', 'cornflour', 'corn flour',
    'white sugar', 'brown sugar', 'caster sugar', 'icing sugar', 'sugar',
    'white rice', 'basmati rice', 'jasmine rice', 'rice',
    'chicken stock', 'vegetable stock', 'beef stock', 'fish stock', 'stock', 'broth',
    'water', 'baking powder', 'bicarbonate of soda', 'bicarb soda', 'bicarbonate',
    'soy sauce', 'fish sauce', 'oyster sauce', 'hoisin sauce', 'worcestershire sauce',
    'honey', 'maple syrup', 'tahini', 'miso paste', 'tomato paste',
    'white wine vinegar', 'red wine vinegar', 'apple cider vinegar', 'rice vinegar', 'vinegar',
    'milk', 'whole milk',
  ].map((n) => normalizeForMatch(n)),
);

function isCountableItem(item: { name: string; category: string }): boolean {
  if (UNCOUNTED_NAMES.has(normalizeForMatch(item.name))) return false;
  // Spices & Seasonings are measured by spoon, never counted — treat as bulk.
  if (item.category === 'Spices & Seasonings') return false;
  return true;
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function PantryTab() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  // Shopping items must live on the pantry screen so chip state can be
  // DERIVED from membership (REGN-007 architectural fix). Without this,
  // the chip kept its own bool which couldn't sync back when Shop-tab
  // hit the X, when undo fired, or when the user re-tapped a ✓ chip.
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [addName, setAddName] = useState('');
  // searchMode is set by pressing the Pressable search bar (not by TextInput
  // onFocus). This sidesteps Android's IME-resize → spurious-onBlur cycle
  // entirely: the autoFocus TextInput opens already-focused, with no state
  // update mid-gesture to cause a race condition.
  const [searchMode, setSearchMode] = useState(false);
  const inputRef = useRef<TextInput>(null);
  // Scroll-to-top when user taps the active Pantry tab button
  const browseScrollRef = useRef<ScrollView>(null);
  useScrollToTop(browseScrollRef);
  // Blur debounce — gives suggestion taps 200 ms to fire before
  // search mode exits. handleSearchSelect clears this on each tap.
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // showDropdown: show the inline suggestion list when the user has typed
  // ≥1 character. Browse content (pills, banner, carousel) is ALWAYS
  // visible underneath — no full-screen mode switch.
  const showDropdown = searchMode && addName.trim().length >= 1;


  // Search bar border colour animates 150 ms between inactive/active gold
  const searchFocusAnim = useSharedValue(0);
  useEffect(() => {
    searchFocusAnim.value = withTiming(searchMode ? 1 : 0, { duration: 150 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchMode]);
  const animatedSearchBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      searchFocusAnim.value,
      [0, 1],
      ['rgba(184,64,48,0.22)', tokens.primary],
    ),
  }));

  // Dynamic card width: screen minus both paddings, one gap, and peek allowance
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.floor(
    screenWidth - CAROUSEL_PADDING * 2 - CARD_GAP - PEEK_WIDTH,
  );

  const [addedAt, setAddedAt] = useState<Record<string, number>>({});
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  // Clear-all confirmation modal
  const [showClearModal, setShowClearModal] = useState(false);

  // Clear-all undo state
  const [undoSnapshot, setUndoSnapshot] = useState<{
    items: PantryItem[];
    addedAt: Record<string, number>;
    label: string;
  } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shopping-list add undo state (3 s window — shorter than clear-all).
  // We hold the ingredient's *name* (not the chip's local state) so undo can
  // find and remove the row even if the chip has re-rendered with a new
  // shoppingItems list underneath it (REGN-007 path #2).
  const [shopUndo, setShopUndo] = useState<{
    id: string;
    name: string;
    label: string;
  } | null>(null);
  const shopUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Build #122 Pass 1 — organised "what you have" list ─────────────────────
  // Collapse state per category (component-local; persisting is a fine
  // follow-up, not required for v1). Default: all expanded (empty set).
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Item-removal undo (stepper − at qty 1 removes the row). Modeled on the
  // shopUndo pattern: hold a snapshot of the removed item so undo can re-insert
  // it even after the list re-renders underneath.
  const [itemUndo, setItemUndo] = useState<{ item: PantryItem; addedAtMs: number; label: string } | null>(null);
  const itemUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Clear all debounce/undo timers so no setState fires after unmount
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (shopUndoTimerRef.current) clearTimeout(shopUndoTimerRef.current);
      if (itemUndoTimerRef.current) clearTimeout(itemUndoTimerRef.current);
    };
  }, []);

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [items, recs, shop] = await Promise.all([
          getPantryItems(db),
          getActiveRecipes(db),
          getShoppingItems(db),
        ]);
        if (!cancelled) {
          setPantryItems(items);
          setRecipes(recs);
          setShoppingItems(shop);
        }
      } catch (e) {
        console.error('Pantry load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db]);

  // Re-sync shopping items AND pantry items every time the user comes back
  // to the Pantry tab. The shopping refetch is the REGN-007 path #5 bridge
  // (Shop-tab X-removal -> chip reverts to "+ need"). The pantry refetch
  // (added 2026-05-10) is the bridge for the new shop -> pantry mirror:
  // when the user ticks an item in Shop, that item lands in pantry as
  // have_it=true, and the recipe-match counters on this carousel should
  // reflect it the moment the user returns. Without this refetch the pantry
  // state stays stale and the counters don't move.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getShoppingItems(db), getPantryItems(db)])
        .then(([shop, pantry]) => {
          if (cancelled) return;
          setShoppingItems(shop);
          setPantryItems(pantry);
        })
        .catch((e) => console.error('shop/pantry refetch failed', e));
      return () => {
        cancelled = true;
      };
    }, [db]),
  );

  // ── Derived ────────────────────────────────────────────────────────────────

  const sortedPantry = useMemo(() => {
    return [...pantryItems].sort((a, b) => {
      const ta = addedAt[a.id] ?? 0;
      const tb = addedAt[b.id] ?? 0;
      return tb - ta;
    });
  }, [pantryItems, addedAt]);

  const matchResults = useMemo<RecipeMatchResult[]>(() => {
    if (pantryItems.length === 0) return [];
    return recipes.map((r) => scoreRecipeAgainstPantry(r, pantryItems));
  }, [recipes, pantryItems]);

  const ranked = useMemo(() => {
    return [...matchResults]
      .filter((m) => m.haveCount > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_MATCHES);
  }, [matchResults]);

  const fullMatches = useMemo(
    () => ranked.filter((m) => m.haveCount === m.totalCount).length,
    [ranked],
  );

  const unlock = useMemo(() => {
    if (pantryItems.length < UNLOCK_MIN_PANTRY) return null;
    const counter = new Map<string, number>();
    for (const m of matchResults) {
      const coverage = m.totalCount > 0 ? m.haveCount / m.totalCount : 0;
      if (coverage < 0.5 || m.haveCount === m.totalCount) continue;
      for (const name of m.missingNames) {
        counter.set(name, (counter.get(name) ?? 0) + 1);
      }
    }
    let best: { name: string; count: number } | null = null;
    for (const [name, count] of counter.entries()) {
      if (count >= UNLOCK_MIN_COUNT && (!best || count > best.count)) {
        best = { name, count };
      }
    }
    return best;
  }, [matchResults, pantryItems.length]);

  const havePills = useMemo(
    () => sortedPantry.filter((p) => p.have_it),
    [sortedPantry],
  );

  // ── Build #122 Pass 1 — grouped "what you have" + stepper helpers ──────────
  // Group stocked items by category, ordered per SHOPPING_SECTION_ORDER, hiding
  // empty categories. Items within a category keep recency order (havePills is
  // already recency-sorted).
  const groupedHaves = useMemo(() => {
    const byCat = new Map<PantryCategory, PantryItem[]>();
    for (const it of havePills) {
      const cat = (it.category as PantryCategory);
      const arr = byCat.get(cat);
      if (arr) arr.push(it);
      else byCat.set(cat, [it]);
    }
    return SHOPPING_SECTION_ORDER
      .filter((cat) => (byCat.get(cat)?.length ?? 0) > 0)
      .map((cat) => ({ category: cat, items: byCat.get(cat)! }));
  }, [havePills]);

  // Sub-line: which surfaced (carousel-ranked) recipes use this ingredient.
  // Reuses the carousel's existing ranked set + normalizeForMatch — no new
  // scoring. Returns recipe titles; empty when no surfaced recipe uses it.
  const recipeTitlesForItem = useCallback(
    (item: PantryItem): string[] => {
      const titles: string[] = [];
      for (const m of ranked) {
        const used = m.recipe.ingredients.some((ing) =>
          sameNorm(cleanIngredientName(ing.name), item.name),
        );
        if (used) titles.push(m.recipe.title);
      }
      return titles;
    },
    [ranked],
  );

  const toggleCategory = useCallback((cat: PantryCategory) => {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  // Stepper: write the row's quantity. Optimistic local update + background
  // persist, mirroring the addItem/removeItem pattern already in this file.
  const setItemQuantity = useCallback(
    (item: PantryItem, nextQty: number) => {
      const clamped = Math.max(1, Math.min(99, nextQty));
      Haptics.selectionAsync().catch(() => {});
      setPantryItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, quantity: clamped } : p)),
      );
      upsertPantryItem(db, { ...item, quantity: clamped }).catch((e) =>
        console.error('setItemQuantity upsert failed', e),
      );
    },
    [db],
  );

  // Stepper − at qty 1 removes the row, with a brief undo toast (reuses the
  // shopUndo visual pattern). Snapshot lets undo re-insert with its quantity.
  const removeItemWithUndo = useCallback(
    (item: PantryItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const snapAddedAt = addedAt[item.id] ?? Date.now();
      setPantryItems((prev) => prev.filter((p) => p.id !== item.id));
      deletePantryItem(db, item.id).catch((e) =>
        console.error('deletePantryItem failed', e),
      );
      if (itemUndoTimerRef.current) clearTimeout(itemUndoTimerRef.current);
      setItemUndo({ item, addedAtMs: snapAddedAt, label: `Removed ${item.name}` });
      itemUndoTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setItemUndo(null);
      }, SHOP_UNDO_TIMEOUT_MS);
    },
    [db, addedAt],
  );

  const undoItemRemove = useCallback(async () => {
    if (!itemUndo) return;
    if (itemUndoTimerRef.current) clearTimeout(itemUndoTimerRef.current);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const { item, addedAtMs } = itemUndo;
    setPantryItems((prev) => (prev.some((p) => p.id === item.id) ? prev : [item, ...prev]));
    setAddedAt((prev) => ({ ...prev, [item.id]: addedAtMs }));
    setItemUndo(null);
    await upsertPantryItem(db, item).catch((e) =>
      console.error('undoItemRemove upsert failed', e),
    );
  }, [db, itemUndo]);

  // Stepper decrement: − at 1 removes; otherwise decrement quantity.
  const decrementItem = useCallback(
    (item: PantryItem) => {
      const qty = item.quantity ?? 1;
      if (qty <= 1) removeItemWithUndo(item);
      else setItemQuantity(item, qty - 1);
    },
    [removeItemWithUndo, setItemQuantity],
  );

  // ── Derived chip state (REGN-007) ─────────────────────────────────────────
  // The chip's added/needed visual is not its own — it's a function of the
  // current shopping list. Anything that changes the list (add, undo, ✓-tap,
  // Shop-tab X) flows through setShoppingItems and the chip auto re-derives.
  const shoppingNameSet = useMemo(() => {
    const s = new Set<string>();
    for (const it of shoppingItems) s.add(normalizeForMatch(it.name));
    return s;
  }, [shoppingItems]);

  // ── Autocomplete sections ──────────────────────────────────────────────────
  // When search is active, the SectionList shows these instead of browse content.

  const autocompleteSections = useMemo<AutocompleteSection[]>(() => {
    const q = addName.trim();
    const entries =
      q.length >= 2
        ? INGREDIENT_CATALOG.filter((e) => fuzzyMatchCatalog(e, q))
        : []; // Don't dump full catalog — wait for 2+ chars

    const inPantryNorms = new Set(pantryItems.map((p) => normalizeForMatch(p.name)));

    const map = new Map<PantryCategory, CatalogEntry[]>();
    for (const entry of entries) {
      const bucket = map.get(entry.category) ?? [];
      bucket.push(entry);
      map.set(entry.category, bucket);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [addName, pantryItems]);

  const inPantrySet = useMemo(() => {
    const s = new Set<string>();
    for (const p of pantryItems) s.add(p.name.toLowerCase().trim());
    return s;
  }, [pantryItems]);

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
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const id = pantryId(clean);
      const item: PantryItem = {
        id,
        name: clean,
        category: category ?? categorizeIngredient(clean),
        quantity: 1, // build #122 — stepper starts at 1 on add
        unit: null,
        have_it: true,
      };
      setPantryItems((prev) => [item, ...prev]);
      setAddedAt((prev) => ({ ...prev, [id]: Date.now() }));
      setFreshIds((prev) => new Set(prev).add(id));
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

  const handleSearchSelect = useCallback(
    (entry: CatalogEntry) => {
      // Cancel pending blur dismissal so search mode stays open
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      addByName(entry.name, entry.category);
      setAddName('');
      // Keep keyboard open for rapid multi-add
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [addByName],
  );

  // handleSearchBlur — fires when TextInput loses focus.
  // Debounced 200 ms so suggestion taps can fire first.
  const handleSearchBlur = useCallback(() => {
    blurTimerRef.current = setTimeout(() => {
      setSearchMode(false);
      setAddName('');
    }, 200);
  }, []);

  const handleAddCustom = useCallback(() => {
    const trimmed = addName.trim();
    if (!trimmed) return;
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    addByName(trimmed);
    setAddName('');
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [addName, addByName]);

  // ── Clear all + undo ───────────────────────────────────────────────────────
  // v3: Modal confirmation replaces the inline button. This is the actual clear
  // function — it runs after the user confirms in the modal.

  const clearAll = useCallback(async () => {
    if (pantryItems.length === 0) return;
    setShowClearModal(false);
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
    await Promise.all(
      undoSnapshot.items.map((it) =>
        upsertPantryItem(db, it).catch((e) =>
          console.error('upsertPantryItem during undo failed', e),
        ),
      ),
    );
  }, [db, undoSnapshot]);

  // ── Shopping list add / remove / undo ──────────────────────────────────────
  // All mutations route through these helpers. Each one updates local state
  // synchronously so the chip re-derives immediately, then persists to SQLite
  // in the background. REGN-007 architectural fix.

  const addToShoppingList = useCallback(
    async (
      ing: { name: string; amount: number; unit: string },
      recipeId: string,
    ) => {
      // No-op if already on the list — chip will already render as ✓.
      // This protects against double-taps and stale render races.
      if (shoppingNameSet.has(normalizeForMatch(ing.name))) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const id = shopId(ing.name);
      const item: ShoppingItem = {
        id,
        name: ing.name,
        category: categorizeIngredient(ing.name),
        quantity: ing.amount > 0 ? ing.amount : null,
        unit: ing.unit || null,
        notes: null,
        manually_added: false,
        in_cart: false,
        added_at: Date.now(),
        sources: [{ kind: 'pantry-suggestion', recipe_id: recipeId }],
      };
      // Optimistic local update — chip re-derives to ✓ immediately.
      setShoppingItems((prev) => [item, ...prev]);
      if (shopUndoTimerRef.current) clearTimeout(shopUndoTimerRef.current);
      setShopUndo({ id, name: ing.name, label: `${ing.name} added to shopping list` });
      shopUndoTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setShopUndo(null);
      }, SHOP_UNDO_TIMEOUT_MS);
      upsertShoppingItem(db, item).catch((e) =>
        console.error('upsertShoppingItem failed', e),
      );
    },
    [db, shoppingNameSet],
  );

  /**
   * removeFromShoppingList — single pathway used by:
   *   (a) clicking the ✓ chip in pantry (REGN-007 path #4)
   *   (b) the toast Undo button (REGN-007 path #2 — wraps this)
   *
   * Looks the row up by name (chip only knows the ingredient, not the
   * shop row id). If the row currently being undone matches, also clears
   * the undo banner so the user doesn't get a ghost toast.
   */
  const removeFromShoppingList = useCallback(
    async (ingName: string) => {
      const target = shoppingItems.find((it) => sameNorm(it.name, ingName));
      if (!target) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      // Optimistic local update — chip re-derives to "+ need" immediately.
      setShoppingItems((prev) => prev.filter((it) => it.id !== target.id));
      // If the active undo banner refers to this exact ingredient, dismiss it.
      // Otherwise leave it alone so a chain of adds + one removal doesn't
      // wipe the banner for an unrelated item.
      if (shopUndo && sameNorm(shopUndo.name, ingName)) {
        if (shopUndoTimerRef.current) clearTimeout(shopUndoTimerRef.current);
        setShopUndo(null);
      }
      deleteShoppingItem(db, target.id).catch((e) =>
        console.error('deleteShoppingItem failed', e),
      );
    },
    [db, shoppingItems, shopUndo],
  );

  const undoShopAdd = useCallback(async () => {
    if (!shopUndo) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
    // Route through removeFromShoppingList — same pathway, single source of
    // truth. removeFromShoppingList clears the timer and the banner.
    await removeFromShoppingList(shopUndo.name);
  }, [shopUndo, removeFromShoppingList]);

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

  const haveCount = havePills.length;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Fixed header zone — never scrolls ──────────────────────── */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 4,
          backgroundColor: tokens.bg,
        }}
      >
        {/* Eyebrow */}
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: tokens.bronze,
            marginBottom: 4,
          }}
        >
          Cook with what you have
        </Text>

        {/* Title row — title + optional trash icon */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <View style={{ flex: 1 }}>
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
                  color: tokens.bronze,
                }}
              >
                Pantry
              </Text>
            </Text>
          </View>

          {/* Right side: item count + trash (only when pantry has items) */}
          {haveCount > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 8 }}>
              <Animated.View
                key={haveCount}
                entering={FadeIn.duration(250)}
                accessibilityLabel={`${haveCount} ingredient${haveCount === 1 ? '' : 's'} stocked`}
              >
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 11,
                    color: tokens.muted,
                  }}
                >
                  {haveCount} stocked
                </Text>
              </Animated.View>
              <Pressable
                onPress={() => setShowClearModal(true)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Clear all pantry items"
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Icon name="trash" size={16} color={tokens.muted} />
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Search bar — v4: full-width, no Cancel, blur exits search mode */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <Animated.View
            style={[animatedSearchBorderStyle, {
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: tokens.cream,
              borderRadius: 14,
              borderWidth: 2,
              paddingHorizontal: 14,
              paddingVertical: 12,
              ...(searchMode
                ? {
                    shadowColor: tokens.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.10,
                    shadowRadius: 6,
                    elevation: 2,
                  }
                : {}),
            }]}
          >
            <Icon name="search" size={15} color={tokens.muted} />
            {!searchMode ? (
              /* Tappable placeholder — reliable Android entry point.
                 autoFocus on the TextInput below handles keyboard open;
                 no onFocus/onBlur state juggling needed. */
              <Pressable
                onPress={() => setSearchMode(true)}
                style={{ flex: 1 }}
                accessibilityRole="button"
                accessibilityLabel="Search or add an ingredient"
              >
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 15,
                    color: tokens.muted,
                    paddingVertical: 0,
                  }}
                >
                  Search or add an ingredient…
                </Text>
              </Pressable>
            ) : (
              <TextInput
                ref={inputRef}
                autoFocus
                value={addName}
                onChangeText={setAddName}
                placeholder="Search or add an ingredient…"
                placeholderTextColor={tokens.muted}
                style={{
                  flex: 1,
                  fontFamily: fonts.sans,
                  fontSize: 15,
                  color: tokens.ink,
                  paddingVertical: 0,
                }}
                autoCorrect={false}
                autoCapitalize="none"
                spellCheck={false}
                returnKeyType="done"
                onSubmitEditing={handleAddCustom}
                onBlur={handleSearchBlur}
              />
            )}
            {/* Android clear button — only in search mode */}
            {addName.length > 0 && searchMode && Platform.OS === 'android' ? (
              <Pressable
                onPress={() => setAddName('')}
                hitSlop={10}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="x" size={11} color={tokens.muted} />
              </Pressable>
            ) : null}
          </Animated.View>
        </View>

        {/* Pills card + match banner removed in build #122 — replaced by the organised list in the browse scroll area below, and the carousel already conveys matches. */}
      </View>

      {/* ── Inline suggestion dropdown ─────────────────────────────────── */}
      {/* Appears between search bar and pills — browse content always stays  */}
      {/* visible. blurTimerRef gives 200 ms for a suggestion tap to land.   */}
      {showDropdown && autocompleteSections.length > 0 ? (
        <View
          style={{
            maxHeight: 280,
            marginHorizontal: 20,
            marginBottom: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(184,64,48,0.28)',
            backgroundColor: tokens.cream,
            overflow: 'hidden',
          }}
        >
          <SectionList<CatalogEntry, AutocompleteSection>
            sections={autocompleteSections}
            keyExtractor={(item, idx) => item.name + idx}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            stickySectionHeadersEnabled
            renderSectionHeader={({ section: { title } }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: tokens.bg,
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderBottomWidth: 1,
                  borderBottomColor: tokens.line,
                }}
              >
                <View
                  style={{
                    width: 3,
                    height: 11,
                    borderRadius: 2,
                    backgroundColor: tokens.warmBrown,
                    opacity: 0.45,
                  }}
                />
                <Text
                  style={{
                    fontSize: 9,
                    fontFamily: fonts.sansBold,
                    letterSpacing: 2,
                    color: tokens.warmBrown,
                    textTransform: 'uppercase',
                    flex: 1,
                  }}
                >
                  {title}
                </Text>
              </View>
            )}
            renderItem={({ item, index, section }) => {
              const alias = matchedAlias(item, addName.trim());
              const alreadyAdded = inPantrySet.has(item.name.toLowerCase().trim());
              const isLast = index === section.data.length - 1;
              return (
                <Pressable
                  onPress={() => !alreadyAdded && handleSearchSelect(item)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    alreadyAdded
                      ? `${item.name} — already in pantry`
                      : `Add ${item.name} to pantry`
                  }
                  android_ripple={{ color: tokens.primaryLight, borderless: false }}
                  style={{ opacity: alreadyAdded ? 0.45 : 1 }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 11,
                    minHeight: 46,
                    backgroundColor: tokens.cream,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: tokens.line,
                    gap: 12,
                  }}>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: fonts.sans,
                        color: alreadyAdded ? tokens.muted : tokens.ink,
                        lineHeight: 19,
                      }}
                    >
                      {item.name}
                    </Text>
                    {alias ? (
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: fonts.sans,
                          color: tokens.muted,
                          marginTop: 1,
                        }}
                      >
                        also {alias}
                      </Text>
                    ) : null}
                  </View>
                  {alreadyAdded ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Icon name="check" size={11} color={tokens.sage} />
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: fonts.sansBold,
                          color: tokens.sage,
                          letterSpacing: 0.3,
                        }}
                      >
                        In pantry
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="plus" size={14} color={tokens.muted} />
                    </View>
                  )}
                  </View>
                </Pressable>
              );
            }}
            ListFooterComponent={
              addName.trim().length >= 1 ? (
                <Pressable
                  onPress={handleAddCustom}
                  android_ripple={{ color: 'rgba(184,64,48,0.15)', borderless: false }}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    minHeight: 50,
                    backgroundColor: 'rgba(184,64,48,0.04)',
                    gap: 12,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(184,64,48,0.22)',
                  }}>
                  <View
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: 'rgba(184,64,48,0.14)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="plus" size={14} color={tokens.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: fonts.sansBold,
                        color: tokens.primary,
                        lineHeight: 17,
                      }}
                      numberOfLines={1}
                    >
                      Add "{addName.trim()}"
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: fonts.sans,
                        color: tokens.muted,
                        marginTop: 1,
                      }}
                    >
                      Save as a custom ingredient
                    </Text>
                  </View>
                  </View>
                </Pressable>
              ) : null
            }
          />
        </View>
      ) : showDropdown && autocompleteSections.length === 0 ? (
        /* No catalog match — offer custom add inline */
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(184,64,48,0.25)',
            backgroundColor: 'rgba(184,64,48,0.04)',
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={handleAddCustom}
            android_ripple={{ color: 'rgba(184,64,48,0.15)', borderless: false }}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 12,
            }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(184,64,48,0.16)',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="plus" size={15} color={tokens.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: fonts.sansBold,
                  color: tokens.primary,
                  lineHeight: 18,
                }}
                numberOfLines={1}
              >
                Add "{addName.trim()}"
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: fonts.sans,
                  color: tokens.muted,
                  marginTop: 2,
                }}
              >
                No catalog match — save as custom
              </Text>
            </View>
            </View>
          </Pressable>
        </View>
      ) : null}

      {/* ── Browse mode — always visible ─────────────────────────────────── */}
        <ScrollView
          ref={browseScrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160, paddingTop: 4 }}
        >
          {/* Empty pantry state — shown when no pills */}
          {havePills.length === 0 ? (
            <EmptyPantry onAddFirst={() => inputRef.current?.focus()} />
          ) : null}

          {/* ── Build #122 Pass 1 — organised "what you have" list ─────────── */}
          {havePills.length > 0 ? (
            <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 11,
                  letterSpacing: 1.6,
                  textTransform: 'uppercase',
                  color: tokens.inkSoft,
                  marginBottom: 11,
                }}
              >
                In your pantry
              </Text>

              {groupedHaves.map(({ category, items }) => {
                const collapsed = collapsedCats.has(category);
                return (
                  <View key={category} style={{ marginBottom: 18 }}>
                    {/* Category header — tap to collapse/expand */}
                    <Pressable
                      onPress={() => toggleCategory(category)}
                      accessibilityRole="button"
                      accessibilityLabel={`${SHOPPING_SECTION_LABEL[category]}, ${items.length} item${items.length === 1 ? '' : 's'}, ${collapsed ? 'collapsed' : 'expanded'}`}
                      android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: false }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 9,
                        paddingTop: 4,
                        paddingBottom: 7,
                        paddingHorizontal: 2,
                        borderBottomWidth: 1,
                        borderBottomColor: tokens.lineDark,
                        marginBottom: collapsed ? 0 : 9,
                      }}
                    >
                      <FoodIcon name={categoryIconName(category)} size={20} color={tokens.inkSoft} />
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: fonts.sansBold,
                          fontSize: 12,
                          letterSpacing: 1.4,
                          textTransform: 'uppercase',
                          color: tokens.ink,
                        }}
                      >
                        {SHOPPING_SECTION_LABEL[category]}
                      </Text>
                      <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: tokens.muted, marginRight: 2 }}>
                        {items.length}
                      </Text>
                      <View style={{ transform: [{ rotate: collapsed ? '-90deg' : '0deg' }] }}>
                        <Icon name="arrow-down" size={15} color={tokens.muted} />
                      </View>
                    </Pressable>

                    {/* Rows */}
                    {!collapsed
                      ? items.map((it) => {
                          const titles = recipeTitlesForItem(it);
                          let subline = '';
                          if (titles.length === 1) subline = titles[0];
                          else if (titles.length === 2) subline = `${titles[0]}, ${titles[1]}`;
                          else if (titles.length > 2) subline = `${titles[0]}, ${titles[1]} +${titles.length - 2}`;
                          const countable = isCountableItem(it);
                          const qty = it.quantity ?? 1;
                          return (
                            <View
                              key={it.id}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 11,
                                paddingVertical: 8,
                                paddingHorizontal: 8,
                                borderRadius: 11,
                                backgroundColor: tokens.cream,
                                borderWidth: 1,
                                borderColor: tokens.line,
                                marginBottom: 6,
                              }}
                            >
                              <FoodIcon name={ingredientIconName(it.name, category)} size={17} color={tokens.inkSoft} />
                              <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: fonts.sans, fontSize: 13.5, color: tokens.ink }} numberOfLines={1}>
                                  {it.name}
                                </Text>
                                {subline ? (
                                  <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: tokens.inkSoft, marginTop: 1 }} numberOfLines={1}>
                                    <Text style={{ color: tokens.muted }}>for </Text>
                                    {subline}
                                  </Text>
                                ) : null}
                              </View>

                              {countable ? (
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: tokens.goldDim,
                                    borderWidth: 1,
                                    borderColor: 'rgba(242,204,42,0.42)',
                                    borderRadius: 999,
                                  }}
                                >
                                  <Pressable
                                    onPress={() => decrementItem(it)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Remove one ${it.name}`}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
                                    style={{ width: 27, height: 27, alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <Icon name="minus" size={14} color={tokens.gold} />
                                  </Pressable>
                                  <Text
                                    style={{ minWidth: 18, textAlign: 'center', fontFamily: fonts.sansBold, fontSize: 13, color: tokens.ink }}
                                    accessibilityLabel={`Quantity ${qty}`}
                                  >
                                    {qty}
                                  </Text>
                                  <Pressable
                                    onPress={() => setItemQuantity(it, qty + 1)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Add one ${it.name}`}
                                    hitSlop={{ top: 10, bottom: 10, left: 4, right: 10 }}
                                    style={{ width: 27, height: 27, alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    <Icon name="plus" size={14} color={tokens.gold} />
                                  </Pressable>
                                </View>
                              ) : (
                                <Pressable
                                  onPress={() => removeItemWithUndo(it)}
                                  accessibilityRole="button"
                                  accessibilityLabel={`${it.name} stocked — tap to remove`}
                                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                  <View
                                    style={{
                                      paddingVertical: 4,
                                      paddingHorizontal: 10,
                                      borderRadius: 999,
                                      backgroundColor: tokens.cream,
                                      borderWidth: 1,
                                      borderColor: tokens.lineDark,
                                    }}
                                  >
                                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 0.3, color: tokens.inkSoft }}>
                                      Stocked
                                    </Text>
                                  </View>
                                </Pressable>
                              )}
                            </View>
                          );
                        })
                      : null}
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* Unlock nudge */}
          {unlock ? (
            <Pressable
              onPress={() => addByName(unlock.name)}
              android_ripple={{ color: tokens.primaryDeep, borderless: false }}
              style={{ borderRadius: 18, marginHorizontal: 20, marginBottom: 16 }}
            >
              <View style={{
                padding: 16,
                borderRadius: 18,
                backgroundColor: tokens.primary,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                ...shadows.card,
                shadowColor: tokens.primaryDeep,
                shadowOpacity: 0.18,
              }}>
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
              <Text style={{ fontSize: 20, color: tokens.ink }}>＋</Text>
              </View>
            </Pressable>
          ) : null}

          {/* Recipe match carousel */}
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
                    : `${ranked.length} dish${ranked.length === 1 ? '' : 'es'}`}
                </Text>
              </View>

              {/* Carousel — snapToInterval is more reliable than snapToOffsets
                  because it doesn't depend on the computed offset array being
                  correct after data changes. CARD_GAP is the gap between cards
                  set in contentContainerStyle, so the snap unit is exact. */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate={0.92}
                snapToInterval={cardWidth + CARD_GAP}
                snapToAlignment="start"
                onMomentumScrollEnd={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                }
                contentContainerStyle={{
                  paddingHorizontal: CAROUSEL_PADDING,
                  gap: CARD_GAP,
                }}
              >
                {ranked.map((m) => (
                  <RecipeMatchCard
                    key={m.recipe.id}
                    match={m}
                    cardWidth={cardWidth}
                    shoppingNameSet={shoppingNameSet}
                    onOpenRecipe={() => router.push(`/recipe/${m.recipe.id}`)}
                    onAddToShoppingList={(ing) =>
                      addToShoppingList(ing, m.recipe.id)
                    }
                    onRemoveFromShoppingList={(name) =>
                      removeFromShoppingList(name)
                    }
                  />
                ))}
              </ScrollView>
            </View>
          ) : pantryItems.length > 0 ? (
            <NoMatchesState />
          ) : null}

          <VersionFooter paddingBottom={32} />
        </ScrollView>

      {/* ── Clear-all confirmation Modal ────────────────────────────── */}
      {/* Modal (not Alert) so we can apply dark tokens and custom styling.
          The count in the button label makes the cost of the action explicit. */}
      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 20,
          }}
          onPress={() => setShowClearModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation?.()}
            style={{
              width: '100%',
              backgroundColor: tokens.cream,
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: tokens.lineDark,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 20,
                color: tokens.ink,
                marginBottom: 10,
                textAlign: 'center',
              }}
            >
              Clear your pantry?
            </Text>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 13,
                color: tokens.muted,
                textAlign: 'center',
                lineHeight: 18,
                marginBottom: 24,
              }}
            >
              This removes all {haveCount} stocked ingredient{haveCount === 1 ? '' : 's'}.{'\n'}
              Your recipe matches will reset.
            </Text>

            {/* Destructive action */}
            <Pressable
              onPress={clearAll}
              android_ripple={{ color: '#C04040', borderless: false }}
              style={{ borderRadius: 12, marginBottom: 10 }}
            >
              <View style={{
                backgroundColor: '#E05252',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}>
                <Text
                  style={{
                    fontFamily: fonts.sansBold,
                    fontSize: 15,
                    color: '#FFF',
                  }}
                >
                  Clear {haveCount} ingredient{haveCount === 1 ? '' : 's'}
                </Text>
              </View>
            </Pressable>

            {/* Safe default — phrased positively */}
            <Pressable
              onPress={() => setShowClearModal(false)}
              android_ripple={{ color: tokens.primaryLight, borderless: false }}
              style={{ borderRadius: 12 }}
            >
              <View style={{
                backgroundColor: tokens.bgDeep,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: tokens.line,
              }}>
                <Text
                  style={{
                    fontFamily: fonts.sansBold,
                    fontSize: 15,
                    color: tokens.ink,
                  }}
                >
                  Keep my pantry
                </Text>
              </View>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Clear-all undo toast (5 s) ──────────────────────────────── */}
      {undoSnapshot ? (
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
      ) : null}

      {/* ── Shopping-list add undo toast (3 s) ──────────────────────── */}
      {/* Gold background makes this impossible to miss — the user needs to
          know their tap *did* something even though the chip went to a
          different tab. Dark text on gold satisfies contrast requirements. */}
      {shopUndo ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={{
            position: 'absolute',
            bottom: insets.bottom + (undoSnapshot ? 152 : 92),
            left: 16,
            right: 16,
            backgroundColor: tokens.primary,
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            ...shadows.toast,
          }}
        >
          <Text style={{ fontSize: 16 }}>🛒</Text>
          <Text
            style={{
              flex: 1,
              fontFamily: fonts.sansBold,
              fontSize: 13,
              color: tokens.onPrimary,
            }}
          >
            {shopUndo.label}
          </Text>
          <Pressable onPress={undoShopAdd} hitSlop={8}>
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 12,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: tokens.onPrimary,
                opacity: 0.65,
              }}
            >
              Undo
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}

      {/* ── Item-removal undo toast (build #122) ─────────────────────── */}
      {itemUndo ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={{
            position: 'absolute',
            bottom: insets.bottom + (undoSnapshot || shopUndo ? 152 : 92),
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
          <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 13, color: '#FFF' }}>
            {itemUndo.label}
          </Text>
          <Pressable onPress={undoItemRemove} hitSlop={8}>
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
      ) : null}
    </KeyboardAvoidingView>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function EmptyPantry({ onAddFirst }: { onAddFirst: () => void }) {
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
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: tokens.sageLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 24 }}>🥘</Text>
      </View>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 18,
          color: tokens.ink,
          marginBottom: 6,
          fontStyle: 'italic',
        }}
      >
        What's in your kitchen?
      </Text>
      <Text
        style={{
          fontFamily: fonts.sans,
          fontSize: 13,
          color: tokens.muted,
          textAlign: 'center',
          lineHeight: 18,
          maxWidth: 260,
          marginBottom: 20,
        }}
      >
        Nothing stocked yet — search above to add what you have.
      </Text>
      <Pressable
        onPress={onAddFirst}
        android_ripple={{ color: tokens.primaryDeep, borderless: false }}
        style={{ borderRadius: 12 }}
      >
        <View style={{
          backgroundColor: tokens.primary,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 22,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 14,
              color: tokens.onPrimary,
            }}
          >
            Add ingredients
          </Text>
        </View>
      </Pressable>
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

/**
 * RecipeMatchCard — compact horizontal card for the match carousel.
 *
 * v0.7.0 (REGN-007): chip state is now DERIVED, not stored. The card no
 * longer keeps a local `addedNames` Set — it reads `shoppingNameSet` (a
 * normalised set of names currently on the shopping list) and the chip
 * decides its own visuals. Add/remove route to the parent so the source
 * of truth (shoppingItems on PantryTab) updates and every chip sees it.
 *
 * v0.6.0: derivationMatches from pantry-helpers Phase 2 are available on
 * the match object — the "from your X →" annotation can be wired here
 * once the design spec is finalised.
 */
function RecipeMatchCard({
  match,
  cardWidth,
  shoppingNameSet,
  onOpenRecipe,
  onAddToShoppingList,
  onRemoveFromShoppingList,
}: {
  match: RecipeMatchResult;
  cardWidth: number;
  shoppingNameSet: Set<string>;
  onOpenRecipe: () => void;
  onAddToShoppingList: (ing: { name: string; amount: number; unit: string }) => void;
  onRemoveFromShoppingList: (name: string) => void;
}) {
  const allReady = match.totalCount === match.haveCount;

  return (
    <Pressable
      onPress={onOpenRecipe}
      accessibilityRole="button"
      accessibilityLabel={`${match.recipe.title} — ${match.haveCount} of ${match.totalCount} ingredients matched`}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
      style={{
        width: cardWidth,
        backgroundColor: tokens.cream,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: tokens.line,
        overflow: 'hidden',
        ...shadows.card,
      }}
    >
      {/* Hero image */}
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
            contentFit="cover"
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
        {!allReady ? (
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
        ) : null}
      </View>

      {/* Card body */}
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
          <View>
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 9,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: tokens.muted,
                marginBottom: 7,
              }}
            >
              Still need
            </Text>
            {/* flex-wrap pill row — pills communicate tap action,
                so no "tap to add" hint is needed */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {match.missingIngredients.map((ing) => (
                <ChipAdd
                  key={ing.name}
                  ing={ing}
                  added={shoppingNameSet.has(normalizeForMatch(ing.name))}
                  onAdd={onAddToShoppingList}
                  onRemove={onRemoveFromShoppingList}
                />
              ))}
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

/**
 * ChipAdd — ingredient pill for the recipe match carousel.
 *
 * Two states:
 *   Need (default): rust outline pill, rust text, "+" prefix → clearly tappable
 *   Added:          rust fill, cream text, "✓" → clearly done. Tapping again
 *                    removes from the shopping list (REGN-007 path #4).
 *
 * The `added` prop is DERIVED upstream from shopping-list membership — this
 * component never owns its own boolean. That's why undo, ✓-toggle, and
 * Shop-tab X-removal all flow through the same chip without it ever being
 * inconsistent with the actual list.
 *
 * Pressable is a bare touch target (android_ripple only). All visual styling
 * lives on the inner View with a static style object — Pressable function-style
 * style props silently drop layout/visual properties on Android.
 */
function ChipAdd({
  ing,
  added,
  onAdd,
  onRemove,
}: {
  ing: { name: string; amount: number; unit: string };
  added: boolean;
  onAdd: (ing: { name: string; amount: number; unit: string }) => void;
  onRemove: (name: string) => void;
}) {
  const label = ing.amount > 0
    ? `${ing.amount}${ing.unit ? ' ' + ing.unit : ''} ${ing.name}`
    : ing.name;

  return (
    <Pressable
      onPress={() => (added ? onRemove(ing.name) : onAdd(ing))}
      accessibilityRole="button"
      accessibilityState={{ selected: added }}
      accessibilityLabel={
        added
          ? `${ing.name} on shopping list — tap to remove`
          : `Add ${label} to shopping list`
      }
      android_ripple={{ color: 'rgba(255,255,255,0.10)', borderless: false }}
      style={{ borderRadius: 999 }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingVertical: 6,
          paddingHorizontal: 11,
          borderRadius: 999,
          backgroundColor: added ? tokens.primary : 'transparent',
          borderWidth: 2,
          borderColor: added ? tokens.primary : tokens.lineDark,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 11,
            color: added ? tokens.onPrimary : tokens.inkSoft,
          }}
        >
          {added ? '✓' : '+'}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 11,
            color: added ? tokens.onPrimary : tokens.inkSoft,
          }}
          numberOfLines={1}
        >
          {ing.name}
        </Text>
      </View>
    </Pressable>
  );
}
