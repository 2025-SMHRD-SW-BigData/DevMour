@echo off
echo ========================================
echo    AI 도로 위험도 분석 시스템 시작
echo ========================================
echo.

echo 🚀 Python AI 서버 시작 중...
cd /d "%~dp0Python"
start "Python AI Server" cmd /k "python main.py"
echo.

echo ⏳ 5초 대기 중...
timeout /t 5 /nobreak > nul

echo 🚀 Node.js AI 서버 시작 중...
cd /d "%~dp0AiServer"
start "Node.js AI Server" cmd /k "npm run dev"
echo.

echo ✅ AI 시스템이 시작되었습니다!
echo.
echo 📊 Python AI 서버: http://localhost:8000
echo 📊 Node.js AI 서버: http://localhost:3000
echo.
echo 🛑 서버를 중지하려면 각 창을 닫으세요.
echo.
pause
