#!/usr/bin/env python3
"""
간단한 도로 점수 저장 테스트
"""

import asyncio
import sys
from pathlib import Path

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from db_manager import save_road_score_to_db

async def test_simple_save():
    """간단한 도로 점수 저장 테스트"""
    print("🧪 간단한 도로 점수 저장 테스트")
    
    try:
        result = await save_road_score_to_db(
            cctv_idx=5,  # 테스트용 CCTV 인덱스
            cctv_name="테스트 CCTV",
            cctv_url="https://test.com",
            cctv_location={"lat": 37.5665, "lon": 126.9780},  # 서울 시청
            risk_score=0.5,
            class_counts={"crack": 1, "break": 0, "ali_crack": 0},
            analysis_type="test",
            frame_info=None
        )
        
        print(f"결과: {result}")
        
    except Exception as e:
        print(f"오류: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_simple_save())
