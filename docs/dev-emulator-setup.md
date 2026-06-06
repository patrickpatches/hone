# Tucker & Spice — Local Dev Preview Setup

Everything has been set up automatically. You have two steps left, then it's one double-click forever.

---

## What's already done (Claude set this up for you)

- ✅ Android SDK command-line tools installed
- ✅ Android 35 system image downloaded and installed (~1.5 GB)
- ✅ `Hone_Dev` virtual device (Pixel 8a, API 35) created
- ✅ `expo-dev-client` added to the project
- ✅ `scripts\dev-preview.bat` — your daily launcher
- ✅ `scripts\dev-first-time.bat` — one-time native build

---

## Two steps left

### Step 1 — Speed up the emulator (one admin command)

Right-click **`scripts\dev-setup-admin.bat`** → **Run as administrator**.

That's it. One second. Starts the hardware virtualisation driver so the emulator runs fast. You never need to do this again.

*(If the emulator already runs fine without this, skip it.)*

---

### Step 2 — First-time native build (run once, ~15–25 minutes)

Double-click **`scripts\dev-first-time.bat`**.

This compiles the native Android shell and installs it on the emulator. It's slow the first time (Gradle is building everything from scratch). When you see **"DONE! From now on, just run dev-preview.bat"** — you're finished.

You never need to run this again unless you install a new package with native code (rare).

---

## Daily use — one double-click

**Double-click `scripts\dev-preview.bat`**

1. Emulator boots automatically
2. App opens automatically
3. Edit any file in `mobile\` → app refreshes in ~1 second

---

## The edit → ship loop

```
Edit a file in mobile\
    ↓  (~1 second — Fast Refresh)
See the change in the emulator
    ↓  happy?
git push → GitHub Actions → new APK for your phone
```

**Shortcut for visual-only changes (colours, labels, spacing):**  
Push → ask the Engineer to trigger an OTA update via EAS Update.  
The change appears on your phone without downloading a new APK.

---

## Keyboard shortcuts while dev-preview is running

| Key | What it does |
|-----|------|
| `a` | Reopen / refocus the app on the emulator |
| `r` | Force a full JS reload (clears all state) |
| `m` | Open the dev menu (same as shaking the phone) |
| `Ctrl+C` | Stop the server (emulator keeps running) |

---

## Shared with Maestro screen tests (Issue #18)

Same `Hone_Dev` AVD. Start the emulator via dev-preview, install the test APK, then run `scripts\maestro-local.sh` — it connects to the same running device.

---

## When to re-run dev-first-time.bat

Only when:
- You run `npx expo install <something>` and it has native code
- You change `plugins[]` in `app.json`
- You set up on a new machine

For all TypeScript / layout / style / logic changes — dev-preview handles it instantly, no rebuild needed.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Emulator very slow | Run `dev-setup-admin.bat` as administrator |
| App doesn't open | Press `a` in the Expo terminal window |
| "AVD not found" | Confirm AVD exists: open Android Studio → Tools → Device Manager → you should see `Hone_Dev` |
| Gradle error on first build | Run `dev-first-time.bat` again — sometimes first run fails on slow connections |
