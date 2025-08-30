#!/usr/bin/env python3
"""
iframe 확대 캡처 기능 테스트 스크립트
"""

import sys
from pathlib import Path

# Python 폴더를 경로에 추가
python_dir = Path(__file__).parent / "Python"
sys.path.insert(0, str(python_dir))

from cctv_processor import CCTVProcessor
import cv2
import time

def test_zoomed_capture():
    """iframe 확대 캡처 기능을 테스트합니다."""
    print("🔍 iframe 확대 캡처 기능 테스트")
    print("=" * 50)
    
    # 테스트할 CCTV URL
    test_url = "https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=L310086&cctvname=%25EB%25AC%25B4%25EA%25B0%2581%25EC%2582%25AC%25EC%2582%25BC%25EA%25B1%25B0%25EB%25A6%25AC&kind=v&cctvip=undefined&cctvch=4&id=2118&cctvpasswd=undefined&cctvport=undefined&minX=126.81182033656034&minY=35.12821182727551&maxX=126.90874682853571&maxY=35.18958135938832"
    
    print(f"테스트 URL: {test_url}")
    
    try:
        # CCTV 프로세서 생성
        processor = CCTVProcessor()
        
        # 다양한 확대 배율로 테스트
        zoom_factors = [1.0, 2.0, 3.0, 4.0]
        
        for zoom_factor in zoom_factors:
            print(f"\n🎯 {zoom_factor}배 확대 캡처 테스트 시작...")
            
            start_time = time.time()
            frame = processor.capture_zoomed_iframe(test_url, zoom_factor=zoom_factor, save_captures=True)
            end_time = time.time()
            
            if frame is not None:
                print(f"✅ {zoom_factor}배 확대 캡처 성공!")
                print(f"   프레임 크기: {frame.shape}")
                print(f"   프레임 타입: {frame.dtype}")
                print(f"   캡처 시간: {end_time - start_time:.2f}초")
                
                # 캡처된 이미지 저장
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                filename = f"zoomed_capture_{zoom_factor}x_{timestamp}.jpg"
                
                # RGB를 BGR로 변환하여 저장
                bgr_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                cv2.imwrite(filename, bgr_frame)
                print(f"   이미지 저장: {filename}")
                
                # 이미지 미리보기 (첫 번째 성공한 경우만)
                if zoom_factor == zoom_factors[0]:
                    try:
                        cv2.imshow(f"Zoomed Capture ({zoom_factor}x)", bgr_frame)
                        print("   이미지 미리보기 창이 열렸습니다. 아무 키나 누르면 닫힙니다.")
                        cv2.waitKey(0)
                        cv2.destroyAllWindows()
                    except:
                        print("   이미지 미리보기 실패 (GUI 환경이 아닐 수 있음)")
                
            else:
                print(f"❌ {zoom_factor}배 확대 캡처 실패")
            
            # 다음 테스트 전 잠시 대기
            time.sleep(2)
            
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()

def test_zoomed_vs_normal():
    """일반 캡처 vs 확대 캡처 비교 테스트"""
    print("\n🔄 일반 캡처 vs 확대 캡처 비교 테스트")
    print("=" * 50)
    
    test_url = "https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=L310086&cctvname=%25EB%25AC%25B4%25EA%25B0%2581%25EC%2582%25AC%25EC%2582%25BC%25EA%25B1%25B0%25EB%25A6%25AC&kind=v&cctvip=undefined&cctvch=4&id=2118&cctvpasswd=undefined&cctvport=undefined&minX=126.81182033656034&minY=35.12821182727551&maxX=126.90874682853571&maxY=35.18958135938832"
    
    try:
        processor = CCTVProcessor()
        
        # 1. 일반 캡처
        print("1️⃣ 일반 iframe 캡처 (1배)")
        start_time = time.time()
        normal_frame = processor.capture_iframe_frame(test_url, save_captures=True, video_only=True)
        normal_time = time.time() - start_time
        
        if normal_frame is not None:
            print(f"   ✅ 성공: {normal_frame.shape}, {normal_time:.2f}초")
        else:
            print("   ❌ 실패")
        
        # 2. 확대 캡처
        print("2️⃣ 확대 iframe 캡처 (3배)")
        start_time = time.time()
        zoomed_frame = processor.capture_zoomed_iframe(test_url, zoom_factor=3.0, save_captures=True)
        zoomed_time = time.time() - start_time
        
        if zoomed_frame is not None:
            print(f"   ✅ 성공: {zoomed_frame.shape}, {zoomed_time:.2f}초")
        else:
            print("   ❌ 실패")
        
        # 3. 성능 비교
        print(f"\n📊 성능 비교:")
        print(f"   일반 캡처: {normal_time:.2f}초")
        print(f"   확대 캡처: {zoomed_time:.2f}초")
        
        if normal_frame is not None and zoomed_frame is not None:
            print(f"   일반 이미지 크기: {normal_frame.shape}")
            print(f"   확대 이미지 크기: {zoomed_frame.shape}")
            print(f"   해상도 증가: {zoomed_frame.shape[0] * zoomed_frame.shape[1] / (normal_frame.shape[0] * normal_frame.shape[1]):.1f}배")
        
    except Exception as e:
        print(f"❌ 비교 테스트 실패: {e}")
        import traceback
        traceback.print_exc()

def main():
    """메인 함수"""
    print("🚀 iframe 확대 캡처 테스트 시작")
    print("=" * 60)
    
    # 확대 캡처 테스트
    test_zoomed_capture()
    
    # 비교 테스트
    test_zoomed_vs_normal()
    
    print("\n🎯 테스트 완료!")
    print("\n📁 저장된 이미지들을 확인하려면:")
    print("   python view_captures.py")
    print("\n🔍 확대 캡처 과정을 자세히 보려면:")
    print("   captured_images 폴더의 로그 파일들을 확인하세요")
    print("\n💡 확대 캡처의 장점:")
    print("   - Video 태그를 개별적으로 찾을 필요 없음")
    print("   - iframe 전체를 고해상도로 캡처")
    print("   - 더 정확한 AI 분석 가능")

if __name__ == "__main__":
    main()
