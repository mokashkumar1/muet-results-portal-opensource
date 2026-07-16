@echo off
REM MUET Results Portal - Automated Deploy Script
REM Automates data compiling, sitemap rebuilding, staging, and git push pipelines.

echo ============================================================
echo [DEPLOY] Starting deployment pipeline...
echo ============================================================

REM 1. Compile CSV data and rebuild sitemap automatically to prevent out-of-sync pushes
echo [DEPLOY] Running build scripts (compiling CSV data and regenerating sitemaps)...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build step failed! Aborting deployment.
    pause
    exit /b 1
)

REM 2. Display git status so the user knows what changes exist
echo.
echo ============================================================
echo [DEPLOY] Current Git Status:
echo ============================================================
call git status
echo ============================================================
echo.

REM 3. Stage all modified and new files
echo [DEPLOY] Staging all files...
call git add .
if errorlevel 1 (
    echo [ERROR] Failed to stage files!
    pause
    exit /b 1
)

REM 4. Generate conventional commit message using the helper script
for /f "delims=" %%i in ('node scripts\generate-commit-message.js') do set COMMIT_MSG=%%i

if "%COMMIT_MSG%"=="" (
    echo [DEPLOY] No changes detected to commit. Exiting.
    pause
    exit /b 0
)

echo ============================================================
echo [DEPLOY] Auto-generated commit message:
echo "%COMMIT_MSG%"
echo ============================================================
echo.

REM 5. Prompt for verification before committing (Never auto-push blindly)
set /p CONFIRM="Do you want to commit and push using the above message? (Y/N): "

if /i "%CONFIRM%"=="Y" (
    echo.
    echo [DEPLOY] Committing changes...
    call git commit -m "%COMMIT_MSG%"
    if errorlevel 1 (
        echo [ERROR] Git commit failed!
        pause
        exit /b 1
    )
    
    echo.
    echo [DEPLOY] Pushing changes to remote...
    call git push
    if errorlevel 1 (
        echo [ERROR] Git push failed! Please check your network connection or conflicts.
        pause
        exit /b 1
    )

    echo.
    echo ============================================================
    echo [SUCCESS] Push succeeded! Vercel Git integration will deploy automatically.
    echo ============================================================
    call git log -1 --oneline
) else (
    echo.
    echo [DEPLOY] Deployment cancelled by user. Staged changes remain in index.
)

pause
