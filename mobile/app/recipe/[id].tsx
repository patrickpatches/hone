/**
 * Recipe Detail — matches hone.html RecipeDetail exactly.
 *
 * BUG-001 FIX (permanent):
 *   Sticky header bar sits ABOVE the hero image — buttons are never
 *   overlaid on the photo. Back button and heart always readable on the
 *   parchment/cardBg header background. No rgba transparency issues.
 *
 * Layout (matches hone.html):
 *   ┌─────────────────────────────────────┐
 *   │  ← (circle)   ♡ (circle)  Start ▶  │  sticky parchment header
 *   ├─────────────────────────────────────┤
 *   │  [  260px hero image               ]│
 *   │  [  Recipe Title (Fraunces)        ]│  title/tagline overlay at bottom
 *   │  [  Italic tagline                 ]│
 *   ├─────────────────────────────────────┤
 *   │  Inspired by card  │  Watch button  │
 *   │  ────────────────────────────────── │
 *   │  ⏱ Time  🔥 Skill  👤 Serves       │
 *   │  Scaling + leftover selector        │
 *   │  Ingredients list                   │
 *   │  Steps list                         │
 *   └─────────────────────────────────────┘
 *
 * Cook mode: full-screen black overlay (same as hone.html).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';

import type { Recipe, Substitution } from '../../src/data/types';
import {
  getRecipeById,
  getFavoriteIds,
  toggleFavorite,
  getSwapsForRecipe,
  setIngredientSwap,
  clearIngredientSwap,
  type SwapRecord,
} from '../../db/database';
import { tokens, fonts } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { ServingsSelector } from '../../src/components/ServingsSelector';
import { SwapSheet } from '../../src/components/SwapSheet';
import { AddToPlanSheet } from '../../src/components/AddToPlanSheet';
import {
  formatAmount,
  scaleIngredient,
  leftoverById,
  totalPortionsFor,
  type LeftoverModeId,
} from '../../src/data/scale';

const LEFTOVER_OPTIONS = [
  { id: 'tonight',   label: 'Just tonight',         desc: 'Exact portions, nothing extra',       extra: 0       },
  { id: 'lunch',     label: '+ lunch tomorrow',      desc: 'Makes one extra portion',             extra: 1       },
  { id: 'threedays', label: 'Three days of meals',   desc: 'Triple the base recipe',              multiplier: 3  },
  { id: 'week',      label: 'Meal prep for the week',desc: '5× batch — freeze what you don\'t eat', multiplier: 5 },
] as const;

function fmtTime(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// ── Cook mode overlay ─────────────────────────────────────────────────────────

function CookMode({
  recipe,
  stepsDone,
  onTickStep,
  onExit,
}: {
  recipe: Recipe;
  stepsDone: Record<string, boolean>;
  onTickStep: (id: string) => void;
  onExit: () => void;
}) {
  const insets = useSafeAreaInsets();
  const doneSoFar = Object.values(stepsDone).filter(Boolean).length;
  const totalSteps = recipe.steps.length;
  const pct = Math.round((doneSoFar / totalSteps) * 100);

  // Auto-advance to first incomplete step
  const firstIncomplete = recipe.steps.findIndex((s) => !stepsDone[s.id]);
  const [activeStep, setActiveStep] = useState(firstIncomplete >= 0 ? firstIncomplete : 0);

  const step = recipe.steps[activeStep];
  const isLast = activeStep === totalSteps - 1;

  function markAndAdvance() {
    onTickStep(step.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!isLast) setActiveStep((s) => s + 1);
    else onExit();
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.07)' }}>
        <View style={{ height: 4, width: `${pct}%`, backgroundColor: tokens.paprika }} />
      </View>

      {/* Top bar */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: fonts.displayItalic ?? fonts.display,
              fontSize: 10,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: 'rgba(247,242,234,0.28)',
              marginBottom: 2,
            }}
          >
            {recipe.title}
          </Text>
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: 'rgba(247,242,234,0.38)',
            }}
          >
            Step {activeStep + 1}
            <Text style={{ opacity: 0.5 }}> / {totalSteps}</Text>
          </Text>
        </View>
        <Pressable
          onPress={onExit}
          style={{
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.sansBold,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: 'uppercase',
              color: 'rgba(247,242,234,0.4)',
            }}
          >
            Exit
          </Text>
        </Pressable>
      </View>

      {/* Step content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ghost step number */}
        <Text
          style={{
            fontFamily: fonts.displayBold,
            fontSize: 96,
            lineHeight: 96,
            color: 'rgba(255,255,255,0.04)',
            marginBottom: -24,
            marginLeft: -4,
            letterSpacing: -4,
          }}
          selectable={false}
        >
          {activeStep + 1}
        </Text>

        {/* Step title */}
        <Text
          style={{
            fontFamily: fonts.displayBold,
            fontSize: 28,
            lineHeight: 33,
            letterSpacing: -0.5,
            color: tokens.cream,
            marginBottom: step.photo_url ? 12 : 16,
          }}
        >
          {step.title}
        </Text>

        {/* Step photo */}
        {step.photo_url && (
          <View
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              height: 192,
              marginBottom: 18,
            }}
          >
            <Image
              source={{ uri: step.photo_url }}
              style={{ width: '100%', height: '100%', opacity: 0.88 }}
              contentFit="cover"
            />
          </View>
        )}

        {/* Step body */}
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 18,
            lineHeight: 32,
            color: 'rgba(247,242,234,0.88)',
          }}
        >
          {step.content}
        </Text>

        {/* Chef's why note */}
        {step.why_note && (
          <View
            style={{
              marginTop: 20,
              padding: 14,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(247,242,234,0.28)', marginBottom: 6 }}>
              Why
            </Text>
            <Text style={{ fontFamily: fonts.displayItalic ?? fonts.display, fontSize: 14, lineHeight: 22, color: 'rgba(247,242,234,0.6)' }}>
              {step.why_note}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom + 16, 32),
          paddingTop: 16,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        {activeStep > 0 && (
          <Pressable
            onPress={() => setActiveStep((s) => s - 1)}
            style={({ pressed }) => ({
              height: 56,
              flex: 1,
              borderRadius: 16,
              backgroundColor: pressed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.07)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: 'rgba(247,242,234,0.7)' }}>
              ← Prev
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={markAndAdvance}
          style={({ pressed }) => ({
            height: 56,
            flex: 2,
            borderRadius: 16,
            backgroundColor: pressed ? tokens.paprikaDeep : tokens.paprika,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: '#FDF9F3' }}>
            {isLast ? 'Finish 🎉' : 'Done →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function RecipeDetailScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recipe, setRecipe] = useState<Recipe | null | undefined>(undefined);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [r, favs] = await Promise.all([
        getRecipeById(db, id ?? ''),
        getFavoriteIds(db),
      ]);
      if (!cancelled) {
        setRecipe(r);
        setFavorite(favs.has(id ?? ''));
      }
    }
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [db, id]);

  const [swaps, setSwaps] = useState<Map<string, SwapRecord>>(new Map());

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getSwapsForRecipe(db, id).then(setSwaps).catch(console.error);
    }, [db, id]),
  );

  const [swapSheet, setSwapSheet] = useState<{
    ingredientId: string;
    ingredientName: string;
    substitutions: Substitution[];
    activeSwapName?: string;
  } | null>(null);

  const [people, setPeople] = useState<number>(2);
  const [leftoverKey, setLeftoverKey] = useState<LeftoverModeId>('tonight');

  useEffect(() => {
    if (recipe) setPeople(recipe.base_servings);
  }, [recipe]);

  const [showPlanSheet, setShowPlanSheet] = useState(false);
  const [cooking, setCooking] = useState(false);
  const [stepsDone, setStepsDone] = useState<Record<string, boolean>>({});
  const [ingTicked, setIngTicked] = useState<Record<string, boolean>>({});
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const tag = 'cook-mode';
    if (cooking) {
      activateKeepAwakeAsync(tag).catch(() => {});
      return () => { deactivateKeepAwake(tag); };
    }
    return undefined;
  }, [cooking]);

  const handleToggleFavorite = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await toggleFavorite(db, recipe!.id);
      setFavorite((f) => !f);
    } catch (err) {
      console.error('toggleFavorite error:', err);
    }
  };

  const tickStep = (stepId: string) => {
    setStepsDone((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const openSource = () => {
    const url = recipe?.source?.video_url;
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('Could not open link', url));
  };

  // ── Loading / error states ────────────────────────────────────────────────

  if (recipe === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.paprika} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>🤔</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: tokens.ink, marginBottom: 8 }}>Recipe not found</Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            paddingHorizontal: 20, paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: pressed ? tokens.paprikaDeep : tokens.paprika,
          })}
        >
          <Text style={{ fontFamily: fonts.sansBold, color: '#FDF9F3', fontSize: 13 }}>Back to Kitchen</Text>
        </Pressable>
      </View>
    );
  }

  const option = leftoverById(leftoverKey);
  const totalPortions = totalPortionsFor(option, people, recipe.base_servings);
  const scaleFactor = totalPortions / recipe.base_servings;

  const attribution = recipe.generated_by_claude
    ? 'Invented from your pantry'
    : recipe.source
    ? `Inspired by ${recipe.source.chef}`
    : recipe.user_added
    ? 'Your own recipe'
    : '';

  // ── Cook mode — full screen black overlay ─────────────────────────────────

  if (cooking) {
    return (
      <CookMode
        recipe={recipe}
        stepsDone={stepsDone}
        onTickStep={tickStep}
        onExit={() => { setCooking(false); setStepsDone({}); setIngTicked({}); }}
      />
    );
  }

  // ── Browse mode ───────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* ── Sticky header bar (hone.html pattern) ────────────────────────── */}
      {/* BUG-001 FIX: buttons in header, never over the hero photo */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: 'rgba(247,242,234,0.96)',
          borderBottomWidth: 1,
          borderBottomColor: tokens.line,
        }}
      >
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Back */}
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Back"
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: pressed ? tokens.bgDeep : tokens.cardBg,
              borderWidth: 1,
              borderColor: tokens.line,
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Icon name="arrow-left" size={18} color={tokens.ink} />
          </Pressable>

          {/* Right: Heart + Start Cooking */}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Pressable
              onPress={handleToggleFavorite}
              accessibilityLabel={favorite ? 'Remove from saved' : 'Save recipe'}
              style={({ pressed }) => ({
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: pressed ? tokens.bgDeep : tokens.cardBg,
                borderWidth: 1,
                borderColor: tokens.line,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Icon
                name="heart"
                size={17}
                color={favorite ? tokens.paprika : tokens.ink}
                fill={favorite}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setCooking(true);
              }}
              style={({ pressed }) => ({
                height: 40,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: pressed ? '#333' : tokens.ink,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: tokens.ink,
                shadowOpacity: 0.22,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 5,
              })}
            >
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: '#FDF9F3' }}>
                Start cooking
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* ── Hero — 260px, title + tagline overlay at bottom ───────────── */}
        <View style={{ height: 260, position: 'relative' }}>
          {recipe.hero_url ? (
            <Image
              source={{ uri: recipe.hero_url }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: recipe.hero_color ?? tokens.bgDeep,
              }}
            >
              <Text style={{ fontSize: 72 }}>{recipe.emoji ?? '🍽️'}</Text>
            </View>
          )}

          {/* Gradient overlay — transparent to dark */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.78)']}
            locations={[0.28, 1]}
            style={{ position: 'absolute', inset: 0 } as any}
            pointerEvents="none"
          />

          {/* Title + tagline at bottom of hero */}
          <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <Text
              style={{
                fontFamily: fonts.displayBold,
                fontSize: 32,
                lineHeight: 34,
                letterSpacing: -0.6,
                color: '#FFFFFF',
              }}
            >
              {recipe.title}
            </Text>
            <Text
              style={{
                fontFamily: fonts.displayItalic ?? fonts.display,
                fontSize: 15,
                marginTop: 6,
                color: 'rgba(255,255,255,0.88)',
              }}
            >
              {recipe.tagline}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {/* ── Source card ────────────────────────────────────────────────── */}
          {attribution ? (
            <View
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 20,
                backgroundColor: tokens.cardBg,
                borderWidth: 1,
                borderColor: tokens.line,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.muted, marginBottom: 4 }}>
                  Inspired by
                </Text>
                <Text style={{ fontFamily: fonts.display, fontSize: 15, lineHeight: 19, color: tokens.ink }} numberOfLines={1}>
                  {recipe.source?.chef ?? attribution}
                </Text>
              </View>
              {recipe.source?.video_url ? (
                <Pressable
                  onPress={openSource}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: pressed ? tokens.paprikaDeep : tokens.paprika,
                  })}
                >
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: '#FDF9F3' }}>Watch</Text>
                  <Icon name="external-link" size={12} color="#FDF9F3" />
                </Pressable>
              ) : (
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: tokens.muted }}>
                  Original
                </Text>
              )}
            </View>
          ) : null}

          {/* ── Meta row ───────────────────────────────────────────────────── */}
          <View
            style={{
              marginTop: 12,
              borderRadius: 20,
              backgroundColor: tokens.cardBg,
              borderWidth: 1,
              borderColor: tokens.line,
              flexDirection: 'row',
              overflow: 'hidden',
            }}
          >
            {[
              { icon: 'clock',   label: fmtTime(recipe.time_min), sub: 'time'    },
              { icon: 'fire',    label: recipe.difficulty,         sub: 'skill'   },
              { icon: 'people',  label: `${recipe.base_servings}`, sub: 'serves'  },
            ].map((m, i) => (
              <View
                key={m.sub}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  borderLeftWidth: i > 0 ? 1 : 0,
                  borderLeftColor: tokens.line,
                  gap: 2,
                }}
              >
                <Icon name={m.icon} size={15} color={tokens.paprika} />
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: tokens.ink, textTransform: 'capitalize', marginTop: 3 }}>
                  {m.label}
                </Text>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase', color: tokens.muted }}>
                  {m.sub}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Scaling / leftovers ─────────────────────────────────────────── */}
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 20,
              backgroundColor: tokens.cardBg,
              borderWidth: 1,
              borderColor: tokens.line,
            }}
          >
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.muted, marginBottom: 12 }}>
              How many?
            </Text>
            {/* People counter */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontFamily: fonts.displayItalic ?? fonts.display, fontSize: 15, color: tokens.inkSoft }}>
                People tonight
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Pressable
                  onPress={() => setPeople((p) => Math.max(1, p - 1))}
                  accessibilityLabel="Fewer people"
                  style={({ pressed }) => ({
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: pressed ? tokens.lineDark : tokens.line,
                    alignItems: 'center', justifyContent: 'center',
                  })}
                >
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 20, color: tokens.ink }}>−</Text>
                </Pressable>
                <Text style={{ fontFamily: fonts.displayBold, fontSize: 24, color: tokens.ink, width: 28, textAlign: 'center' }}>
                  {people}
                </Text>
                <Pressable
                  onPress={() => setPeople((p) => Math.min(20, p + 1))}
                  accessibilityLabel="More people"
                  style={({ pressed }) => ({
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: pressed ? '#333' : tokens.ink,
                    alignItems: 'center', justifyContent: 'center',
                  })}
                >
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 20, color: '#FDF9F3' }}>+</Text>
                </Pressable>
              </View>
            </View>
            {/* Leftover options — 2-col grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LEFTOVER_OPTIONS.map((lo) => {
                const active = leftoverKey === lo.id;
                return (
                  <Pressable
                    key={lo.id}
                    onPress={() => setLeftoverKey(lo.id as LeftoverModeId)}
                    style={({ pressed }) => ({
                      width: '47%',
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: active
                        ? tokens.paprika
                        : pressed ? tokens.bgDeep : tokens.bg,
                      borderWidth: 1,
                      borderColor: active ? tokens.paprika : tokens.line,
                    })}
                  >
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, lineHeight: 16, color: active ? '#FDF9F3' : tokens.ink }}>
                      {lo.label}
                    </Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 11, marginTop: 3, color: active ? 'rgba(253,249,243,0.8)' : tokens.muted, lineHeight: 15 }}>
                      {lo.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Ingredients ────────────────────────────────────────────────── */}
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 22, color: tokens.ink, marginBottom: 14 }}>
              Ingredients
            </Text>
            {recipe.ingredients.map((ing) => {
              const swap = swaps.get(ing.id);
              const displayName = swap?.swap_name ?? ing.name;
              const scaled = scaleIngredient(ing, scaleFactor);
              const displayAmount = formatAmount(scaled.amount);
              const ticked = ingTicked[ing.id] ?? false;

              return (
                <View
                  key={ing.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 11,
                    borderBottomWidth: 1,
                    borderBottomColor: tokens.line,
                    gap: 10,
                    opacity: ticked ? 0.4 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.sansBold,
                      fontSize: 14,
                      color: tokens.paprika,
                      minWidth: 52,
                      textAlign: 'right',
                    }}
                  >
                    {displayAmount ? `${displayAmount}${scaled.unit ? ' ' + scaled.unit : ''}` : '—'}
                  </Text>
                  <Text style={{ flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: tokens.ink }}>
                    {displayName}
                    {ing.notes ? (
                      <Text style={{ fontFamily: fonts.sans, color: tokens.muted, fontSize: 12 }}>
                        {' '}({ing.notes})
                      </Text>
                    ) : null}
                  </Text>
                  {/* Swap button */}
                  <Pressable
                    onPress={() =>
                      setSwapSheet({
                        ingredientId: ing.id,
                        ingredientName: ing.name,
                        substitutions: ing.substitutions ?? [],
                        activeSwapName: swap?.swap_name,
                      })
                    }
                    style={{
                      padding: 6,
                      opacity: (ing.substitutions?.length ?? 0) > 0 ? 1 : 0.25,
                    }}
                    accessibilityLabel={`Swap ${ing.name}`}
                  >
                    <Icon name="swap-horiz" size={18} color={tokens.ochre} />
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* ── Steps ──────────────────────────────────────────────────────── */}
          <View style={{ marginTop: 28 }}>
            <Text style={{ fontFamily: fonts.displayBold, fontSize: 22, color: tokens.ink, marginBottom: 14 }}>
              Method
            </Text>
            {recipe.steps.map((step, idx) => {
              const done = stepsDone[step.id] ?? false;
              const whyExpanded = expandedWhy[step.id] ?? false;

              return (
                <View
                  key={step.id}
                  style={{
                    marginBottom: 20,
                    padding: 16,
                    borderRadius: 18,
                    backgroundColor: tokens.cardBg,
                    borderWidth: 1,
                    borderColor: done ? tokens.sage + '44' : tokens.line,
                  }}
                >
                  {/* Step photo */}
                  {step.photo_url && (
                    <View style={{ borderRadius: 12, overflow: 'hidden', height: 180, marginBottom: 14 }}>
                      <Image
                        source={{ uri: step.photo_url }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                    </View>
                  )}

                  {/* Step header */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: done ? tokens.sage : tokens.ink,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: '#FDF9F3' }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontFamily: fonts.display, fontSize: 17, lineHeight: 22, color: tokens.ink }}>
                      {step.title}
                    </Text>
                  </View>

                  <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 24, color: tokens.inkSoft, marginLeft: 40 }}>
                    {step.content}
                  </Text>

                  {/* Chef's why note */}
                  {step.why_note && (
                    <Pressable
                      onPress={() => setExpandedWhy((p) => ({ ...p, [step.id]: !p[step.id] }))}
                      style={{ marginTop: 12, marginLeft: 40 }}
                    >
                      <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 0.6, color: tokens.ochre }}>
                        {whyExpanded ? 'Hide chef\'s note ▲' : 'Chef\'s note ▼'}
                      </Text>
                      {whyExpanded && (
                        <Text style={{ fontFamily: fonts.displayItalic ?? fonts.display, fontSize: 13, lineHeight: 20, color: tokens.muted, marginTop: 6 }}>
                          {step.why_note}
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      {swapSheet && (
        <SwapSheet
          ingredientId={swapSheet.ingredientId}
          ingredientName={swapSheet.ingredientName}
          substitutions={swapSheet.substitutions}
          activeSwapName={swapSheet.activeSwapName}
          onApply={async (name, notes) => {
            if (!id) return;
            await setIngredientSwap(db, id, swapSheet.ingredientId, name, notes);
            const updated = await getSwapsForRecipe(db, id);
            setSwaps(updated);
            setSwapSheet(null);
          }}
          onClear={async () => {
            if (!id) return;
            await clearIngredientSwap(db, id, swapSheet.ingredientId);
            const updated = await getSwapsForRecipe(db, id);
            setSwaps(updated);
            setSwapSheet(null);
          }}
          onClose={() => setSwapSheet(null)}
        />
      )}

      {showPlanSheet && recipe && (
        <AddToPlanSheet recipe={recipe} onClose={() => setShowPlanSheet(false)} />
      )}
    </View>
  );
}
