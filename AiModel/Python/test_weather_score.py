#!/usr/bin/env python3
"""
날씨 점수 계산 기능 테스트 스크립트
"""

import sys
from pathlib import Path

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from cctv_processor import CCTVProcessor

def test_weather_score_calculation():
    """날씨 점수 계산 기능을 테스트합니다."""
    print("🌤️ 날씨 점수 계산 기능 테스트 시작")
    print("=" * 50)
    
    # CCTVProcessor 인스턴스 생성
    processor = CCTVProcessor()
    
    # 테스트 케이스들
    test_cases = [
        # (온도, 강수량, 강설량, 예상 점수, 설명)
        (25, 0, 0, 1, "맑은 날씨"),
        (25, 2, 0, 1, "약한 비"),
        (25, 10, 0, 2, "보통 비"),
        (25, 25, 0, 3, "강한 비"),
        (25, 40, 0, 4, "매우 강한 비"),
        (25, 60, 0, 5, "폭우"),
        
        (-5, 0, 0, 1, "맑은 추운 날씨"),
        (-5, 5, 0, 5, "영하에서 비 (가장 위험)"),
        (-5, 0, 3, 2, "약한 눈"),
        (-5, 0, 8, 3, "보통 눈"),
        (-5, 0, 15, 4, "강한 눈"),
        (-5, 0, 25, 5, "폭설"),
        
        (0, 0, 0, 1, "맑은 날씨"),
        (0, 5, 0, 2, "보통 비"),
        (0, 0, 5, 2, "보통 눈"),
    ]
    
    print("📊 테스트 결과:")
    print("-" * 50)
    
    for i, (temp, rain, snow, expected_score, description) in enumerate(test_cases, 1):
        try:
            actual_score = processor.calculate_weather_score(temp, rain, snow)
            status = "✅" if actual_score == expected_score else "❌"
            
            print(f"{i:2d}. {status} {description}")
            print(f"    온도: {temp}°C, 강수량: {rain}mm, 강설량: {snow}mm")
            print(f"    예상 점수: {expected_score}점, 실제 점수: {actual_score}점")
            print()
            
        except Exception as e:
            print(f"{i:2d}. ❌ {description} - 오류 발생: {e}")
            print()
    
    print("=" * 50)
    print("🌤️ 날씨 점수 계산 기능 테스트 완료")

if __name__ == "__main__":
    test_weather_score_calculation()
