@echo off
cd /d "%~dp0"
echo =========================================
echo       Starting NutriSync Full Stack      
echo =========================================
echo.

echo [1/3] Starting PostgreSQL Database via Docker...
docker compose up -d
echo.

echo [2/3] Starting FastAPI Backend & Applying Database Migrations...
start "NutriSync Backend" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\activate && alembic upgrade head && uvicorn app.main:app --reload"
echo Backend window opened!
echo.

echo [3/3] Starting React Frontend...
start "NutriSync Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo Frontend window opened!
echo.

echo =========================================
echo All services have been launched!
echo.
echo Frontend URL: http://localhost:8443
echo Backend API:  http://localhost:8000/docs
echo =========================================
echo.
pause
