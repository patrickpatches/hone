/**
 * Root layout.
 *
 * Provider order (outermost → innermost):
 *   GestureHandlerRootView → BottomSheetModalProvider → SQLiteProvider
 *   → ThemeProvider → AppShell
 *
 * SQLiteProvider and BottomSheetModalProvider sit ABOVE ThemeProvider so they
 * never remount when the Stealth ↔ Neon toggle fires a key change on the Stack.
 * The SQLite context is still accessible to all descendants via React context.
 *
 * Theme switching: ThemeProvider holds the active theme in state. Toggling calls
 * setActiveTheme() (mutates the shared `tokens` object in place) then changes
 * `key` on the Stack, forcing a full remount so static `tokens` importers pick
 * up the new values on next render.
 */
import '../global.css';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { SQLiteProvider } from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  Fraunces_400Regular,
  Fraunces_500Medium_Italic,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { Poppins_400Regular } from '@expo-google-fonts/poppins';
import { tokens } from '../src/theme/tokens';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { PreferencesProvider } from '../src/state/PreferencesContext';
import { initDatabase } from '../db/database';
import {
  seedDatabase, syncNewSeedRecipes, refreshSeedRecipeFields,
  updateSubstitutions, pruneOrphanedSeedRecipes, smokeAlarmSeedCount,
  validateDecision015,
} from '../db/seed';
import { SEED_RECIPES } from '../src/data/seed-recipes';
import { auditAllergens } from '../src/data/allergens';

async function setupDatabase(db: SQLiteDatabase): Promise<void> {
  await initDatabase(db);
  const meta = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'seeded'",
  );
  if (!meta) {
    await seedDatabase(db);
    await db.runAsync("INSERT INTO app_meta (key, value) VALUES ('seeded', '1')");
  }
  await syncNewSeedRecipes(db);
  await refreshSeedRecipeFields(db);
  await updateSubstitutions(db);
  await pruneOrphanedSeedRecipes(db);
  await smokeAlarmSeedCount(db);
  validateDecision015();
  // Dev-only tripwire: logs each recipe's derived allergens and warns on any
  // ingredient that looks allergen-bearing but matched no rule. Production silent.
  auditAllergens(SEED_RECIPES);
}

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(tokens.bg).catch(() => {});

// ─── Inner shell — reads theme, renders Stack ────────────────────────────
function AppShell({ ready }: { ready: boolean }) {
  const { theme } = useTheme();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  // Dark theme → light status-bar glyphs; Light theme → dark glyphs.
  const isDark = theme === 'dark';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        key={theme}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tokens.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium_Italic,
    Fraunces_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_800ExtraBold,
    Poppins_400Regular,
  });

  // Safety net: an unsettled font promise must never permanently block the UI.
  // On web, fonts are delivered via CSS @font-face and swap in on their own, so
  // we don't gate the tree on the JS font promise there at all — that gate is
  // exactly what black-screens the app when useFonts hangs on web. On native we
  // still wait for fonts (fast, reliable, avoids a flash of fallback type), but
  // a 2.5s timeout guarantees the app renders even if the promise never settles.
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFontTimeout(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const ready =
    Platform.OS === 'web' || fontsLoaded || !!fontError || fontTimeout;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SQLiteProvider databaseName="hone.db" onInit={setupDatabase}>
          <PreferencesProvider>
            <ThemeProvider>
              <AppShell ready={ready} />
            </ThemeProvider>
          </PreferencesProvider>
        </SQLiteProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
