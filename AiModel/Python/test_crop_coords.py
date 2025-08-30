#!/usr/bin/env python3
"""
크롭 좌표를 사용한 iframe 캡처 테스트
"""

import sys
from pathlib import Path
import time

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from cctv_processor import CCTVProcessor

def test_crop_coords():
    """자동 크롭 테스트"""
    print("🔍 고정 좌표로 자동 크롭하는 페이지 캡처 테스트 시작")
    
    # CCTV 프로세서 초기화
    processor = CCTVProcessor()
    
    # 테스트 URL (utic.go.kr CCTV)
    test_url = "https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=L310086&cctvname=%25EB%25AC%25B4%25EA%25B0%2581%25EC%2582%25AC%25EC%2582%25BC%25EA%25B1%25B0%25EB%25A6%25AC&kind=v&cctvip=undefined&cctvch=4&id=2118&cctvpasswd=undefined&cctvport=undefined&minX=126.81182033656034&minY=35.12821182727551&maxX=126.90874682853571&maxY=35.18958135938832"
    
    # 고정된 크롭 좌표 (코드 내부에 하드코딩됨)
    fixed_coords = {
        'x1': 463,  # 시작 지점 (좌상단) x
        'y1': 107,  # 시작 지점 (좌상단) y
        'x2': 825,  # 종료 지점 (우하단) x
        'y2': 362   # 종료 지점 (우하단) y
    }
    
    print(f"📡 테스트 URL: {test_url}")
    print(f"✂️ 고정 크롭 좌표: ({fixed_coords['x1']}, {fixed_coords['y1']}) ~ ({fixed_coords['x2']}, {fixed_coords['y2']})")
    print(f"📐 크롭 영역: {fixed_coords['x2'] - fixed_coords['x1']} x {fixed_coords['y2'] - fixed_coords['y1']} 픽셀")
    
    try:
        # 자동 크롭 캡처 실행 (crop_coords 파라미터 불필요)
        print("\n🚀 자동 크롭 캡처 시작...")
        frame = processor.capture_iframe_frame(
            iframe_url=test_url,
            save_captures=True
        )
        
        if frame is not None:
            print(f"✅ 자동 크롭 캡처 성공!")
            print(f"📊 이미지 크기: {frame.shape}")
            print(f"📁 저장된 이미지: captured_images/ 폴더 확인")
            
            # 이미지 정보 출력
            height, width = frame.shape[:2]
            print(f"📏 해상도: {width} x {height}")
            print(f"✂️ 크롭 영역: {fixed_coords['x2'] - fixed_coords['x1']} x {fixed_coords['y2'] - fixed_coords['y1']} 픽셀")
            
            # 크롭된 이미지가 예상 크기와 일치하는지 확인
            expected_width = fixed_coords['x2'] - fixed_coords['x1']
            expected_height = fixed_coords['y2'] - fixed_coords['y1']
            
            if width == expected_width and height == expected_height:
                print("✅ 크롭 크기가 예상과 정확히 일치!")
            else:
                print(f"⚠️ 크롭 크기 불일치: 예상 {expected_width}x{expected_height}, 실제 {width}x{height}")
            
        else:
            print("❌ 자동 크롭 캡처 실패")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()

def test_full_iframe():
    """전체 페이지 캡처 테스트 (크롭 없음)"""
    print("\n🔍 전체 페이지 캡처 테스트 (크롭 없음)")
    
    processor = CCTVProcessor()
    test_url = "https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=L310086&cctvname=%25EB%25AC%25B4%25EA%25B0%2581%25EC%2582%25AC%25EC%2582%25BC%25EA%25B1%25B0%25EB%25A6%25AC&kind=v&cctvip=undefined&cctvch=4&id=2118&cctvpasswd=undefined&cctvport=undefined&minX=126.81182033656034&minY=35.12821182727551&maxX=126.90874682853571&maxY=35.18958135938832"
    
    try:
        frame = processor.capture_iframe_frame(
            iframe_url=test_url,
            crop_coords=None,  # 크롭 없음
            save_captures=True
        )
        
        if frame is not None:
            print(f"✅ 전체 페이지 캡처 성공!")
            print(f"📊 이미지 크기: {frame.shape}")
        else:
            print("❌ 전체 페이지 캡처 실패")
            
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    # 크롭 좌표 테스트
    test_crop_coords()
    
    # 전체 iframe 테스트 (비교용)
    test_full_iframe()
    
    print("\n🎯 테스트 완료! captured_images/ 폴더에서 결과를 확인하세요.")
