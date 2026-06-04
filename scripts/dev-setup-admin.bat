@echo off
:: ─────────────────────────────────────────────────────────────────────────────
::  Hone — ONE-TIME admin step
::  Right-click this file → "Run as administrator"
::  You only ever need to do this once.
::
::  What it does: starts the Android Emulator Hypervisor driver (AEHD).
::  Without it the emulator still works, just slower.
:: ─────────────────────────────────────────────────────────────────────────────
sc start aehd
if %ERRORLEVEL% EQU 0 (
    echo.
    echo  Done! The emulator will now run at full speed.
    echo  You never need to run this script again.
) else (
    echo.
    echo  Note: AEHD may already be active, or your PC uses a different
    echo  virtualisation backend (Hyper-V / WHPX). Either way the emulator
    echo  will work — this is just a speed optimisation.
)
echo.
pause
