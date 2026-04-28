/**
 * Recipe Detail — the full recipe view with cook mode.
 *
 * BUG-001 FIX: Sticky header is a separate View ABOVE the ScrollView,
 * not inside it. This prevents the header floating over the hero.
 *
 * BUG-002 FIX: scrollView has keyboardShouldPersistTaps handled.
 *
 * Studio Kitchen palette throughout. Plan toggle is a simple
 * bookmark-style button — no calendar, no date picker.
 */
import React, { useEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';

import type { Recipe } from '../../src/data/types';
import {
  getRecipeById,
  getFavoriteIds,
  toggleFavorite,
  getPlannedRecipeIds,
  togglePlannedRecipe,
} from '../../db/database';
import { tokens, fonts } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { ServingsSelector } from '../../src/components/ServingsSelector';
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

  const [recipe, setRecipe]     = useState<Recipe | null | undefined>(undefined);
  const [favorite, setFavorite] = useState(false);
  const [isPlanned, setIsPlanned] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [r, favs, planned] = await Promise.all([
        getRecipeById(db, id ?? ''),
        getFavoriteIds(db),
        getPlannedRecipeIds(db),
      ]);
      if (!cancelled) {
        setRecipe(r);
        setFavorite(favs.has(id ?? ''));
        setIsPlanned(planned.has(id ?? ''));
      }
    }
    load().catch(console.error);
    return () => { cancelled = true; };
  }, [db, id]);

  // Sync default servings once recipe loads
  const [people, setPeople]         = useState<number>(2);
  const [leftoverKey, setLeftoverKey] = useState<LeftoverModeId>('tonight');

  useEffect(() => {
    if (recipe) setPeople(recipe.base_servings);
  }, [recipe]);

  // Cook mode
  const [cooking, setCooking]       = useState(false);
  const [stepsDone, setStepsDone]   = useState<Record<string, boolean>>({});
  const [ingTicked, setIngTicked]   = useState<Record<string, boolean>>({});

  // Wake lock while cooking
  useEffect(() => {
    const tag = 'cook-mode';
    if (cooking) {
      activateKeepAwakeAsync(tag).catch(() => {});
      return () => { deactivateKeepAwake(tag); };
    }
    return undefined;
  }, [cooking]);

  // ── Loading states ──────────────────────────────────────────────────────────

  if (recipe === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.primary} />
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
          It may have been removed or never existed.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: pressed ? tokens.primaryDeep : tokens.primary,
          })}
        >
          <Text style={{ fontFamily: fonts.sansBold, color: tokens.ink, fontSize: 14 }}>
            Back to Kitchen
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const option       = leftoverById(leftoverKey);
  const totalPortions = totalPortionsFor(option, people, recipe.base_servings);
  const stepsDoneCount = Object.values(stepsDone).filter(Boolean).length;
  const progress     = cooking ? stepsDoneCount / recipe.steps.length : 0;
  const gradient     = recipe.hero_fallback ?? [tokens.ink, tokens.warmBrown, tokens.bgDeep];

  // Cook-mode surface palette. CLAUDE.md: dark, OLED-friendly true blacks.
  // The same surface names are used in both modes so JSX can read `c.X`
  // without branching on `cooking` everywhere.
  const c = cooking
    ? {
        screenBg: tokens.cookMode.screenBg,
        cardBg:   tokens.cookMode.cardBg,
        bgDeep:   tokens.cookMode.bgDeep,
        ink:      tokens.cookMode.ink,
        inkSoft:  tokens.cookMode.inkSoft,
        muted:    tokens.cookMode.muted,
        line:     tokens.cookMode.line,
        lineDark: tokens.cookMode.lineDark,
        primary:  tokens.cookMode.primary,
        sage:     tokens.cookMode.sage,
        ochre:    tokens.cookMode.ochre,
      }
    : {
        screenBg: tokens.bg,
        cardBg:   tokens.cream,
        bgDeep:   tokens.bgDeep,
        ink:      tokens.ink,
        inkSoft:  tokens.inkSoft,
        muted:    tokens.muted,
        line:     tokens.line,
        lineDark: tokens.lineDark,
        primary:  tokens.primary,
        sage:     tokens.sage,
        ochre:    tokens.ochre,
      };
  const attribution  = recipe.generated_by_claude
    ? 'Invented from your pantry'
    : recipe.source
      ? `Inspired by ${recipe.source.chef}`
      : recipe.user_added
        ? 'Your recipe'
        : '';

  // ── Handlers ────────────────────────────────────────────────────────────────

  const toggleCooking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setCooking((c) => !c);
    if (cooking) { setStepsDone({}); setIngTicked({}); }
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

  const handleTogglePlan = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const nowPlanned = await togglePlannedRecipe(db, recipe.id, recipe.base_servings);
    setIsPlanned(nowPlanned);
  };

  const openSource = () => {
    const url = recipe.source?.video_url;
    if (!url) return;
    Linking.openURL(url).catch(() => { Alert.alert('Could not open link', url); });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: c.screenBg }}>

      {/* ── STICKY HEADER (above ScrollView, not inside it) ── */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: cooking ? tokens.cookMode.screenBg : tokens.bg,
          borderBottomWidth: cooking ? 0 : 1,
          borderBottomColor: tokens.line,
        }}
      >
        {cooking ? (
          /* Cook mode bar */
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.5, color: c.ink, textTransform: 'uppercase' }}>
                <Text style={{ color: c.ochre }}>Cooking</Text> · {stepsDoneCount}/{recipe.steps.length} steps
              </Text>
              <Pressable onPress={toggleCooking} hitSlop={8}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: c.ochre }}>End session</Text>
              </Pressable>
            </View>
            {/* Progress bar */}
            <View style={{ height: 3, backgroundColor: c.lineDark, borderRadius: 2 }}>
              <View
                style={{
                  height: 3,
                  width: `${progress * 100}%`,
                  backgroundColor: c.primary,
                  borderRadius: 2,
                }}
              />
            </View>
          </View>
        ) : (
          /* Normal back bar */
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: pressed ? tokens.bgDeep : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Icon name="arrow-left" size={20} color={tokens.ink} />
            </Pressable>
            <Text
              style={{
                flex: 1,
                fontFamily: fonts.display,
                fontSize: 16,
                color: tokens.ink,
              }}
              numberOfLines={1}
            >
              {recipe.title}
            </Text>
            {/* Plan toggle */}
            <Pressable
              onPress={handleTogglePlan}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={isPlanned ? 'Remove from plan' : 'Add to plan'}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isPlanned ? tokens.sageLight : (pressed ? tokens.bgDeep : 'transparent'),
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Icon name={isPlanned ? 'check' : 'plus'} size={20} color={isPlanned ? tokens.sage : tokens.ink} />
            </Pressable>
            {/* Favourite */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                toggleFavorite(db, recipe.id).catch(console.error);
                setFavorite((f) => !f);
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={favorite ? 'Unfavourite' : 'Favourite'}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: pressed ? tokens.bgDeep : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Icon name="heart" size={20} color={favorite ? tokens.primary : tokens.ink} fill={favorite ? tokens.primary : 'none'} />
            </Pressable>
          </View>
        )}
      </View>

      {/* ── SCROLLABLE CONTENT ── */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero — hidden in cook mode */}
        {!cooking && (
          <View style={{ height: 260 }}>
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
                  <Text style={{ position: 'absolute', bottom: 20, right: 20, fontSize: 72, opacity: 0.9 }}>
                    {recipe.emoji}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        )}

        {/* Title card */}
        <View style={{ paddingHorizontal: 20, marginTop: cooking ? 16 : -24 }}>
          <View
            style={{
              backgroundColor: c.cardBg,
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: c.lineDark,
              shadowColor: tokens.ink,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.07,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            {attribution ? (
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: c.primary,
                  marginBottom: 6,
                }}
              >
                {attribution}
              </Text>
            ) : null}

            <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 33, color: c.ink }}>
              {recipe.title}
            </Text>
            <Text
              style={{
                fontFamily: fonts.displayItalic,
                fontStyle: 'italic',
                fontSize: 15,
                lineHeight: 20,
                color: c.inkSoft,
                marginTop: 6,
              }}
            >
              {recipe.tagline}
            </Text>

            {/* Meta row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 14 }}>
              <MetaPill icon="clock" label={`${recipe.time_min} min`} color={c.inkSoft} />
              <MetaPill icon="flame" label={recipe.difficulty} color={c.inkSoft} />
            </View>

            {/* Description */}
            {recipe.description ? (
              <View
                style={{
                  backgroundColor: c.bgDeep,
                  borderRadius: 14,
                  padding: 12,
                  marginTop: 14,
                }}
              >
                <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: c.inkSoft }}>
                  <Text style={{ fontFamily: fonts.sansBold, color: c.ink }}>A note: </Text>
                  {recipe.description}
                </Text>
              </View>
            ) : null}

            {/* Watch link */}
            {recipe.source?.video_url ? (
              <Pressable
                onPress={openSource}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}
              >
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: c.primary }}>
                  Watch the original
                </Text>
                <Icon name="external" size={12} color={c.primary} />
              </Pressable>
            ) : null}

            {/* Plan toggle — full width, inside card. Hidden in cook mode
                because you don't plan a meal you're already cooking. */}
            {!cooking && (
              <Pressable
                onPress={handleTogglePlan}
                accessibilityRole="button"
                accessibilityLabel={isPlanned ? 'Remove from plan' : 'Add to plan'}
                style={({ pressed }) => ({
                  marginTop: 16,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: isPlanned
                    ? (pressed ? tokens.sageDeep : tokens.sage)
                    : (pressed ? tokens.primaryLight : 'transparent'),
                  borderWidth: 1.5,
                  borderColor: isPlanned ? tokens.sage : tokens.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                })}
              >
                <Icon
                  name={isPlanned ? 'check' : 'plus'}
                  size={16}
                  color={isPlanned ? tokens.ink : tokens.primary}
                />
                <Text
                  style={{
                    fontFamily: fonts.sansBold,
                    fontSize: 13,
                    color: isPlanned ? tokens.ink : tokens.primary,
                  }}
                >
                  {isPlanned ? 'In your plan ✓' : '+ Plan this recipe'}
                </Text>
              </Pressable>
            )}
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
          <SectionHeader title="Ingredients" hint={cooking ? 'Tap to tick off' : undefined} inkColor={c.ink} mutedColor={c.muted} />
          <View
            style={{
              backgroundColor: c.cardBg,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: c.lineDark,
              overflow: 'hidden',
              shadowColor: tokens.ink,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {recipe.ingredients.map((ing, idx) => {
              const checked    = !!ingTicked[ing.id];
              const amount     = scaleIngredient(ing, totalPortions, recipe.base_servings);
              const showUnit   = ing.unit && ing.unit !== 'to taste' && ing.unit !== 'as needed';
              const inlineUnit = ing.unit === 'to taste' || ing.unit === 'as needed';
              return (
                <Pressable
                  key={ing.id}
                  onPress={() => tickIngredient(ing.id)}
                  disabled={!cooking}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    borderBottomWidth: idx < recipe.ingredients.length - 1 ? 1 : 0,
                    borderBottomColor: c.line,
                  }}
                >
                  {cooking ? (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 7,
                        borderWidth: 1.5,
                        borderColor: checked ? c.sage : c.muted,
                        backgroundColor: checked ? c.sage : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 2,
                      }}
                    >
                      {checked && <Icon name="check" size={13} color={tokens.ink} />}
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.sans,
                        fontSize: 14,
                        lineHeight: 20,
                        color: checked ? c.muted : c.ink,
                        textDecorationLine: checked ? 'line-through' : 'none',
                      }}
                    >
                      {!inlineUnit ? (
                        <>
                          <Text style={{ fontFamily: fonts.sansBold, fontVariant: ['tabular-nums'], color: checked ? c.muted : c.ink }}>
                            {formatAmount(amount)}
                          </Text>
                          {showUnit ? <Text style={{ fontFamily: fonts.sansBold }}> {ing.unit}</Text> : null}
                          <Text> {ing.name}</Text>
                        </>
                      ) : (
                        <>
                          <Text>{ing.name}</Text>
                          <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic', color: c.muted }}>
                            {' — '}{ing.unit}
                          </Text>
                        </>
                      )}
                    </Text>
                    {ing.prep ? (
                      <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: c.muted, marginTop: 2 }}>
                        {ing.prep}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Method */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeader title="Method" hint={cooking ? 'Tap the number to mark done' : undefined} inkColor={c.ink} mutedColor={c.muted} />
          <View style={{ gap: 12 }}>
            {recipe.steps.map((step, idx) => {
              const done = !!stepsDone[step.id];
              // Step number badge: when cooking, the unticked badge sits on
              // the dark card so it needs to invert (cream-on-dark instead
              // of dark-on-cream). Done badge stays sage with dark ink text
              // (sage is now light fern in the new pastel palette).
              const numBadgeBg = done ? c.sage : (cooking ? c.cardBg : tokens.ink);
              const numBadgeFg = done ? tokens.ink : (cooking ? c.ink : '#FFF');
              const numBadgeBorder = cooking && !done ? c.lineDark : 'transparent';
              return (
                <View
                  key={step.id}
                  style={{
                    backgroundColor: c.cardBg,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: c.lineDark,
                    padding: 16,
                    opacity: done ? 0.55 : 1,
                    shadowColor: tokens.ink,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                      onPress={() => tickStep(step.id)}
                      disabled={!cooking}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: numBadgeBg,
                        borderWidth: numBadgeBorder === 'transparent' ? 0 : 1.5,
                        borderColor: numBadgeBorder,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {done ? (
                        <Icon name="check" size={15} color={tokens.ink} />
                      ) : (
                        <Text style={{ fontFamily: fonts.display, fontSize: 16, color: numBadgeFg }}>
                          {idx + 1}
                        </Text>
                      )}
                    </Pressable>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: fonts.sansBold,
                          fontSize: 15,
                          color: c.ink,
                          textDecorationLine: done ? 'line-through' : 'none',
                          marginBottom: 5,
                        }}
                      >
                        {step.title}
                      </Text>
                      <Text style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: c.inkSoft }}>
                        {step.content}
                      </Text>

                      {step.stage_note ? (
                        <Callout label="Look for" accent={c.primary} bg={c.bgDeep} bodyColor={c.inkSoft} italic text={step.stage_note} />
                      ) : null}
                      {step.why_note ? (
                        <Callout label="Why" accent={c.sage} bg={c.bgDeep} bodyColor={c.inkSoft} text={step.why_note} />
                      ) : null}
                      {step.lookahead ? (
                        <Callout label="Heads-up" accent={c.ochre} bg={c.bgDeep} bodyColor={c.inkSoft} text={step.lookahead} />
                      ) : null}

                      {step.timer_seconds && cooking ? (
                        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Icon name="clock" size={12} color={c.muted} />
                          <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: c.muted }}>
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

          {/* Leftover note */}
          {recipe.leftover_mode ? (
            <View
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 14,
                backgroundColor: c.bgDeep,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: c.ochre,
                  marginBottom: 4,
                }}
              >
                Designed for leftovers
              </Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: c.inkSoft }}>
                {recipe.leftover_mode.note}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* ── FLOATING START-COOKING PILL ──
          Solid paprika-tint pill, centered horizontally near the bottom.
          Stays put while the recipe scrolls (ScrollView already pads
          bottom 140 so content clears it).

          Structure note: the Pressable is a bare tap target with no
          layout/visual styling — all of that lives on an inner View.
          On Android, Pressable + function-style + layout properties
          (flexDirection, backgroundColor) sometimes renders without
          the background. Splitting the roles makes the bg reliable
          and lets android_ripple handle press feedback. */}
      {!cooking ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: insets.bottom + 18,
            alignItems: 'center',
            pointerEvents: 'box-none',
          }}
        >
          <Pressable
            onPress={toggleCooking}
            accessibilityRole="button"
            accessibilityLabel="Start cooking"
            android_ripple={{ color: 'rgba(255,255,255,0.22)', borderless: false }}
            style={{ borderRadius: 999 }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 999,
                backgroundColor: tokens.primary,
                shadowColor: tokens.ink,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.22,
                shadowRadius: 14,
                elevation: 8,
              }}
            >
              <Icon name="chef" size={18} color={tokens.ink} />
              <Text
                style={{
                  fontFamily: fonts.sansXBold,
                  fontSize: 15,
                  color: tokens.ink,
                  letterSpacing: 0.3,
                }}
              >
                Start Cooking
              </Text>
            </View>
          </Pressable>
        </View>
      ) : progress === 1 ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: insets.bottom + 18,
            alignItems: 'center',
            pointerEvents: 'box-none',
          }}
        >
          <Pressable
            onPress={toggleCooking}
            accessibilityRole="button"
            accessibilityLabel="Finish cooking"
            android_ripple={{ color: 'rgba(255,255,255,0.22)', borderless: false }}
            style={{ borderRadius: 999 }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 16,
                paddingHorizontal: 32,
                borderRadius: 999,
                backgroundColor: tokens.sage,
                shadowColor: tokens.ink,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.22,
                shadowRadius: 14,
                elevation: 8,
              }}
            >
              <Icon name="check" size={18} color={tokens.ink} />
              <Text
                style={{
                  fontFamily: fonts.sansXBold,
                  fontSize: 15,
                  color: tokens.ink,
                  letterSpacing: 0.3,
                }}
              >
                Done — eat well
              </Text>
            </View>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

// ── Small pieces ──────────────────────────────────────────────────────────────

function MetaPill({
  icon,
  label,
  color = tokens.inkSoft,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  color?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={14} color={color} />
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color }}>
        {label}
      </Text>
    </View>
  );
}

function SectionHeader({
  title,
  hint,
  inkColor = tokens.ink,
  mutedColor = tokens.muted,
}: {
  title: string;
  hint?: string;
  inkColor?: string;
  mutedColor?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <Text style={{ fontFamily: fonts.display, fontSize: 22, color: inkColor }}>
        {title}
      </Text>
      {hint ? (
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: mutedColor }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function Callout({
  label,
  text,
  accent,
  italic,
  bg = tokens.bgDeep,
  bodyColor = tokens.inkSoft,
}: {
  label: string;
  text: string;
  accent: string;
  italic?: boolean;
  bg?: string;
  bodyColor?: string;
}) {
  return (
    <View
      style={{
        marginTop: 10,
        padding: 10,
        borderRadius: 12,
        backgroundColor: bg,
        borderLeftWidth: 3,
        borderLeftColor: accent,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.sansBold,
          fontSize: 9,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: accent,
          marginBottom: 3,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: italic ? fonts.displayItalic : fonts.sans,
          fontStyle: italic ? 'italic' : 'normal',
          fontSize: 13,
          lineHeight: 18,
          color: bodyColor,
        }}
      >
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
