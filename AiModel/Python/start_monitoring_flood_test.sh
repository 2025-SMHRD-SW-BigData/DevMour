#!/bin/bash

echo "🌊 침수 모니터링 시스템 (테스트 모드) 시작..."
echo ""
echo "🧪 5분 간격으로 모니터링을 실행합니다."
echo ""

# 현재 디렉토리로 이동
cd "$(dirname "$0")"

# Python 스크립트 실행 (테스트 모드)
python3 monitoring_flood.py --test
