# Hone Session Report — 7 June 2026 (Session 2)

**Role:** Senior Engineer (Claude Code)
**Commit:** `ab031a9` — fix: APK startup freeze — two root causes
**Branch:** main
**Build triggered:** No (Patrick's call per CLAUDE.md builds protocol)

---

## What was fixed

### Bug 1 — Syntax error in seed-recipes.ts (PAD_THAI)

**Root cause:** The cook's daily culinary review (commit `b5ecc84`) rewrote PAD_THAI step s1 content using a single-quoted JS string literal containing an unescaped apostrophe: `'...Sweet-sour leads, then salty — that's the authentic balance...'`. The apostrophe in `that's` closes the string literal early. Hermes-parser (the React Native JS engine's parser) fails at line 1849:212 with `'}' expected` — the rest of the line becomes stray tokens that prevent the module from loading at all.

**Fix:** Escaped the apostrophe to `that\'s`, matching the convention used throughout the file (`doesn\'t`, `aren\'t`, etc.).

**Verified:** Ran hermes-parser on HEAD (fails at 1849:212) and on the fixed working tree (passes).

---

### Bug 2 — Splash screen freeze under SQLiteProvider error or hang

**Root cause:** Two separate refactors combined to create a silent failure mode:

1. The theme refactor moved `SplashScreen.hideAsync()` from `RootLayout` (always mounted) into `AppShell` (a child of `SQLiteProvider`).
2. `SQLiteProvider` (NonSuspense path, see `node_modules/expo-sqlite/build/hooks.js` lines 71–118) returns `null` while its `onInit` promise is in flight. `AppShell` therefore never renders until the DB is ready.

With no `onError` prop: when `setupDatabase` throws (locked file, interrupted WAL, schema migration error), `SQLiteProvider` catches it internally and re-throws it during render, crashing the tree silently. No `SplashScreen.hideAsync()` ever fires. The native amber splash screen stays up permanently.

Pure hang case: if `onInit` simply never resolves (DB file lock that doesn't throw), the same `null` rendering continues forever — also a frozen splash.

**Fix in `mobile/app/_layout.tsx`:**

| Added | Purpose |
|---|---|
| `onError={onDbError}` on `SQLiteProvider` | Intercepts throw instead of letting it crash the render tree |
| `onDbError` callback | Logs with full attempt context (`console.error` — swap for `Sentry.captureException` at launch); sets `dbError` state |
| 15 s watchdog timer | Fires `setDbError` if `onInit` never completes; resets on each retry attempt |
| `DbErrorScreen` component | Renders outside all context providers; calls `SplashScreen.hideAsync()` in a `useEffect`; built from raw RN primitives + static `tokens` (no theme/SQLite context needed); shows plain error text, attempt count, Try again button |
| `dbAttempt` counter | Its identity change propagates through `onDbInit` (a `useCallback` dep) → SQLiteProvider's `useEffect` deps → triggers teardown + fresh `openDatabaseWithInitAsync`. Recovers transient issues (temp lock, interrupted checkpoint). Honest in the UI: hard failures (corrupted file, disk full) need a full process restart — told explicitly after the first failed retry |

**The existing success path and theme-switch remount are untouched.**

---

## Verifications run

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 4 pre-existing errors (pantry.tsx missing @react-navigation/native; SearchOverlay.tsx route type mismatch). **Zero new errors** from this commit. |
| hermes-parser on HEAD commit | **FAILS**: `'}' expected at end of object literal` at 1849:212 |
| hermes-parser on working tree | **PASSES** |
| Zod validation — all 16 SEED_RECIPES | **16/16 pass** |

---

## Bug Lord update

- `STARTUP-FREEZE` added to `BUGS.md` — status: **FIX ATTEMPTED**. Awaiting Patrick on-device validation (R-015 — only Patrick closes tickets).
- No build triggered. Patrick to trigger preview build at his discretion.

---

## Files changed

| File | Change |
|---|---|
| `mobile/app/_layout.tsx` | +194 lines — DB resilience: onError, watchdog, DbErrorScreen, retry |
| `mobile/src/data/seed-recipes.ts` | Apostrophe fix in PAD_THAI s1; cook's review changes also staged |
| `docs/FILE_MAP.md` | Allergen module row (was in working tree from prior session, now committed) |
| `BUGS.md` | STARTUP-FREEZE FIX ATTEMPTED entry + root cause notes |
| `.gitignore` | `.icon-gen/` added |
