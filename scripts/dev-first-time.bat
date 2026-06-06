@echo off
setlocal EnableDelayedExpansion

:: ─────────────────────────────────────────────────────────────────────────────
::  Tucker & Spice First-Time Build  —  run this ONCE before dev-preview.bat
:: ─────────────────────────────────────────────────────────────────────────────
::
::  What it does:
::    Compiles the native Android shell (Gradle + React Native) and installs
::    it on the emulator. This creates the "development build" that dev-preview
::    connects to every day.
::
::  How long:
::    - First run: 15-25 minutes (Gradle downloads + compiles everything)
::    - Future runs: ~1-2 minutes (only if app.json or native deps changed)
::
::  When to re-run:
::    - Once, right now (you've never built locally before)
::    - After running: npx expo install <some-new-package>
::    - After changing plugins[] in app.json
::    - On a fresh machine or after clearing the Gradle cache
::
::  You do NOT need to re-run this just to change TypeScript/layout/styles.
::  Those changes hot-reload instantly through dev-preview.bat.
::
::  PREREQUISITE: Complete the one-time Android Studio setup first.
::  See docs/dev-emulator-setup.md
:: ─────────────────────────────────────────────────────────────────────────────

set "SDK=C:\Users\patri\AppData\Local\Android\Sdk"
set "ANDROID_HOME=%SDK%"
set "PATH=%SDK%\emulator;%SDK%\platform-tools;%PATH%"
set "AVD=Hone_Dev"
set "APP_DIR=C:\Users\patri\hone\mobile"

echo.
echo  ===========================================
echo    Tucker & Spice First-Time Build
echo    Make a coffee. This takes 15-25 minutes.
echo  ===========================================
echo.

:: ── Step 1: Start emulator (needs to be running for install) ─────────────
adb devices 2>nul | findstr /R "emulator-[0-9]" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Emulator already running.
    goto :BUILD
)

echo  [1/2] Starting Android emulator "%AVD%"...
start "" "%SDK%\emulator\emulator.exe" -avd "%AVD%" -no-snapshot-save -no-boot-anim

echo  [1/2] Waiting for emulator to boot...
set /A TRIES=0
:WAIT_BOOT
set /A TRIES+=1
if %TRIES% GTR 90 (
    echo.
    echo  [!] Emulator taking a while. Wait for the home screen in the emulator
    echo      window, then press any key to continue.
    pause >nul
    goto :BUILD
)
timeout /t 2 /nobreak >nul
for /f "tokens=*" %%B in ('adb shell getprop sys.boot_completed 2^>nul') do (
    if "%%B"=="1" goto :BOOTED
)
<nul set /p "=."
goto :WAIT_BOOT

:BOOTED
echo.
echo  [OK] Emulator booted.
adb shell input keyevent 82 >nul 2>&1

:BUILD
:: ── Step 2: Compile + install ─────────────────────────────────────────────
echo.
echo  [2/2] Building and installing Tucker & Spice on the emulator...
echo        (You will see a lot of Gradle output — that is normal.)
echo.
cd /d "%APP_DIR%"
npx expo run:android

echo.
echo  ===========================================
echo    DONE!
echo    From now on, just run dev-preview.bat
echo    to start your live preview instantly.
echo  ===========================================
echo.
pause
endlocal
