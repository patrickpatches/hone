# TICKET — Startup freeze: verify the fix holds and harden what's fragile

| | |
|---|---|
| **Status** | READY TO BUILD |
| **Owner** | Senior Engineer |
| **Priority** | P0 — blocks next usable build for Patrick |
| **Primary files** | `mobile/app/_layout.tsx`, `mobile/db/database.ts`, `mobile/db/seed.ts`, `maestro/flows/01-kitchen-loads.yaml` |
| **Do not touch** | Any screen outside `_layout.tsx` unless a specific task below requires it. The recipe detail, cook mode, plan, and pantry screens are unrelated and must not regress. |

---

## What went wrong

Patrick reported the latest APK boots and hangs forever on the native amber splash screen. Two root causes were identified and partially fixed. Neither has been confirmed on-device yet.

---

## What has already been done (commits `ab031a9`, `703fa8a`)

Read these diffs before writing a single line of code. Do not redo work that is already correct.

**Bug 1 — syntax error, PAD_THAI step s1 (`ab031a9`)**
`seed-recipes.ts` had an unescaped apostrophe in a single-quoted JS string:
`'...that's the authentic balance...'`. Hermes-parser failed at line 1849:212.
Fix: escaped to `that\'s`. Confirmed with hermes-parser: HEAD passes, prior commit failed.

**Bug 2 — SQLiteProvider left no escape hatch (`ab031a9`)**
`SplashScreen.hideAsync()` lives in `AppShell`, which is a child of `SQLiteProvider`.
`SQLiteProvider` (NonSuspense path — see `mobile/node_modules/expo-sqlite/build/hooks.js` lines 71–118) returns `null` while its `onInit` is running. With no `onError` prop, any throw inside `setupDatabase` re-throws during render with no error boundary. The native splash stays up forever. A pure hang (locked DB, stalled WAL) is equally silent.

Fix applied:
- `onError={onDbError}` added to `SQLiteProvider` — intercepts throws, logs them, sets `dbError` state
- 15 s watchdog timer resets on each `dbAttempt` and fires `setDbError` if `onInit` never completes
- `DbErrorScreen` component: renders outside all context providers, calls `SplashScreen.hideAsync()`, shows the error and a "Try again" button
- Retry: `dbAttempt` counter is a dep of `onDbInit` (`useCallback`), so incrementing it changes the callback identity → SQLiteProvider re-runs its `useEffect` → fresh `openDatabaseWithInitAsync`

**CI smoke timeout (`703fa8a`)**
`maestro/flows/01-kitchen-loads.yaml` `assertVisible` timeout increased 6 000 → 25 000 ms. Rationale: a cold first boot on a GitHub Actions x86_64 emulator takes 8–12 s for DB init (migrations + seed 16 recipes over virtualised I/O). 25 s still catches all real failures — a DB error shows `DbErrorScreen` not "Browse by cuisine"; a hang shows `DbErrorScreen` by t=15 s; a true frozen splash shows nothing.

---

## What is NOT yet confirmed

The Android APK build on `aff0e95` (which includes Bug 2 fix) succeeded. The startup smoke test ran against it and **failed** — but the failure was almost certainly the 6 s timeout, not a broken app (the timeout is now fixed). **No human has confirmed the app boots cleanly on a real device since the fix landed.**

You must confirm this. Steps are below.

---

## Your tasks, in order

### Task 0 — Read before touching anything

1. Read `mobile/app/_layout.tsx` in full. Understand the provider hierarchy comment at the top, the `DbErrorScreen` component, the `onDbInit`/`onDbError` callbacks, the watchdog `useEffect`, and how `dbAttempt` forces a retry. You will be responsible for not breaking any of this.
2. Read `mobile/node_modules/expo-sqlite/build/hooks.js` lines 71–118 (`SQLiteProviderNonSuspense`). Confirm your mental model of what `onInit`, `onError`, and the `loading` state do.
3. Read `mobile/db/seed.ts` — understand what `setupDatabase` does (migrations → seed → sync passes → validate). This is where DB init time comes from.

### Task 1 — Trigger a new build and wait for the smoke test

Trigger a new preview build via the GitHub Actions `Tucker & Spice Android Build` workflow (`workflow_dispatch`). Wait for:
- The build to complete (success expected — the syntax error is fixed)
- The startup smoke to run automatically after the build
- The smoke result

If the smoke **passes**: proceed to Task 2 (hardening).
If the smoke **fails again**: read the `maestro-startup-smoke-debug` artifact from the failed run before touching any code. The artifact contains Maestro screenshots and assertion logs showing exactly what the emulator was displaying when the assertion timed out. Do not guess — read the logs first, then diagnose.

### Task 2 — Verify on a real device (mandatory before marking done)

Per CLAUDE.md startup-critical rule: a change to `_layout.tsx`, provider hierarchy, SQLite init, or splash screen **requires an on-device boot check**. Web preview is insufficient.

With the new APK:
1. Cold install (uninstall first, then install fresh — this triggers the full first-boot DB seed path).
2. App should boot past the splash to the Kitchen screen with "Browse by cuisine" and the cuisine tiles visible.
3. Force a DB init failure to verify `DbErrorScreen` appears: the simplest way is to temporarily introduce a `throw new Error('test')` at the start of `setupDatabase`, build locally with `expo run:android`, verify the error screen shows (amber title, "Couldn't open the recipe database", "Try again" button), tap retry and confirm the DB error persists (since you threw on purpose). Remove the throw. Boot normally — confirm Kitchen loads.

Report the device model and Android version in your session report.

### Task 3 — Fix the known race condition in the retry path (do not skip)

There is a race condition in the current retry implementation. When `dbAttempt` increments and `onDbInit` identity changes, `SQLiteProvider`'s `useEffect` runs its cleanup (sets `databaseRef.current = null`, `setLoading(true)`) and starts a new `setup()` call. However, if the **previous** `setup()` call was a hanging DB open (not a throw), it is still running in the background as an orphaned async task. When it eventually resolves, it calls `databaseRef.current = old_db` and `setLoading(false)` — clobbering the new setup's state, assigning a stale DB handle, and potentially leaving two DB connections open simultaneously.

This race does not happen on the common paths (fast error or fast success) but it does happen on the watchdog path (setup hangs → watchdog fires at 15 s → user retries → old setup eventually completes).

Fix: add a cancellation flag inside the `useEffect` so stale async completions are ignored.

In `SQLiteProviderNonSuspense` (hooks.js) the effect already has a ref-based approach, but `onDbInit` (our wrapper) doesn't propagate a cancel signal. The fix lives in `_layout.tsx`, not in expo-sqlite internals. Pattern:

```tsx
const onDbInit = useCallback(async (db: SQLiteDatabase) => {
  // Each attempt gets its own token; stale completions check it before writing state.
  const attemptAtStart = dbAttempt;
  await setupDatabase(db);
  // If dbAttempt changed while we were awaiting, this attempt was superseded — ignore.
  if (dbAttempt !== attemptAtStart) return;
  dbInitializedRef.current = true;
}, [dbAttempt]);
```

Wait — `dbAttempt` is a closure value captured when the callback was created (it won't change inside the async function). That's the wrong tool for this.

Correct approach: use a `cancelled` ref scoped to each `useEffect` run. But `onDbInit` is defined outside the effect (it's a `useCallback`). The cleanest fix is to track the "current generation" in a ref and abort stale completions:

```tsx
const dbGenerationRef = useRef(0);

// When dbAttempt increments, bump the generation
useEffect(() => {
  dbGenerationRef.current += 1;
}, [dbAttempt]);

const onDbInit = useCallback(async (db: SQLiteDatabase) => {
  const myGeneration = dbGenerationRef.current;
  await setupDatabase(db);
  if (dbGenerationRef.current !== myGeneration) return; // superseded — discard
  dbInitializedRef.current = true;
}, [dbAttempt]); // eslint-disable-line react-hooks/exhaustive-deps
```

This is safe because `dbGenerationRef.current` is a mutable ref — mutations from later effects are visible to the still-running async function without needing it in the closure.

Verify this does not change normal-path behaviour: on first boot, `myGeneration === dbGenerationRef.current` when `setupDatabase` completes, so `dbInitializedRef.current` is set normally.

### Task 4 — Smoke test: add a failure-mode assertion (do not skip)

The current smoke only checks the happy path. It has no way to distinguish "Kitchen rendered" from "error screen rendered then Kitchen rendered on retry". Add a second flow that explicitly verifies the error screen is reachable:

**New file: `maestro/flows/00-db-error-screen-shows.yaml`**

This flow should only run when manually invoked (not part of the automatic post-build smoke). It:
1. Launches the app
2. Asserts "Couldn't open the recipe database" is visible within 20 s

This flow requires a specially-built APK with `setupDatabase` patched to throw immediately. Add a note in the file making this clear. It is a manual verification tool, not an automated gate — but it must exist so the error path can be spot-checked after future changes to `_layout.tsx`.

### Task 5 — Reduce cold-boot DB init time (do not skip)

A first boot that takes 8–12 s on a CI emulator is too slow. It puts pressure on the Maestro timeout and will frustrate users with slow phones. The bottleneck is `seedDatabase` in `mobile/db/seed.ts` — it runs 16 × `insertRecipe` sequentially, each of which does multiple `db.runAsync` calls.

Fix: wrap the entire first-boot seed in a single `withTransactionAsync` block so all 16 recipe inserts happen atomically in one transaction instead of 16 separate ones. SQLite flushes to disk on every transaction commit by default — batching all seed writes into one transaction turns ~80 disk flushes into 1.

```ts
// seed.ts — seedDatabase()
export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const recipe of SEED_RECIPES) {
      const parsed = RecipeSchema.safeParse(recipe);
      if (!parsed.success) { /* existing warning */ continue; }
      await insertRecipe(db, parsed.data);
    }
  });
}
```

Check that `insertRecipe` does not itself open a transaction (nested transactions are not supported by expo-sqlite). If it does, inline its operations directly.

Also wrap the `syncNewSeedRecipes` and `refreshSeedRecipeFields` passes in transactions where they loop over records.

Measure before and after: add `console.time('setupDatabase')` / `console.timeEnd('setupDatabase')` around the call in `onDbInit`. Report the time in your session report for both a cold boot (first install) and a warm boot (second launch).

---

## Constraints — read carefully

- **Do not change the provider hierarchy** in `_layout.tsx` (`GestureHandlerRootView → BottomSheetModalProvider → SQLiteProvider → PreferencesProvider → ThemeProvider → AppShell`). The order is load-bearing — see the comment at the top of the file.
- **Do not change the theme-switch remount mechanism** (`key={theme}` on `Stack` inside `AppShell`). It must continue to work.
- **Do not touch `mobile/db/schema.ts`** — schema version is 10 and no migration is needed for any of the above tasks.
- **Do not modify any recipe screen** (`recipe/[id].tsx`, `index.tsx`, etc.). If a task requires a change outside `_layout.tsx` and `db/seed.ts`, flag it first.
- **`npx tsc --noEmit` must stay clean** — same 4 pre-existing errors maximum (pantry.tsx `@react-navigation/native` and SearchOverlay.tsx route type), zero new ones.
- **All 16 SEED_RECIPES must continue to pass Zod validation** (`node mobile/_validate-seed.js` if you recreate it, or mirror the pattern from the previous session).
- **Hermes-parser must pass** on `seed-recipes.ts` at HEAD.

---

## Definition of done

- [ ] Startup smoke passes on a new CI build (post `703fa8a`)
- [ ] App confirmed to boot to Kitchen screen on a real device — cold install verified
- [ ] `DbErrorScreen` confirmed to appear when `setupDatabase` throws — tested locally
- [ ] Race condition in retry path fixed (`dbGenerationRef` pattern or equivalent)
- [ ] `00-db-error-screen-shows.yaml` Maestro flow written
- [ ] `seedDatabase` (and sync passes) wrapped in transactions
- [ ] Cold-boot time measured and reported (target: under 4 s on a mid-range device)
- [ ] `tsc --noEmit` — no new errors
- [ ] Session report written to `docs/sessions/`
- [ ] STARTUP-FREEZE ticket in `BUGS.md` moved to awaiting Patrick validation

## What only Patrick does

Patrick validates on-device and closes the ticket. Do not self-close.
