@echo off
echo 🌊 침수 모니터링 시스템 (테스트 모드) 시작...
echo.
echo 🧪 5분 간격으로 모니터링을 실행합니다.
echo.

cd /d "%~dp0"
python monitoring_flood.py --test

pause
