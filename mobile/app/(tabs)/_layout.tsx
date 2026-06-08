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
import React, { useCallback, useEffect, useState } from 'react';
import { ImageBackground, Platform, Pressable, Text, View } from 'react-native';
import { Asset } from 'expo-asset';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens, fonts } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/ThemeContext';
import { Icon, type IconName } from '../../src/components/Icon';

// Each tab scene paints its OWN illustration backdrop (via screenLayout below),
// so the active scene is fully opaque and cannot be bled through by an inactive
// sibling scene. AppShell's root ImageBackground still covers non-tab screens.
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
  const isLight = theme === 'light';

  // Web-only: resolve the illustration URI for use as a CSS backgroundImage.
  const [webBgUri, setWebBgUri] = useState<string>('');
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    Asset.fromModule(SYNTHWAVE_BG)
      .downloadAsync()
      .then(asset => { setWebBgUri(asset.localUri ?? asset.uri ?? ''); })
      .catch(() => { setWebBgUri(''); });
  }, []);

  // screenLayout wraps EVERY tab scene in its own opaque backdrop. This is the
  // fix for the cross-tab bleed-through: React Navigation keeps inactive tab
  // scenes mounted and PAINTED at z-index:-1, relying on the active scene being
  // opaque to hide them. Our screens are transparent (so a shared illustration
  // can show through), which let the inactive Kitchen scene show behind Pantry/
  // Shop. Giving each scene its own opaque illustration backdrop restores the
  // occlusion: the active scene fully covers the inactive one, and every screen
  // still shows the illustration.
  //   dark        → solid View (tokens.bg)
  //   light native→ ImageBackground (illustration file)
  //   light web   → View with CSS backgroundImage (RN Web passes it to the <div>)
  const renderScreenLayout = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      if (!isLight) {
        return <View style={{ flex: 1, backgroundColor: tokens.bg }}>{children}</View>;
      }
      if (Platform.OS === 'web') {
        return (
          <View
            style={[
              { flex: 1 },
              webBgUri
                ? ({
                    backgroundImage: `url("${webBgUri}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  } as object)
                : { backgroundColor: '#C20060' },
            ]}
          >
            {children}
          </View>
        );
      }
      return (
        <ImageBackground source={SYNTHWAVE_BG} style={{ flex: 1 }} resizeMode="cover">
          {children}
        </ImageBackground>
      );
    },
    [isLight, webBgUri],
  );

  return (
    <Tabs
      screenLayout={renderScreenLayout}
      screenOptions={{
        headerShown: false,
        // bottom-tabs uses `sceneStyle` (not Stack's contentStyle/sceneContainerStyle).
        // Transparent so the screenLayout backdrop above is what paints each scene.
        sceneStyle: { backgroundColor: 'transparent' },
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
}
