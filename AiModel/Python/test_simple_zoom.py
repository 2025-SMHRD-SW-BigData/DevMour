#!/usr/bin/env python3
"""
간단한 iframe 확대 캡처 테스트
"""

import sys
from pathlib import Path
import time

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from cctv_processor import CCTVProcessor

def test_simple_zoom():
    """간단한 크롭 테스트"""
    print("🔍 간단한 iframe 크롭 테스트 시작")
    
    # CCTV 프로세서 초기화
    processor = CCTVProcessor()
    
    # 테스트 URL (utic.go.kr CCTV)
    test_url = "https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=L310086&cctvname=%25EB%25AC%25B4%25EA%25B0%2581%25EC%2582%25AC%25EC%2582%25BC%25EA%25B1%25B0%25EB%25A6%25AC&kind=v&cctvip=undefined&cctvch=4&id=2118&cctvpasswd=undefined&cctvport=undefined&minX=126.81182033656034&minY=35.12821182727551&maxX=126.90874682853571&maxY=35.18958135938832"
    
    # 크롭 좌표 설정 (사용자가 지정한 좌표)
    crop_coords = {
        'x1': 463,  # 시작 지점 (좌상단) x
        'y1': 107,  # 시작 지점 (좌상단) y
        'x2': 825,  # 종료 지점 (우하단) x
        'y2': 362   # 종료 지점 (우하단) y
    }
    
    print(f"📡 테스트 URL: {test_url}")
    print(f"✂️ 크롭 좌표: ({crop_coords['x1']}, {crop_coords['y1']}) ~ ({crop_coords['x2']}, {crop_coords['y2']})")
    
    try:
        # 크롭 캡처 실행
        frame = processor.capture_iframe_frame(
            iframe_url=test_url,
            crop_coords=crop_coords,
            save_captures=True
        )
        
        if frame is not None:
            print(f"✅ 크롭 캡처 성공!")
            print(f"📊 이미지 크기: {frame.shape}")
            print(f"📁 저장된 이미지: captured_images/ 폴더 확인")
            
            # 이미지 정보 출력
            height, width = frame.shape[:2]
            print(f"📏 해상도: {width} x {height}")
            print(f"✂️ 크롭 영역: {crop_coords['x2'] - crop_coords['x1']} x {crop_coords['y2'] - crop_coords['y1']} 픽셀")
            
        else:
            print("❌ 크롭 캡처 실패")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_simple_zoom()
