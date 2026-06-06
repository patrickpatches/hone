/**
 * Weekly meal-planner tab (issue #38).
 *
 * Shows Mon–Sun for the current week (and navigable adjacent weeks).
 * Each day lists planned recipes as dismissible pills.
 * Tap "+" on any day to pick a recipe from the full catalogue.
 * The Shop tab auto-picks up everything added here because it reads
 * ALL meal_plan rows via getPlannedEntries().
 */
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';

import { tokens, fonts } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import {
  getAllRecipes,
  getMealPlanForWeek,
  addWeeklyMealPlan,
  removeWeeklyMealPlan,
} from '../../db/database';
import type { Recipe } from '../../src/data/types';
import type { WeeklyPlanEntry } from '../../db/database';

// ── Date helpers ──────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Returns the Monday of the ISO week containing the given date. */
function weekStart(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const dow = copy.getDay(); // 0=Sun…6=Sat
  const diff = dow === 0 ? -6 : 1 - dow;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]}`;
}

function isToday(iso: string): boolean {
  return iso === toISO(new Date());
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PlanScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const [weekOffset, setWeekOffset] = useState(0);   // 0=this week, 1=next, -1=last
  const [entries, setEntries]       = useState<WeeklyPlanEntry[]>([]);
  const [recipes, setRecipes]       = useState<Recipe[]>([]);
  const [pickerDay, setPickerDay]   = useState<string | null>(null); // ISO date for add-picker
  const [search, setSearch]         = useState('');

  // Compute week days from current offset
  const monday  = weekStart(addDays(new Date(), weekOffset * 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => toISO(addDays(monday, i)));
  const startISO = weekDays[0];
  const endISO   = weekDays[6];

  const load = useCallback(async () => {
    const [allRecipes, weekEntries] = await Promise.all([
      getAllRecipes(db),
      getMealPlanForWeek(db, startISO, endISO),
    ]);
    setRecipes(allRecipes);
    setEntries(weekEntries);
  }, [db, startISO, endISO]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async (recipeId: string) => {
    if (!pickerDay) return;
    await addWeeklyMealPlan(db, pickerDay, recipeId, 2);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPickerDay(null);
    setSearch('');
    await load();
  };

  const handleRemove = async (entryId: string) => {
    await removeWeeklyMealPlan(db, entryId);
    Haptics.selectionAsync().catch(() => {});
    await load();
  };

  // Recipes matching the search query (shown in picker)
  const filteredRecipes = search.trim()
    ? recipes.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.tagline?.toLowerCase().includes(search.toLowerCase())
      )
    : recipes;

  // Format week header
  const weekLabel = weekOffset === 0 ? 'This week'
    : weekOffset === 1 ? 'Next week'
    : weekOffset === -1 ? 'Last week'
    : `Week of ${formatDayLabel(startISO)}`;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12,
        paddingBottom: 12,
        paddingHorizontal: 20,
        backgroundColor: tokens.bgDeep,
        borderBottomWidth: 1,
        borderBottomColor: tokens.line,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => setWeekOffset(w => w - 1)}
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
          >
            <Text style={{ fontSize: 22, color: tokens.inkSoft, paddingRight: 8 }}>‹</Text>
          </Pressable>
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: tokens.ink }}>
            {weekLabel}
          </Text>
          <Pressable
            onPress={() => setWeekOffset(w => w + 1)}
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel="Next week"
          >
            <Text style={{ fontSize: 22, color: tokens.inkSoft, paddingLeft: 8 }}>›</Text>
          </Pressable>
        </View>
        {weekOffset !== 0 && (
          <Pressable onPress={() => setWeekOffset(0)} style={{ alignItems: 'center', marginTop: 6 }}>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: tokens.primary }}>
              Back to this week
            </Text>
          </Pressable>
        )}
      </View>

      {/* Week grid */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {weekDays.map((iso, dayIdx) => {
          const dayEntries = entries.filter(e => e.date === iso);
          const today = isToday(iso);

          return (
            <View
              key={iso}
              style={{
                marginBottom: 10,
                backgroundColor: tokens.cream,
                borderRadius: 16,
                borderWidth: today ? 1.5 : 1,
                borderColor: today ? tokens.primary : tokens.lineDark,
                overflow: 'hidden',
              }}
            >
              {/* Day header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 14, paddingVertical: 10,
                borderBottomWidth: dayEntries.length > 0 ? 1 : 0,
                borderBottomColor: tokens.line,
              }}>
                <Text style={{
                  fontFamily: fonts.sansBold, fontSize: 13,
                  color: today ? tokens.primary : tokens.inkSoft,
                  width: 34,
                }}>
                  {DAY_NAMES[dayIdx]}
                </Text>
                <Text style={{
                  fontFamily: fonts.sans, fontSize: 12,
                  color: today ? tokens.primary : tokens.muted,
                  flex: 1,
                }}>
                  {formatDayLabel(iso)}
                  {today ? ' · Today' : ''}
                </Text>
                <Pressable
                  onPress={() => { setPickerDay(iso); setSearch(''); }}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Add meal for ${DAY_NAMES[dayIdx]}`}
                  style={{
                    backgroundColor: tokens.primary,
                    borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4,
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                  }}
                >
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 18, color: tokens.onPrimary, lineHeight: 20 }}>+</Text>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: tokens.onPrimary }}>Meal</Text>
                </Pressable>
              </View>

              {/* Planned recipes */}
              {dayEntries.map(entry => {
                const recipe = recipes.find(r => r.id === entry.recipe_id);
                if (!recipe) return null;
                return (
                  <View
                    key={entry.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 14, paddingVertical: 10,
                      borderBottomWidth: 1, borderBottomColor: tokens.line,
                    }}
                  >
                    <Text style={{ fontSize: 16, marginRight: 10 }}>
                      {recipe.emoji ?? '🍽️'}
                    </Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{ fontFamily: fonts.sansBold, fontSize: 14, color: tokens.ink }}
                        numberOfLines={1}
                      >
                        {recipe.title}
                      </Text>
                      <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted, marginTop: 1 }}>
                        {entry.servings} serves · {recipe.time_min} min
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleRemove(entry.id)}
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${recipe.title}`}
                    >
                      <Text style={{ fontSize: 18, color: tokens.muted, paddingLeft: 12 }}>×</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* Recipe picker modal */}
      <Modal
        visible={pickerDay !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerDay(null)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' }}>
          <View style={{
            backgroundColor: tokens.bgDeep,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            maxHeight: '80%',
          }}>
            {/* Drag handle */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: tokens.lineDark, alignSelf: 'center', marginBottom: 14 }} />

            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 20, color: tokens.ink, marginBottom: 12 }}>
                {pickerDay ? `Add meal for ${DAY_NAMES[weekDays.indexOf(pickerDay)]} ${formatDayLabel(pickerDay ?? '')}` : 'Add meal'}
              </Text>
              {/* Search */}
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: tokens.cream, borderRadius: 12,
                borderWidth: 1, borderColor: tokens.lineDark,
                paddingHorizontal: 12,
              }}>
                <Icon name="search" size={14} color={tokens.muted} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search recipes…"
                  placeholderTextColor={tokens.muted}
                  style={{
                    flex: 1, fontFamily: fonts.sans, fontSize: 14,
                    color: tokens.ink, paddingVertical: 10, paddingLeft: 8,
                  }}
                />
              </View>
            </View>

            <FlatList
              data={filteredRecipes}
              keyExtractor={r => r.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleAdd(item.id)}
                  android_ripple={{ color: tokens.primaryLight }}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 20, paddingVertical: 13,
                    borderBottomWidth: 1, borderBottomColor: tokens.line,
                  }}
                >
                  <Text style={{ fontSize: 18, marginRight: 12 }}>
                    {item.emoji ?? '🍽️'}
                  </Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{ fontFamily: fonts.sansBold, fontSize: 14, color: tokens.ink }}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted, marginTop: 2 }}
                      numberOfLines={1}>
                      {item.time_min} min · {item.difficulty}
                    </Text>
                  </View>
                </Pressable>
              )}
            />

            <Pressable
              onPress={() => setPickerDay(null)}
              style={{ alignItems: 'center', paddingVertical: 16, paddingTop: 12 }}
            >
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: tokens.muted }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
