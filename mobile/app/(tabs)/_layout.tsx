/**
 * Bottom tab layout.
 *
 * Floating pill-shaped nav bar — matches hone.html's dock design.
 * Dark ink background, dusty terracotta active pill.
 * Primary actions in right thumb zone (Kitchen home is the exception —
 * it's leftmost because it's the app's anchor, not a "primary action").
 *
 * Ergonomics: 48dp minimum touch target per tab.
 * Shadow lifts the bar off the content — content scrolls under it,
 * not behind a hard line.
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
};

const TABS: TabSpec[] = [
  { name: 'index',  label: 'Kitchen', icon: 'home'     },
  { name: 'pantry', label: 'Pantry',  icon: 'sparkles' },
  { name: 'shop',   label: 'Shop',    icon: 'cart'     },
  { name: 'add',    label: 'Add',     icon: 'plus'     },
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
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 14),
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
              maxWidth: 480,
              alignSelf: 'center',
              width: '100%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.22,
              shadowRadius: 14,
              elevation: 14,
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
                    backgroundColor: focused ? tokens.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 8,
                    gap: 2,
                  }}
                >
                  <Icon
                    name={spec.icon}
                    size={16}
                    color={focused ? tokens.ink : 'rgba(255,255,255,0.55)'}
                  />
                  <Text
                    style={{
                      color: focused ? tokens.ink : 'rgba(255,255,255,0.55)',
                      fontFamily: fonts.sansBold,
                      fontSize: 10,
                      letterSpacing: 0.2,
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
