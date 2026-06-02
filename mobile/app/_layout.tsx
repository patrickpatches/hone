/**
 * Root layout.
 *
 * Responsibilities:
 *   - Load the bundled fonts (Fraunces for display headings, Inter
 *     for body) before anything renders. We keep the splash screen up until
 *     fonts are ready so the first frame doesn't flash system fonts.
 *   - Set the background colour at the OS level (expo-system-ui) so the status
 *     bar region matches the app near-black rather than flashing white on launch.
 *   - Stack host for expo-router. (tabs) is the default destination; future
 *     full-screen routes like /recipe/[id] and /cook/[id] will live as
 *     sibling routes so the bottom nav can hide for those screens.
 *
 * Font pairing: Fraunces (display/headings) + Inter (body/UI).
 * v0.7 change: Source Sans 3 → Inter. Inter is more architectural at UI
 * sizes (12-15sp) and suits the dark dramatic palette better.
 *
 * StatusBar: style="light" (light icons on the near-black #111111 bg).
 *
 * Everything cooking-specific (recipes, pantry, etc.) lives under child
 * routes. This file is boilerplate for the whole app's shell and should
 * not grow unless we're adding cross-cutting concerns like error boundaries,
 * analytics wrapper (later), or a context provider.
 *
 * Database bootstrap note:
 * All seed orchestration is in setupDatabase (below), not in initDatabase.
 * seed.ts imports insertRecipe from database.ts — if database.ts also imported
 * from seed.ts the cycle would corrupt Metro's TypeScript stripping. By keeping
 * database.ts free of any seed.ts import, both modules resolve cleanly and
 * setupDatabase imports from each side independently.
 */
import '../global.css';
import React, { useEffect } from 'react';
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
import { initDatabase } from '../db/database';
import { seedDatabase, syncNewSeedRecipes, refreshSeedRecipeFields, updateSubstitutions, pruneOrphanedSeedRecipes, smokeAlarmSeedCount, validateDecision015 } from '../db/seed';

/**
 * Full database bootstrap sequence, called once by SQLiteProvider on open.
 *
 *   1. initDatabase        — WAL + FK pragmas, CREATE TABLE IF NOT EXISTS, migrations.
 *                            No seed.ts import here (circular dep prevention).
 *   2. seedDatabase        — First launch only: write all SEED_RECIPES via insertRecipe.
 *   3. syncNewSeedRecipes  — Every launch: insert seed recipes added after first install.
 *   4. refreshSeedRecipeFields — Every launch: UPDATE DECISION-009 fields on seed rows
 *                                so new content data ships without requiring a reinstall.
 *   5. pruneOrphanedSeedRecipes — Every launch: delete seeded rows whose ids no
 *                                longer appear in SEED_RECIPES. Cleans up
 *                                installs after launch-roster changes.
 *   6. smokeAlarmSeedCount — Dev-only: loud console.error if seeded-row count
 *                                drifts from SEED_RECIPES.length.
 */
async function setupDatabase(db: SQLiteDatabase): Promise<void> {
  // Step 1: tables + migrations only — no seeding.
  await initDatabase(db);

  // Step 2: first-launch seed gate.
  const meta = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'seeded'",
  );
  if (!meta) {
    await seedDatabase(db);
    await db.runAsync(
      "INSERT INTO app_meta (key, value) VALUES ('seeded', '1')",
    );
  }

  // Steps 3 & 4: idempotent passes on every launch — cheap, safe to repeat.
  await syncNewSeedRecipes(db);
  await refreshSeedRecipeFields(db);

  // Step 4b: refresh substitution quality values. refreshSeedRecipeFields only
  // updates the recipes table; ingredient substitutions are a separate column.
  // Without this call, existing installs keep old quality values ('good',
  // 'compromise') which crash SubstitutionSheet at PILL_CONFIG lookup.
  await updateSubstitutions(db);

  // Step 5 (2026-05-09): prune any seed-origin rows whose ids are no longer
  // in SEED_RECIPES. Cleans up existing installs after Patrick's launch
  // roster split (DECISION-013 architectural fix). Idempotent — no-op once
  // the DB matches the launch list.
  await pruneOrphanedSeedRecipes(db);

  // Step 6 (2026-05-09): dev-only smoke alarm. Loud console.error if the
  // seeded-row count drifts from SEED_RECIPES.length. Silent in production.
  await smokeAlarmSeedCount(db);

  // Step 7 (2026-05-12, DECISION-015): substitution quality sanity check +
  // step_overrides validator. Counts green/yellow/red across SEED_RECIPES,
  // screams if any legacy 4-tier values remain, and lists any step_overrides
  // keys that don't match an actual step id on the parent recipe.
  validateDecision015();
}

// Keep splash up until fonts are loaded — avoids system-font flash.
SplashScreen.preventAutoHideAsync().catch(() => {});

SystemUI.setBackgroundColorAsync(tokens.bg).catch(() => {});

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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // If fonts fail to load we still render — the app won't crash, it'll just
  // fall back to system fonts until the user relaunches.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* BottomSheetModalProvider must be inside GestureHandlerRootView and
          wrap the entire nav tree so BottomSheetModal portals render correctly. */}
      <BottomSheetModalProvider>
        <SQLiteProvider databaseName="hone.db" onInit={setupDatabase}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: tokens.bg },
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SQLiteProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
