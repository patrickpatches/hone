/**
 * Plan — weekly meal planner + aisle-aware shopping list.
 *
 * Week view shows Mon–Sun. Tapping a day opens a bottom sheet recipe picker.
 * The shopping list button aggregates all planned recipes' ingredients,
 * subtracts whatever is in the pantry (have_it = true), then groups by
 * store section in a logical walk-the-aisles order.
 *
 * Design rationale:
 *   - Day rows are tall cards — easier to tap with wet hands than a tiny grid.
 *   - Shopping list uses large checkboxes (44dp) — store use case means
 *     distracted glances and one-handed holds.
 *   - Pantry subtraction happens at generation time, not display time, so the
 *     list stays stable while shopping even if pantry state changes.
 *   - Week navigation uses ±7 day offsets from a Monday anchor; no library
 *     needed for this level of date math.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  Share,
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
import { SwapSheet } from '../../src/components/SwapSheet';
import {
  getAllRecipes,
  getPantryItems,
  getMealPlanForWeek,
  setMealPlanEntry,
  deleteMealPlanEntry,
  setIngredientSwap,
  clearIngredientSwap,
  getAllSwaps,
  type SwapRecord,
} from '../../db/database';
import type { MealPlanEntry, PantryItem } from '../../db/database';
import type { Recipe, Substitution } from '../../src/data/types';
import {
  categorizeIngredient,
  cleanIngredientName,
  normalizeForMatch,
  SHOPPING_SECTION_LABEL,
  SHOPPING_SECTION_ORDER,
} from '../../src/data/pantry-helpers';
import type { PantryCategory } from '../../src/data/pantry-helpers';

// ── Date helpers ──────────────────────────────────────────────────────────────

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_SHORT   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAY_LONG    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function toMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function dayIndex(date: Date): number {
  const d = date.getDay();
  return d === 0 ? 6 : d - 1; // 0=Mon … 6=Sun
}

// ── Amount formatter ──────────────────────────────────────────────────────────

function fmtAmt(n: number): string {
  if (n <= 0) return '';
  const rounded = Math.round(n * 10) / 10;
  return rounded % 1 === 0 ? String(Math.round(rounded)) : String(rounded);
}

// ── Shopping list types ───────────────────────────────────────────────────────

interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: PantryCategory;
  fromRecipe: string;
  recipeId: string;
  ingredientId: string;
  substitutions: Substitution[];
}

type ShoppingSection = { title: string; sectionKey: PantryCategory; data: ShoppingItem[] };

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PlanTab() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [weekStart, setWeekStart] = useState<Date>(() => toMonday(new Date()));
  const [mealPlan, setMealPlan]   = useState<MealPlanEntry[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Recipe picker modal
  const [pickerDay, setPickerDay]   = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Shopping list modal
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // BUG-003 fix: custom items the user adds ad-hoc to the shopping list.
  // Stored as plain strings; reset each time the list is regenerated.
  const [customItems, setCustomItems] = useState<string[]>([]);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [recipes, pantry] = await Promise.all([getAllRecipes(db), getPantryItems(db)]);
      if (!cancelled) {
        setAllRecipes(recipes);
        setPantryItems(pantry);
        setLoading(false);
      }
    }
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [db]);

  const loadWeek = useCallback(async (start: Date) => {
    const end = addDays(start, 6);
    const entries = await getMealPlanForWeek(db, toISO(start), toISO(end));
    setMealPlan(entries);
  }, [db]);

  useEffect(() => {
    loadWeek(weekStart).catch(console.error);
  }, [weekStart, loadWeek]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const recipeMap = useMemo(() => {
    const m = new Map<string, Recipe>();
    for (const r of allRecipes) m.set(r.id, r);
    return m;
  }, [allRecipes]);

  const planByDate = useMemo(() => {
    const m = new Map<string, MealPlanEntry>();
    for (const e of mealPlan) m.set(e.date, e);
    return m;
  }, [mealPlan]);

  const plannedCount = mealPlan.length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAssign = async (recipeId: string) => {
    if (!pickerDay) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const entry: MealPlanEntry = {
      id: `mp-${pickerDay}-${Date.now()}`,
      date: pickerDay,
      recipe_id: recipeId,
      servings: recipeMap.get(recipeId)?.base_servings ?? 2,
    };
    await setMealPlanEntry(db, entry);
    setPickerDay(null);
    setPickerSearch('');
    await loadWeek(weekStart);
  };

  const handleRemove = async (entry: MealPlanEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await deleteMealPlanEntry(db, entry.id);
    await loadWeek(weekStart);
  };

  const handleGenerateShopping = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const haveNorms = new Set(
      pantryItems.filter((p) => p.have_it).map((p) => normalizeForMatch(p.name)),
    );

    const inPantry = (name: string): boolean => {
      const norm = normalizeForMatch(name);
      for (const p of haveNorms) {
        if (norm === p) return true;
        if (norm.length > 4 && p.length > 4 && (norm.includes(p) || p.includes(norm))) return true;
      }
      return false;
    };

    const aggregated = new Map<string, ShoppingItem>();

    for (const entry of mealPlan) {
      const recipe = recipeMap.get(entry.recipe_id);
      if (!recipe) continue;
      const scale = entry.servings / recipe.base_servings;

      for (const ing of recipe.ingredients) {
        if (inPantry(ing.name)) continue;
        const clean = cleanIngredientName(ing.name);
        const key = normalizeForMatch(ing.name);
        const scaledAmt = ing.amount * scale;

        if (aggregated.has(key)) {
          const existing = aggregated.get(key)!;
          if (existing.unit === ing.unit) {
            existing.amount += scaledAmt;
          }
        } else {
          aggregated.set(key, {
            id: `shop-${key.replace(/\s+/g, '-')}`,
            name: clean,
            amount: scaledAmt,
            unit: ing.unit,
            category: categorizeIngredient(clean),
            fromRecipe: recipe.title,
            recipeId: recipe.id,
            ingredientId: ing.id,
            substitutions: ing.substitutions ?? [],
          });
        }
      }
    }

    setShoppingItems(Array.from(aggregated.values()));
    setCheckedIds(new Set());
    setCustomItems([]);
    setShowShopping(true);
  };

  // ── Picker search filter ──────────────────────────────────────────────────

  const filteredRecipes = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    return q
      ? allRecipes.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.tagline.toLowerCase().includes(q) ||
            r.tags.some((t) => t.toLowerCase().includes(q)),
        )
      : allRecipes;
  }, [allRecipes, pickerSearch]);

  // ── Shopping sections ─────────────────────────────────────────────────────

  const shoppingSections = useMemo<ShoppingSection[]>(() => {
    return SHOPPING_SECTION_ORDER.map((cat) => ({
      title: SHOPPING_SECTION_LABEL[cat],
      sectionKey: cat,
      data: shoppingItems.filter((i) => i.category === cat),
    })).filter((s) => s.data.length > 0);
  }, [shoppingItems]);

  const weekLabel = `${MONTH_SHORT[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTH_SHORT[addDays(weekStart, 6).getMonth()]} ${addDays(weekStart, 6).getDate()}`;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.paprika} />
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 160,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Kicker */}
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: tokens.paprika,
            marginBottom: 4,
          }}
        >
          Weekly planner
        </Text>

        {/* Title + shop button */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 }}>
          <Text
            style={{
              flex: 1,
              fontFamily: fonts.display,
              fontSize: 38,
              lineHeight: 42,
              color: tokens.ink,
            }}
          >
            Meal Plan
          </Text>
          {plannedCount > 0 && (
            <Pressable
              onPress={handleGenerateShopping}
              accessibilityRole="button"
              accessibilityLabel="Generate shopping list"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: pressed ? tokens.inkSoft : tokens.ink,
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 9,
                marginBottom: 4,
              })}
            >
              <Icon name="cart" size={14} color={tokens.cream} />
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.cream }}>
                Shop
              </Text>
            </Pressable>
          )}
        </View>

        {/* Week navigation */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: tokens.cream,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: tokens.line,
            marginBottom: 20,
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setWeekStart((w) => addDays(w, -7));
            }}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
            hitSlop={4}
            style={({ pressed }) => ({
              padding: 14,
              backgroundColor: pressed ? tokens.bgDeep : 'transparent',
            })}
          >
            <Icon name="arrow-left" size={16} color={tokens.ink} />
          </Pressable>

          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: tokens.ink }}>
              {weekLabel}
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted, marginTop: 1 }}>
              {plannedCount === 0 ? 'No meals planned yet' : `${plannedCount} meal${plannedCount === 1 ? '' : 's'} planned`}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setWeekStart((w) => addDays(w, 7));
            }}
            accessibilityRole="button"
            accessibilityLabel="Next week"
            hitSlop={4}
            style={({ pressed }) => ({
              padding: 14,
              backgroundColor: pressed ? tokens.bgDeep : 'transparent',
            })}
          >
            <Icon name="arrow-right" size={16} color={tokens.ink} />
          </Pressable>
        </View>

        {/* Day rows */}
        <View style={{ gap: 10 }}>
          {weekDays.map((day) => {
            const iso = toISO(day);
            const entry = planByDate.get(iso);
            const recipe = entry ? recipeMap.get(entry.recipe_id) : undefined;
            const today = isToday(day);
            const idx = dayIndex(day);

            return (
              <DayRow
                key={iso}
                day={day}
                dayShort={DAY_SHORT[idx] ?? ''}
                dayLong={DAY_LONG[idx] ?? ''}
                isToday={today}
                recipe={recipe}
                entry={entry}
                onAdd={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setPickerDay(iso);
                }}
                onRemove={handleRemove}
                onViewRecipe={(id) => router.push(`/recipe/${id}`)}
              />
            );
          })}
        </View>

        {/* Empty state hint */}
        {plannedCount === 0 && (
          <View
            style={{
              marginTop: 20,
              padding: 16,
              backgroundColor: tokens.cream,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: tokens.line,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 20 }}>💡</Text>
            <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 13, color: tokens.inkSoft, lineHeight: 20 }}>
              Tap any day to plan a meal. Once you've planned the week, hit{' '}
              <Text style={{ fontFamily: fonts.sansBold, color: tokens.ink }}>Shop</Text> to get a pantry-filtered shopping list — grouped by aisle, ready to use in store.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating shop button when meals are planned */}
      {plannedCount > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: insets.bottom + 90,
          }}
        >
          <Pressable
            onPress={handleGenerateShopping}
            accessibilityRole="button"
            accessibilityLabel={`Generate shopping list for ${plannedCount} meals`}
            style={({ pressed }) => ({
              backgroundColor: pressed ? tokens.paprikaDeep : tokens.paprika,
              borderRadius: 18,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: tokens.paprika,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            })}
          >
            <Icon name="cart" size={18} color={tokens.cream} />
            <Text style={{ fontFamily: fonts.sansXBold, fontSize: 14, color: tokens.cream }}>
              Shopping List · {plannedCount} {plannedCount === 1 ? 'meal' : 'meals'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Recipe picker modal */}
      <Modal
        visible={pickerDay !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setPickerDay(null); setPickerSearch(''); }}
      >
        <RecipePickerSheet
          day={pickerDay}
          weekDays={weekDays}
          recipes={filteredRecipes}
          search={pickerSearch}
          setSearch={setPickerSearch}
          onSelect={handleAssign}
          onClose={() => { setPickerDay(null); setPickerSearch(''); }}
        />
      </Modal>

      {/* Shopping list modal */}
      <Modal
        visible={showShopping}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShopping(false)}
      >
        <ShoppingListSheet
          sections={shoppingSections}
          checkedIds={checkedIds}
          onToggleChecked={(id) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setCheckedIds((prev) => {
              const next = new Set(prev);
              next.has(id) ? next.delete(id) : next.add(id);
              return next;
            });
          }}
          weekLabel={weekLabel}
          totalCount={shoppingItems.length}
          onClose={() => setShowShopping(false)}
          customItems={customItems}
          onAddCustomItem={(item) => setCustomItems((prev) => [...prev, item])}
          onRemoveCustomItem={(idx) => setCustomItems((prev) => prev.filter((_, i) => i !== idx))}
        />
      </Modal>
    </View>
  );
}

// ── Day row ───────────────────────────────────────────────────────────────────

function DayRow({
  day,
  dayShort,
  dayLong,
  isToday,
  recipe,
  entry,
  onAdd,
  onRemove,
  onViewRecipe,
}: {
  day: Date;
  dayShort: string;
  dayLong: string;
  isToday: boolean;
  recipe: Recipe | undefined;
  entry: MealPlanEntry | undefined;
  onAdd: () => void;
  onRemove: (entry: MealPlanEntry) => void;
  onViewRecipe: (id: string) => void;
}) {
  const dateLabel = `${MONTH_SHORT[day.getMonth()]} ${day.getDate()}`;

  return (
    <View
      style={{
        backgroundColor: tokens.cream,
        borderRadius: 18,
        borderWidth: isToday ? 2 : 1,
        borderColor: isToday ? tokens.paprika : tokens.line,
        overflow: 'hidden',
      }}
    >
      {/* Day header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: recipe ? 8 : 12,
          gap: 8,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 13,
            color: isToday ? tokens.paprika : tokens.ink,
          }}
        >
          {dayShort}
        </Text>
        {isToday && (
          <View
            style={{
              backgroundColor: tokens.paprika,
              borderRadius: 999,
              paddingHorizontal: 7,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, color: tokens.cream, letterSpacing: 0.5 }}>
              TODAY
            </Text>
          </View>
        )}
        <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: tokens.muted }}>{dateLabel}</Text>
        <View style={{ flex: 1 }} />
        {!recipe && (
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={`Add meal for ${dayLong}`}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: pressed ? tokens.bgDeep : 'transparent',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
            })}
          >
            <Icon name="plus" size={14} color={tokens.muted} />
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: tokens.muted }}>
              Plan a meal
            </Text>
          </Pressable>
        )}
      </View>

      {/* Recipe card */}
      {recipe && entry && (
        <Pressable
          onPress={() => onViewRecipe(recipe.id)}
          accessibilityRole="button"
          accessibilityLabel={`${recipe.title} — tap to view recipe`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: pressed ? tokens.bgDeep : tokens.bg,
            borderTopWidth: 1,
            borderTopColor: tokens.line,
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 12,
          })}
        >
          {recipe.emoji ? (
            <Text style={{ fontSize: 28 }}>{recipe.emoji}</Text>
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: recipe.hero_fallback?.[0] ?? tokens.bgDeep,
              }}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontFamily: fonts.sansBold, fontSize: 14, color: tokens.ink }}
              numberOfLines={1}
            >
              {recipe.title}
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: tokens.muted, marginTop: 2 }}>
              {recipe.time_min} min · {recipe.difficulty} · serves {entry.servings}
            </Text>
          </View>

          {/* Change meal button */}
          <Pressable
            onPress={onAdd}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Change meal"
            style={({ pressed }) => ({
              padding: 6,
              borderRadius: 8,
              backgroundColor: pressed ? tokens.line : 'transparent',
            })}
          >
            <Icon name="arrow-right" size={14} color={tokens.muted} />
          </Pressable>

          {/* Remove button */}
          <Pressable
            onPress={() => onRemove(entry)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${recipe.title} from ${dayLong}`}
            style={({ pressed }) => ({
              padding: 6,
              borderRadius: 8,
              backgroundColor: pressed ? tokens.line : 'transparent',
            })}
          >
            <Icon name="x" size={16} color={tokens.muted} />
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

// ── Recipe picker sheet ───────────────────────────────────────────────────────

function RecipePickerSheet({
  day,
  weekDays,
  recipes,
  search,
  setSearch,
  onSelect,
  onClose,
}: {
  day: string | null;
  weekDays: Date[];
  recipes: Recipe[];
  search: string;
  setSearch: (s: string) => void;
  onSelect: (recipeId: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  const dayLabel = useMemo(() => {
    if (!day) return '';
    const d = weekDays.find((wd) => toISO(wd) === day);
    if (!d) return day;
    const idx = dayIndex(d);
    return `${DAY_LONG[idx]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
  }, [day, weekDays]);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top + 8 }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: tokens.line,
          gap: 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.5, color: tokens.paprika, textTransform: 'uppercase' }}>
              Choose a recipe
            </Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: tokens.ink, marginTop: 2 }}>
              {dayLabel}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close recipe picker"
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

        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: tokens.cream,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: tokens.line,
            paddingHorizontal: 12,
            paddingVertical: 10,
            gap: 8,
            marginTop: 12,
          }}
        >
          <Icon name="search" size={14} color={tokens.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search recipes…"
            placeholderTextColor={tokens.muted}
            autoFocus
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
              <Icon name="x" size={13} color={tokens.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Recipe list */}
      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: tokens.line, marginLeft: 56 }} />}
        renderItem={({ item: recipe }) => (
          <Pressable
            onPress={() => onSelect(recipe.id)}
            accessibilityRole="button"
            accessibilityLabel={`Plan ${recipe.title}`}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 14,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {recipe.emoji ? (
              <Text style={{ fontSize: 30, width: 42, textAlign: 'center' }}>{recipe.emoji}</Text>
            ) : (
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: recipe.hero_fallback?.[0] ?? tokens.bgDeep,
                }}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: tokens.ink }} numberOfLines={1}>
                {recipe.title}
              </Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: tokens.muted, marginTop: 2 }}>
                {recipe.time_min} min · {recipe.difficulty}
                {recipe.source ? ` · ${recipe.source.chef}` : ''}
              </Text>
            </View>
            <Icon name="arrow-right" size={14} color={tokens.line} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: tokens.muted }}>
              No recipes match "{search}"
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ── Custom item input ────────────────────────────────────────────────────────

function CustomItemInput({ onAdd }: { onAdd: (item: string) => void }) {
  const [text, setText] = React.useState('');

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onAdd(trimmed);
    setText('');
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleAdd}
        placeholder="Add an item (milk, bin liners…)"
        placeholderTextColor={tokens.muted}
        returnKeyType="done"
        blurOnSubmit={false}
        style={{
          flex: 1,
          fontFamily: fonts.sans,
          fontSize: 14,
          color: tokens.ink,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: tokens.bgDeep,
          borderWidth: 1,
          borderColor: tokens.line,
        }}
      />
      <Pressable
        onPress={handleAdd}
        accessibilityRole="button"
        accessibilityLabel="Add item to shopping list"
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: pressed ? tokens.skyDeep : tokens.sky,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Icon name="plus" size={18} color="#fff" />
      </Pressable>
    </View>
  );
}

// ── Shopping list sheet ───────────────────────────────────────────────────────

function ShoppingListSheet({
  sections,
  checkedIds,
  onToggleChecked,
  weekLabel,
  totalCount,
  onClose,
  customItems,
  onAddCustomItem,
  onRemoveCustomItem,
}: {
  sections: ShoppingSection[];
  checkedIds: Set<string>;
  onToggleChecked: (id: string) => void;
  weekLabel: string;
  totalCount: number;
  onClose: () => void;
  customItems: string[];
  onAddCustomItem: (item: string) => void;
  onRemoveCustomItem: (idx: number) => void;
}) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const checkedCount = checkedIds.size;

  // Swap state — keyed by `${recipeId}:${ingredientId}` (matches DB key).
  const [swaps, setSwaps] = useState<Map<string, SwapRecord>>(new Map());
  const [swapSheetItem, setSwapSheetItem] = useState<ShoppingItem | null>(null);

  useEffect(() => {
    getAllSwaps(db).then(setSwaps).catch(console.error);
  }, [db]);

  const swapKey = (item: ShoppingItem) => `${item.recipeId}:${item.ingredientId}`;

  // ── Share ────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // Build a plain-text list grouped by aisle section
    const lines: string[] = [`🛒 Shopping List — ${weekLabel}`, ''];
    for (const section of sections) {
      lines.push(`${section.title.toUpperCase()}`);
      for (const item of section.data) {
        const activeSwap = swaps.get(swapKey(item));
        const name = activeSwap ? activeSwap.swap_name : item.name;
        const amtStr = fmtAmt(item.amount);
        const label = [amtStr, item.unit, name].filter(Boolean).join(' ');
        lines.push(`  · ${label}`);
      }
      lines.push('');
    }
    lines.push('Made with Hone — Recipes & Meal Planning');
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // Share was cancelled or failed — silently ignore
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top + 8 }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: tokens.line,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, color: tokens.ink }}>
              Shopping List
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: tokens.muted, marginTop: 3 }}>
              {weekLabel} · {totalCount} items · pantry items excluded
            </Text>
            {checkedCount > 0 && (
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: tokens.sage, marginTop: 2 }}>
                {checkedCount} of {totalCount} grabbed ✓
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {sections.length > 0 && (
              <Pressable
                onPress={handleShare}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Share shopping list"
                style={({ pressed }) => ({
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: pressed ? tokens.inkSoft : tokens.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <Icon name="external" size={15} color={tokens.cream} />
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close shopping list"
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
        </View>
      </View>

      {/* BUG-003 fix — add custom items to the shopping list ── */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: tokens.line,
          backgroundColor: tokens.cream,
        }}
      >
        <CustomItemInput onAdd={onAddCustomItem} />
        {customItems.length > 0 && (
          <View style={{ marginTop: 10, gap: 6 }}>
            {customItems.map((item, idx) => (
              <View
                key={`custom-${idx}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 4,
                }}
              >
                <View
                  style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: tokens.sky,
                  }}
                />
                <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 14, color: tokens.ink }}>
                  {item}
                </Text>
                <Pressable
                  onPress={() => onRemoveCustomItem(idx)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item}`}
                >
                  <Icon name="x" size={14} color={tokens.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {sections.length === 0 && customItems.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🎉</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: tokens.ink, marginBottom: 8 }}>
            You have everything
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: tokens.muted, textAlign: 'center' }}>
            Your pantry covers every ingredient in this week's plan.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View
              style={{
                backgroundColor: tokens.bgDeep,
                paddingHorizontal: 20,
                paddingVertical: 9,
              }}
            >
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
            </View>
          )}
          renderItem={({ item, index, section }) => {
            const checked = checkedIds.has(item.id);
            const isLast = index === section.data.length - 1;
            const amtStr = fmtAmt(item.amount);
            const activeSwap = swaps.get(swapKey(item));
            const displayName = activeSwap ? activeSwap.swap_name : item.name;
            const hasSubs = item.substitutions.length > 0;
            const label = [amtStr, item.unit, displayName].filter(Boolean).join(' ');

            return (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: activeSwap ? 'rgba(91,107,71,0.06)' : tokens.cream,
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  gap: 14,
                  minHeight: 56,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: tokens.line,
                }}
              >
                {/* Checkbox */}
                <Pressable
                  onPress={() => onToggleChecked(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  accessibilityLabel={`${label}${checked ? ', grabbed' : ''}`}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    borderWidth: 2,
                    borderColor: checked ? tokens.sage : tokens.line,
                    backgroundColor: checked ? tokens.sage : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {checked && <Icon name="check" size={14} color={tokens.cream} />}
                </Pressable>

                {/* Amount + name */}
                <Pressable style={{ flex: 1 }} onPress={() => onToggleChecked(item.id)}>
                  <Text
                    style={{
                      fontFamily: fonts.sans,
                      fontSize: 15,
                      color: checked ? tokens.muted : activeSwap ? tokens.ochre : tokens.ink,
                      textDecorationLine: checked ? 'line-through' : 'none',
                    }}
                  >
                    {amtStr && item.unit ? (
                      <>
                        <Text style={{ fontFamily: fonts.sansBold }}>
                          {amtStr} {item.unit}
                        </Text>
                        {' '}{displayName}
                      </>
                    ) : amtStr ? (
                      <>
                        <Text style={{ fontFamily: fonts.sansBold }}>{amtStr}</Text>
                        {' '}{displayName}
                      </>
                    ) : (
                      displayName
                    )}
                  </Text>
                  {activeSwap && (
                    <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted, marginTop: 1 }}>
                      instead of {item.name}
                      {activeSwap.quantity_note ? ` · ${activeSwap.quantity_note}` : ''}
                    </Text>
                  )}
                </Pressable>

                {/* Swap icon */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSwapSheetItem(item);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Swap ${item.name}`}
                  hitSlop={8}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: activeSwap ? tokens.ochre : tokens.bgDeep,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: hasSubs || activeSwap ? 1 : 0.28,
                  }}
                >
                  <Icon name="swap" size={14} color={activeSwap ? tokens.cream : tokens.ink} />
                </Pressable>
              </View>
            );
          }}
        />
      )}

      {/* Swap sheet for shopping items */}
      {swapSheetItem && (
        <SwapSheet
          visible
          ingredientName={swapSheetItem.name}
          substitutions={swapSheetItem.substitutions}
          activeSwapName={swaps.get(swapKey(swapSheetItem))?.swap_name}
          onClose={() => setSwapSheetItem(null)}
          onSelect={async (sub) => {
            const item = swapSheetItem;
            if (sub === null) {
              await clearIngredientSwap(db, item.recipeId, item.ingredientId).catch(console.error);
            } else {
              await setIngredientSwap(
                db,
                item.recipeId,
                item.ingredientId,
                item.name,
                sub.ingredient,
                sub.quantity_note ?? undefined,
              ).catch(console.error);
            }
            const updated = await getAllSwaps(db).catch(() => new Map<string, SwapRecord>());
            setSwaps(updated);
            setSwapSheetItem(null);
          }}
        />
      )}
    </View>
  );
}
