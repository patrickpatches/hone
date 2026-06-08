/**
 * Bottom tab layout.
 *
 * Floating pill-shaped nav bar -- matches hone.html's dock design.
 * Sage palette: light cream dock on sage-green app bg.
 * Primary actions in right thumb zone (Kitchen home is the exception --
 * it's leftmost because it's the app's anchor, not a "primary action").
 *
 * Ergonomics: 48dp minimum touch target per tab.
 * Shadow lifts the bar off the content -- content scrolls under it,
 * not behind a hard line.
 */
import React from 'react';
import { ImageBackground, Platform, Pressable, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens, fonts } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/ThemeContext';
import { Icon, type IconName } from '../../src/components/Icon';

// The illustration lives here (not just in AppShell) so it's the DIRECT parent
// of the Tabs component — no navigation container transparency chain needed.
// AppShell's root ImageBackground still covers non-tab screens (Settings, etc.).
const SYNTHWAVE_BG = require('../../assets/images/synthwave-bg.png');

type TabSpec = {
  name: string;
  label: string;
  icon: IconName;
};

const TABS: TabSpec[] = [
  { name: 'index',  label: 'Kitchen', icon: 'home'     },
  { name: 'pantry', label: 'Pantry',  icon: 'sparkles' },
  { name: 'plan',   label: 'Plan',    icon: 'calendar' },
  { name: 'shop',   label: 'Shop',    icon: 'cart'     },
  { name: 'add',    label: 'Add',     icon: 'plus'     },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // Only wrap in ImageBackground on native light mode — dark mode uses a solid
  // dark View from AppShell, and web uses the CSS backgroundImage approach.
  // This guarantees the illustration shows regardless of whether React Navigation's
  // internal scene containers honour our sceneContainerStyle: transparent override.
  const showIllustration = theme === 'light' && Platform.OS !== 'web';

  const tabsNode = (
    <Tabs
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        sceneContainerStyle: { backgroundColor: 'transparent' },
      }}
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
          {/* Pill bg: tokens.cream (#1E1E1E) -- elevated dark card surface.
              Dark palette: dock floats on #141414 app bg.
              Active pill: rust primary with cream labels (tokens.onPrimary).
              Inactive: warm cream at 55% opacity -- legible on the dark dock
              without competing with the active rust pill. */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              backgroundColor: tokens.dockBg,
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
                  {/* Focused: rust pill -- cream label (tokens.onPrimary) for contrast.
                      Unfocused: dark ink at 52% opacity on the light dock.
                      Why 52% not lower: inactive tabs were disappearing into the
                      dock at 38%. 52% gives legibility without competing with
                      the active rust pill. */}
                  <Icon
                    name={spec.icon}
                    size={16}
                    color={focused ? tokens.onPrimary : 'rgba(245,239,232,0.55)'}
                  />
                  <Text
                    style={{
                      color: focused ? tokens.onPrimary : 'rgba(245,239,232,0.55)',
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

  if (!showIllustration) return tabsNode;

  return (
    <ImageBackground source={SYNTHWAVE_BG} style={{ flex: 1 }} resizeMode="cover">
      {tabsNode}
    </ImageBackground>
  );
}
