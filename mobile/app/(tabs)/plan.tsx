/**
 * Plan & Shop — matches hone.html PlanAndShop exactly.
 *
 * Simple list of planned recipes (no calendar, no date picker).
 * Each recipe card has: title, servings +/-, leftover mode picker, remove button.
 * Shopping list below: grouped by aisle, check-off items, Share button.
 * Custom item input for BUG-003.
 *
 * Matches hone.html behaviour:
 *   - plan() is a toggle — add/remove with one tap
 *   - No date, no calendar, no week view
 *   - Shopping list auto-generated from planned recipes
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';

import { tokens, fonts } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import {
  getPlannedRecipes,
  removePlannedRecipe,
  updatePlannedServings,
  getRecipeById,
  getPantryItems,
  getShoppingExtras,
  addShoppingExtra,
  deleteShoppingExtra,
  type ShoppingExtra,
} from '../../db/database';
import type { Recipe } from '../../src/data/types';
import {
  categorizeIngredient,
  cleanIngredientName,
  SHOPPING_SECTION_LABEL,
  SHOPPING_SECTION_ORDER,
} from '../../src/data/pantry-helpers';
import { scaleIngredient, totalPortionsFor, type LeftoverModeId } from '../../src/data/scale';

// ── Leftover modes — exactly as hone.html ─────────────────────────────────────

const LEFTOVER_OPTIONS: Array<{
  id: LeftoverModeId;
  label: string;
  desc: string;
}> = [
  { id: 'tonight',   label: 'Just tonight',          desc: 'Exact portions' },
  { id: 'lunch',     label: '+ lunch tomorrow',       desc: 'One extra portion' },
  { id: 'threedays', label: 'Three days of meals',    desc: 'Triple the recipe' },
  { id: 'week',      label: 'Meal prep for the week', desc: '5× batch' },
];

// ── Shopping list helpers ─────────────────────────────────────────────────────

function formatAmt(amount: number, unit: string): string {
  if (!amount) return unit;
  const n = amount % 1 === 0 ? amount.toString() : amount.toFixed(1).replace(/\.0$/, '');
  return unit ? `${n}${unit}` : n;
}

interface ShopItem {
  key: string;
  name: string;
  amount: number;
  unit: string;
  section: string;
  extra?: boolean;
}

function buildShoppingList(
  plannedWithRecipes: Array<{ recipe: Recipe; servings: number; leftover: LeftoverModeId }>,
  pantryNames: Set<string>,
): Record<string, ShopItem[]> {
  const merged: Record<string, ShopItem> = {};

  for (const { recipe, servings, leftover } of plannedWithRecipes) {
    const totalPortions = totalPortionsFor(servings, leftover);
    for (const ing of recipe.ingredients) {
      const scaled = scaleIngredient(ing, recipe.base_servings, totalPortions);
      const clean = cleanIngredientName(scaled.name);
      const normKey = clean.toLowerCase().replace(/\s+/g, ' ').trim();

      if (pantryNames.has(normKey)) continue;

      const section = categorizeIngredient(clean);
      if (merged[normKey]) {
        if (merged[normKey].unit === scaled.unit) {
          merged[normKey].amount += scaled.amount;
        }
      } else {
        merged[normKey] = {
          key: normKey,
          name: clean,
          amount: scaled.amount,
          unit: scaled.unit ?? '',
          section,
        };
      }
    }
  }

  const grouped: Record<string, ShopItem[]> = {};
  for (const item of Object.values(merged)) {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  }
  return grouped;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PlanAndShopScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  type PlannedEntry = {
    recipe: Recipe;
    servings: number;
    leftover: LeftoverModeId;
  };

  const [planned, setPlanned] = useState<PlannedEntry[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [extraItems, setExtraItems] = useState<ShoppingExtra[]>([]);
  const [newItem, setNewItem] = useState('');
  const [pantryNames, setPantryNames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [entries, pantry, extras] = await Promise.all([
      getPlannedRecipes(db),
      getPantryItems(db),
      getShoppingExtras(db),
    ]);

    const pNames = new Set<string>(
      pantry
        .filter((p) => p.have_it)
        .map((p) => p.name.toLowerCase().trim()),
    );
    setPantryNames(pNames);
    setExtraItems(extras);

    const withRecipes: PlannedEntry[] = [];
    for (const e of entries) {
      const recipe = await getRecipeById(db, e.recipe_id);
      if (recipe) {
        withRecipes.push({ recipe, servings: e.servings, leftover: 'tonight' });
      }
    }
    setPlanned(withRecipes);
    setLoading(false);
  }, [db]);

  useEffect(() => { loadData(); }, [loadData]);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData]),
  );

  const handleRemove = async (recipeId: string) => {
    Haptics.selectionAsync().catch(() => {});
    await removePlannedRecipe(db, recipeId);
    setPlanned((p) => p.filter((e) => e.recipe.id !== recipeId));
  };

  const handleServings = async (recipeId: string, delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    setPlanned((prev) =>
      prev.map((e) => {
        if (e.recipe.id !== recipeId) return e;
        const next = Math.max(1, e.servings + delta);
        updatePlannedServings(db, recipeId, next).catch(console.error);
        return { ...e, servings: next };
      }),
    );
  };

  const handleLeftover = (recipeId: string, leftover: LeftoverModeId) => {
    Haptics.selectionAsync().catch(() => {});
    setPlanned((prev) =>
      prev.map((e) => (e.recipe.id === recipeId ? { ...e, leftover } : e)),
    );
  };

  const toggleCheck = (key: string) => {
    setCheckedItems((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleAddExtra = async () => {
    const name = newItem.trim();
    if (!name) return;
    Haptics.selectionAsync().catch(() => {});
    const extra: ShoppingExtra = {
      id: `extra_${Date.now()}`,
      name,
      amount: 0,
      unit: '',
      category: 'Pantry Staples',
      created_at: Date.now(),
    };
    await addShoppingExtra(db, extra);
    setExtraItems((e) => [...e, extra]);
    setNewItem('');
  };

  const handleRemoveExtra = async (id: string) => {
    await deleteShoppingExtra(db, id);
    setExtraItems((e) => e.filter((x) => x.id !== id));
  };

  const handleShare = async () => {
    if (planned.length === 0) return;
    const grouped = buildShoppingList(planned, pantryNames);
    const sections = SHOPPING_SECTION_ORDER.filter((s) => grouped[s]);
    let text = '🛒 Shopping List (Hone)\n';
    for (const sec of sections) {
      text += `\n${SHOPPING_SECTION_LABEL[sec] ?? sec}\n`;
      for (const item of grouped[sec]) {
        const qty = formatAmt(item.amount, item.unit);
        text += `  • ${item.name}${qty ? ` — ${qty}` : ''}\n`;
      }
    }
    if (extraItems.length) {
      text += '\nExtras\n';
      for (const e of extraItems) text += `  • ${e.name}\n`;
    }
    try {
      await Share.share({ message: text });
    } catch { /* silent */ }
  };

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (!loading && planned.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg }}>
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: tokens.line,
          }}
        >
          <Text style={{ fontFamily: fonts.display, fontSize: 28, color: tokens.ink, letterSpacing: -0.5 }}>
            Plan & Shop
          </Text>
          <Text style={{ fontFamily: fonts.displayItalic, fontSize: 14, color: tokens.muted, marginTop: 2 }}>
            0 meals on the go
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🛒</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 22, color: tokens.ink, textAlign: 'center', marginBottom: 8 }}>
            No meals planned yet
          </Text>
          <Text style={{ fontFamily: fonts.displayItalic, fontSize: 14, color: tokens.muted, textAlign: 'center', lineHeight: 22 }}>
            Browse recipes and tap Plan to build your week — your shopping list writes itself.
          </Text>
          <Pressable
            onPress={() => router.push('/')}
            style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: tokens.paprika }}
          >
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: '#FDF9F3' }}>Browse recipes</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const grouped = buildShoppingList(planned, pantryNames);
  const sections = SHOPPING_SECTION_ORDER.filter((s) => grouped[s]);
  const totalShopItems = Object.values(grouped).reduce((n, a) => n + a.length, 0) + extraItems.length;

  // ── Full plan ────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: tokens.line,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontFamily: fonts.display, fontSize: 28, color: tokens.ink, letterSpacing: -0.5 }}>
            Plan & Shop
          </Text>
          <Text style={{ fontFamily: fonts.displayItalic, fontSize: 14, color: tokens.muted, marginTop: 2 }}>
            {planned.length} meal{planned.length !== 1 ? 's' : ''} on the go
          </Text>
        </View>
        {totalShopItems > 0 && (
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: tokens.paprika,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Icon name="share" size={14} color="#FDF9F3" />
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: '#FDF9F3' }}>Share list</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Planned recipe cards */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
          {planned.map((entry) => (
            <View
              key={entry.recipe.id}
              style={{
                backgroundColor: tokens.cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: tokens.line,
                padding: 14,
              }}
            >
              {/* Title row */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Pressable
                  onPress={() => router.push(`/recipe/${entry.recipe.id}`)}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  <Text style={{ fontFamily: fonts.display, fontSize: 17, color: tokens.ink, letterSpacing: -0.2 }}>
                    {entry.recipe.title}
                  </Text>
                  <Text style={{ fontFamily: fonts.displayItalic, fontSize: 13, color: tokens.muted, marginTop: 2 }}>
                    {entry.recipe.tagline}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRemove(entry.recipe.id)}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: tokens.bgDeep,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Icon name="x" size={14} color={tokens.inkSoft} />
                </Pressable>
              </View>

              {/* Servings row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: tokens.inkSoft }}>Serves</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
                  <Pressable
                    onPress={() => handleServings(entry.recipe.id, -1)}
                    style={({ pressed }) => ({
                      width: 32, height: 32, borderRadius: 8,
                      backgroundColor: pressed ? tokens.bgDeep : tokens.bg,
                      borderWidth: 1, borderColor: tokens.line,
                      alignItems: 'center', justifyContent: 'center',
                    })}
                  >
                    <Icon name="minus" size={12} color={tokens.ink} />
                  </Pressable>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: tokens.ink, minWidth: 32, textAlign: 'center' }}>
                    {entry.servings}
                  </Text>
                  <Pressable
                    onPress={() => handleServings(entry.recipe.id, +1)}
                    style={({ pressed }) => ({
                      width: 32, height: 32, borderRadius: 8,
                      backgroundColor: pressed ? tokens.bgDeep : tokens.bg,
                      borderWidth: 1, borderColor: tokens.line,
                      alignItems: 'center', justifyContent: 'center',
                    })}
                  >
                    <Icon name="plus" size={12} color={tokens.ink} />
                  </Pressable>
                </View>
              </View>

              {/* Leftover options — 2×2 grid matching hone.html */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {LEFTOVER_OPTIONS.map((opt) => {
                  const active = entry.leftover === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => handleLeftover(entry.recipe.id, opt.id)}
                      style={({ pressed }) => ({
                        flex: 1,
                        minWidth: '45%',
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: active ? tokens.paprika : tokens.line,
                        backgroundColor: active ? tokens.paprikaLight : tokens.bg,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text style={{
                        fontFamily: fonts.sansBold,
                        fontSize: 11,
                        color: active ? tokens.paprika : tokens.inkSoft,
                        marginBottom: 1,
                      }}>
                        {opt.label}
                      </Text>
                      <Text style={{
                        fontFamily: fonts.sans,
                        fontSize: 10,
                        color: active ? tokens.paprika : tokens.muted,
                      }}>
                        {opt.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Shopping list */}
        {totalShopItems > 0 && (
          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 22, color: tokens.ink, marginBottom: 14 }}>
              Shopping list
            </Text>

            {sections.map((sec) => (
              <View key={sec} style={{ marginBottom: 20 }}>
                <Text style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 11,
                  color: tokens.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  marginBottom: 8,
                }}>
                  {SHOPPING_SECTION_LABEL[sec] ?? sec}
                </Text>
                {grouped[sec].map((item) => {
                  const checked = checkedItems.has(item.key);
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => { Haptics.selectionAsync().catch(() => {}); toggleCheck(item.key); }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: tokens.line,
                        gap: 12,
                      }}
                    >
                      {/* Checkbox */}
                      <View style={{
                        width: 22, height: 22, borderRadius: 6,
                        borderWidth: 1.5,
                        borderColor: checked ? tokens.sage : tokens.lineDark,
                        backgroundColor: checked ? tokens.sage : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {checked && <Icon name="check" size={11} color="#FDF9F3" />}
                      </View>
                      <Text style={{
                        flex: 1,
                        fontFamily: fonts.sansMedium,
                        fontSize: 14,
                        color: checked ? tokens.muted : tokens.ink,
                        textDecorationLine: checked ? 'line-through' : 'none',
                      }}>
                        {item.name}
                      </Text>
                      {item.amount > 0 && (
                        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: tokens.muted }}>
                          {formatAmt(item.amount, item.unit)}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {/* Extra items (BUG-003) */}
            {extraItems.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  fontFamily: fonts.sansBold, fontSize: 11, color: tokens.muted,
                  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
                }}>
                  Extras
                </Text>
                {extraItems.map((extra) => {
                  const checked = checkedItems.has(extra.id);
                  return (
                    <View key={extra.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tokens.line, gap: 12 }}>
                      <Pressable onPress={() => toggleCheck(extra.id)} style={{
                        width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
                        borderColor: checked ? tokens.sage : tokens.lineDark,
                        backgroundColor: checked ? tokens.sage : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {checked && <Icon name="check" size={11} color="#FDF9F3" />}
                      </Pressable>
                      <Text style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: checked ? tokens.muted : tokens.ink, textDecorationLine: checked ? 'line-through' : 'none' }}>
                        {extra.name}
                      </Text>
                      <Pressable onPress={() => handleRemoveExtra(extra.id)}>
                        <Icon name="x" size={14} color={tokens.muted} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Add custom item — BUG-003 fix */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginTop: 8,
              marginBottom: 8,
              backgroundColor: tokens.cardBg,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.line,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}>
              <Icon name="plus" size={14} color={tokens.muted} />
              <TextInput
                value={newItem}
                onChangeText={setNewItem}
                placeholder="Add an item…"
                placeholderTextColor={tokens.muted}
                style={{ flex: 1, fontFamily: fonts.sans, fontSize: 14, color: tokens.ink, paddingVertical: 10 }}
                returnKeyType="done"
                onSubmitEditing={handleAddExtra}
              />
              {newItem.trim().length > 0 && (
                <Pressable onPress={handleAddExtra} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: tokens.paprika }}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: '#FDF9F3' }}>Add</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
