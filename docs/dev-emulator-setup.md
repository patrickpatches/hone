# Hone — Local Dev Preview Setup

One-time setup so you can run `scripts\dev-preview.bat` and see the app live on your desktop with hot reload.

**Total time: ~30-40 minutes** (mostly download/install waits).  
**You only do this once.** After this it's one double-click to start.

---

## What you'll end up with

```
Double-click dev-preview.bat
  → Emulator boots (phone on screen)
  → App opens automatically
  → Edit any file in mobile\ → app refreshes in ~1 second
```

---

## One-time installs

### Step 1 — Install the Android Emulator Hypervisor Driver  
*(Makes the emulator run fast — do this first)*

1. Open **File Explorer** and go to:  
   `C:\Users\patri\AppData\Local\Android\Sdk\extras\google\Android_Emulator_Hypervisor_Driver`
2. Right-click `silent_install.bat` → **Run as administrator**
3. A console window flashes — that means it worked.

---

### Step 2 — Install the Android system image in Android Studio

*(The "phone brain" the emulator runs — not installed yet)*

1. Open **Android Studio**
2. Top menu → **Tools → SDK Manager**
3. Click the **SDK Platforms** tab
4. Find **Android API 35** in the list. Click the row to expand it.
5. Tick: **Google APIs Intel x86_64 Atom System Image**
6. Click **Apply** → **OK** to download (~1.5 GB, takes a few minutes)

---

### Step 3 — Create the virtual device (AVD)

1. In Android Studio: top menu → **Tools → Device Manager**
2. Click the **+** button (or "Create Virtual Device")
3. Choose **Phone** category, select **Pixel 8a** → click **Next**
4. Click the **x86 Images** tab at the top
5. Find the row **API Level 35, ABI x86_64, Target "Google APIs"** — click **Download** if needed, then select it → **Next**
6. Under **AVD Name**, type exactly: **`Hone_Dev`**
   *(The scripts look for this exact name)*
7. Leave everything else as default → **Finish**

---

### Step 4 — Run the first-time native build (once only)

This compiles the app's native Android code and installs it on the emulator. Takes 15–25 minutes the first time.

1. Double-click **`scripts\dev-first-time.bat`**
2. Watch the emulator boot and Gradle compile
3. When you see "DONE! From now on, just run dev-preview.bat" — you're set.

---

## Daily use

**Double-click `scripts\dev-preview.bat`** — that's it.

The emulator boots, the app opens, and any change you save in `mobile\` appears in ~1 second without a full restart.

---

## The edit → see loop

```
You save a file in mobile\
      ↓ (~1 second)
Fast Refresh updates the running app
      ↓ (no app restart needed)
You see the change
      ↓
Happy? → git push → GitHub Actions builds the APK → install on phone
```

**Shortcut for look/wording-only changes:**  
Once you're happy with something visual (a colour, a label, spacing), you can push and it gets sent to an already-installed APK as an **OTA update** via EAS Update — no new APK download needed. Ask the Engineer to trigger an OTA update after landing the change.

---

## Keyboard shortcuts in the Expo terminal (while dev-preview is running)

| Key | What it does |
|-----|------|
| `a` | Open / relaunch the app on the emulator |
| `r` | Force a full JS reload (clears all state) |
| `m` | Toggle the dev menu (shake gesture equivalent) |
| `Ctrl+C` | Stop the server (emulator stays open) |

---

## When to re-run dev-first-time.bat

You only need to redo the first-time build when:
- You install a new Expo package that has native code (rare)
- You change `plugins[]` in `app.json`
- You switch to a new machine

For all TypeScript / UI / logic / style changes → `dev-preview.bat` handles it, no rebuild needed.

---

## Sharing the emulator with Maestro screen tests

The `Hone_Dev` AVD is the same emulator the `scripts\maestro-local.sh` test harness uses.  
Start the emulator (via dev-preview or manually from Android Studio Device Manager),  
install the test APK, then run Maestro — it connects to the already-running `Hone_Dev`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "AVD not found" | Open Android Studio Device Manager and confirm the AVD is named exactly `Hone_Dev` |
| Emulator is very slow | Check Step 1 (hypervisor driver) was run as admin |
| App doesn't open after Metro starts | Press `a` in the Expo terminal |
| "SDK location not found" | The scripts set `ANDROID_HOME` automatically — if it still fails, check that `C:\Users\patri\AppData\Local\Android\Sdk` exists |
| Gradle error on first build | Run `dev-first-time.bat` again — sometimes the first Gradle run fails on a slow connection |
