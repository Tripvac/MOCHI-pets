@echo off
setlocal
cd /d "%~dp0"

echo Publish MOCHI 9 to https://github.com/Tripvac/MOCHI-pets
echo.
where git >nul 2>nul
if errorlevel 1 (
    echo Git is required. Install Git for Windows, then run this file again:
    echo https://git-scm.com/downloads/win
    pause
    exit /b 1
)
if not exist "package.json" (
    echo Extract the entire MOCHI folder before running this file.
    pause
    exit /b 1
)

if not exist ".git" (
    git init -b main
    if errorlevel 1 goto failed
)

git remote get-url mochi-github >nul 2>nul
if errorlevel 1 (
    git remote add mochi-github https://github.com/Tripvac/MOCHI-pets.git
    if errorlevel 1 goto failed
) else (
    git remote get-url mochi-github | findstr /i /x /c:"https://github.com/Tripvac/MOCHI-pets.git" >nul
    if errorlevel 1 (
        echo The mochi-github remote points to a different repository. No push performed.
        pause
        exit /b 1
    )
)

git config user.name >nul 2>nul
if errorlevel 1 git config --local user.name Tripvac
git config user.email >nul 2>nul
if errorlevel 1 git config --local user.email 130146108+Tripvac@users.noreply.github.com

git add -- .gitattributes .gitignore README.md README_RU.md package.json package-lock.json index.html tsconfig.json vite.config.ts server.mjs run.py START_WINDOWS.bat START_SHARED_WINDOWS.bat PUBLISH_GITHUB_WINDOWS.bat src shared public phone-widget scripts tests docs
if errorlevel 1 goto failed

git diff --cached --quiet
if errorlevel 2 goto failed
if errorlevel 1 (
    git commit -m "Publish MOCHI 9 with full documentation"
    if errorlevel 1 goto failed
)

echo.
echo Sign into GitHub as Tripvac if a sign-in window appears.
echo This sends source files to the main branch without force-pushing.
git push -u mochi-github HEAD:main
if errorlevel 1 goto failed

echo.
echo Published successfully.
start "" "https://github.com/Tripvac/MOCHI-pets"
pause
exit /b 0

:failed
echo.
echo Publication stopped. Read the Git error above. No force push was used.
echo If GitHub already contains commits, do not delete them to bypass this error.
pause
exit /b 1
