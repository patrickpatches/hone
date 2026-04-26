/**
 * Bottom tab navigation — matches hone.html nav bar exactly.
 *
 * Dark ink (#1C1712) pill-shaped bar with an animated paprika (#C4422A)
 * active indicator. All tab labels and icons are cream (#FDF9F3).
 * No per-tab colours — the HTML uses one consistent paprika active state.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Tabs, usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { tokens, fonts } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';

type TabSpec = {
  name: string;
  label: string;
  icon: string;
  href: string;
};

const TABS: TabSpec[] = [
  { name: 'index',  label: 'Kitchen',     icon: 'home',     href: '/'          },
  { name: 'pantry', label: 'Pantry',      icon: 'sparkles', href: '/pantry'    },
  { name: 'plan',   label: 'Plan & Shop', icon: 'cart',     href: '/plan'      },
  { name: 'add',    label: 'Add',         icon: 'plus',     href: '/add'       },
];

function HoneTabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const activeIdx = TABS.findIndex((t) => {
    if (t.name === 'index') return pathname === '/';
    return pathname.startsWith('/' + t.name);
  });

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 16),
        // Gradient fade — approximate with semi-transparent base
        backgroundColor: 'transparent',
      }}
      pointerEvents="box-none"
    >
      {/* Gradient fade behind bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          backgroundColor: tokens.bg,
          opacity: 0.96,
        }}
        pointerEvents="none"
      />

      {/* The pill bar itself */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: tokens.ink,
          borderRadius: 20,
          padding: 6,
          shadowColor: '#000',
          shadowOpacity: 0.28,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
          position: 'relative',
        }}
      >
        {TABS.map((tab, idx) => {
          const active = idx === activeIdx;
          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                router.push(tab.href as any);
              }}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 5,
                paddingVertical: 11,
                borderRadius: 14,
                backgroundColor: active ? tokens.paprika : 'transparent',
                shadowColor: active ? tokens.paprika : 'transparent',
                shadowOpacity: active ? 0.32 : 0,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: active ? 4 : 0,
              }}
            >
              <Icon name={tab.icon} size={16} color="#FDF9F3" />
              <Text
                style={{
                  fontFamily: fonts.sansBold,
                  fontSize: 11,
                  color: '#FDF9F3',
                  letterSpacing: -0.3,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <HoneTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="pantry" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="add" />
    </Tabs>
  );
}
