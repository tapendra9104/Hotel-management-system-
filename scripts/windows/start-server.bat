@echo off
REM GrandStay Hotel - Start the full-stack app in a new terminal window

setlocal
for %%I in ("%~dp0..\..") do set "PROJECT_ROOT=%%~fI"
set "PORT=5001"

echo.
echo ==========================================
echo GrandStay Hotel - Server Launcher
echo ==========================================
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| find ":%PORT%"') do (
  set "PID=%%a"
)

if defined PID (
  echo [INFO] GrandStay is already running on http://localhost:%PORT% (PID: %PID%)
  echo.
  start "" "http://localhost:%PORT%"
  exit /b 0
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Node.js is not installed or not in PATH.
  pause
  exit /b 1
)

if not exist "%PROJECT_ROOT%\backend\node_modules" (
  echo [INFO] Installing backend dependencies...
  call npm --prefix "%PROJECT_ROOT%\backend" install
  if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
  )
)

echo [INFO] Starting backend from "%PROJECT_ROOT%\backend" using TypeScript runtime
start "GrandStay Backend" cmd /k "cd /d ""%PROJECT_ROOT%"" && npm --prefix backend start"

echo.
echo [SUCCESS] GrandStay is starting.
echo Website: http://localhost:%PORT%
echo.
timeout /t 2 >nul
start "" "http://localhost:%PORT%"
