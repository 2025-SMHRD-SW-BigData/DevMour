@echo off
echo ========================================
echo    AI 자동 이미지 분석 시스템 시작
echo ========================================
echo.

echo 🚀 Python AI 서버 시작 중...
cd /d "%~dp0Python"
start "Python AI Server" cmd /k "python main.py"
echo.

echo ⏳ 10초 대기 중... (서버 초기화 대기)
timeout /t 10 /nobreak > nul

echo 🚀 자동 이미지 분석 시작 중...
cd /d "%~dp0"
start "Auto Analysis Controller" cmd /k "python start_auto_analysis.py"
echo.

echo ✅ 자동 이미지 분석 시스템이 시작되었습니다!
echo.
echo 📊 Python AI 서버: http://localhost:8000
echo 🤖 자동 분석 컨트롤러가 별도 창에서 실행됩니다
echo.
echo 📋 사용법:
echo   1. 자동 분석 컨트롤러 창에서 메뉴 선택
echo   2. 1번: 60초 간격으로 자동 분석 시작
echo   3. 2번: 사용자 정의 간격으로 자동 분석 시작
echo   4. 3번: 자동 분석 중지
echo   5. 4번: 분석 통계 조회
echo   6. 5번: 즉시 분석 수행
echo   7. 6번: 실시간 모니터링
echo.
echo 🛑 서버를 중지하려면 각 창을 닫으세요.
echo.
pause
