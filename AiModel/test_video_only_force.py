#!/usr/bin/env python3
"""
Video 전용 캡처 강제 테스트 스크립트
"""

import sys
from pathlib import Path

# Python 폴더를 경로에 추가
python_dir = Path(__file__).parent / "Python"
sys.path.insert(0, str(python_dir))

from cctv_processor import CCTVProcessor
import cv2
import time

def test_video_only_force():
    """Video 전용 캡처를 강제로 테스트합니다."""
    print("🎬 Video 전용 캡처 강제 테스트")
    print("=" * 50)
    
    # 테스트할 CCTV URL
    test_url = "https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=L310086&cctvname=%25EB%25AC%25B4%25EA%25B0%2581%25EC%2582%25AC%25EC%2582%25BC%25EA%25B1%25B0%25EB%25A6%25AC&kind=v&cctvip=undefined&cctvch=4&id=2118&cctvpasswd=undefined&cctvport=undefined&minX=126.81182033656034&minY=35.12821182727551&maxX=126.90874682853571&maxY=35.18958135938832"
    
    print(f"테스트 URL: {test_url}")
    print("\n🎯 Video 전용 캡처 강제 실행...")
    
    try:
        # CCTV 프로세서 생성
        processor = CCTVProcessor()
        
        # Video 전용 캡처 강제 실행
        start_time = time.time()
        frame = processor.capture_iframe_frame(test_url, save_captures=True, video_only=True)
        end_time = time.time()
        
        if frame is not None:
            print(f"✅ Video 전용 캡처 성공!")
            print(f"   프레임 크기: {frame.shape}")
            print(f"   프레임 타입: {frame.dtype}")
            print(f"   캡처 시간: {end_time - start_time:.2f}초")
            
            # 캡처된 이미지 저장
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"video_only_force_{timestamp}.jpg"
            
            # RGB를 BGR로 변환하여 저장
            bgr_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            cv2.imwrite(filename, bgr_frame)
            print(f"   이미지 저장: {filename}")
            
            # 이미지 미리보기
            try:
                cv2.imshow("Video Only Force Capture", bgr_frame)
                print("   이미지 미리보기 창이 열렸습니다. 아무 키나 누르면 닫힙니다.")
                cv2.waitKey(0)
                cv2.destroyAllWindows()
            except:
                print("   이미지 미리보기 실패 (GUI 환경이 아닐 수 있음)")
            
        else:
            print("❌ Video 전용 캡처 실패")
            
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()

def test_video_area_fallback():
    """Video 영역 크롭 fallback을 테스트합니다."""
    print("\n📐 Video 영역 크롭 Fallback 테스트")
    print("=" * 40)
    
    try:
        processor = CCTVProcessor()
        
        # Video 영역 크롭 (video_only=False)
        start_time = time.time()
        frame = processor.capture_iframe_frame(test_url, save_captures=True, video_only=False)
        end_time = time.time()
        
        if frame is not None:
            print(f"✅ Video 영역 크롭 성공!")
            print(f"   프레임 크기: {frame.shape}")
            print(f"   캡처 시간: {end_time - start_time:.2f}초")
        else:
            print("❌ Video 영역 크롭 실패")
            
    except Exception as e:
        print(f"❌ Video 영역 크롭 테스트 실패: {e}")

def main():
    """메인 함수"""
    print("🚀 Video 전용 캡처 강제 테스트 시작")
    print("=" * 60)
    
    # Video 전용 캡처 강제 테스트
    test_video_only_force()
    
    # Video 영역 크롭 fallback 테스트
    test_video_area_fallback()
    
    print("\n🎯 테스트 완료!")
    print("\n📁 저장된 이미지들을 확인하려면:")
    print("   python view_captures.py")
    print("\n🔍 캡처 과정을 자세히 보려면:")
    print("   captured_images 폴더의 로그 파일들을 확인하세요")

if __name__ == "__main__":
    main()
