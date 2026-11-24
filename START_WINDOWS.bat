@echo off
setlocal
cd /d "%~dp0"
if not exist "MOCHI-play.html" (
    echo MOCHI-play.html is missing. Extract the entire archive first.
    pause
    exit /b 1
)
start "" "%~dp0MOCHI-play.html"
