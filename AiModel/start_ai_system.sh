#!/bin/bash

echo "========================================"
echo "    AI 도로 위험도 분석 시스템 시작"
echo "========================================"
echo

# Python AI 서버 시작
echo "🚀 Python AI 서버 시작 중..."
cd "$(dirname "$0")/Python"
gnome-terminal --title="Python AI Server" -- bash -c "python main.py; exec bash" &
echo

# 5초 대기
echo "⏳ 5초 대기 중..."
sleep 5

# Node.js AI 서버 시작
echo "🚀 Node.js AI 서버 시작 중..."
cd "$(dirname "$0")/AiServer"
gnome-terminal --title="Node.js AI Server" -- bash -c "npm run dev; exec bash" &
echo

echo "✅ AI 시스템이 시작되었습니다!"
echo
echo "📊 Python AI 서버: http://localhost:8000"
echo "📊 Node.js AI 서버: http://localhost:3000"
echo
echo "🛑 서버를 중지하려면 각 터미널을 닫으세요."
echo

# 프로세스 ID 저장
PYTHON_PID=$!
NODE_PID=$!

# Ctrl+C 처리
trap 'echo "서버를 중지합니다..."; kill $PYTHON_PID $NODE_PID 2>/dev/null; exit' INT

# 대기
wait
