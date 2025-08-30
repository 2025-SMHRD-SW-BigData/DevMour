#!/usr/bin/env python3
"""
도로 점수 저장 기능 테스트 스크립트
"""

import asyncio
import sys
from pathlib import Path

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from db_manager import save_road_score_to_db

async def test_road_score_save():
    """도로 점수 저장 기능을 테스트합니다."""
    print("🧪 도로 점수 저장 기능 테스트 시작")
    
    # 테스트 데이터
    test_data = {
        'cctv_name': '테스트 CCTV',
        'cctv_url': 'https://example.com/test',
        'risk_score': 0.75,
        'class_counts': {
            'crack': 2,
            'break': 1,
            'ali_crack': 0
        },
        'analysis_type': 'test_analysis',
        'frame_info': {
            'width': 1280,
            'height': 720
        }
    }
    
    try:
        print(f"📊 테스트 데이터: {test_data}")
        
        # 도로 점수 저장 시도
        result = await save_road_score_to_db(**test_data)
        
        if result:
            print("✅ 도로 점수 저장 테스트 성공!")
        else:
            print("❌ 도로 점수 저장 테스트 실패!")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 도로 점수 저장 테스트 실행")
    print("=" * 50)
    
    # 비동기 테스트 실행
    asyncio.run(test_road_score_save())
    
    print("=" * 50)
    print("🏁 테스트 완료")
