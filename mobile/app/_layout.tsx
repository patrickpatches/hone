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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
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

// ─── DB error screen — renders outside ALL context providers ─────────────
// Must survive without ThemeProvider, SQLiteProvider, or PreferencesProvider.
// Uses raw RN primitives and reads tokens directly from the module-level
// object (which holds dark-theme defaults until setActiveTheme() is called —
// that only happens after a successful startup, so default values are safe here).
//
// Retry note: incrementing `attempt` changes the `onDbInit` callback identity,
// which re-triggers SQLiteProvider's useEffect (onInit is in its dep array) and
// issues a fresh openDatabaseWithInitAsync call.  This recovers transient
// failures (locked WAL, interrupted checkpoint).  For a hard failure (corrupted
// file, disk full) only a process restart can clear the SQLite native state —
// tell the user explicitly if they've already retried once.
function DbErrorScreen({
  error,
  attempt,
  onRetry,
}: {
  error: Error;
  attempt: number;
  onRetry: () => void;
}) {
  // Hide the native splash so the user sees this screen, not a frozen amber logo.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const persistentFailure = attempt > 0;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <Text
        style={{
          color: tokens.ochre,
          fontSize: 20,
          fontWeight: '700',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        Couldn't open the recipe database
      </Text>
      <Text
        style={{
          color: tokens.inkSoft,
          fontSize: 14,
          textAlign: 'center',
          marginBottom: 8,
          lineHeight: 21,
        }}
      >
        {persistentFailure
          ? `Still failing after ${attempt + 1} attempts. The database file may be corrupted or the storage is full.`
          : 'The database failed to open. This is usually a one-off — tap Try again.'}
      </Text>
      {persistentFailure && (
        <Text
          style={{
            color: tokens.muted,
            fontSize: 12,
            textAlign: 'center',
            marginBottom: 8,
            lineHeight: 18,
          }}
        >
          If retrying doesn't help, fully close and reopen Tucker & Spice.
          Only a full process restart clears a hard database failure.
        </Text>
      )}
      <Text
        style={{
          color: tokens.muted,
          fontSize: 11,
          textAlign: 'center',
          marginBottom: 28,
          fontFamily: 'monospace',
          lineHeight: 16,
        }}
        numberOfLines={3}
      >
        {error.message}
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => ({
          backgroundColor: pressed ? tokens.primaryDeep : tokens.primary,
          paddingHorizontal: 28,
          paddingVertical: 14,
          borderRadius: 12,
        })}
      >
        <Text
          style={{
            color: tokens.onPrimary,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          Try again
        </Text>
      </Pressable>
    </View>
  );
}

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

  // ── DB resilience ──────────────────────────────────────────────────────
  // Problem: SQLiteProvider (NonSuspense path) returns null while loading.
  // With no onError prop, any throw inside onInit re-throws during render
  // (no boundary) and the native splash never comes down.  Pure hangs (DB
  // file locked, migration stalled) are equally silent.
  //
  // Fix: onError surfaces the failure; a 15 s watchdog covers the hang case;
  // DbErrorScreen hides the splash and offers a best-effort retry.
  //
  // Retry mechanics: dbAttempt is a dep of onDbInit, so incrementing it
  // produces a new callback identity.  SQLiteProvider's useEffect depends on
  // onInit, so it re-runs — teardown + fresh openDatabaseWithInitAsync.
  // Recovers transient issues (temp lock, interrupted WAL checkpoint).
  // A hard failure (corrupted file, disk full) needs a process restart.
  const [dbError, setDbError] = useState<Error | null>(null);
  const [dbAttempt, setDbAttempt] = useState(0);
  const dbInitializedRef = useRef(false);

  // Watchdog: pure-hang case — onInit/onError never fires (e.g. platform DB
  // lock that doesn't throw).  After 15 s, surface the error screen.
  useEffect(() => {
    dbInitializedRef.current = false;
    const watchdog = setTimeout(() => {
      if (!dbInitializedRef.current) {
        const msg =
          'Database took longer than 15 s to open. ' +
          'The file may be locked or the device storage is unavailable.';
        console.warn('[Tucker & Spice] DB watchdog fired:', msg);
        setDbError(new Error(msg));
      }
    }, 15_000);
    return () => clearTimeout(watchdog);
  }, [dbAttempt]);

  // onInit identity changes with dbAttempt → forces SQLiteProvider to retry.
  // setupDatabase is module-level so the only dep that changes is dbAttempt.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onDbInit = useCallback(async (db: SQLiteDatabase) => {
    await setupDatabase(db);
    dbInitializedRef.current = true; // disarm watchdog
  }, [dbAttempt]);

  const onDbError = useCallback(
    (err: Error) => {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      // Observability hook — swap in Sentry.captureException(wrapped) at launch.
      console.error(
        `[Tucker & Spice] DB init failed (attempt ${dbAttempt + 1}):`,
        wrapped,
      );
      setDbError(wrapped);
    },
    [dbAttempt],
  );

  const ready =
    Platform.OS === 'web' || fontsLoaded || !!fontError || fontTimeout;

  // DB startup failed — render error screen outside all context providers.
  // GestureHandlerRootView is kept so Pressable works correctly.
  if (dbError) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DbErrorScreen
          error={dbError}
          attempt={dbAttempt}
          onRetry={() => {
            setDbError(null);
            setDbAttempt((a) => a + 1);
          }}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SQLiteProvider
          databaseName="hone.db"
          onInit={onDbInit}
          onError={onDbError}
        >
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
