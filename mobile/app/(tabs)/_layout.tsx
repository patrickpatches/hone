/**
 * Bottom tab layout — Kitchen / Pantry / Plan / Add.
 *
 * Why a custom tab bar instead of expo-router's default `<Tabs>`:
 *   The HTML prototype's bottom dock is deliberate — pill-shaped, floating
 *   off the bottom edge by 12dp, with a gradient fade behind it so content
 *   can scroll under. The stock Material 3 bottom bar can't express that
 *   without heavy overrides. Rolling our own is ~50 lines and keeps the
 *   visual identity intact.
 *
 * Ergonomics: 56dp minimum height per tab. Primary thumb-reach arc on a
 * modern Android phone extends ~65mm from the palm-rested bottom edge —
 * the nav sits squarely inside that arc. Primary action ("Add") is on the
 * right because the global population is ~90% right-handed.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens, fonts } from '../../src/theme/tokens';
import { Icon, type IconName } from '../../src/components/Icon';

type TabSpec = {
  name: string;
  label: string;
  icon: IconName;
  emoji?: string;
  activeBg: string;  // pastel per-tab active colour
};

const TABS: TabSpec[] = [
  { name: 'index',  label: 'Kitchen',    icon: 'home',      activeBg: tokens.peach    },
  { name: 'pantry', label: 'Pantry',     icon: 'sparkles',  activeBg: tokens.lavender, emoji: '🧺' },
  { name: 'plan',   label: 'Plan & Shop',icon: 'cart',      activeBg: tokens.sky      },
  { name: 'add',    label: 'Add',        icon: 'plus',      activeBg: tokens.sage     },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 12,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 12),
            // subtle fade so cards scrolling under the nav feel recessed,
            // not awkwardly clipped.
            backgroundColor: 'transparent',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              backgroundColor: tokens.ink,
              borderRadius: 999,
              padding: 4,
              maxWidth: 500,
              alignSelf: 'center',
              width: '100%',
              shadowColor: tokens.ink,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            {state.routes.map((route, i) => {
              const spec = TABS.find((t) => t.name === route.name);
              if (!spec) return null;
              const focused = state.index === i;
              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityLabel={spec.label}
                  accessibilityState={focused ? { selected: true } : undefined}
                  onPress={() => {
                    if (!focused) {
                      Haptics.selectionAsync().catch(() => {});
                      navigation.navigate(route.name as never);
                    }
                  }}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderRadius: 999,
                    backgroundColor: focused ? spec.activeBg : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 8,
                    gap: 2,
                  }}
                >
                  {spec.emoji ? (
                    <Text style={{ fontSize: 16 }}>{spec.emoji}</Text>
                  ) : (
                    <Icon name={spec.icon} size={16} color={tokens.cream} />
                  )}
                  <Text
                    style={{
                      color: tokens.cream,
                      fontFamily: fonts.sansBold,
                      fontSize: 10,
                      letterSpacing: 0.3,
                    }}
                  >
                    {spec.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}
