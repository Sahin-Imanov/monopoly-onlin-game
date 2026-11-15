@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js 22 ve ya 24 qurun.
 pause
 exit /b 1
)
if not exist node_modules (
 call npm ci
 if errorlevel 1 exit /b 1
)
echo Brauzerde http://localhost:3000 acin.
echo Serveri dayandirmaq ucun Ctrl+C.
call npm start
pause
