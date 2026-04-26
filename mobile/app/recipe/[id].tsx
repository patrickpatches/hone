/**
 * Recipe Detail — the stage-1 cooking screen.
 *
 * v2 changes (BUG-001 fix + pastel-retro design):
 *   - CircleButton now uses fully opaque backgrounds — no more rgba that
 *     disappears over light hero images. Each button has a distinct solid
 *     colour: white for back, sky for calendar, white/rose for heart.
 *   - "Start cooking" CTA uses the new peach token (warmer, lighter than
 *     the old paprika red).
 *   - Step number circles use ink by default, peach for the current/active
 *     step in cook mode, sage when done.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  Linking,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from 'expo-keep-awake';
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

  useEffect(() => {
    const tag = 'cook-mode';
    if (cooking) {
      activateKeepAwakeAsync(tag).catch(() => {});
      return () => { deactivateKeepAwake(tag); };
    }
    return undefined;
  }, [cooking]);

  if (recipe === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.peach} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>🤔</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: tokens.ink, marginBottom: 8 }}>
          Recipe not found
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: tokens.muted, textAlign: 'center', marginBottom: 20 }}>
          It was probably removed or never existed.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            paddingHorizontal: 20, paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: pressed ? tokens.peachDeep : tokens.peach,
          })}
        >
          <Text style={{ fontFamily: fonts.sansBold, color: '#fff', fontSize: 13 }}>Back to Kitchen</Text>
        </Pressable>
      </View>
    );
  }

  const option = leftoverById(leftoverKey);
  const totalPortions = totalPortionsFor(option, people, recipe.base_servings);
  const stepsDoneCount = Object.values(stepsDone).filter(Boolean).length;
  const progress = cooking ? stepsDoneCount / recipe.steps.length : 0;

  const toggleCooking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setCooking((c) => !c);
    if (cooking) {
      setStepsDone({});
      setIngTicked({});
    }
  };

  const tickStep = (stepId: string) => {
    if (!cooking) return;
    Haptics.selectionAsync().catch(() => {});
    setStepsDone((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const tickIngredient = (ingId: string) => {
    if (!cooking) return;
    Haptics.selectionAsync().catch(() => {});
    setIngTicked((prev) => ({ ...prev, [ingId]: !prev[ingId] }));
  };

  const openSource = () => {
    const url = recipe.source?.video_url;
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('Could not open link', url));
  };

  const gradient = recipe.hero_fallback ?? ['#3D342C', '#8B7968', '#D9CEBB'];
  const attribution = recipe.generated_by_claude
    ? 'Invented from your pantry'
    : recipe.source
      ? `Inspired by ${recipe.source.chef}`
      : recipe.user_added
        ? 'Your own recipe'
        : '';

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Cook-mode header bar */}
      {cooking ? (
        <View style={{ paddingTop: insets.top, backgroundColor: tokens.ink }}>
          <View style={{
            paddingHorizontal: 16, paddingVertical: 12,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Text style={{
              fontFamily: fonts.sansBold, fontSize: 11,
              letterSpacing: 1.5, color: tokens.cream, textTransform: 'uppercase',
            }}>
              <Text style={{ color: tokens.ochre }}>Cooking</Text>
              {' · '}{stepsDoneCount} of {recipe.steps.length} steps
            </Text>
            <Pressable onPress={toggleCooking} accessibilityRole="button" accessibilityLabel="End cooking session" hitSlop={8}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: tokens.ochre }}>End session</Text>
            </Pressable>
          </View>
          <View style={{ height: 3, backgroundColor: tokens.inkSoft }}>
            <View style={{ height: 3, width: `${progress * 100}%`, backgroundColor: tokens.peach }} />
          </View>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Hero — only in browse mode */}
        {!cooking ? (
          <View style={{ position: 'relative', height: 280 }}>
            {recipe.hero_url ? (
              <Image
                source={{ uri: recipe.hero_url }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={250}
              />
            ) : (
              <View style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: gradient[0] }} />
                <View style={{ flex: 1, backgroundColor: gradient[1] }} />
                <View style={{ flex: 1, backgroundColor: gradient[2] }} />
                {recipe.emoji ? (
                  <Text style={{ position: 'absolute', bottom: 20, right: 20, fontSize: 72, opacity: 0.92 }}>
                    {recipe.emoji}
                  </Text>
                ) : null}
              </View>
            )}

            {/* ── Top bar — BUG-001 FIX: fully opaque buttons, no rgba ── */}
            <View style={{
              position: 'absolute',
              top: insets.top + 10,
              left: 14,
              right: 14,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              {/* Back — white pill, always readable */}
              <CircleButton
                accessibilityLabel="Back"
                onPress={() => router.back()}
                icon="arrow-left"
                bg="#FFFFFF"
                iconColor={tokens.ink}
              />

              {/* Right cluster — calendar + heart */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <CircleButton
                  accessibilityLabel="Add to meal plan"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setShowPlanSheet(true);
                  }}
                  icon="calendar"
                  bg={tokens.sky}
                  iconColor="#FFFFFF"
                />
                <CircleButton
                  accessibilityLabel={favorite ? 'Unfavourite' : 'Favourite'}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    toggleFavorite(db, recipe.id).catch(console.error);
                    setFavorite((f) => !f);
                  }}
                  icon="heart"
                  bg={favorite ? tokens.rose : '#FFFFFF'}
                  iconColor={favorite ? '#FFFFFF' : tokens.inkSoft}
                  iconFill={favorite ? '#FFFFFF' : 'none'}
                />
              </View>
            </View>
          </View>
        ) : null}

        {/* Title card */}
        <View style={{ paddingHorizontal: 20, marginTop: cooking ? 16 : -28 }}>
          <View style={{
            backgroundColor: tokens.cream,
            borderRadius: 24, padding: 20,
            borderWidth: 1, borderColor: tokens.line,
          }}>
            {attribution ? (
              <Text style={{
                fontFamily: fonts.sansBold, fontSize: 10,
                letterSpacing: 2, textTransform: 'uppercase',
                color: tokens.peach, marginBottom: 6,
              }}>
                {attribution}
              </Text>
            ) : null}
            <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: tokens.ink }}>
              {recipe.title}
            </Text>
            <Text style={{
              fontFamily: fonts.displayItalic, fontStyle: 'italic',
              fontSize: 15, lineHeight: 20, color: tokens.inkSoft, marginTop: 6,
            }}>
              {recipe.tagline}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <MetaPill icon="clock" label={`${recipe.time_min} min`} />
              <MetaPill icon="flame" label={recipe.difficulty} />
            </View>

            {recipe.description ? (
              <View style={{ backgroundColor: tokens.bgDeep, borderRadius: 14, padding: 12, marginTop: 14 }}>
                <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: tokens.inkSoft }}>
                  <Text style={{ fontFamily: fonts.sansBold, color: tokens.ink }}>A note: </Text>
                  {recipe.description}
                </Text>
              </View>
            ) : null}

            {recipe.source?.video_url ? (
              <Pressable
                onPress={openSource}
                accessibilityRole="link"
                accessibilityLabel={`Watch the original from ${recipe.source.chef}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}
              >
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.peach }}>
                  Watch the original
                </Text>
                <Icon name="external" size={12} color={tokens.peach} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Servings selector */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <ServingsSelector
            people={people}
            setPeople={setPeople}
            leftoverKey={leftoverKey}
            setLeftoverKey={setLeftoverKey}
            baseServings={recipe.base_servings}
          />
        </View>

        {/* Ingredients */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeader title="Ingredients" hint={cooking ? 'Tap to tick off' : undefined} />
          <View style={{
            backgroundColor: tokens.cream,
            borderRadius: 18, borderWidth: 1, borderColor: tokens.line,
            overflow: 'hidden',
          }}>
            {recipe.ingredients.map((ing, idx) => {
              const checked = !!ingTicked[ing.id];
              const amount = scaleIngredient(ing, totalPortions, recipe.base_servings);
              const showUnit = ing.unit && ing.unit !== 'to taste' && ing.unit !== 'as needed';
              const inlineUnit = ing.unit === 'to taste' || ing.unit === 'as needed';
              const activeSwap = swaps.get(ing.id);
              const displayName = activeSwap ? activeSwap.swap_name : ing.name;
              const hasSubs = (ing.substitutions?.length ?? 0) > 0;
              return (
                <View
                  key={ing.id}
                  style={{
                    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                    paddingHorizontal: 14, paddingVertical: 12,
                    borderBottomWidth: idx < recipe.ingredients.length - 1 ? 1 : 0,
                    borderBottomColor: tokens.line,
                    backgroundColor: activeSwap ? 'rgba(78,138,101,0.06)' : 'transparent',
                  }}
                >
                  {cooking ? (
                    <Pressable
                      onPress={() => tickIngredient(ing.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      style={{
                        width: 24, height: 24, borderRadius: 6,
                        borderWidth: 1.5,
                        borderColor: checked ? tokens.sage : tokens.muted,
                        backgroundColor: checked ? tokens.sage : 'transparent',
                        alignItems: 'center', justifyContent: 'center', marginTop: 2,
                      }}
                    >
                      {checked ? <Icon name="check" size={14} color="#fff" /> : null}
                    </Pressable>
                  ) : null}

                  <Pressable
                    style={{ flex: 1 }}
                    onPress={() => tickIngredient(ing.id)}
                    disabled={!cooking}
                    accessibilityRole={cooking ? 'checkbox' : 'text'}
                    accessibilityState={cooking ? { checked } : undefined}
                  >
                    <Text style={{
                      fontFamily: fonts.sans, fontSize: 14, lineHeight: 20,
                      color: checked ? tokens.muted : activeSwap ? tokens.sage : tokens.ink,
                      textDecorationLine: checked ? 'line-through' : 'none',
                    }}>
                      {!inlineUnit ? (
                        <>
                          <Text style={{
                            fontFamily: fonts.sansBold,
                            fontVariant: ['tabular-nums'],
                            color: checked ? tokens.muted : activeSwap ? tokens.sage : tokens.ink,
                          }}>
                            {formatAmount(amount)}
                          </Text>
                          {showUnit ? <Text style={{ fontFamily: fonts.sansBold }}> {ing.unit}</Text> : null}
                          <Text> {displayName}</Text>
                        </>
                      ) : (
                        <>
                          <Text>{displayName}</Text>
                          <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic', color: tokens.muted }}>
                            {' — '}{ing.unit}
                          </Text>
                        </>
                      )}
                    </Text>
                    {activeSwap && (
                      <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted, marginTop: 1 }}>
                        instead of {ing.name}
                        {activeSwap.quantity_note ? ` · ${activeSwap.quantity_note}` : ''}
                      </Text>
                    )}
                    {!activeSwap && ing.prep ? (
                      <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted, marginTop: 2 }}>
                        {ing.prep}
                      </Text>
                    ) : null}
                  </Pressable>

                  {/* Swap button */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setSwapSheet({
                        ingredientId: ing.id,
                        ingredientName: ing.name,
                        substitutions: ing.substitutions ?? [],
                        activeSwapName: activeSwap?.swap_name,
                      });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Swap ${ing.name}`}
                    hitSlop={8}
                    style={{
                      width: 30, height: 30, borderRadius: 15,
                      backgroundColor: activeSwap ? tokens.sage : tokens.bgDeep,
                      alignItems: 'center', justifyContent: 'center',
                      marginTop: 2,
                      opacity: hasSubs || activeSwap ? 1 : 0.28,
                    }}
                  >
                    <Icon name="swap" size={14} color={activeSwap ? '#fff' : tokens.ink} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Method */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeader title="Method" hint={cooking ? 'Tap the number to mark done' : undefined} />
          <View style={{ gap: 12 }}>
            {recipe.steps.map((step, idx) => {
              const done = !!stepsDone[step.id];
              return (
                <View
                  key={step.id}
                  style={{
                    backgroundColor: tokens.cream,
                    borderRadius: 18, borderWidth: 1, borderColor: tokens.line,
                    overflow: 'hidden',
                    opacity: done ? 0.55 : 1,
                  }}
                >
                  {step.photo_url ? (
                    <Image
                      source={{ uri: step.photo_url }}
                      style={{ width: '100%', height: 200 }}
                      contentFit="cover"
                      transition={200}
                      accessibilityLabel={`Photo for step ${idx + 1}: ${step.title}`}
                    />
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
                    <Pressable
                      onPress={() => tickStep(step.id)}
                      disabled={!cooking}
                      accessibilityRole={cooking ? 'button' : 'text'}
                      accessibilityLabel={
                        cooking
                          ? done ? `Step ${idx + 1} done — tap to undo` : `Mark step ${idx + 1} done`
                          : `Step ${idx + 1}`
                      }
                      style={{
                        width: 34, height: 34, borderRadius: 17,
                        backgroundColor: done ? tokens.sage : tokens.peach,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {done ? (
                        <Icon name="check" size={15} color="#fff" />
                      ) : (
                        <Text style={{ fontFamily: fonts.display, fontSize: 16, color: '#fff' }}>
                          {idx + 1}
                        </Text>
                      )}
                    </Pressable>

                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontFamily: fonts.sansBold, fontSize: 15,
                        color: tokens.ink,
                        textDecorationLine: done ? 'line-through' : 'none',
                        marginBottom: 4,
                      }}>
                        {step.title}
                      </Text>
                      <Text style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: tokens.inkSoft }}>
                        {step.content}
                      </Text>

                      {step.stage_note ? <Callout label="Look for" tone="peach" italic text={step.stage_note} /> : null}
                      {step.why_note   ? <Callout label="Why"      tone="sage"  text={step.why_note}   /> : null}
                      {step.lookahead  ? <Callout label="Heads-up" tone="butter" text={step.lookahead}  /> : null}

                      {recipe.ingredients
                        .filter((ing) => {
                          const swap = swaps.get(ing.id);
                          if (!swap) return false;
                          const hay = [step.content, step.title, step.stage_note ?? ''].join(' ').toLowerCase();
                          return hay.includes(ing.name.toLowerCase()) || hay.includes(swap.swap_name.toLowerCase());
                        })
                        .map((ing) => {
                          const swap = swaps.get(ing.id)!;
                          return (
                            <Callout
                              key={ing.id}
                              label="Using a swap"
                              tone="butter"
                              text={`${swap.swap_name} instead of ${ing.name}${swap.quantity_note ? ` — ${swap.quantity_note}` : ''}`}
                            />
                          );
                        })}

                      {step.timer_seconds && cooking ? (
                        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Icon name="clock" size={12} color={tokens.muted} />
                          <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted }}>
                            Rough timer: {formatTimer(step.timer_seconds)}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {recipe.leftover_mode ? (
            <View style={{ marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: tokens.butterLight }}>
              <Text style={{
                fontFamily: fonts.sansBold, fontSize: 10,
                letterSpacing: 1.5, textTransform: 'uppercase',
                color: tokens.butter, marginBottom: 4,
              }}>
                Designed for leftovers
              </Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: tokens.inkSoft }}>
                {recipe.leftover_mode.note}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Swap sheet */}
      {swapSheet && (
        <SwapSheet
          visible
          ingredientName={swapSheet.ingredientName}
          substitutions={swapSheet.substitutions}
          activeSwapName={swapSheet.activeSwapName}
          onClose={() => setSwapSheet(null)}
          onSelect={async (sub) => {
            const ingId = swapSheet.ingredientId;
            const recipeId = id ?? '';
            const originalName = swapSheet.ingredientName;
            if (sub === null) {
              await clearIngredientSwap(db, recipeId, ingId).catch(console.error);
            } else {
              await setIngredientSwap(db, recipeId, ingId, originalName, sub.ingredient, sub.quantity_note ?? undefined).catch(console.error);
            }
            const updated = await getSwapsForRecipe(db, recipeId).catch(() => new Map<string, SwapRecord>());
            setSwaps(updated);
            setSwapSheet(null);
          }}
        />
      )}

      <AddToPlanSheet
        visible={showPlanSheet}
        recipeId={recipe.id}
        recipeTitle={recipe.title}
        defaultServings={people}
        onClose={() => setShowPlanSheet(false)}
      />

      {/* Sticky CTA */}
      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        paddingHorizontal: 20, paddingTop: 12,
        paddingBottom: insets.bottom + 14,
        backgroundColor: 'rgba(253,250,243,0.97)',
        borderTopWidth: 1, borderTopColor: tokens.line,
      }}>
        {!cooking ? (
          <Pressable
            onPress={toggleCooking}
            accessibilityRole="button"
            accessibilityLabel="Start cooking"
            style={({ pressed }) => ({
              paddingVertical: 16, borderRadius: 999,
              backgroundColor: pressed ? tokens.peachDeep : tokens.peach,
              alignItems: 'center', flexDirection: 'row',
              justifyContent: 'center', gap: 8,
            })}
          >
            <Icon name="chef" size={18} color="#fff" />
            <Text style={{ fontFamily: fonts.sansXBold, fontSize: 15, color: '#fff', letterSpacing: 0.3 }}>
              Start cooking
            </Text>
          </Pressable>
        ) : progress === 1 ? (
          <Pressable
            onPress={toggleCooking}
            accessibilityRole="button"
            accessibilityLabel="Finish cooking session"
            style={({ pressed }) => ({
              paddingVertical: 16, borderRadius: 999,
              backgroundColor: pressed ? tokens.sageDeep : tokens.sage,
              alignItems: 'center', flexDirection: 'row',
              justifyContent: 'center', gap: 8,
            })}
          >
            <Icon name="check" size={18} color="#fff" />
            <Text style={{ fontFamily: fonts.sansXBold, fontSize: 15, color: '#fff' }}>
              Done — eat well
            </Text>
          </Pressable>
        ) : (
          <View style={{ paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted, textAlign: 'center' }}>
              Screen stays on while you cook. Tap the step number to tick it off.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * CircleButton — BUG-001 fix.
 * Takes explicit `bg` + `iconColor` props so each button in the hero top-bar
 * can have its own fully-opaque colour rather than relying on rgba that fails
 * against lighter hero images.
 */
function CircleButton({
  onPress,
  icon,
  accessibilityLabel,
  bg,
  iconColor,
  iconFill,
}: {
  onPress: () => void;
  icon: React.ComponentProps<typeof Icon>['name'];
  accessibilityLabel: string;
  bg: string;
  iconColor?: string;
  iconFill?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      style={({ pressed }) => ({
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: bg,
        opacity: pressed ? 0.85 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.20,
        shadowRadius: 6,
        elevation: 4,
      })}
    >
      <Icon name={icon} size={18} color={iconColor ?? tokens.ink} fill={iconFill ?? 'none'} />
    </Pressable>
  );
}

function MetaPill({ icon, label }: { icon: React.ComponentProps<typeof Icon>['name']; label: string }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: tokens.bgDeep,
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 999,
    }}>
      <Icon name={icon} size={13} color={tokens.inkSoft} />
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.inkSoft }}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 22, color: tokens.ink }}>{title}</Text>
      {hint ? (
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted }}>{hint}</Text>
      ) : null}
    </View>
  );
}

function Callout({ label, text, tone, italic }: { label: string; text: string; tone: 'peach' | 'sage' | 'butter'; italic?: boolean }) {
  const accent = tone === 'peach' ? tokens.peach : tone === 'sage' ? tokens.sage : tokens.butter;
  const bg     = tone === 'peach' ? tokens.peachLight : tone === 'sage' ? tokens.sageLight : tokens.butterLight;
  return (
    <View style={{ marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: bg }}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: accent, marginBottom: 3 }}>
        {label}
      </Text>
      <Text style={{
        fontFamily: italic ? fonts.displayItalic : fonts.sans,
        fontStyle: italic ? 'italic' : 'normal',
        fontSize: 13, lineHeight: 18, color: tokens.inkSoft,
      }}>
        {text}
      </Text>
    </View>
  );
}

function formatTimer(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h} h` : `${h} h ${rem} min`;
}
