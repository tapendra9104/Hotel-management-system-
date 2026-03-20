@echo off
REM GrandStay Hotel - Run the backend in the current terminal

setlocal
for %%I in ("%~dp0..\..") do set "PROJECT_ROOT=%%~fI"
set "PORT=5001"

echo.
echo ========================================
echo   GrandStay Hotel - Project Startup
echo ========================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

cd /d "%PROJECT_ROOT%"

if not exist "backend\node_modules" (
    echo [1/2] Installing backend dependencies...
    call npm --prefix backend install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install backend dependencies.
        pause
        exit /b 1
    )
)

echo [2/2] Launching GrandStay backend...
echo.
echo Website: http://localhost:%PORT%
echo Backend: TypeScript + SQLite
echo Frontend: Static site served by the backend
echo.

call npm --prefix backend run dev
