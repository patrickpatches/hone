/**
 * Root layout.
 *
 * Responsibilities:
 *   - Load the bundled fonts (Playfair Display for display headings, Inter
 *     for body) before anything renders. We keep the splash screen up until
 *     fonts are ready so the first frame doesn't flash system fonts.
 *   - Set the background colour at the OS level (expo-system-ui) so the status
 *     bar region matches the app near-black rather than flashing white on launch.
 *   - Stack host for expo-router. (tabs) is the default destination; future
 *     full-screen routes like /recipe/[id] and /cook/[id] will live as
 *     sibling routes so the bottom nav can hide for those screens.
 *
 * Font pairing: Playfair Display (display/headings) + Inter (body/UI).
 * v0.7 change: Source Sans 3 → Inter. Inter is more architectural at UI
 * sizes (12–15sp) and suits the dark dramatic palette better.
 *
 * StatusBar: style="light" (light icons on the near-black #111111 bg).
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
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  PlayfairDisplay_500Medium_Italic,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { tokens } from '../src/theme/tokens';
import { initDatabase } from '../db/database';

// Keep splash up until fonts are loaded — avoids system-font flash.
SplashScreen.preventAutoHideAsync().catch(() => {});

SystemUI.setBackgroundColorAsync(tokens.bg).catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_500Medium_Italic,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_800ExtraBold,
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
      {/* BottomSheetModalProvider must be inside GestureHandlerRootView and
          wrap the entire nav tree so BottomSheetModal portals render correctly. */}
      <BottomSheetModalProvider>
      <SQLiteProvider databaseName="hone.db" onInit={initDatabase}>
        <StatusBar style="light" />
        <Stack