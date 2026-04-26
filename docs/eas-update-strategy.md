# EAS Update — strategy after the v0.7.x failure

**Status:** rolled back at v0.6.3 (2026-04-26). v0.7.0 and v0.7.1 are
documented in CHANGELOG as BROKEN.

## What went wrong with v0.7.x

We tried to add `expo-updates` to our DIY GitHub-Actions Gradle pipeline.
Three Gradle hangs in a row, each requiring a separate fix:

1. `expo-updates:verifyReleaseResources FAILED` — fixed by adding
   `expo-updates` to app.json `plugins` array so prebuild writes the
   AndroidManifest meta-data.
2. `:app:sdkReleaseDependencyData FAILED` — Android Gradle Plugin's SDK
   Index disclosure task failed; fixed by `-x sdkReleaseDependencyData`.
3. Run #24 hung at "Build standalone release APK" for 117 minutes with
   zero output. Root cause unknown — likely another Gradle task we'd
   need to skip or configure.

The pattern is clear: adding `expo-updates` to a SDK-54 RN-0.81 project
introduces a chain of Android tooling compatibility issues. Our DIY
pipeline isn't equipped to handle them.

## The right approach (next attempt)

Use **EAS Build cloud**, not our DIY Gradle CI. Reasons:

- EAS Build is Expo's first-party build service. It handles the exact
  Gradle config issues we keep hitting — that's literally what it's for.
- It's free up to 30 builds/month, more than enough for our pre-launch
  cadence (we're at ~5 builds/week).
- Setup: `eas build:configure` once → `eas build --platform android --profile preview`
  per release. No Gradle daemon mysteries.

## Plan for the next OTA attempt

Allocate a full dedicated session. Steps:

1. Sign in to EAS via `EXPO_TOKEN` (already in our GitHub Secrets).
2. Create `eas.json` with three profiles: `development`, `preview` (sideload APK),
   `production` (Play Store AAB).
3. Build a **test APK** that does nothing but boot the app + log a heartbeat
   on launch — no business logic. Verify it reaches Patrick's phone and
   the OTA mechanism works (push a trivial JS change, see it apply).
4. Only after that test passes, layer it onto the real Hone codebase.
5. Replace our DIY `eas-build.yml` workflow with a simpler one that calls
   EAS Build remotely (or trigger via the EAS dashboard).

## What we keep from the v0.7.x attempt

- `eas-update.yml` workflow (renamed to `.disabled` — restore + adapt
  when we re-attempt).
- The understanding of `expo-updates` config (URL, runtime version,
  plugin entry).
- This document.

## What's gone

- `expo-updates` package — uninstalled.
- `app.json` `updates` section + `runtimeVersion` + plugin entry — removed.
- v0.7.0 and v0.7.1 git tags — kept in history, marked BROKEN in CHANGELOG.
