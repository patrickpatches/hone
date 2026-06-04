@echo off
setlocal EnableDelayedExpansion

:: ─────────────────────────────────────────────────────────────────────────────
::  Hone Dev Preview  —  double-click to start your live preview
:: ─────────────────────────────────────────────────────────────────────────────
::
::  What it does:
::    1. Starts the Android emulator (Hone_Dev)
::    2. Waits for it to finish booting
::    3. Starts the Expo hot-reload server
::    4. Opens the app on the emulator automatically
::
::  Once it's running:
::    - Edit any file in mobile\ and the app reloads within ~1 second.
::    - Your phone can also connect — scan the QR code shown below with
::      the "Expo Go" app (iOS) or the Hone dev build (Android).
::    - Press 'r' in this window to force a full reload.
::    - Press 'Ctrl+C' to stop. The emulator keeps running.
::
::  PREREQUISITE: Run dev-first-time.bat once before using this script.
::
::  AVD NAME: "Hone_Dev"  — create it in Android Studio > Device Manager
::  (See docs/dev-emulator-setup.md for the full one-time setup guide.)
:: ─────────────────────────────────────────────────────────────────────────────

set "SDK=C:\Users\patri\AppData\Local\Android\Sdk"
set "ANDROID_HOME=%SDK%"
set "PATH=%SDK%\emulator;%SDK%\platform-tools;%PATH%"
set "AVD=Hone_Dev"
set "APP_DIR=C:\Users\patri\hone\mobile"

echo.
echo  ===========================================
echo    Hone Dev Preview
echo  ===========================================
echo.

:: ── Step 1: Check if emulator is already running ─────────────────────────
adb devices 2>nul | findstr /R "emulator-[0-9]" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Emulator already running — skipping launch.
    goto :START_EXPO
)

:: ── Step 2: Start the emulator ───────────────────────────────────────────
echo  [1/2] Starting Android emulator "%AVD%"...
echo        (A new window will open — that is the phone screen.)
echo.
start "" "%SDK%\emulator\emulator.exe" -avd "%AVD%" -no-snapshot-save -no-boot-anim

:: ── Step 3: Wait for the emulator to fully boot ──────────────────────────
echo  [1/2] Waiting for emulator to finish booting (30-90 seconds)...
set /A TRIES=0

:WAIT_BOOT
set /A TRIES+=1
if %TRIES% GTR 90 (
    echo.
    echo  [!] Emulator is taking longer than expected.
    echo      If the emulator window opened, wait until you see the home screen,
    echo      then press any key here to continue.
    pause >nul
    goto :BOOT_DONE
)
timeout /t 2 /nobreak >nul
for /f "tokens=*" %%B in ('adb shell getprop sys.boot_completed 2^>nul') do (
    if "%%B"=="1" goto :BOOT_DONE
)
<nul set /p "=."
goto :WAIT_BOOT

:BOOT_DONE
echo.
echo  [OK] Emulator booted.
:: Dismiss the lock screen
adb shell input keyevent 82 >nul 2>&1
timeout /t 1 /nobreak >nul

:START_EXPO
:: ── Step 4: Launch the Expo dev server ───────────────────────────────────
echo.
echo  [2/2] Starting Expo hot-reload server...
echo        The app will open on the emulator automatically.
echo.
echo  ┌──────────────────────────────────────────────────────────┐
echo  │  Edit any file → app reloads in ~1 second               │
echo  │  Press 'r'     → force full reload                      │
echo  │  Press 'a'     → reopen on emulator                     │
echo  │  Press Ctrl+C  → stop server (emulator stays open)      │
echo  └──────────────────────────────────────────────────────────┘
echo.

cd /d "%APP_DIR%"
npx expo start --android

endlocal
pause
