/**
 * Plan & Shop — planned meals + live shopping list in one screen.
 *
 * The shopping list is always visible and auto-updates when meals are
 * added or removed — no "generate" button, no modal. Adding a recipe
 * to the plan immediately populates the list with its ingredients,
 * scaled to the chosen servings and minus anything already in the pantry.
 *
 * Layout:
 *   1. "The Plan" header + compact meal cards (servings stepper inline)
 *   2. "Shopping List" section label + progress
 *   3. Add custom item input
 *   4. Ingredients grouped by aisle (rendered inline, no SectionList nesting)
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';

import { tokens, fonts } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import {
  getAllRecipes,
  getPantryItems,
  getPlannedEntries,
  removePlannedRecipe,
  updatePlannedServings,
} from '../../db/database';
import type { MealPlanEntry, PantryItem } from '../../db/database';
import type { Recipe } from '../../src/data/types';
import {
  categorizeIngredient,
  cleanIngredientName,
  normalizeForMatch,
  SHOPPING_SECTION_LABEL,
  SHOPPING_SECTION_ORDER,
} from '../../src/data/pantry-helpers';
import type { PantryCategory } from '../../src/data/pantry-helpers';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShopItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: PantryCategory;
  recipeIds: string[];   // which planned recipes contributed this item
}

interface CustomShopItem {
  id: string;
  name: string;
}

function fmtAmt(n: number): string {
  if (n <= 0) return '';
  const r = Math.round(n * 10) / 10;
  return r % 1 === 0 ? String(Math.round(r)) : String(r);
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PlanTab() {
  const db     = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [allRecipes,   setAllRecipes]   = useState<Recipe[]>([]);
  const [pantryItems,  setPantryItems]  = useState<PantryItem[]>([]);
  const [planEntries,  setPlanEntries]  = useState<MealPlanEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [checkedIds,   setCheckedIds]   = useState<Set<string>>(new Set());
  const [customItems,  setCustomItems]  = useState<CustomShopItem[]>([]);
  const [addVal,       setAddVal]       = useState('');
  const [addFocused,   setAddFocused]   = useState(false);

  // ── Load ───────────────────────────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        const [recipes, pantry, entries] = await Promise.all([
          getAllRecipes(db),
          getPantryItems(db),
          getPlannedEntries(db),
        ]);
        if (!cancelled) {
          setAllRecipes(recipes);
          setPantryItems(pantry);
          setPlanEntries(entries);
          setLoading(false);
        }
      }
      load().catch(console.error);
      return () => { cancelled = true; };
    }, [db]),
  );

  // ── Derived data ───────────────────────────────────────────────────────────

  const recipeMap = useMemo(() => {
    const m = new Map<string, Recipe>();
    for (const r of allRecipes) m.set(r.id, r);
    return m;
  }, [allRecipes]);

  const plannedRecipes = useMemo(() =>
    planEntries
      .map((e) => ({ entry: e, recipe: recipeMap.get(e.recipe_id) }))
      .filter((x): x is { entry: MealPlanEntry; recipe: Recipe } => !!x.recipe),
    [planEntries, recipeMap],
  );

  // Build shopping list — auto, always live
  const shopSections = useMemo(() => {
    const haveNorms = new Set(
      pantryItems.filter((p) => p.have_it).map((p) => normalizeForMatch(p.name)),
    );
    const inPantry = (name: string): boolean => {
      const norm = normalizeForMatch(name);
      for (const p of haveNorms) {
        if (norm === p) return true;
        if (norm.length > 4 && p.length > 4 && (norm.includes(p) || p.includes(norm)))
          return true;
      }
      return false;
    };

    const aggregated = new Map<string, ShopItem>();
    for (const { entry, recipe } of plannedRecipes) {
      const scale = entry.servings / recipe.base_servings;
      for (const ing of recipe.ingredients) {
        if (inPantry(ing.name)) continue;
        const clean = cleanIngredientName(ing.name);
        const key   = normalizeForMatch(ing.name);
        const scaledAmt = ing.amount * scale;
        if (aggregated.has(key)) {
          const ex = aggregated.get(key)!;
          if (ex.unit === ing.unit) ex.amount += scaledAmt;
          if (!ex.recipeIds.includes(entry.recipe_id)) ex.recipeIds.push(entry.recipe_id);
        } else {
          aggregated.set(key, {
            id: `shop-${key.replace(/\s+/g, '-')}`,
            name: clean,
            amount: scaledAmt,
            unit: ing.unit,
            category: categorizeIngredient(clean),
            recipeIds: [entry.recipe_id],
          });
        }
      }
    }

    const allItems = Array.from(aggregated.values());
    return SHOPPING_SECTION_ORDER
      .map((cat) => ({
        key: cat,
        title: SHOPPING_SECTION_LABEL[cat],
        items: allItems.filter((i) => i.category === cat),
      }))
      .filter((s) => s.items.length > 0);
  }, [plannedRecipes, pantryItems]);

  const totalShopItems  = shopSections.reduce((n, s) => n + s.items.length, 0) + customItems.length;
  const checkedCount    = checkedIds.size;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRemove = async (recipeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await removePlannedRecipe(db, recipeId);
    setPlanEntries((prev) => prev.filter((e) => e.recipe_id !== recipeId));
  };

  const handleServings = async (recipeId: string, delta: number) => {
    const entry = planEntries.find((e) => e.recipe_id === recipeId);
    if (!entry) return;
    const next = Math.max(1, Math.min(20, entry.servings + delta));
    if (next === entry.servings) return;
    Haptics.selectionAsync().catch(() => {});
    await updatePlannedServings(db, recipeId, next);
    setPlanEntries((prev) =>
      prev.map((e) => (e.recipe_id === recipeId ? { ...e, servings: next } : e)),
    );
  };

  const toggleCheck = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addCustomItem = (name: string) => {
    if (!name.trim()) return;
    setCustomItems((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, name: name.trim() },
    ]);
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.primary} />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── HEADER ── */}
      <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, marginBottom: 4 }}>
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: tokens.primary,
            marginBottom: 2,
          }}
        >
          This week
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 36, lineHeight: 42, color: tokens.ink }}>
          The Plan
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: tokens.muted, marginTop: 2 }}>
          {plannedRecipes.length === 0
            ? 'Add recipes below to build your shopping list'
            : `${plannedRecipes.length} meal${plannedRecipes.length !== 1 ? 's' : ''} · ${totalShopItems} item${totalShopItems !== 1 ? 's' : ''} to buy`}
        </Text>
      </View>

      {/* ── PLANNED MEALS ── */}
      <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
        {plannedRecipes.length === 0 ? (
          <Pressable
            onPress={() => router.push('/')}
            style={{
              backgroundColor: tokens.cream,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: tokens.lineDark,
              padding: 20,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 32 }}>🥗</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 17, color: tokens.ink }}>
              Nothing planned yet
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
              Open a recipe and tap{' '}
              <Text style={{ fontFamily: fonts.sansBold, color: tokens.primary }}>+</Text>
              {' '}to add it here
            </Text>
            <View
              style={{
                marginTop: 4,
                backgroundColor: tokens.primary,
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: '#FFF' }}>
                Browse recipes
              </Text>
            </View>
          </Pressable>
        ) : (
          <View style={{ gap: 10 }}>
            {plannedRecipes.map(({ entry, recipe }) => (
              <MealCard
                key={entry.recipe_id}
                recipe={recipe}
                servings={entry.servings}
                onRemove={() => handleRemove(entry.recipe_id)}
                onServingsChange={(delta) => handleServings(entry.recipe_id, delta)}
              />
            ))}
            {/* Browse more */}
            <Pressable
              onPress={() => router.push('/')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 12,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: tokens.line,
                backgroundColor: pressed ? tokens.bgDeep : 'transparent',
              })}
            >
              <Icon name="plus" size={14} color={tokens.inkSoft} />
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: tokens.inkSoft }}>
                Add another recipe
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ── SHOPPING LIST ── */}
      <View style={{ marginTop: 32 }}>
        {/* Section heading — display-font with primary kicker */}
        <View
          style={{
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 14,
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
              Aisle by aisle
            </Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: tokens.ink }}>
              Shopping List
            </Text>
            {totalShopItems > 0 && (
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: tokens.muted, marginTop: 4 }}>
                {checkedCount > 0
                  ? `${checkedCount} of ${totalShopItems} ticked off`
                  : `${totalShopItems} ${totalShopItems === 1 ? 'item' : 'items'} · pantry excluded`}
              </Text>
            )}
          </View>
          {checkedCount > 0 && (
            <Pressable
              onPress={() => setCheckedIds(new Set())}
              hitSlop={10}
              style={({ pressed }) => ({
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: pressed ? tokens.bgDeep : tokens.line,
              })}
            >
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: tokens.inkSoft }}>
                Clear ticks
              </Text>
            </Pressable>
          )}
        </View>

        {/* Add custom item — premium pill input */}
        <View style={{ paddingHorizontal: 20, marginBottom: 18 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: tokens.cream,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: addFocused ? tokens.primary : tokens.lineDark,
              paddingHorizontal: 12,
              paddingVertical: 10,
              gap: 12,
              shadowColor: tokens.ink,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: addFocused ? 0.08 : 0.04,
              shadowRadius: 6,
              elevation: addFocused ? 2 : 1,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: tokens.primaryLight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="plus" size={16} color={tokens.primary} />
            </View>
            <TextInput
              value={addVal}
              onChangeText={setAddVal}
              onFocus={() => setAddFocused(true)}
              onBlur={() => setAddFocused(false)}
              placeholder="Add an extra item…"
              placeholderTextColor={tokens.muted}
              style={{
                flex: 1,
                fontFamily: fonts.sans,
                fontSize: 15,
                color: tokens.ink,
                padding: 0,
              }}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (addVal.trim()) { addCustomItem(addVal); setAddVal(''); }
              }}
            />
            {addVal.trim() ? (
              <Pressable
                onPress={() => { addCustomItem(addVal); setAddVal(''); }}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? tokens.primaryDeep : tokens.primary,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                })}
              >
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: '#FFF', letterSpacing: 0.2 }}>
                  Add
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Empty shopping list state */}
        {totalShopItems === 0 && plannedRecipes.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>🎉</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 16, color: tokens.ink, marginBottom: 4 }}>
              Your pantry covers everything
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: tokens.muted, textAlign: 'center' }}>
              Nothing extra to buy for this plan.
            </Text>
          </View>
        )}

        {/* Custom items (user-added, no category) */}
        {customItems.length > 0 && (
          <AisleSection title="Added by you" count={customItems.length}>
            {customItems.map((item, idx) => (
              <ShopRow
                key={item.id}
                label={item.name}
                checked={checkedIds.has(item.id)}
                onToggle={() => toggleCheck(item.id)}
                isLast={idx === customItems.length - 1}
              />
            ))}
          </AisleSection>
        )}

        {/* Ingredient sections by aisle */}
        {shopSections.map((section) => (
          <AisleSection key={section.key} title={section.title} count={section.items.length}>
            {section.items.map((item, idx) => {
              const amtStr  = fmtAmt(item.amount);
              const checked = checkedIds.has(item.id);
              const qty     = amtStr ? (item.unit ? `${amtStr} ${item.unit}` : amtStr) : undefined;
              return (
                <ShopRow
                  key={item.id}
                  qty={qty}
                  label={item.name}
                  checked={checked}
                  onToggle={() => toggleCheck(item.id)}
                  isLast={idx === section.items.length - 1}
                />
              );
            })}
          </AisleSection>
        ))}

        {/* Placeholder when no meals added yet */}
        {plannedRecipes.length === 0 && customItems.length === 0 && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
            <View
              style={{
                backgroundColor: tokens.cream,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: tokens.line,
                padding: 18,
                gap: 10,
              }}
            >
              {['Produce', 'Meat & Seafood', 'Pantry Staples'].map((cat) => (
                <View
                  key={cat}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 14, opacity: 0.32 }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: tokens.line,
                    }}
                  />
                  <View
                    style={{
                      height: 11,
                      width: 50,
                      borderRadius: 4,
                      backgroundColor: tokens.line,
                    }}
                  />
                  <View
                    style={{
                      height: 11,
                      flex: 1,
                      borderRadius: 4,
                      backgroundColor: tokens.line,
                    }}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── Meal card ─────────────────────────────────────────────────────────────────

function MealCard({
  recipe,
  servings,
  onRemove,
  onServingsChange,
}: {
  recipe: Recipe;
  servings: number;
  onRemove: () => void;
  onServingsChange: (delta: number) => void;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      style={({ pressed }) => ({
        backgroundColor: pressed ? tokens.bgDeep : tokens.cream,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: tokens.lineDark,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 14,
        paddingRight: 10,
        paddingVertical: 12,
        gap: 12,
        shadowColor: tokens.ink,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      })}
    >
      {/* Colour swatch / emoji */}
      {recipe.emoji ? (
        <Text style={{ fontSize: 28 }}>{recipe.emoji}</Text>
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: recipe.hero_fallback?.[0] ?? tokens.primaryLight,
          }}
        />
      )}

      {/* Title */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontFamily: fonts.display, fontSize: 15, color: tokens.ink, lineHeight: 19 }}
          numberOfLines={2}
        >
          {recipe.title}
        </Text>
        {recipe.source ? (
          <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted, marginTop: 1 }}>
            {recipe.source.chef}
          </Text>
        ) : null}
      </View>

      {/* Compact servings stepper */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onServingsChange(-1); }}
          hitSlop={8}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: servings <= 1 ? tokens.line : tokens.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: servings <= 1 ? 0.35 : 1,
          }}
        >
          <Icon name="minus" size={12} color={servings <= 1 ? tokens.muted : tokens.primary} />
        </Pressable>
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 14,
            color: tokens.ink,
            minWidth: 20,
            textAlign: 'center',
          }}
        >
          {servings}
        </Text>
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onServingsChange(1); }}
          hitSlop={8}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: servings >= 20 ? tokens.line : tokens.primary,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: servings >= 20 ? 0.35 : 1,
          }}
        >
          <Icon name="plus" size={12} color={servings >= 20 ? tokens.muted : tokens.primary} />
        </Pressable>
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted, marginLeft: 2 }}>
          pax
        </Text>
      </View>

      {/* Remove */}
      <Pressable
        onPress={(e) => { e.stopPropagation?.(); onRemove(); }}
        hitSlop={8}
        style={({ pressed }) => ({
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: pressed ? tokens.bgDeep : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <Icon name="x" size={14} color={tokens.muted} />
      </Pressable>
    </Pressable>
  );
}

// ── Aisle section wrapper ─────────────────────────────────────────────────────
// Title is set in display serif (Lora), with a coloured accent bar on the
// left and a count chip on the right. Items live inside a bordered cream
// card so the whole aisle reads as a single object.

function AisleSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 22 }}>
      {/* Heading */}
      <View
        style={{
          paddingHorizontal: 20,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 3,
            height: 22,
            backgroundColor: tokens.primary,
            borderRadius: 2,
          }}
        />
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.display,
            fontSize: 19,
            color: tokens.ink,
            letterSpacing: 0.1,
          }}
        >
          {title}
        </Text>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: tokens.bgDeep,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 11,
              color: tokens.muted,
              letterSpacing: 0.4,
            }}
          >
            {count}
          </Text>
        </View>
      </View>

      {/* Card body */}
      <View
        style={{
          marginHorizontal: 20,
          backgroundColor: tokens.cream,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: tokens.line,
          overflow: 'hidden',
          shadowColor: tokens.ink,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 6,
          elevation: 1,
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ── Single shopping row ───────────────────────────────────────────────────────
// Layout (left → right):
//   [checkbox]  [qty column, optional]  [name, fills remaining width]
// On check: rounded checkbox fills with sage, name + qty fade to muted with
// a strikethrough — feels conclusive without being shouty.

function ShopRow({
  qty,
  label,
  checked,
  onToggle,
  isLast,
}: {
  qty?: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
  isLast?: boolean;
}) {
  // Pressable is the bare tap target — all visual & layout styling lives
  // on the inner View so Android renders the row reliably. The qty and
  // label are nested inside a single Text, which guarantees inline flow
  // (qty + name on one line, wraps together if too long) and keeps both
  // in the body sans-serif (Inter) for a consistent type voice.
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      android_ripple={{ color: tokens.bgDeep }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 14,
          minHeight: 56,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: tokens.line,
        }}
      >
        {/* Rounded-square checkbox */}
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 9,
            borderWidth: 2,
            borderColor: checked ? tokens.sage : tokens.lineDark,
            backgroundColor: checked ? tokens.sage : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {checked && <Icon name="check" size={14} color="#FFF" />}
        </View>

        {/* Single Text — qty bolded inline, name follows. Both Inter,
            both line-through together when checked. */}
        <Text
          numberOfLines={2}
          style={{
            flex: 1,
            flexShrink: 1,
            fontFamily: fonts.sans,
            fontSize: 15,
            lineHeight: 21,
            color: checked ? tokens.muted : tokens.ink,
            textDecorationLine: checked ? 'line-through' : 'none',
          }}
        >
          {qty ? (
            <Text
              style={{
                fontFamily: fonts.sansBold,
                color: checked ? tokens.muted : tokens.primary,
              }}
            >
              {qty}{'  '}
            </Text>
          ) : null}
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
