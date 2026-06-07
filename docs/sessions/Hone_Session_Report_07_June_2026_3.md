# Session Report — 7 June 2026 (Session 3)

**Engineer:** Senior Engineer (Claude Code)
**Headline:** Diagnosed and fixed the APK startup freeze (build #156) at its real root cause; proven on a real emulator. Plus a live design pass (Light/Dark themes, Settings screen, measurement units, simplified servings).

---

## 1 · Startup freeze — the main event

### What it was
The installed APK booted and hung forever on the native amber splash. Earlier work (`ab031a9`) hypothesised a `SQLiteProvider`/DB-failure cause and added an error screen + watchdog — valid hardening, but it **did not fix the freeze** (the freeze was never reproduced, because the smoke test had a bug and never actually ran).

### The real root cause (proven on-device)
A React render-ordering bug:

- On-device `[TS-BOOT]` logcat (build #159) showed the app boots cleanly — RN mounts, `setupDatabase` completes in ~0.86 s, **no crash** — yet renders **zero** content (Maestro saw zero TextViews, only the splash image).
- `RootLayout` computed `ready=true` early, but `SQLiteProvider` renders `null` until its async DB open resolves (~0.77 s). So `AppShell` mounted **late, carrying a stale `ready=false`** prop, and **never re-rendered** when `ready` flipped true → `AppShell` returned `null` forever → blank → frozen splash.
- **Why web never caught it:** `ready = Platform.OS === 'web' || …` short-circuits to `true` on web. The web preview *structurally* cannot exercise the native readiness path — so it passed every web/CI check yet froze on device.

### The fix (`599eb98`, build #161)
`AppShell` now owns `useFonts` + the 2.5 s timeout + the `ready` gate itself, so its own state drives its own re-renders — no readiness prop threaded across `SQLiteProvider`'s async-load boundary. `AppShell` only mounts once the DB is ready anyway, so it's strictly simpler *and* correct.

**Confirmed:** build #161 startup-smoke asserts "Browse by cuisine" + "Kitchen" both visible on an API-26 emulator. Smoke job green end to end.

### Supporting work
- **`startup-smoke` workflow activated** — it boots the built APK on an emulator after every build and runs `maestro/flows/01-kitchen-loads.yaml`. This is what finally caught the freeze. Fixed two of its own bugs along the way: the flow used an invalid `assertVisible.timeout` (→ `extendedWaitUntil`), and logcat capture needed a background-file + separate-print step. The emulator-runner step returns a flaky non-zero on teardown, so it's `continue-on-error` and the real result is enforced from `/tmp/maestro_exit`.
- **Retry race** hardened (`dbGenerationRef`) so a superseded DB-init completion can't clobber a retry (`4c3a4df`).
- **Cold-boot speed** — seed + sync passes wrapped in `withTransactionAsync`; `setupDatabase` now ~0.86 s (`4c3a4df`).
- **Failure-mode flow** `maestro/flows/00-db-error-screen-shows.yaml` (manual) added.
- **CLAUDE.md rule** added: startup/provider/DB/splash/font/native changes require an on-device boot check; web preview is not sufficient.

### Still required (Patrick only — R-015)
On-device cold-install validation of build #161, and the forced-throw `DbErrorScreen` check. BUGS.md STARTUP-FREEZE left at **FIX ATTEMPTED**.

---

## 2 · Design + feature work (earlier in the session)

- **Themes renamed** Stealth/Neon → **Dark/Light**; toggle moved into a new **Settings** screen (opened from the profile avatar) with a proper sun/moon switch.
- **Web font-load race fixed** (no more black screen on web).
- **Settings → Cooking:** "Cooking for N" default servings, persisted in SQLite, pre-scales people-based recipes (count-based dishes ignore it).
- **Settings → Measurements:** °C/°F + ml/cups, exact conversions only; weights stay in grams (honest about limits).
- **Recipe scaler simplified** to "How many servings?" — leftover-mode selector removed (scaling unchanged).

---

## 3 · Build / verification

- Final build: **#161** (`tuckerspice-v0.5.0-build161`, 60.5 MB). Startup-smoke green.
- `tsc --noEmit`: 4 pre-existing errors only (pantry `@react-navigation/native`, 3× SearchOverlay route types). Zero new.
- hermes-parser passes on `seed-recipes.ts`.

## 4 · Housekeeping notes
- `BUGS.md` has a stray null byte (~offset 10205) — worth a cleanup pass.
- Untracked scratch files remain in the tree (`mobile/_test/`, `mobile/src/_truncated_test.ts`, `.claude/worktrees/`) — not imported, candidates for `.gitignore`/deletion.
- `docs/FILE_MAP.md` should list this session's new files (`settings.tsx`, `units.ts`, `PreferencesContext.tsx`, `ThemeContext.tsx`, `allergens.ts`, the two new workflows, the two new maestro flows).
