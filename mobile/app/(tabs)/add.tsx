/**
 * Add Recipe — autocomplete-driven entry, three phases.
 *
 * Replaces the paste-only form (session 13) with an autocomplete picker
 * backed by CANONICAL_INGREDIENTS. Type "flour" → suggests "Plain flour"
 * pre-filled with the most-common amount + unit from the existing corpus.
 * Custom-add stays as a fallback.
 *
 * Design grounded in `docs/add-recipe-research.md`:
 *   - Recognition over recall (Anderson, Nielsen) — autocomplete eliminates
 *     ~80% of typing
 *   - Smart defaults (Krug) — amount + unit pre-filled to most common
 *   - Single column (Penzo) — never side-by-side
 *   - Inline validation (Wroblewski) — green tick / red hint per field
 *   - Recognition over recall x2 — yield mode auto-detects from name
 *   - Paste-mode kept for the "I have a screenshot" workflow (Phase 2 disclosure)
 *
 * v1 deliberately ships WITHOUT:
 *   - Auto-save draft (Ovsiankina) — earmarked for v1.0.1
 *   - Drag-to-reorder ingredients/steps — earmarked for v1.2
 *   - Photo OCR / web import — earmarked for v1.2
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';

import { tokens, fonts } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
import { insertRecipe } from '../../db/database';
import type { Recipe, Ingredient, Step } from '../../src/data/types';
import {
  CANONICAL_INGREDIENTS,
  type CanonicalIngredient,
} from '../../src/data/canonical-ingredients';

type YieldMode = 'serves' | 'makes' | 'one';

type DraftIngredient = {
  key: string;
  canonical?: string;
  name: string;
  amount: string;
  unit: string;
};

const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

function inferDifficulty(timeMin: number, stepCount: number): 'Easy' | 'Intermediate' | 'Involved' {
  if (timeMin <= 30 && stepCount <= 5) return 'Easy';
  if (timeMin >= 90 || stepCount >= 10) return 'Involved';
  return 'Intermediate';
}

// Yield-mode auto-detection from recipe name. Keywords lifted from observed
// patterns in the existing corpus + general baking vocabulary.
function inferYieldMode(name: string): { mode: YieldMode; amount: string; unit: string } {
  const n = name.toLowerCase();
  // Yield-by-piece nouns
  for (const [kw, unit, amt] of [
    ['tortilla', 'tortilla', '8'],
    ['cookie', 'cookie', '24'],
    ['biscuit', 'biscuit', '12'],
    ['dumpling', 'dumpling', '20'],
    ['samosa', 'samosa', '12'],
    ['bao', 'bao', '8'],
    ['scone', 'scone', '12'],
    ['muffin', 'muffin', '12'],
    ['bun', 'bun', '8'],
  ] as const) {
    if (n.includes(kw)) return { mode: 'makes', amount: amt, unit };
  }
  // Yield-of-one nouns
  for (const kw of ['loaf', 'sourdough', 'focaccia', 'cake', 'pavlova', 'pie', 'tart', 'roast', 'whole chicken']) {
    if (n.includes(kw)) return { mode: 'one', amount: '1', unit: '' };
  }
  return { mode: 'serves', amount: '4', unit: '' };
}

// Score a canonical ingredient against a query — multi-tier matching.
function scoreCanonical(c: CanonicalIngredient, q: string): number {
  if (!q) return c.recipe_count; // empty query: rank by frequency
  const qLow = q.toLowerCase();
  const nLow = c.name.toLowerCase();
  const cLow = c.canonical.toLowerCase();
  if (nLow === qLow || cLow === qLow) return 1000;          // exact
  if (nLow.startsWith(qLow) || cLow.startsWith(qLow)) return 500; // prefix
  // Token-start match
  for (const tok of nLow.split(' ')) {
    if (tok.startsWith(qLow)) return 200;
  }
  // Alias prefix
  for (const a of c.aliases) {
    if (a.startsWith(qLow)) return 150;
  }
  // Substring
  if (nLow.includes(qLow) || cLow.includes(qLow)) return 50;
  return 0;
}

export default function AddTab() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);

  // Phase 1 — what
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('');
  const [timeMin, setTimeMin] = useState('');
  const [yieldMode, setYieldMode] = useState<YieldMode>('serves');
  const [yieldAmount, setYieldAmount] = useState('4');
  const [yieldUnit, setYieldUnit] = useState('');
  const [yieldOverridden, setYieldOverridden] = useState(false);

  // Phase 2 — ingredients
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);
  const [ingQuery, setIngQuery] = useState('');
  const [showPasteMode, setShowPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Phase 3 — method
  const [methodText, setMethodText] = useState('');

  // ── Smart yield-mode auto-detect ──────────────────────────────────────────
  // When user types the title, infer yield mode unless they've manually overridden.
  const handleTitleChange = (s: string) => {
    setTitle(s);
    if (!yieldOverridden && s.trim().length >= 4) {
      const inferred = inferYieldMode(s);
      setYieldMode(inferred.mode);
      setYieldAmount(inferred.amount);
      if (inferred.mode === 'makes') setYieldUnit(inferred.unit);
    }
  };

  // ── Autocomplete suggestions ──────────────────────────────────────────────
  const suggestions = useMemo<CanonicalIngredient[]>(() => {
    const used = new Set(ingredients.map((i) => i.canonical).filter(Boolean) as string[]);
    const pool = CANONICAL_INGREDIENTS.filter((c) => !used.has(c.canonical));
    const scored = pool
      .map((c) => ({ c, s: scoreCanonical(c, ingQuery) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || b.c.recipe_count - a.c.recipe_count)
      .slice(0, 5);
    return scored.map((x) => x.c);
  }, [ingQuery, ingredients]);

  // Show empty-state suggestions when query is empty (top staples)
  const emptyStateSuggestions = useMemo<CanonicalIngredient[]>(() => {
    const used = new Set(ingredients.map((i) => i.canonical).filter(Boolean) as string[]);
    return CANONICAL_INGREDIENTS
      .filter((c) => !used.has(c.canonical))
      .slice(0, 5);
  }, [ingredients]);

  const addCanonical = (c: CanonicalIngredient) => {
    Haptics.selectionAsync().catch(() => {});
    setIngredients((prev) => [
      ...prev,
      {
        key: uid(),
        canonical: c.canonical,
        name: c.name,
        amount: c.default_amount > 0 ? String(c.default_amount) : '',
        unit: c.default_unit,
      },
    ]);
    setIngQuery('');
  };

  const addCustom = (rawName: string) => {
    const name = rawName.trim();
    if (!name) return;
    Haptics.selectionAsync().catch(() => {});
    setIngredients((prev) => [
      ...prev,
      { key: uid(), name, amount: '', unit: '' },
    ]);
    setIngQuery('');
  };

  const removeIng = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIngredients((prev) => prev.filter((i) => i.key !== key));
  };

  const updateIng = (key: string, field: 'amount' | 'unit' | 'name', value: string) => {
    setIngredients((prev) => prev.map((i) => (i.key === key ? { ...i, [field]: value } : i)));
  };

  // Paste mode → parse block of text into ingredient rows in one shot
  const handlePasteParse = () => {
    const lines = pasteText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsed: DraftIngredient[] = [];
    for (const line of lines) {
      const m = line.match(/^(\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*([a-zA-Z]{1,5})?\s+(.+)$/);
      if (m) {
        const amountStr = m[1].replace(/\s+/g, '');
        let amount = 0;
        if (amountStr.includes('/')) {
          const [a, b] = amountStr.split('/').map(Number);
          amount = b ? a / b : a;
        } else {
          amount = parseFloat(amountStr);
        }
        const restName = m[3].trim();
        // Try to match against canonical
        const canon = CANONICAL_INGREDIENTS.find(
          (c) => c.name.toLowerCase() === restName.toLowerCase() ||
                 c.canonical === restName.toLowerCase() ||
                 c.aliases.some((a) => a === restName.toLowerCase()),
        );
        parsed.push({
          key: uid(),
          canonical: canon?.canonical,
          name: canon?.name ?? restName,
          amount: String(isNaN(amount) ? 0 : amount),
          unit: m[2] ?? '',
        });
      } else {
        parsed.push({ key: uid(), name: line, amount: '', unit: '' });
      }
    }
    setIngredients((prev) => [...prev, ...parsed]);
    setPasteText('');
    setShowPasteMode(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  // Method preview — shows what the parser will produce on save
  const methodPreview = useMemo<string[]>(() => {
    const c = methodText.trim();
    if (!c) return [];
    const numbered = c.split(/\n(?=\s*\d+[.\)]\s)/);
    let blocks: string[];
    if (numbered.length > 1) {
      blocks = numbered.map((b) => b.replace(/^\s*\d+[.\)]\s*/, '').trim());
    } else {
      blocks = c.split(/\n\s*\n/).map((b) => b.trim());
    }
    return blocks.filter(Boolean).map((b) => {
      const first = b.split(/[.!?]/)[0] ?? b;
      const titleWords = first.trim().split(/\s+/).slice(0, 6).join(' ');
      return titleWords.charAt(0).toUpperCase() + titleWords.slice(1);
    });
  }, [methodText]);

  // ── Validation state for the Save CTA ─────────────────────────────────────
  const titleValid = title.trim().length > 0;
  const timeValid = !!parseInt(timeMin, 10) && parseInt(timeMin, 10) > 0;
  const ingredientsValid = ingredients.length > 0;
  const methodValid = methodPreview.length > 0;
  const allValid = titleValid && timeValid && ingredientsValid && methodValid;

  const handleSave = async () => {
    if (!allValid) {
      Alert.alert('Almost there', 'Add a name, time, at least one ingredient, and a method.');
      return;
    }

    let baseServings = 4;
    let yieldUnitFinal: string | undefined;
    let fixedYield: boolean | undefined;
    if (yieldMode === 'one') {
      baseServings = 1;
      fixedYield = true;
    } else {
      const n = parseInt(yieldAmount, 10) || 1;
      baseServings = Math.max(1, n);
      if (yieldMode === 'makes') {
        yieldUnitFinal = yieldUnit.trim() || undefined;
      }
    }

    const recipeId = 'user-' + uid();
    const ings: Ingredient[] = ingredients.map((i, idx) => ({
      id: `${recipeId}-ing-${idx}`,
      name: i.name.trim(),
      amount: parseFloat(i.amount) || 0,
      unit: i.unit.trim(),
      scales: 'linear',
    }));

    const steps: Step[] = methodPreview.map((titleStr, idx) => {
      // Map preview titles back to source blocks
      const c = methodText.trim();
      const numbered = c.split(/\n(?=\s*\d+[.\)]\s)/);
      let blocks: string[];
      if (numbered.length > 1) {
        blocks = numbered.map((b) => b.replace(/^\s*\d+[.\)]\s*/, '').trim());
      } else {
        blocks = c.split(/\n\s*\n/).map((b) => b.trim());
      }
      const content = blocks[idx] ?? '';
      return {
        id: `${recipeId}-step-${idx}`,
        title: titleStr || `Step ${idx + 1}`,
        content,
      };
    });

    const recipe: Recipe = {
      id: recipeId,
      title: title.trim(),
      tagline: title.trim(),
      base_servings: baseServings,
      yield_unit: yieldUnitFinal,
      fixed_yield: fixedYield,
      time_min: parseInt(timeMin, 10),
      difficulty: inferDifficulty(parseInt(timeMin, 10), steps.length),
      tags: [],
      user_added: true,
      generated_by_claude: false,
      emoji: emoji.trim() || undefined,
      ingredients: ings,
      steps,
    };

    try {
      setSaving(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await insertRecipe(db, recipe);
      router.replace(`/recipe/${recipeId}`);
    } catch (e) {
      setSaving(false);
      Alert.alert('Save failed', String(e));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingHorizontal: 20,
          paddingBottom: 200,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={kicker}>Your recipe</Text>
        <Text style={hero}>Add a recipe</Text>

        {/* ── Phase 1: WHAT ────────────────────────────────────────────── */}
        <PhaseHeader num={1} label="What are you making?" />

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Field>Recipe name</Field>
            <Input
              value={title}
              onChangeText={handleTitleChange}
              placeholder="Mum's lamb roast"
              autoCapitalize="words"
              maxLength={80}
            />
            {title.trim().length > 0 && <ValidationTick />}
          </View>
          <View style={{ width: 70 }}>
            <Field>Emoji</Field>
            <Input
              value={emoji}
              onChangeText={setEmoji}
              placeholder="🍽"
              maxLength={2}
              style={{ textAlign: 'center', fontSize: 22 }}
            />
          </View>
        </View>

        <Field>How long does it take?</Field>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Input
            value={timeMin}
            onChangeText={setTimeMin}
            placeholder="45"
            keyboardType="number-pad"
            maxLength={4}
            style={{ width: 100 }}
          />
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: tokens.muted }}>minutes</Text>
          {timeValid && <ValidationTick />}
        </View>

        <Field>Yield</Field>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
          {(['serves', 'makes', 'one'] as YieldMode[]).map((m) => {
            const active = yieldMode === m;
            const label = m === 'serves' ? 'Serves people' : m === 'makes' ? 'Makes pieces' : 'Makes one';
            return (
              <Pressable
                key={m}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setYieldMode(m);
                  setYieldOverridden(true);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: active ? tokens.ink : pressed ? tokens.bgDeep : tokens.cream,
                  borderWidth: 1,
                  borderColor: active ? tokens.ink : tokens.line,
                })}
              >
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: active ? tokens.cream : tokens.inkSoft }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {yieldMode !== 'one' && (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <View style={{ width: 90 }}>
              <Input
                value={yieldAmount}
                onChangeText={(s) => { setYieldAmount(s); setYieldOverridden(true); }}
                placeholder={yieldMode === 'serves' ? '4' : '12'}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            {yieldMode === 'makes' && (
              <View style={{ flex: 1 }}>
                <Input
                  value={yieldUnit}
                  onChangeText={(s) => { setYieldUnit(s); setYieldOverridden(true); }}
                  placeholder="tortillas, cookies, dumplings…"
                  autoCapitalize="none"
                  maxLength={30}
                />
              </View>
            )}
          </View>
        )}

        {/* ── Phase 2: INGREDIENTS — autocomplete ─────────────────────── */}
        <PhaseHeader num={2} label={`Ingredients · ${ingredients.length} added`} />

        {/* Selected ingredients */}
        <View style={{ gap: 8, marginBottom: 12 }}>
          {ingredients.map((i) => (
            <SelectedIngredientRow
              key={i.key}
              ing={i}
              onUpdate={(field, val) => updateIng(i.key, field, val)}
              onRemove={() => removeIng(i.key)}
            />
          ))}
        </View>

        {/* Autocomplete search input */}
        <View
          style={{
            backgroundColor: tokens.cream,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: tokens.line,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 11,
              gap: 10,
            }}
          >
            <Icon name="search" size={15} color={tokens.muted} />
            <TextInput
              value={ingQuery}
              onChangeText={setIngQuery}
              placeholder={ingredients.length === 0 ? 'Add an ingredient — type to search' : 'Add another'}
              placeholderTextColor={tokens.muted}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                fontFamily: fonts.sans,
                fontSize: 14,
                color: tokens.ink,
                padding: 0,
              }}
            />
            {ingQuery.length > 0 && (
              <Pressable onPress={() => setIngQuery('')} hitSlop={8}>
                <Icon name="x" size={14} color={tokens.muted} />
              </Pressable>
            )}
          </View>

          {/* Suggestions list (closed-state empty hint or live results) */}
          <View style={{ borderTopWidth: 1, borderTopColor: tokens.line }}>
            {(ingQuery.trim().length > 0 ? suggestions : emptyStateSuggestions).map((c) => (
              <SuggestionRow
                key={c.canonical}
                c={c}
                query={ingQuery}
                onAdd={() => addCanonical(c)}
              />
            ))}
            {/* Custom-add fallback when query is non-empty */}
            {ingQuery.trim().length > 0 && (
              <Pressable
                onPress={() => addCustom(ingQuery)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: pressed ? tokens.bgDeep : 'transparent',
                  borderTopWidth: 1,
                  borderTopColor: tokens.line,
                })}
              >
                <Icon name="plus-circle" size={16} color={tokens.paprika} />
                <Text style={{ flex: 1, fontFamily: fonts.sansBold, fontSize: 13, color: tokens.paprika }}>
                  Add custom: "{ingQuery.trim()}"
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Paste-mode disclosure */}
        <Pressable
          onPress={() => setShowPasteMode((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}
        >
          <Icon name={showPasteMode ? 'arrow-down' : 'arrow-right'} size={11} color={tokens.muted} />
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.muted }}>
            Got a wall of text from a screenshot? Paste it
          </Text>
        </Pressable>
        {showPasteMode && (
          <View style={{ marginTop: 8 }}>
            <Input
              value={pasteText}
              onChangeText={setPasteText}
              multiline
              placeholder={'200g flour\n2 eggs\n1 tsp salt\nblack pepper to taste'}
              style={{ minHeight: 100, textAlignVertical: 'top', fontSize: 13, lineHeight: 19 }}
              autoCapitalize="none"
            />
            <Pressable
              onPress={handlePasteParse}
              disabled={!pasteText.trim()}
              accessibilityLabel="Parse pasted text into ingredients"
              style={({ pressed }) => ({
                marginTop: 8,
                paddingVertical: 11,
                borderRadius: 12,
                alignItems: 'center',
                backgroundColor: !pasteText.trim()
                  ? tokens.bgDeep
                  : pressed
                    ? tokens.paprikaDeep
                    : tokens.paprika,
              })}
            >
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: !pasteText.trim() ? tokens.muted : tokens.cream }}>
                Parse and add all
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Phase 3: METHOD ─────────────────────────────────────────── */}
        <PhaseHeader num={3} label="How do you make it?" style={{ marginTop: 28 }} />
        <Text style={hint}>
          Each paragraph (or numbered step) becomes its own step in cook mode.
        </Text>
        <Input
          value={methodText}
          onChangeText={setMethodText}
          multiline
          placeholder={'Mix the dry ingredients in a wide bowl.\n\nWhisk eggs and milk together, fold into the dry mix.\n\nRest 15 minutes before cooking.'}
          style={{ minHeight: 160, textAlignVertical: 'top', fontSize: 14, lineHeight: 22 }}
        />
        {methodPreview.length > 0 && (
          <View style={{
            marginTop: 12,
            padding: 12,
            backgroundColor: 'rgba(91,107,71,0.08)',
            borderRadius: 12,
            borderLeftWidth: 3,
            borderLeftColor: tokens.sage,
          }}>
            <Text style={{
              fontFamily: fonts.sansBold,
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: tokens.sage,
              marginBottom: 6,
            }}>
              {methodPreview.length} step{methodPreview.length === 1 ? '' : 's'} parsed
            </Text>
            {methodPreview.map((t, i) => (
              <Text key={i} style={{
                fontFamily: fonts.sans,
                fontSize: 13,
                color: tokens.inkSoft,
                marginBottom: 2,
                lineHeight: 18,
              }}>
                Step {i + 1}: {t}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Sticky save CTA */}
      <View
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          paddingHorizontal: 20, paddingTop: 12,
          paddingBottom: insets.bottom + 14,
          backgroundColor: 'rgba(245,240,232,0.96)',
          borderTopWidth: 1, borderTopColor: tokens.line,
        }}
      >
        <Pressable
          onPress={handleSave}
          disabled={saving || !allValid}
          accessibilityLabel="Save recipe"
          style={({ pressed }) => ({
            paddingVertical: 16,
            borderRadius: 18,
            backgroundColor: !allValid
              ? tokens.bgDeep
              : saving
                ? tokens.bgDeep
                : pressed
                  ? tokens.paprikaDeep
                  : tokens.paprika,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          })}
        >
          {saving ? (
            <ActivityIndicator color={tokens.cream} size="small" />
          ) : (
            <Icon name="chef" size={18} color={!allValid ? tokens.muted : tokens.cream} />
          )}
          <Text style={{
            fontFamily: fonts.sansXBold,
            fontSize: 14,
            color: !allValid || saving ? tokens.muted : tokens.cream,
            letterSpacing: 0.3,
          }}>
            {saving ? 'Saving…' : allValid ? 'Save recipe' : `Add ${[
              !titleValid && 'a name',
              !timeValid && 'a time',
              !ingredientsValid && 'ingredients',
              !methodValid && 'a method',
            ].filter(Boolean).slice(0, 1)[0]}`}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PhaseHeader({ num, label, style }: { num: number; label: string; style?: object }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 14 }, style]}>
      <View style={{
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: tokens.paprika,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: tokens.cream }}>{num}</Text>
      </View>
      <Text style={{ fontFamily: fonts.display, fontSize: 20, color: tokens.ink }}>{label}</Text>
    </View>
  );
}

function SelectedIngredientRow({
  ing,
  onUpdate,
  onRemove,
}: {
  ing: DraftIngredient;
  onUpdate: (field: 'amount' | 'unit' | 'name', value: string) => void;
  onRemove: () => void;
}) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: tokens.cream,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.line,
      paddingHorizontal: 10,
      paddingVertical: 8,
    }}>
      <TextInput
        value={ing.amount}
        onChangeText={(v) => onUpdate('amount', v)}
        placeholder="0"
        placeholderTextColor={tokens.muted}
        keyboardType="decimal-pad"
        maxLength={6}
        style={{
          width: 50,
          fontFamily: fonts.sansBold,
          fontSize: 14,
          color: tokens.ink,
          textAlign: 'right',
          padding: 0,
        }}
      />
      <TextInput
        value={ing.unit}
        onChangeText={(v) => onUpdate('unit', v)}
        placeholder="unit"
        placeholderTextColor={tokens.muted}
        maxLength={10}
        style={{
          width: 50,
          fontFamily: fonts.sans,
          fontSize: 13,
          color: tokens.muted,
          padding: 0,
        }}
      />
      <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 14, color: tokens.ink }} numberOfLines={1}>
        {ing.name}
      </Text>
      <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel="Remove ingredient">
        <Icon name="x" size={14} color={tokens.muted} />
      </Pressable>
    </View>
  );
}

function SuggestionRow({
  c,
  query,
  onAdd,
}: {
  c: CanonicalIngredient;
  query: string;
  onAdd: () => void;
}) {
  // Highlight the matched prefix per Algolia best practice
  const q = query.trim().toLowerCase();
  const nm = c.name;
  let head = '';
  let match = '';
  let tail = '';
  if (q && nm.toLowerCase().startsWith(q)) {
    match = nm.slice(0, q.length);
    tail = nm.slice(q.length);
  } else {
    tail = nm;
  }
  return (
    <Pressable
      onPress={onAdd}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        backgroundColor: pressed ? tokens.bgDeep : 'transparent',
        borderTopWidth: 1,
        borderTopColor: tokens.line,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: tokens.ink }}>
          {match.length > 0 && (
            <Text style={{ fontFamily: fonts.sansBold, color: tokens.paprika }}>{match}</Text>
          )}
          {tail}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: tokens.muted, marginTop: 1 }}>
          {c.default_amount > 0 && `${c.default_amount}${c.default_unit ? ' ' + c.default_unit : ''} default`}
          {c.default_amount > 0 && c.recipe_count > 0 && ' · '}
          {c.recipe_count > 0 && `in ${c.recipe_count} recipe${c.recipe_count === 1 ? '' : 's'}`}
        </Text>
      </View>
      <Icon name="plus" size={16} color={tokens.sage} />
    </Pressable>
  );
}

function ValidationTick() {
  return (
    <View style={{
      position: 'absolute',
      right: 10,
      top: 32,
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: tokens.sage,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name="check" size={12} color={tokens.cream} />
    </View>
  );
}

// ── Form primitives ──────────────────────────────────────────────────────────

const kicker = { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' as const, color: tokens.paprika, marginBottom: 4 };
const hero = { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, color: tokens.ink, marginBottom: 4 };
const hint = { fontFamily: fonts.sans, fontSize: 12, color: tokens.muted, lineHeight: 17, marginBottom: 8 };

function Field({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <Text style={[{
      fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1,
      textTransform: 'uppercase' as const, color: tokens.muted, marginBottom: 6,
    }, style]}>
      {children}
    </Text>
  );
}

function Input(props: React.ComponentProps<typeof TextInput> & { style?: object }) {
  const { style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={tokens.muted}
      style={[{
        backgroundColor: tokens.bg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: tokens.line,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: fonts.sans,
        fontSize: 14,
        color: tokens.ink,
        minHeight: 46,
      }, style]}
      {...rest}
    />
  );
}
