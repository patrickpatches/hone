/**
 * PreferencesContext — user cooking preferences, persisted in SQLite app_meta.
 *
 * Lives ABOVE the theme-keyed Stack (see _layout.tsx) so its state survives a
 * theme toggle remount, and INSIDE SQLiteProvider so it can read/write the db.
 *
 * Currently holds `defaultServings` ("Cooking for N") — the household size that
 * people-based recipes pre-scale to. Count-based recipes (4 burgers, 1 loaf —
 * those carry output_default) ignore it, per the count-vs-people golden rule.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { TemperatureUnit, VolumeSystem } from '../data/units';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 12;
const DEFAULT_SERVINGS = 2;
const DEFAULT_TEMP: TemperatureUnit = 'C';
const DEFAULT_VOLUME: VolumeSystem = 'metric';

type PreferencesValue = {
  defaultServings: number;
  setDefaultServings: (n: number) => void;
  temperatureUnit: TemperatureUnit;
  setTemperatureUnit: (u: TemperatureUnit) => void;
  volumeSystem: VolumeSystem;
  setVolumeSystem: (s: VolumeSystem) => void;
};

const PreferencesContext = createContext<PreferencesValue>({
  defaultServings: DEFAULT_SERVINGS,
  setDefaultServings: () => {},
  temperatureUnit: DEFAULT_TEMP,
  setTemperatureUnit: () => {},
  volumeSystem: DEFAULT_VOLUME,
  setVolumeSystem: () => {},
});

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [defaultServings, setServings] = useState<number>(DEFAULT_SERVINGS);
  const [temperatureUnit, setTemp] = useState<TemperatureUnit>(DEFAULT_TEMP);
  const [volumeSystem, setVolume] = useState<VolumeSystem>(DEFAULT_VOLUME);

  // Load all stored preferences once on mount.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await db.getAllAsync<{ key: string; value: string }>(
          "SELECT key, value FROM app_meta WHERE key IN ('default_servings', 'temperature_unit', 'volume_system')",
        );
        if (!alive) return;
        for (const row of rows) {
          if (row.key === 'default_servings') {
            const n = Number(row.value);
            if (Number.isFinite(n)) setServings(clamp(n));
          } else if (row.key === 'temperature_unit') {
            if (row.value === 'C' || row.value === 'F') setTemp(row.value);
          } else if (row.key === 'volume_system') {
            if (row.value === 'metric' || row.value === 'cups') setVolume(row.value);
          }
        }
      } catch {
        // Non-fatal: fall back to in-memory defaults.
      }
    })();
    return () => {
      alive = false;
    };
  }, [db]);

  // Persist a single app_meta key — failure is non-fatal (in-memory value still
  // applies this session, just won't survive a cold start).
  const persist = useCallback(
    (key: string, value: string) => {
      db.runAsync(
        `INSERT INTO app_meta (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, value],
      ).catch(() => {});
    },
    [db],
  );

  const setDefaultServings = useCallback(
    (n: number) => {
      const v = clamp(n);
      setServings(v);
      persist('default_servings', String(v));
    },
    [persist],
  );

  const setTemperatureUnit = useCallback(
    (u: TemperatureUnit) => {
      setTemp(u);
      persist('temperature_unit', u);
    },
    [persist],
  );

  const setVolumeSystem = useCallback(
    (s: VolumeSystem) => {
      setVolume(s);
      persist('volume_system', s);
    },
    [persist],
  );

  return (
    <PreferencesContext.Provider
      value={{
        defaultServings,
        setDefaultServings,
        temperatureUnit,
        setTemperatureUnit,
        volumeSystem,
        setVolumeSystem,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}

export const SERVINGS_BOUNDS = { min: MIN_SERVINGS, max: MAX_SERVINGS } as const;

function clamp(n: number): number {
  return Math.max(MIN_SERVINGS, Math.min(MAX_SERVINGS, Math.round(n)));
}
