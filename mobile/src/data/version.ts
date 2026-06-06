/**
 * App version metadata — single source of truth.
 *
 * We read the version string from Expo's Constants at runtime. expoConfig
 * pulls from app.json at build time, so bumping the version in app.json
 * is the only thing that needs to happen on a release.
 *
 * The build number (Android versionCode) is the bookkeeping integer the
 * Play Store uses for ordering — it must increase monotonically. We expose
 * it here so the version footer can show "Tucker & Spice v0.2.0 · build 2".
 */
import Constants from 'expo-constants';

export const APP_VERSION: string =
  Constants.expoConfig?.version ?? '0.0.0';

export const ANDROID_VERSION_CODE: number =
  (Constants.expoConfig?.android as { versionCode?: number } | undefined)
    ?.versionCode ?? 0;

/** Human-readable string for the footer: "v0.2.0 · build 2" */
export const VERSION_LABEL = `v${APP_VERSION} · build ${ANDROID_VERSION_CODE}`;
