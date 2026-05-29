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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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

import type { Recipe, Ingredient, Substitution } from '../../src/data/types';
import {
  getRecipeById,
  getFavoriteIds,
  toggleFavorite,
  getPlannedRecipeIds,
  togglePlannedRecipe,
  getPantryItems,
  upsertShoppingItem,
} from '../../db/database';
import type { PantryItem } from '../../db/database';
import { tokens, fonts } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { SubstitutionSheet, PILL_CONFIG } from '../../src/components/SubstitutionSheet';
import { ServingsSelector } from '../../src/components/ServingsSelector';
// v7 — pantry-aware data + ingredient icons (build #122 visual anchor)
import {
  scoreRecipeAgainstPantry,
  normalizeForMatch,
  cleanIngredientName,
  categorizeIngredient,
} from '../../src/data/pantry-helpers';
import { FoodIcon, ingredientIconName, categoryIconName } from '../../src/components/PantryIcons';
import {
  formatAmount,
  scaleIngredient,
  leftoverById,
  totalPortionsFor,
  type LeftoverModeId,
} from '../../src/data/scale';

// ── v7 diagnostic ErrorBoundary (build #130) ──────────────────────────────
//
// Catches any render-time error from the recipe screen so a force-close
// becomes a visible error message on screen. Patrick screenshots it; the
// real bug gets fixed in one targeted shot instead of repeated guesses.
//
// This is purely defensive — no behavioural change unless a crash actually
// occurs. Class component because Error Boundaries MUST be class components
// (React API requirement; functional ones can't catch render errors).
class RecipeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Loud console so adb logcat captures it; also reaches the on-screen
    // fallback below so Patrick can screenshot it.
    console.error('[RecipeErrorBoundary] caught render error', error, info?.componentStack);
  }
  reset = () => this.setState({ error: null });
  render() {
    if (this.state.error) {
      return <RecipeErrorFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

function RecipeErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: tokens.primaryInk, marginBottom: 8 }}>
        Recipe screen — render error
      </Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 22, lineHeight: 27, color: tokens.ink, marginBottom: 14 }}>
        Something crashed when this recipe tried to render.
      </Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: tokens.inkSoft, marginBottom: 18 }}>
        Patrick — please screenshot this whole screen and send it. The exact message + stack below is the bug we need.
      </Text>
      <View style={{ padding: 14, borderRadius: 12, backgroundColor: tokens.cream, borderWidth: 1, borderColor: tokens.lineDark, marginBottom: 18 }}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: tokens.primaryInk, marginBottom: 6 }}>
          {error.name || 'Error'}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: tokens.ink, marginBottom: 10 }}>
          {error.message || '(no message)'}
        </Text>
        {error.stack ? (
          <Text style={{ fontFamily: fonts.sans, fontSize: 10, lineHeight: 15, color: tokens.muted }} selectable>
            {error.stack.split('\n').slice(0, 20).join('\n')}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={() => router.back()}
        style={{ marginBottom: 10, borderRadius: 12 }}
        android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: false }}
      >
        <View style={{ paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: tokens.lineDark, alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: tokens.ink }}>← Back</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onReset}
        style={{ borderRadius: 12 }}
        android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: false }}
      >
        <View style={{ paddingVertical: 13, borderRadius: 12, backgroundColor: tokens.primary, alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: tokens.onPrimary }}>Try again</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

export default function RecipeDetailScreen() {
  return (
    <RecipeErrorBoundary>
      <RecipeDetailScreenInner />
    </RecipeErrorBoundary>
  );
}

function RecipeDetailScreenInner() {
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
    if (recipe) {
      // DECISION-014: prefer output_default when the recipe has authored its
      // per-unit count (4 burgers, 1 loaf, 8 tortillas). Falls back to
      // base_servings for recipes that haven't been migrated yet.
      setPeople(recipe.output_default ?? recipe.base_servings);
    }
  }, [recipe]);

  // Reset mise en place when navigating to a different recipe
  useEffect(() => {
    setMiseChecked(new Set());
    setMiseExpanded(false);
    miseExpandOpacity.setValue(0);
  }, [recipe?.id]);

  // Cook mode
  const [cooking, setCooking]       = useState(false);
  // Build #117 — cook mode v2 single-step navigator. The list view stays
  // for browse mode; cook mode renders ONE step at a time and the user
  // advances via the full-width Next pill. Reset to 0 whenever cooking
  // toggles on so a fresh cook session always starts at step 1.
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepsDone, setStepsDone]   = useState<Record<string, boolean>>({});
  const [ingTicked, setIngTicked]   = useState<Record<string, boolean>>({});

  // Substitution sheet state.
  // activeSwaps maps ingredient.id → chosen Substitution (null = restored original).
  const [sheetIngredient, setSheetIngredient] = useState<Ingredient | null>(null);
  const [sheetVisible, setSheetVisible]       = useState(false);
  // Build #115 — debounce against rapid re-open. After the sheet dismisses
  // we capture a timestamp; openSwapSheet refuses to fire if called within
  // 350ms. Defends against any stray tap (residual @gorhom backdrop gesture,
  // misjudged knuckle landing on the Swap pill during dismiss animation,
  // etc.) re-opening the sheet immediately after close.
  const lastSheetCloseMs = useRef<number>(0);

  // Mise en place state — session-only, no persistence (DECISION-008)
  const [miseChecked, setMiseChecked] = useState<Set<number>>(new Set());

  // ── v7 — pantry-aware data wiring (build #129 Commit B) ────────────────────
  // Load the user's pantry once on mount + refresh on screen focus (mirrors the
  // Pantry tab's refetch pattern from build #122). scoreRecipeAgainstPantry
  // gives us N/M + the missing list straight from the existing matcher — no new
  // scoring logic.
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [journeyExpanded, setJourneyExpanded] = useState<null | 'plate'>(null);
  const [shoppingAdded, setShoppingAdded] = useState(false);
  const [miseExpanded, setMiseExpanded] = useState(false);
  const miseExpandOpacity = useRef(new Animated.Value(0)).current;
  const [activeSwaps, setActiveSwaps]         = useState<Record<string, Substitution | null>>({});

  // Wake lock while cooking
  useEffect(() => {
    const tag = 'cook-mode';
    if (cooking) {
      activateKeepAwakeAsync(tag).catch(() => {});
      return () => { deactivateKeepAwake(tag); };
    }
    return undefined;
  }, [cooking]);

  // v7 — load the user's pantry once on mount. Recipe screen re-mounts each
  // time you tap a recipe card so a one-shot load is sufficient; no focus
  // refetch needed because the screen always remounts on entry.
  useEffect(() => {
    let cancelled = false;
    getPantryItems(db)
      .then((items) => { if (!cancelled) setPantryItems(items); })
      .catch((e) => console.error('recipe screen pantry load failed', e));
    return () => { cancelled = true; };
  }, [db]);

  // ── Loading states ──────────────────────────────────────────────────────────

  if (recipe === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tokens.primaryInk} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: tokens.ink, marginBottom: 8 }}>
          Recipe not found
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: tokens.muted, textAlign: 'center', marginBottom: 20 }}>
          It may have been removed or never existed.
        </Text>
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: tokens.primaryDeep, borderless: false }}
          style={{ borderRadius: 999 }}
        >
          <View style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 999,
            backgroundColor: tokens.primary,
          }}>
            <Text style={{ fontFamily: fonts.sansBold, color: tokens.onPrimary, fontSize: 14 }}>
              Back to Kitchen
            </Text>
          </View>
        </Pressable>
      </View>
    );
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const option       = leftoverById(leftoverKey);
  const totalPortions = totalPortionsFor(option, people, recipe.base_servings);
  // True only when every step already has a photo URL.
  // Derived, not persisted — no schema change needed.
  const hasStagePhotos = recipe.steps.every((s) => Boolean(s.photo_url));
  const stepsDoneCount = Object.values(stepsDone).filter(Boolean).length;
  const progress     = cooking ? stepsDoneCount / recipe.steps.length : 0;
  const gradient     = recipe.hero_fallback ?? [tokens.ink, tokens.warmBrown, tokens.bgDeep];

  // DECISION-008 derived display values
  const difficultyLabel = recipe.difficulty
    ? recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)
    : null;
  const cuisineLabel = recipe.categories?.cuisines?.[0]
    ? recipe.categories.cuisines[0].charAt(0).toUpperCase() + recipe.categories.cuisines[0].slice(1)
    : null;
  // Glance row only renders if at least one timing/difficulty field is populated
  const hasGlanceData = !!(recipe.total_time_minutes || recipe.active_time_minutes || difficultyLabel);

  // ── v7 — pantry match (build #129) ─────────────────────────────────────────
  // Reuses the existing scoreRecipeAgainstPantry — same engine the Kitchen tab
  // and pantry carousel use. No new scoring logic.
  const match = useMemo(
    () => scoreRecipeAgainstPantry(recipe, pantryItems),
    [recipe, pantryItems],
  );
  const inPantryNames = useMemo(() => {
    const s = new Set<string>();
    for (const it of pantryItems) {
      if (it.have_it) s.add(normalizeForMatch(it.name));
    }
    return s;
  }, [pantryItems]);
  const ingredientInPantry = useCallback(
    (name: string) => inPantryNames.has(normalizeForMatch(cleanIngredientName(name))),
    [inPantryNames],
  );

  // Kitchen-journey time estimates (read-only): Mise = 5 min default (the
  // mise_en_place items don't carry per-item durations in the current schema);
  // Cook = sum of step timer_seconds; Plate = 3 min default (0 if leftover-only).
  const journeyTimes = useMemo(() => {
    const cookSec = recipe.steps.reduce((acc, s) => acc + (s.timer_seconds ?? 0), 0);
    return {
      miseMin: 5,
      cookMin: Math.max(1, Math.round(cookSec / 60)),
      // ticket said '0 if leftover_mode==tonight' but leftover_mode is an object
      // in the current schema, not a string. 3 min plating is universally honest.
      plateMin: 3,
    };
  }, [recipe.steps]);

  // Cook-mode surface palette. CLAUDE.md: dark, OLED-friendly true blacks.
  // The same surface names are used in both modes so JSX can read `c.X`
  // without branching on `cooking` everywhere.
  //
  // `primary` is the surface fill (progress bar, button bg).
  // `primaryInk` is the same family used as TEXT colour on light cards
  // — deeper in light mode for WCAG AA contrast, lifted in cook mode
  // because the dark card already gives enough separation.
  const c = cooking
    ? {
        screenBg:   tokens.cookMode.screenBg,
        cardBg:     tokens.cookMode.cardBg,
        bgDeep:     tokens.cookMode.bgDeep,
        ink:        tokens.cookMode.ink,
        inkSoft:    tokens.cookMode.inkSoft,
        muted:      tokens.cookMode.muted,
        line:       tokens.cookMode.line,
        lineDark:   tokens.cookMode.lineDark,
        primary:    tokens.cookMode.primary,
        primaryInk: tokens.cookMode.primary,    // already lifted, reads on dark
        sage:       tokens.cookMode.sage,
        ochre:      tokens.cookMode.ochre,
      }
    : {
        screenBg:   tokens.bg,
        cardBg:     tokens.cream,
        bgDeep:     tokens.bgDeep,
        ink:        tokens.ink,
        inkSoft:    tokens.inkSoft,
        muted:      tokens.muted,
        line:       tokens.line,
        lineDark:   tokens.lineDark,
        primary:    tokens.primary,
        primaryInk: tokens.primaryInk,          // deeper for AA on cream
        sage:       tokens.sage,
        ochre:      tokens.ochre,
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
    // Build #117 — reset cook-mode navigator on every toggle. Entering cook
    // mode always starts at step 1; exiting clears it too so the next entry
    // is clean.
    setCurrentStepIdx(0);
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

  // Opens the SubstitutionSheet for the given ingredient.
  // Only called in non-cook mode (in cook mode, tapping ticks the ingredient).
  const openSwapSheet = (ing: Ingredient) => {
    // Build #115 — defensive: refuse to open if the sheet is already
    // visible (duplicate-trigger no-op) and within 350ms of the last
    // dismiss (debounce against stray taps that land on the pill while
    // the dismiss animation is still completing).
    if (sheetVisible) return;
    if (Date.now() - lastSheetCloseMs.current < 350) return;
    Haptics.selectionAsync().catch(() => {});
    setSheetIngredient(ing);
    setSheetVisible(true);
  };

  // Called by SubstitutionSheet on confirm. null = restore original ingredient.
  // Build #115 — also closes the sheet from this single source. Previously
  // SubstitutionSheet.handleConfirm called ref.current.dismiss() directly,
  // racing with the parent's setSheetVisible(false). Now the parent owns
  // dismissal: setSheetVisible(false) here flows through the sheet's
  // useEffect to call ref.current.dismiss(). One source of truth.
  const handleSwap = (sub: Substitution | null) => {
    if (!sheetIngredient) return;
    setActiveSwaps((prev) => ({ ...prev, [sheetIngredient.id]: sub }));
    setSheetVisible(false);
    lastSheetCloseMs.current = Date.now();
  };

  const handleSheetDismiss = () => {
    setSheetVisible(false);
    lastSheetCloseMs.current = Date.now();
    // Keep sheetIngredient set until after dismiss — sheet animates out and
    // still renders its content during the exit animation.
  };

  const toggleMise = (idx: number) => {
    Haptics.selectionAsync().catch(() => {});
    setMiseChecked(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const expandMise = () => {
    setMiseExpanded(true);
    Animated.timing(miseExpandOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
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

  // v7 — add every missing ingredient (per scoreRecipeAgainstPantry) to the
  // shopping list. Uses the existing shopping DB layer; source kind='meal' so
  // the items are attributed to this recipe in the sources_json column.
  const addMissingToShoppingList = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await Promise.all(
        match.missingIngredients.map((mi) => {
          const id = 'shop-' + recipe.id + '-' + normalizeForMatch(mi.name);
          return upsertShoppingItem(db, {
            id,
            name: mi.name,
            category: categorizeIngredient(mi.name),
            quantity: mi.amount > 0 ? mi.amount : null,
            unit: mi.unit ?? null,
            notes: null,
            manually_added: false,
            in_cart: false,
            added_at: Date.now(),
            sources: [{ kind: 'meal', recipe_id: recipe.id, servings: recipe.base_servings }],
          });
        }),
      );
      setShoppingAdded(true);
      setTimeout(() => { setShoppingAdded(false); }, 2500);
    } catch (e) {
      console.error('addMissingToShoppingList failed', e);
    }
  }, [db, recipe, match.missingIngredients]);

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
            {/* Back button — Pressable+View split (REGN session 4 Report 4):
                Android silently drops layout/visual props from function-style
                Pressable.style on some devices. The Pressable is a bare touch
                target with android_ripple; all visual styling lives on the
                inner View with a static style object. */}
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Back"
              android_ripple={{ color: tokens.primaryLight, borderless: true }}
              style={{ borderRadius: 19 }}
            >
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="arrow-left" size={20} color={tokens.ink} />
              </View>
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
            {/* Plan toggle — Pressable+View split for Android layout reliability */}
            <Pressable
              onPress={handleTogglePlan}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={isPlanned ? 'Remove from plan' : 'Add to plan'}
              android_ripple={{ color: tokens.primaryLight, borderless: true }}
              style={{ borderRadius: 19 }}
            >
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isPlanned ? tokens.primaryLight : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name={isPlanned ? 'check' : 'plus'} size={20} color={isPlanned ? tokens.primaryInk : tokens.ink} />
              </View>
            </Pressable>
            {/* Favourite */}
            {/* Favourite — Pressable+View split for Android layout reliability */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                toggleFavorite(db, recipe.id).catch(console.error);
                setFavorite((f) => !f);
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={favorite ? 'Unfavourite' : 'Favourite'}
              android_ripple={{ color: tokens.primaryLight, borderless: true }}
              style={{ borderRadius: 19 }}
            >
              <View style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="heart" size={20} color={favorite ? tokens.primary : tokens.ink} fill={favorite ? tokens.primary : 'none'} />
              </View>
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
              /* v7 no-photo fallback — Fraunces title card over the existing
                 hero_fallback gradient bands. No emoji block; the typography
                 IS the asset. fonts.display now points to Fraunces (build #127). */
              <View style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: gradient[0] }} />
                <View style={{ flex: 1, backgroundColor: gradient[1] }} />
                <View style={{ flex: 1, backgroundColor: gradient[2] }} />
                <Text
                  style={{
                    position: 'absolute', right: 14, bottom: 4,
                    fontFamily: fonts.display, fontSize: 96,
                    color: 'rgba(255,255,255,0.08)',
                  }}
                  numberOfLines={1}
                >
                  {recipe.title.charAt(0)}
                </Text>
                <View style={{ position: 'absolute', left: 20, right: 20, bottom: 32, alignItems: 'flex-start' }}>
                  <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 35, color: '#FFFFFF' }} numberOfLines={3}>
                    {recipe.title}
                  </Text>
                  {recipe.source?.chef ? (
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: tokens.bronze, marginTop: 8 }}>
                      {`Inspired by ${recipe.source.chef}`}
                    </Text>
                  ) : null}
                  {recipe.tagline ? (
                    <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic', fontSize: 14, lineHeight: 19, color: 'rgba(255,255,255,0.88)', marginTop: 6 }} numberOfLines={2}>
                      {recipe.tagline}
                    </Text>
                  ) : null}
                  <View style={{ width: 44, height: 2, borderRadius: 2, backgroundColor: tokens.gold, marginTop: 12 }} />
                </View>
              </View>
            )}
            {/* CC licensing convention — when hero_url is a CC-licensed
                photo (Unsplash/Pexels), surface photographer credit.
                Bottom-right of the hero so it's present without competing
                with the title card below. Small, muted, on a translucent
                scrim so it reads against any image colour. */}
            {recipe.hero_url && recipe.hero_attribution ? (
              <View
                style={{
                  position: 'absolute',
                  right: 10,
                  bottom: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: 'rgba(0,0,0,0.45)',
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.sans,
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.85)',
                    letterSpacing: 0.2,
                  }}
                >
                  {recipe.hero_attribution}
                </Text>
              </View>
            ) : null}
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
                  color: c.primaryInk,
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

            {/* Watch link — Pressable+View split for Android */}
            {recipe.source?.video_url ? (
              <Pressable
                onPress={openSource}
                accessibilityRole="link"
                accessibilityLabel="Watch the original video"
                android_ripple={{ color: tokens.primaryLight, borderless: false }}
                style={{ alignSelf: 'flex-start', borderRadius: 999, marginTop: 14 }}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 7,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                  backgroundColor: 'rgba(232,184,48,0.10)',
                  borderWidth: 1,
                  borderColor: 'rgba(232,184,48,0.28)',
                }}>
                  <Icon name="play" size={10} color={c.primaryInk} fill={c.primaryInk} />
                  <Text style={{
                    fontFamily: fonts.sansBold,
                    fontSize: 12,
                    color: c.primaryInk,
                    letterSpacing: 0.2,
                  }}>
                    Watch the original
                  </Text>
                </View>
              </Pressable>
            ) : null}

            {/* Plan toggle — full width, inside card. Hidden in cook mode
                because you don't plan a meal you're already cooking. */}
            {/* Plan-this-recipe pill — Pressable+View split.
                Border colour stays primaryInk so the unchecked state has
                contrast against the cream card. */}
            {!cooking && (
              <Pressable
                onPress={handleTogglePlan}
                accessibilityRole="button"
                accessibilityLabel={isPlanned ? 'Remove from plan' : 'Add to plan'}
                android_ripple={{
                  color: isPlanned ? tokens.primaryDeep : tokens.primaryLight,
                  borderless: false,
                }}
                style={{ marginTop: 16, borderRadius: 14 }}
              >
                <View style={{
                  paddingVertical: 13,
                  borderRadius: 14,
                  backgroundColor: isPlanned ? tokens.primary : 'transparent',
                  borderWidth: 1.5,
                  borderColor: tokens.primaryInk,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                  <Icon
                    name={isPlanned ? 'check' : 'plus'}
                    size={15}
                    color={isPlanned ? tokens.ink : tokens.primaryInk}
                  />
                  <Text
                    style={{
                      fontFamily: fonts.sansBold,
                      fontSize: 13,
                      letterSpacing: 0.2,
                      color: isPlanned ? tokens.ink : tokens.primaryInk,
                    }}
                  >
                    {isPlanned ? 'In your plan' : 'Plan this recipe'}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>


        {/* ── v7 IN YOUR PANTRY (build #129) ────────────────────────────
            Pantry-aware match card. N/M from scoreRecipeAgainstPantry; the
            missing list and "Add to shopping list" button reuse the same
            engine the Kitchen tab and pantry carousel use. */}
        {!cooking && recipe.ingredients.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
            {/* bronze eyebrow */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <FoodIcon name="cat-pantry" size={14} color={tokens.bronze} />
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: tokens.bronze, flex: 1 }}>
                In your pantry
              </Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: 'rgba(194,161,90,0.15)', borderWidth: 1, borderColor: 'rgba(194,161,90,0.35)' }}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, color: tokens.bronze }}>
                  {match.haveCount}/{match.totalCount}
                </Text>
              </View>
            </View>
            {/* card body */}
            <View
              style={{
                backgroundColor: c.cardBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: c.lineDark,
                padding: 14,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 36, color: tokens.bronze }}>
                  {match.haveCount}<Text style={{ color: tokens.bronze, opacity: 0.4 }}>/{match.totalCount}</Text>
                </Text>
                <View style={{ flex: 1, paddingTop: 2 }}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: c.ink }}>
                    {match.haveCount === match.totalCount ? 'Ready to cook now' :
                     match.haveCount === 0 ? "You don't have any of this yet" :
                     match.haveCount >= match.totalCount - 3 ? "You're nearly there" :
                     "Some of it's already in your pantry"}
                  </Text>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: c.muted, marginTop: 3 }}>
                    {match.missingIngredients.length === 0
                      ? 'Tap Start cooking below'
                      : `${match.missingIngredients.length} ingredient${match.missingIngredients.length === 1 ? '' : 's'} to pick up`}
                  </Text>
                </View>
              </View>
              {match.missingIngredients.length > 0 ? (
                <>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {match.missingIngredients.slice(0, 6).map((mi) => (
                      <View
                        key={mi.name}
                        style={{
                          paddingHorizontal: 9,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: c.bgDeep,
                          borderWidth: 1,
                          borderColor: c.lineDark,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: c.inkSoft }}>
                          {mi.name}
                        </Text>
                      </View>
                    ))}
                    {match.missingIngredients.length > 6 ? (
                      <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: c.bgDeep, borderWidth: 1, borderColor: c.lineDark }}>
                        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: c.muted }}>+{match.missingIngredients.length - 6}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={addMissingToShoppingList}
                    accessibilityRole="button"
                    accessibilityLabel="Add missing ingredients to shopping list"
                    android_ripple={{ color: 'rgba(242,204,42,0.18)', borderless: false }}
                    style={{ borderRadius: 12 }}
                  >
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                      paddingVertical: 11, borderRadius: 12,
                      borderWidth: 1.5, borderColor: 'rgba(242,204,42,0.55)',
                      backgroundColor: 'rgba(242,204,42,0.06)',
                    }}>
                      <Icon name={shoppingAdded ? 'check' : 'cart'} size={14} color={tokens.gold} />
                      <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.gold, letterSpacing: 0.2 }}>
                        {shoppingAdded ? 'Added to shopping list' : 'Add missing to shopping list'}
                      </Text>
                    </View>
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── v7 YOUR KITCHEN JOURNEY (build #129) ──────────────────────────
            Read-only 3-card row: Mise · Cook · Plate. Plate is tap-to-expand
            and carries finishing_note + leftovers_note (Patrick's call —
            fold them into Plate, not separate sections). No Animated. */}
        {!cooking ? (
          <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <FoodIcon name="cat-spice" size={14} color={tokens.bronze} />
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: tokens.bronze }}>
                Your kitchen journey
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([
                { key: 'mise', n: 1, label: 'Mise', time: `${journeyTimes.miseMin} min`, expandable: false },
                { key: 'cook', n: 2, label: 'Cook', time: `${journeyTimes.cookMin} min`, expandable: false },
                { key: 'plate', n: 3, label: 'Plate', time: `${journeyTimes.plateMin} min`, expandable: !!(recipe.finishing_note || recipe.leftovers_note) },
              ] as const).map((card) => (
                <Pressable
                  key={card.key}
                  onPress={() => {
                    if (card.expandable) setJourneyExpanded((prev) => (prev === 'plate' ? null : 'plate'));
                  }}
                  accessibilityRole={card.expandable ? 'button' : undefined}
                  accessibilityLabel={card.expandable ? `${card.label} — tap for finishing and leftovers notes` : undefined}
                  style={{ flex: 1, borderRadius: 12 }}
                >
                  <View style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    backgroundColor: c.cardBg,
                    borderWidth: 1,
                    borderColor: card.expandable && journeyExpanded === 'plate' ? 'rgba(194,161,90,0.55)' : c.lineDark,
                    alignItems: 'center',
                  }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 18, color: tokens.bronze, marginBottom: 2 }}>
                      {card.n}
                    </Text>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 0.6, color: c.ink, marginBottom: 2 }}>
                      {card.label}
                    </Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: c.muted }}>
                      {card.time}
                    </Text>
                    {card.expandable ? (
                      <View style={{ marginTop: 4, transform: [{ rotate: journeyExpanded === 'plate' ? '180deg' : '0deg' }] }}>
                        <Icon name="arrow-down" size={11} color={tokens.bronze} />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
            {journeyExpanded === 'plate' && (recipe.finishing_note || recipe.leftovers_note) ? (
              <View style={{
                marginTop: 8,
                padding: 14,
                borderRadius: 12,
                backgroundColor: tokens.bronzeSoft,
                borderLeftWidth: 3,
                borderLeftColor: tokens.bronze,
                gap: 12,
              }}>
                {recipe.finishing_note ? (
                  <View>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: tokens.bronze, marginBottom: 5 }}>
                      Finishing & tasting
                    </Text>
                    <Text style={{ fontFamily: fonts.displayItalic, fontStyle: 'italic', fontSize: 13, lineHeight: 19, color: c.inkSoft }}>
                      {recipe.finishing_note}
                    </Text>
                  </View>
                ) : null}
                {recipe.leftovers_note ? (
                  <View>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: tokens.bronze, marginBottom: 5 }}>
                      Leftovers
                    </Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: c.inkSoft }}>
                      {recipe.leftovers_note}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ── AT A GLANCE (DECISION-008) ──
            Renders only when the cook has populated timing/difficulty fields.
            Backwards-compatible: old recipes without these fields render nothing. */}
        {!cooking && hasGlanceData && (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <View
              style={{
                backgroundColor: c.cardBg,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: c.lineDark,
                flexDirection: 'row',
                paddingVertical: 14,
              }}
            >
              {([
                recipe.total_time_minutes
                  ? { icon: 'clock' as const, value: String(recipe.total_time_minutes), sub: 'total min' }
                  : null,
                recipe.active_time_minutes
                  ? { icon: 'flame' as const, value: String(recipe.active_time_minutes), sub: 'active min' }
                  : null,
                difficultyLabel
                  ? { icon: 'flame' as const, value: difficultyLabel, sub: 'difficulty' }
                  : null,
                cuisineLabel
                  ? { icon: 'chef' as const, value: cuisineLabel, sub: 'cuisine' }
                  : null,
                { icon: 'check' as const, value: recipe.leftover_mode ? 'yes' : 'no', sub: 'leftovers' },
              ] as const).filter(Boolean).map((item, idx, arr) => (
                <View
                  key={idx}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    borderRightWidth: idx < arr.length - 1 ? 1 : 0,
                    borderRightColor: c.line,
                    paddingHorizontal: 4,
                    gap: 3,
                  }}
                >
                  <Icon name={item!.icon} size={14} color={c.muted} />
                  <Text
                    style={{ fontFamily: fonts.sansBold, fontSize: 12, color: c.ink, textAlign: 'center' }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {item!.value}
                  </Text>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: c.muted, textAlign: 'center' }}>
                    {item!.sub}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stage photos notice — shown once when recipe has no stage photos.
            Hidden in cook mode (no point showing it while actively cooking). */}
        {!cooking && !hasStagePhotos && (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                backgroundColor: tokens.skyLight,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: 'rgba(168,196,208,0.35)',
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Icon name="camera" size={14} color={tokens.skyDeep} style={{ marginTop: 2 }} />
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  lineHeight: 17,
                  color: tokens.inkSoft,
                  flex: 1,
                }}
              >
                Stage-by-stage photos are on the way — we'll photograph this recipe soon.
              </Text>
            </View>
          </View>
        )}

        {/* ── WHAT TO KNOW (DECISION-008) ──
            Rendered from before_you_start[]. Max 3 items per schema.
            Blue left-border: caution/information, not action. */}
        {!cooking && (recipe.before_you_start?.length ?? 0) > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <View
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(91,143,212,0.25)',
                borderLeftWidth: 3,
                borderLeftColor: '#5B8FD4',
                backgroundColor: 'rgba(91,143,212,0.06)',
                paddingTop: 12,
                paddingBottom: 4,
                paddingRight: 14,
                paddingLeft: 14,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 9,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: '#5B8FD4',
                  marginBottom: 8,
                }}
              >
                What to know before you start
              </Text>
              {recipe.before_you_start!.map((note, idx) => (
                <View
                  key={idx}
                  style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}
                >
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: '#5B8FD4',
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <Text style={{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: c.inkSoft, flex: 1 }}>
                    {note}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Servings selector — DECISION-014 per-recipe units. The selector
            falls back to legacy "people / portions" when output_unit is
            absent, so non-launch recipes keep working until cook authors
            their unit data in v1.1+. */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <ServingsSelector
            people={people}
            setPeople={setPeople}
            leftoverKey={leftoverKey}
            setLeftoverKey={setLeftoverKey}
            baseServings={recipe.base_servings}
            outputUnit={recipe.output_unit}
            outputUnitPlural={recipe.output_unit_plural}
            extraForTomorrowLabel={recipe.extra_for_tomorrow_label}
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
              const checked     = !!ingTicked[ing.id];
              const amount      = scaleIngredient(ing, totalPortions, recipe.base_servings);
              const showUnit    = ing.unit && ing.unit !== 'to taste' && ing.unit !== 'as needed';
              const inlineUnit  = ing.unit === 'to taste' || ing.unit === 'as needed';
              const hasSwaps    = (ing.substitutions?.length ?? 0) > 0;
              // Active swap for this ingredient: null means "restored to original",
              // undefined means "no swap ever chosen".
              const activeSwap  = activeSwaps[ing.id];
              const isSwapped   = activeSwap !== undefined && activeSwap !== null;
              const displayName = isSwapped ? (activeSwap as Substitution).ingredient : ing.name;

              // Build #114 — swap trigger is now a dedicated pill on the right
              // of the row, not the whole row. Stops stray taps after
              // sheet-dismiss from re-opening the sheet, and gives a
              // clearly visible swap affordance.
              const activeSwapQuality = activeSwap && (activeSwap as Substitution).quality;
              const pillCfg = activeSwapQuality ? PILL_CONFIG[activeSwapQuality as 'green' | 'yellow' | 'red'] : null;

              return (
                <Pressable
                  key={ing.id}
                  // Only the row itself ticks in cook mode. Out of cook mode
                  // it's inert — the Swap pill on the right is the only
                  // swap trigger.
                  onPress={cooking ? () => tickIngredient(ing.id) : undefined}
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
                          {/* Show active swap name in gold if swapped, original otherwise */}
                          <Text style={isSwapped ? { color: c.primary } : undefined}> {displayName}</Text>
                          {isSwapped && (
                            <Text style={{ fontFamily: fonts.sans, color: c.muted, textDecorationLine: 'line-through' }}>
                              {' '}({ing.name})
                            </Text>
                          )}
                        </>
                      ) : (
                        <>
                          <Text style={isSwapped ? { color: c.primary } : undefined}>{displayName}</Text>
                          {isSwapped && (
                            <Text style={{ fontFamily: fonts.sans, color: c.muted, textDecorationLine: 'line-through' }}>
                              {' '}({ing.name})
                            </Text>
                          )}
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

                  {/* Build #114 — dedicated Swap pill. Replaces the small
                      ↻ icon and the whole-row Pressable. Has its own
                      Pressable so taps to other parts of the row don't
                      open the sheet, and stray taps after sheet-dismiss
                      go nowhere. Pill colour = the active swap's pill
                      colour when one is set; gold-bordered when swap is
                      available but not yet chosen. */}
                  {!cooking && hasSwaps ? (
                    <Pressable
                      onPress={() => openSwapSheet(ing)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isSwapped
                          ? `Change swap on ${ing.name}, currently ${(activeSwap as Substitution).ingredient}`
                          : `Swap ${ing.name}`
                      }
                      hitSlop={6}
                      android_ripple={{ color: tokens.primaryLight, borderless: false }}
                      style={{
                        marginTop: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 9,
                        paddingVertical: 5,
                        borderRadius: 999,
                        backgroundColor: pillCfg ? pillCfg.bg : 'transparent',
                        borderWidth: 1,
                        borderColor: pillCfg ? pillCfg.border : tokens.gold,
                      }}
                    >
                      <Icon
                        name="swap"
                        size={11}
                        color={pillCfg ? pillCfg.fg : tokens.gold}
                      />
                      <Text
                        style={{
                          fontFamily: fonts.sansBold,
                          fontSize: 10,
                          letterSpacing: 0.3,
                          color: pillCfg ? pillCfg.fg : tokens.gold,
                        }}
                      >
                        {isSwapped ? 'Swapped' : 'Swap'}
                      </Text>
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── PLACEHOLDER for recipes with no Equipment AND no Prep ──
            One small honest line where the Equipment/Prep blocks would have
            been. Only renders when BOTH fields are absent — if either is
            populated, that block renders normally and we don't show this.
            Currently this affects only sourdough-maintenance (the starter
            feeder guide, intentionally outside the DECISION-008 schema).
            UI guard against the "looks half-built" state Patrick reported. */}
        {!cooking
          && (recipe.equipment?.length ?? 0) === 0
          && (recipe.mise_en_place?.length ?? 0) === 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <View
              style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 14,
                backgroundColor: 'rgba(170,204,168,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(170,204,168,0.22)',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <Icon name="chef" size={14} color={tokens.sage} style={{ marginTop: 2 }} />
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  lineHeight: 19,
                  color: c.inkSoft,
                }}
              >
                Equipment and prep notes are coming — the chef hasn't written the audit for this recipe yet. Ingredients and method below are complete.
              </Text>
            </View>
          </View>
        )}

        {/* ── EQUIPMENT (DECISION-008) ──
            v2 (2026-05-08, Patrick): vertical flex-wrap pill list, always
            visible. Replaces the previous horizontal ScrollView which (a) hid
            items off-screen, (b) was fragile inside the outer page ScrollView
            on Android (gesture conflict), (c) added a side-scroll affordance
            users had to discover. Vertical wrap shows everything at a glance
            in 2-3 short rows. Schema cap (no formal max) means we wrap
            naturally; recipes with >8 items would still all render — review
            then if any get genuinely long. */}
        {!cooking && (recipe.equipment?.length ?? 0) > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 20,
                color: c.ink,
                marginBottom: 10,
              }}
            >
              Equipment
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {recipe.equipment!.map((item, idx) => (
                <View
                  key={idx}
                  style={{
                    paddingHorizontal: 13,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: 'rgba(232,184,48,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(232,184,48,0.22)',
                  }}
                >
                  <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── PREP (DECISION-008) ──
            UI label is "Prep" (Patrick 7 May 2026) — schema field stays
            mise_en_place to preserve the data contract.
            Tappable checklist from mise_en_place[]. Session-only state.
            Expand pattern: show first 4; chip reveals the rest with 150ms fade.
            Progress counter counts all items including collapsed ones. */}
        {!cooking && (recipe.mise_en_place?.length ?? 0) > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <View
              style={{
                backgroundColor: c.cardBg,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: c.lineDark,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: c.line,
                }}
              >
                <View>
                  {/* UI label: "Prep" (per Patrick 7 May 2026 — friendlier than
                      'Mise en place' for Australian home-cook audience). The
                      schema field stays mise_en_place to preserve the data
                      contract; only the displayed header changes. */}
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 14, color: c.ink }}>
                    Prep
                  </Text>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: c.muted, marginTop: 2 }}>
                    Do this before you heat anything
                  </Text>
                </View>
                <Text
                  style={{ fontFamily: fonts.sansBold, fontSize: 11, color: tokens.ochre }}
                  accessibilityLabel={`${miseChecked.size} of ${recipe.mise_en_place!.length} prep steps done`}
                >
                  {miseChecked.size} / {recipe.mise_en_place!.length} done
                </Text>
              </View>

              {/* Always-visible items (first 4) */}
              {recipe.mise_en_place!.slice(0, 4).map((task, idx) => (
                <MiseItem
                  key={idx}
                  text={task}
                  checked={miseChecked.has(idx)}
                  onToggle={() => toggleMise(idx)}
                  isLast={idx === Math.min(3, recipe.mise_en_place!.length - 1) && recipe.mise_en_place!.length <= 4}
                  lineColor={c.line}
                  inkColor={c.inkSoft}
                />
              ))}

              {/* Expand chip */}
              {recipe.mise_en_place!.length > 4 && !miseExpanded && (
                /* Expand chip — Pressable+View split for Android */
                <Pressable
                  onPress={expandMise}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${recipe.mise_en_place!.length - 4} more prep tasks`}
                  android_ripple={{ color: 'rgba(242,216,150,0.25)', borderless: false }}
                  style={{ margin: 10, borderRadius: 20 }}
                >
                  <View style={{
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: 'rgba(242,216,150,0.09)',
                    borderWidth: 1,
                    borderColor: 'rgba(242,216,150,0.22)',
                    alignItems: 'center',
                  }}>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.ochre }}>
                      Show {recipe.mise_en_place!.length - 4} more prep tasks
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* Expanded items (4+) */}
              {recipe.mise_en_place!.length > 4 && miseExpanded && (
                <Animated.View style={{ opacity: miseExpandOpacity }}>
                  {recipe.mise_en_place!.slice(4).map((task, idx) => (
                    <MiseItem
                      key={idx + 4}
                      text={task}
                      checked={miseChecked.has(idx + 4)}
                      onToggle={() => toggleMise(idx + 4)}
                      isLast={idx + 4 === recipe.mise_en_place!.length - 1}
                      lineColor={c.line}
                      inkColor={c.inkSoft}
                    />
                  ))}
                </Animated.View>
              )}
            </View>
          </View>
        )}


        {/* Method */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <SectionHeader title="Method" hint={cooking ? 'Tap Next to advance' : undefined} inkColor={c.ink} mutedColor={c.muted} />
          {cooking ? (
            // Build #117 — cook mode v2: single-step navigator.
            // Renders the current step only, full-width photo block at top,
            // doneness cue, big timer, why note, and a bottom Next pill.
            // Preserves DECISION-015 step_overrides + "adapted for your swap"
            // cue with sage border treatment.
            (() => {
              const step = recipe.steps[currentStepIdx];
              if (!step) return null;
              const isFinal = currentStepIdx >= recipe.steps.length - 1;
              const nextStep = !isFinal ? recipe.steps[currentStepIdx + 1] : null;
              const prevStep = currentStepIdx > 0 ? recipe.steps[currentStepIdx - 1] : null;
              // step_overrides resolution — most recently active swap wins
              let adaptedContent: string | undefined;
              let adaptedSwapName: string | undefined;
              for (const [, swap] of Object.entries(activeSwaps)) {
                if (!swap) continue;
                const o = swap.step_overrides?.[step.id];
                if (o) { adaptedContent = o; adaptedSwapName = swap.ingredient; }
              }
              const isAdapted = !!adaptedContent;
              const photoUri = step.photo_url ?? recipe.hero_url;
              const bands = recipe.hero_fallback ?? [tokens.bgDeep, tokens.cream, tokens.bgDeep];
              const onNext = () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                if (!stepsDone[step.id]) setStepsDone(prev => ({ ...prev, [step.id]: true }));
                if (isFinal) {
                  // Final step "Done" exits cook mode entirely.
                  setCooking(false);
                  setCurrentStepIdx(0);
                } else {
                  setCurrentStepIdx(currentStepIdx + 1);
                }
              };
              const onBack = () => {
                Haptics.selectionAsync().catch(() => {});
                setCurrentStepIdx(Math.max(0, currentStepIdx - 1));
              };
              return (
                <View>
                  {/* ── PHOTO BLOCK ── */}
                  <View style={{ height: 224, borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
                    {photoUri ? (
                      <Image
                        source={{ uri: photoUri }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={{ flex: 1 }}>
                        <View style={{ flex: 1, backgroundColor: bands[0] }} />
                        <View style={{ flex: 1, backgroundColor: bands[1] }} />
                        <View style={{ flex: 1, backgroundColor: bands[2] }} />
                      </View>
                    )}
                    {/* Top fade */}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 72, backgroundColor: 'rgba(0,0,0,0.55)' }} />
                    {/* Bottom fade */}
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.85)' }} />
                    {/* Progress segments */}
                    <View style={{ position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', gap: 4 }}>
                      {recipe.steps.map((sx, i) => {
                        const pct = i < currentStepIdx ? '100%' : i === currentStepIdx ? '55%' : '0%';
                        return (
                          <View key={sx.id} style={{ flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 2, overflow: 'hidden' }}>
                            <View style={{ width: pct, height: '100%', backgroundColor: tokens.gold }} />
                          </View>
                        );
                      })}
                    </View>
                    {/* Step tag pill (bottom-left) */}
                    <View
                      style={{
                        position: 'absolute', bottom: 14, left: 14,
                        flexDirection: 'row', alignItems: 'center', gap: 5,
                        backgroundColor: 'rgba(0,0,0,0.55)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)',
                        borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5,
                      }}
                    >
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: tokens.gold }} />
                      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, color: 'rgba(245,242,236,0.88)', letterSpacing: 0.3 }}>
                        Step {currentStepIdx + 1} · {recipe.title}
                      </Text>
                    </View>
                    {/* Ghost step number watermark (bottom-right) */}
                    <Text
                      style={{
                        position: 'absolute', right: 16, bottom: -8,
                        fontFamily: fonts.display, fontSize: 64,
                        color: 'rgba(245,242,236,0.08)', letterSpacing: -2,
                      }}
                    >
                      {currentStepIdx + 1}
                    </Text>
                  </View>

                  {/* ── TITLE ── */}
                  <Text
                    style={{
                      fontFamily: fonts.display, fontSize: 24,
                      color: c.ink, lineHeight: 28,
                      marginTop: 18, marginBottom: 11,
                    }}
                  >
                    {step.title}
                  </Text>

                  {/* ── BODY ── */}
                  <Text
                    style={{
                      fontFamily: fonts.sans, fontSize: 14.5,
                      color: 'rgba(245,242,236,0.88)', lineHeight: 24,
                      marginBottom: 14,
                    }}
                  >
                    {adaptedContent ?? step.content}
                  </Text>

                  {/* DECISION-015 — adapted-for-your-swap cue (preserved) */}
                  {isAdapted ? (
                    <View
                      style={{
                        marginBottom: 12, paddingTop: 8,
                        borderTopWidth: 1, borderTopColor: 'rgba(74,124,89,0.25)',
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: c.sage }}>≈</Text>
                      <Text
                        style={{
                          fontFamily: fonts.displayItalic, fontStyle: 'italic',
                          fontSize: 11, color: c.sage,
                        }}
                      >
                        adapted for your {adaptedSwapName} swap
                      </Text>
                    </View>
                  ) : null}

                  {/* ── DONENESS CUE (NEW v2 — from stage_note) ── */}
                  {step.stage_note ? (
                    <View
                      style={{
                        marginBottom: 12,
                        borderLeftWidth: 3, borderLeftColor: tokens.gold,
                        borderRightWidth: 1, borderTopWidth: 1, borderBottomWidth: 1,
                        borderRightColor: 'rgba(242,204,42,0.35)',
                        borderTopColor: 'rgba(242,204,42,0.35)',
                        borderBottomColor: 'rgba(242,204,42,0.35)',
                        backgroundColor: 'rgba(242,204,42,0.13)',
                        borderTopRightRadius: 10, borderBottomRightRadius: 10,
                        paddingVertical: 10, paddingHorizontal: 13,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.sansBold, fontSize: 9,
                          letterSpacing: 0.7, textTransform: 'uppercase',
                          color: tokens.gold, marginBottom: 4,
                        }}
                      >
                        Look for this
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.displayItalic, fontStyle: 'italic',
                          fontSize: 12.5, color: 'rgba(242,204,42,0.82)', lineHeight: 18,
                        }}
                      >
                        {step.stage_note}
                      </Text>
                    </View>
                  ) : null}

                  {/* ── TIMER (NEW v2 — 38sp Playfair) ── */}
                  {step.timer_seconds ? (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginBottom: 14 }}>
                      <Text
                        style={{
                          fontFamily: fonts.display, fontSize: 38,
                          color: c.ink, letterSpacing: -1, lineHeight: 40,
                        }}
                      >
                        {formatTimer(step.timer_seconds)}
                      </Text>
                      <Text style={{ fontSize: 11, color: c.muted, marginBottom: 6 }}>
                        rough timer
                      </Text>
                    </View>
                  ) : null}

                  {/* ── WHY NOTE (preserved, restyled to Playfair italic) ── */}
                  {step.why_note ? (
                    <View
                      style={{
                        paddingTop: 12,
                        borderTopWidth: 1, borderTopColor: c.line,
                        marginBottom: 14,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.displayItalic, fontStyle: 'italic',
                          fontSize: 12, color: c.muted, lineHeight: 19,
                        }}
                      >
                        {step.why_note}
                      </Text>
                    </View>
                  ) : null}

                  {/* ── BOTTOM ACTION ── */}
                  <View style={{ marginTop: 8, gap: 10 }}>
                    <Pressable
                      onPress={onNext}
                      android_ripple={{
                        color: isFinal ? 'rgba(74,124,89,0.45)' : tokens.primaryDeep,
                        borderless: false,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={isFinal ? 'Finish cooking' : `Next step: ${nextStep?.title ?? ''}`}
                      style={{
                        backgroundColor: isFinal ? c.sage : tokens.primary,
                        borderRadius: 18,
                        paddingVertical: 16, paddingHorizontal: 22,
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: fonts.sansBold, fontSize: 15,
                            color: '#FFFFFF', letterSpacing: 0.2,
                          }}
                        >
                          {isFinal ? 'Done — finish cooking' : 'Next step'}
                        </Text>
                        {!isFinal && nextStep ? (
                          <Text
                            style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 }}
                            numberOfLines={1}
                          >
                            {nextStep.title}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={{ fontSize: 22, color: 'rgba(255,255,255,0.85)', marginLeft: 8 }}>›</Text>
                    </Pressable>

                    {/* Ghost back link */}
                    {prevStep ? (
                      <Pressable
                        onPress={onBack}
                        accessibilityRole="button"
                        accessibilityLabel={`Back to: ${prevStep.title}`}
                        style={{ paddingVertical: 8 }}
                      >
                        <Text
                          style={{
                            textAlign: 'center', fontSize: 12,
                            color: 'rgba(245,242,236,0.42)', letterSpacing: 0.2,
                          }}
                        >
                          ‹  {prevStep.title}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })()
          ) : (
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

              // DECISION-015 — step_overrides resolution.
              // Walk active swaps; the LAST one with an override for this
              // step id wins (Object.entries preserves insertion order for
              // string keys, so the most-recently-activated swap takes the
              // step). Designer's spec calls for sage border on the step
              // card + a single "adapted for your X swap" cue below.
              let adaptedContent: string | undefined;
              let adaptedSwapName: string | undefined;
              for (const [ingId, swap] of Object.entries(activeSwaps)) {
                if (!swap) continue;
                const override = swap.step_overrides?.[step.id];
                if (override) {
                  adaptedContent = override;
                  adaptedSwapName = swap.ingredient;
                  // No break — keep walking so a later swap can win.
                  // Defensive guardrail: if step_overrides references an
                  // unknown step id, the lookup just misses and falls
                  // through. The startup validator catches the bad mapping.
                }
                void ingId;
              }
              const isAdapted = !!adaptedContent;
              // Cook mode: knuckle-tap-to-advance. The whole card is a
              // forgiving tap target that toggles step-done. The inner
              // badge Pressable still works for precise taps. Outside
              // cook mode the outer Pressable is disabled so non-cook
              // taps don't accidentally tick.
              return (
                <Pressable
                  key={step.id}
                  onPress={() => {
                    if (cooking) {
                      tickStep(step.id);
                    } else {
                      // v7 (#129): browse-mode tap → enter cook mode at this
                      // step. Lightweight haptic so the affordance is felt.
                      Haptics.selectionAsync().catch(() => {});
                      setCurrentStepIdx(idx);
                      setCooking(true);
                    }
                  }}
                  android_ripple={{ color: 'rgba(255,255,255,0.06)', borderless: false }}
                  accessibilityRole="button"
                  accessibilityLabel={cooking ? `${done ? 'Unmark' : 'Mark'} step ${idx + 1} ${done ? 'undone' : 'done'}: ${step.title}` : `Cook from step ${idx + 1}: ${step.title}`}
                  style={{
                    backgroundColor: c.cardBg,
                    borderRadius: 18,
                    borderWidth: 1,
                    // DECISION-015 — adapted step card uses sage border for
                    // at-a-glance signalling per Designer's v2 spec.
                    borderColor: isAdapted ? 'rgba(74,124,89,0.4)' : c.lineDark,
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
                        {adaptedContent ?? step.content}
                      </Text>

                      {/* DECISION-015 — "adapted for your swap" cue with sage
                          divider. Only renders when a swap has authored an
                          override for THIS step id. */}
                      {isAdapted ? (
                        <View
                          style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(74,124,89,0.25)',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Text style={{ fontSize: 11, color: c.sage }}>≈</Text>
                          <Text
                            style={{
                              fontFamily: fonts.displayItalic,
                              fontStyle: 'italic',
                              fontSize: 11,
                              color: c.sage,
                            }}
                          >
                            adapted for your {adaptedSwapName} swap
                          </Text>
                        </View>
                      ) : null}

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

                      {/* Step photo — render image if available, placeholder if not.
                          Shows in both browse and cook mode so users can see how
                          the dish should look at each stage. */}
                      {step.photo_url ? (
                        <View style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', height: 160 }}>
                          <Image
                            source={{ uri: step.photo_url }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                            transition={200}
                          />
                        </View>
                      ) : (
                        <View
                          style={{
                            marginTop: 12,
                            height: 100,
                            borderRadius: 12,
                            borderWidth: 1.5,
                            borderStyle: 'dashed',
                            borderColor: c.lineDark,
                            backgroundColor: c.bgDeep,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <Icon name="camera" size={18} color={c.muted} />
                          <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: c.muted }}>
                            Photo coming soon
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
          )}

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

      {/* SubstitutionSheet — rendered outside ScrollView so it can overlay it.
          BottomSheetModal portals above all content via @gorhom/portal. */}
      <SubstitutionSheet
        ingredient={sheetIngredient}
        visible={sheetVisible}
        activeSwapName={
          sheetIngredient && activeSwaps[sheetIngredient.id]
            ? (activeSwaps[sheetIngredient.id] as Substitution).ingredient
            : undefined
        }
        inCookMode={cooking}
        onSwap={handleSwap}
        onDismiss={handleSheetDismiss}
      />
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


/**
 * MiseItem — single tappable Prep checklist row.
 *
 * Pressable+View split (REGN session 4 Report 4): Android silently drops
 * borderRadius / backgroundColor / borderColor properties from a function-style
 * Pressable.style on some devices. The Pressable is a bare touch target with
 * android_ripple; all visual styling lives on the inner View with a static
 * style object. borderWidth uses integer 2 (not 1.5) — non-integer borders
 * also rendered inconsistently on Android in earlier sessions.
 */
function MiseItem({
  text,
  checked,
  onToggle,
  isLast,
  lineColor,
  inkColor,
}: {
  text: string;
  checked: boolean;
  onToggle: () => void;
  isLast: boolean;
  lineColor: string;
  inkColor: string;
}) 
{
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={text}
      accessibilityState={{ checked }}
      android_ripple={{ color: 'rgba(242,216,150,0.18)', borderless: false }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 13,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: lineColor,
          backgroundColor: 'transparent',
          opacity: checked ? 0.5 : 1,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: checked ? tokens.ochre : lineColor,
            backgroundColor: checked ? 'rgba(242,216,150,0.15)' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 1,
          }}
        >
          {checked && <Icon name="check" size={10} color={tokens.ochre} />}
        </View>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 13,
            lineHeight: 19,
            color: inkColor,
            flex: 1,
            textDecorationLine: checked ? 'line-through' : 'none',
          }}
        >
          {text}
        </Text>
      </View>
    </Pressable>
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
