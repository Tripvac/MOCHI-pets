@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
    echo Node.js 22 or newer is required for the shared home.
    echo You can open MOCHI-play.html without installing anything.
    pause
    exit /b 1
)
set MOCHI_HOST=0.0.0.0
node scripts/start-shared.mjs
pause
