/**
 * Root layout.
 *
 * Responsibilities:
 *   - Load the bundled fonts (Playfair Display for display, Source Sans 3
 *     for body) before anything renders. We keep the splash screen up until
 *     fonts are ready so the first frame doesn't flash system fonts.
 *   - Set the background colour at the OS level (expo-system-ui) so the status
 *     bar region matches the app cream rather than flashing white on launch.
 *   - Stack host for expo-router. (tabs) is the default destination; future
 *     full-screen routes like /recipe/[id] and /cook/[id] will live as
 *     sibling routes so the bottom nav can hide for those screens.
 *
 * Everything cooking-specific (recipes, pantry, etc.) lives under child
 * routes. This file is boilerplate for the whole app's shell and should
 * not grow unless we're adding cross-cutting concerns like error boundaries,
 * analytics wrapper (later), or a context provider.
 */
import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { SQLiteProvider } from 'expo-sqlite';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  SourceSans3_400Regular,
  SourceSans3_700Bold,
  SourceSans3_800ExtraBold,
} from '@expo-google-fonts/source-sans-3';
import { tokens } from '../src/theme/tokens';
import { initDatabase } from '../db/database';

// Keep splash up until fonts are loaded — avoids system-font flash.
SplashScreen.preventAutoHideAsync().catch(() => {});

SystemUI.setBackgroundColorAsync(tokens.bg).catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_500Medium_Italic,
    SourceSans3_400Regular,
    SourceSans3_700Bold,
    SourceSans3_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // If the fonts fail to load we still render — the app won't crash, it'll
  // just fall back to system fonts until the user relaunches. Rule #6: be
  // honest about degradation, don't pretend everything is fine with a
  // black screen.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="hone.db" onInit={initDatabase}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: tokens.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
