@echo off
title Forza Telemetry - Build Release
echo =========================================
echo   Building Forza Horizon 6 Telemetry
echo =========================================
echo.

echo [1/4] Building Frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo [2/4] Copying UI to Backend...
if exist backend\public rmdir /s /q backend\public
mkdir backend\public
xcopy /e /i frontend\dist\* backend\public\ >nul

echo [3/4] Building Backend TypeScript...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo Backend build failed!
    pause
    exit /b %errorlevel%
)

echo [4/4] Packaging to .exe...
call npx pkg . --targets node18-win-x64 --output ..\ForzaTelemetry.exe
if %errorlevel% neq 0 (
    echo Packaging failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo =========================================
echo   Build Successful! 
echo   ForzaTelemetry.exe has been created.
echo =========================================
pause
