#!/usr/bin/env python3
"""
Video 태그 내용만 캡처하는 기능 테스트 스크립트
"""

import sys
from pathlib import Path

# Python 폴더를 경로에 추가
python_dir = Path(__file__).parent / "Python"
sys.path.insert(0, str(python_dir))

from cctv_processor import CCTVProcessor
import cv2
import time

def test_video_only_capture():
    """Video 태그 내용만 캡처하는 기능을 테스트합니다."""
    print("🎬 Video 전용 캡처 기능 테스트")
    print("=" * 50)
    
    # 테스트할 CCTV URL
    test_url = "https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=L310086&cctvname=%25EB%25AC%25B4%25EA%25B0%2581%25EC%2582%25AC%25EC%2582%25BC%25EA%25B1%25B0%25EB%25A6%25AC&kind=v&cctvip=undefined&cctvch=4&id=2118&cctvpasswd=undefined&cctvport=undefined&minX=126.81182033656034&minY=35.12821182727551&maxX=126.90874682853571&maxY=35.18958135938832"
    
    print(f"테스트 URL: {test_url}")
    print("\nVideo 전용 캡처 시작...")
    
    try:
        # CCTV 프로세서 생성
        processor = CCTVProcessor()
        
        # Video 전용 캡처 수행 (강제 설정)
        print("🎯 video_only=True로 강제 설정하여 Video 콘텐츠만 캡처")
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
            filename = f"video_only_capture_{timestamp}.jpg"
            
            # RGB를 BGR로 변환하여 저장
            bgr_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            cv2.imwrite(filename, filename)
            print(f"   이미지 저장: {filename}")
            
            # 이미지 미리보기
            try:
                cv2.imshow("Video Only Capture", bgr_frame)
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

def test_video_area_capture():
    """Video 영역만 크롭하는 기능을 테스트합니다."""
    print("\n📐 Video 영역 크롭 테스트")
    print("=" * 40)
    
    try:
        processor = CCTVProcessor()
        
        # Video 영역만 크롭 (video_only=False)
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

def compare_capture_methods():
    """다양한 캡처 방법을 비교합니다."""
    print("\n🔄 캡처 방법 비교 테스트")
    print("=" * 40)
    
    test_url = "https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=L310086&cctvname=%25EB%25AC%25B4%25EA%25B0%2581%25EC%2582%25AC%25EC%2582%25BC%25EA%25B1%25B0%25EB%25A6%25AC&kind=v&cctvip=undefined&cctvch=4&id=2118&cctvpasswd=undefined&cctvport=undefined&minX=126.81182033656034&minY=35.12821182727551&maxX=126.90874682853571&maxY=35.18958135938832"
    
    try:
        processor = CCTVProcessor()
        
        # 1. Video 전용 캡처
        print("1️⃣ Video 전용 캡처 (video_only=True)")
        start_time = time.time()
        video_frame = processor.capture_iframe_frame(test_url, save_captures=True, video_only=True)
        video_time = time.time() - start_time
        
        if video_frame is not None:
            print(f"   ✅ 성공: {video_frame.shape}, {video_time:.2f}초")
        else:
            print("   ❌ 실패")
        
        # 2. Video 영역 크롭
        print("2️⃣ Video 영역 크롭 (video_only=False)")
        start_time = time.time()
        area_frame = processor.capture_iframe_frame(test_url, save_captures=True, video_only=False)
        area_time = time.time() - start_time
        
        if area_frame is not None:
            print(f"   ✅ 성공: {area_frame.shape}, {area_time:.2f}초")
        else:
            print("   ❌ 실패")
        
        # 3. 기존 방식
        print("3️⃣ 기존 방식 캡처")
        start_time = time.time()
        traditional_frame = processor.capture_with_retry()
        traditional_time = time.time() - start_time
        
        if traditional_frame is not None:
            print(f"   ✅ 성공: {traditional_frame.shape}, {traditional_time:.2f}초")
        else:
            print("   ❌ 실패")
        
        print(f"\n📊 성능 비교:")
        print(f"   Video 전용: {video_time:.2f}초")
        print(f"   Video 영역: {area_time:.2f}초")
        print(f"   기존 방식: {traditional_time:.2f}초")
        
    except Exception as e:
        print(f"❌ 비교 테스트 실패: {e}")
        import traceback
        traceback.print_exc()

def main():
    """메인 함수"""
    print("🚀 Video 전용 캡처 테스트 시작")
    print("=" * 60)
    
    # Video 전용 캡처 테스트
    test_video_only_capture()
    
    # Video 영역 크롭 테스트
    test_video_area_capture()
    
    # 캡처 방법 비교
    compare_capture_methods()
    
    print("\n🎯 테스트 완료!")
    print("\n📁 저장된 이미지들을 확인하려면:")
    print("   python view_captures.py")

if __name__ == "__main__":
    main()
