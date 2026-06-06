/**
 * Settings screen.
 *
 * Opened from the profile avatar on the Kitchen home. Currently houses the
 * Appearance section with the Light/Dark theme toggle.
 *
 * The theme toggle re-themes the whole app via a Stack remount (key={theme} in
 * _layout.tsx), so this screen itself remounts on switch — the knob renders on
 * the correct side immediately from the current theme. No animation needed: the
 * effect the user sees is the entire screen flipping theme in one crisp step.
 */
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { tokens, fonts, shadows } from '../src/theme/tokens';
import { Icon } from '../src/components/Icon';
import { useTheme } from '../src/theme/ThemeContext';
import { usePreferences, SERVINGS_BOUNDS } from '../src/state/PreferencesContext';

// ─── Proper sliding sun/moon toggle ─────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const knob = (icon: 'sun' | 'moon') => (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: tokens.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.card,
      }}
    >
      <Icon name={icon} size={16} color={tokens.onPrimary} />
    </View>
  );

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="switch"
      accessibilityState={{ checked: !isDark }}
      accessibilityLabel="Theme — light or dark"
      hitSlop={8}
      style={{
        width: 78,
        height: 40,
        borderRadius: 999,
        backgroundColor: tokens.bgDeep,
        borderWidth: 1,
        borderColor: tokens.lineDark,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
      }}
    >
      {isDark ? (
        <>
          {knob('moon')}
          <Icon name="sun" size={16} color={tokens.muted} style={{ marginRight: 7 }} />
        </>
      ) : (
        <>
          <Icon name="moon" size={16} color={tokens.muted} style={{ marginLeft: 7 }} />
          {knob('sun')}
        </>
      )}
    </Pressable>
  );
}

// ─── Servings stepper — − N + ────────────────────────────────────────────────
function ServingsStepper() {
  const { defaultServings, setDefaultServings } = usePreferences();
  const atMin = defaultServings <= SERVINGS_BOUNDS.min;
  const atMax = defaultServings >= SERVINGS_BOUNDS.max;

  const button = (kind: 'minus' | 'plus', disabled: boolean, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={kind === 'minus' ? 'Fewer servings' : 'More servings'}
      hitSlop={6}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: disabled ? 'transparent' : tokens.primaryLight,
        borderWidth: 1,
        borderColor: disabled ? tokens.line : 'transparent',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Icon name={kind} size={18} color={disabled ? tokens.muted : tokens.primaryInk} />
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      {button('minus', atMin, () => setDefaultServings(defaultServings - 1))}
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 26,
          color: tokens.ink,
          minWidth: 26,
          textAlign: 'center',
          fontVariant: ['tabular-nums'],
        }}
      >
        {defaultServings}
      </Text>
      {button('plus', atMax, () => setDefaultServings(defaultServings + 1))}
    </View>
  );
}

// ─── Segmented two-option toggle (e.g. °C | °F) ──────────────────────────────
function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: ReadonlyArray<{ label: string; value: T }>;
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={ariaLabel}
      style={{
        flexDirection: 'row',
        backgroundColor: tokens.bgDeep,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: tokens.lineDark,
        padding: 3,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            style={{
              minWidth: 52,
              paddingVertical: 7,
              paddingHorizontal: 14,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? tokens.primary : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: fonts.sansBold,
                fontSize: 13,
                color: active ? tokens.onPrimary : tokens.inkSoft,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const {
    temperatureUnit,
    setTemperatureUnit,
    volumeSystem,
    setVolumeSystem,
  } = usePreferences();

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 14,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="arrow-left" size={22} color={tokens.ink} />
        </Pressable>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 26,
            color: tokens.ink,
            letterSpacing: -0.3,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        {/* Cooking section */}
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: tokens.bronze,
            marginTop: 8,
            marginBottom: 10,
          }}
        >
          Cooking
        </Text>

        <View
          style={{
            backgroundColor: tokens.cream,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: tokens.line,
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 22,
            ...shadows.card,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: tokens.ink }}>
              Cooking for
            </Text>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 13,
                color: tokens.muted,
                marginTop: 2,
              }}
            >
              Recipes open scaled to your kitchen
            </Text>
          </View>
          <ServingsStepper />
        </View>

        {/* Measurements section */}
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: tokens.bronze,
            marginTop: 8,
            marginBottom: 10,
          }}
        >
          Measurements
        </Text>

        <View
          style={{
            backgroundColor: tokens.cream,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: tokens.line,
            paddingHorizontal: 16,
            paddingVertical: 6,
            marginBottom: 22,
            ...shadows.card,
          }}
        >
          {/* Temperature */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: tokens.ink }}>
                Temperature
              </Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: tokens.muted, marginTop: 2 }}>
                Oven temps in your steps
              </Text>
            </View>
            <SegmentedToggle
              ariaLabel="Temperature unit"
              value={temperatureUnit}
              onChange={setTemperatureUnit}
              options={[
                { label: '°C', value: 'C' },
                { label: '°F', value: 'F' },
              ]}
            />
          </View>

          <View style={{ height: 1, backgroundColor: tokens.line }} />

          {/* Volume */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 14,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: tokens.ink }}>
                Volume
              </Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: tokens.muted, marginTop: 2 }}>
                Liquids in the ingredients list
              </Text>
            </View>
            <SegmentedToggle
              ariaLabel="Volume units"
              value={volumeSystem}
              onChange={setVolumeSystem}
              options={[
                { label: 'ml', value: 'metric' },
                { label: 'cups', value: 'cups' },
              ]}
            />
          </View>

          <View style={{ height: 1, backgroundColor: tokens.line }} />

          {/* Honesty note — Golden Rule #3 */}
          <Text
            style={{
              fontFamily: fonts.sans,
              fontSize: 12,
              color: tokens.muted,
              lineHeight: 17,
              paddingVertical: 12,
            }}
          >
            Weights stay in grams. A cup of flour and a cup of sugar don&rsquo;t weigh
            the same, so we won&rsquo;t pretend a gram is a cup.
          </Text>
        </View>

        {/* Appearance section */}
        <Text
          style={{
            fontFamily: fonts.sansBold,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: tokens.bronze,
            marginTop: 8,
            marginBottom: 10,
          }}
        >
          Appearance
        </Text>

        <View
          style={{
            backgroundColor: tokens.cream,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: tokens.line,
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...shadows.card,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: tokens.ink }}>
              Theme
            </Text>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 13,
                color: tokens.muted,
                marginTop: 2,
              }}
            >
              {isDark ? 'Dark — warm cookbook' : 'Light — bright kitchen'}
            </Text>
          </View>
          <ThemeToggle />
        </View>
      </ScrollView>
    </View>
  );
}
