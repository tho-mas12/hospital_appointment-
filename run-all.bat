@echo off
title Medicare Hospital Project Launcher
echo ===================================================
echo   Starting Medicare Hospital Full-Stack Application
echo ===================================================
echo.

echo [1/2] Launching Backend Server...
start "Medicare Backend (Port 5000)" cmd /k "npm.cmd run dev"


echo.
echo [2/2] Launching Frontend Client...
cd frontend
start "Medicare Frontend (Port 5173)" cmd /k "npm.cmd run dev"

echo.
echo ===================================================
echo   Both servers are starting up in separate windows!
echo   - Frontend Client: http://localhost:5173
echo   - Backend API:     http://localhost:5000
echo ===================================================
echo.
pause
