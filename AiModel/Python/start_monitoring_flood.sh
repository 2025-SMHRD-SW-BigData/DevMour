#!/bin/bash

echo "🌊 침수 모니터링 시스템 시작..."
echo ""

# 현재 디렉토리로 이동
cd "$(dirname "$0")"

# Python 스크립트 실행
python3 monitoring_flood.py
