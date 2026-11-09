@echo off
title Icelauch Launcher
cd /d "%~dp0"
echo ========================================================
echo       DANG KHOI DONG TRINH QUAN LY GAME ICELAUCH
echo ========================================================
echo.
set ELECTRON_RUN_AS_NODE=
start "" "node_modules\electron\dist\electron.exe" "%~dp0."
