@echo off
echo 🌊 침수 모니터링 시스템 시작...
echo.

cd /d "%~dp0"
python monitoring_flood.py

pause
