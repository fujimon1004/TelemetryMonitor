@echo off
title Forza Telemetry - Mock Server
echo =========================================
echo   Forza Horizon 6 Telemetry (MOCK MODE)
echo =========================================
echo.
echo Starting Backend Server...
start "Forza Telemetry Backend" cmd /c "cd backend && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting Frontend Server...
start "Forza Telemetry Frontend" cmd /c "cd frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo Starting Mock Data Sender...
start "Forza Telemetry Mock Sender" cmd /c "cd backend && npm run mock"

echo.
echo Mock Servers are running! 
echo Frontend is available at http://localhost:5173
echo.
echo Close this window to keep the servers running in the background.
echo (To stop, close the three opened command prompt windows)
echo.
pause
