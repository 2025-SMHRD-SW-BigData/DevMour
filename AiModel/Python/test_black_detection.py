#!/usr/bin/env python3
"""
검정 화면 감지 및 재시도 기능 테스트 스크립트
"""

import sys
import os
from pathlib import Path

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from cctv_processor import CCTVProcessor

def test_black_image_detection():
    """검정 화면 감지 기능을 테스트합니다."""
    print("🔍 검정 화면 감지 기능 테스트")
    print("=" * 50)
    
    # CCTV 프로세서 초기화
    processor = CCTVProcessor()
    
    try:
        # 테스트할 이미지 경로들
        test_images = [
            "capture_images/full_page_screenshot.png",  # 실제 캡처된 이미지
            "capture_images/cropped_result.png",        # 크롭된 결과 이미지
        ]
        
        for image_path in test_images:
            if os.path.exists(image_path):
                print(f"\n📷 이미지 테스트: {image_path}")
                print("-" * 30)
                
                # 검정 화면 여부 확인
                is_black = processor._is_black_image(image_path)
                
                if is_black:
                    print(f"🖤 검정 화면으로 판단됨")
                else:
                    print(f"✅ 정상 이미지로 판단됨")
                    
                # 파일 크기 확인
                file_size = os.path.getsize(image_path)
                print(f"📊 파일 크기: {file_size:,} bytes")
                
            else:
                print(f"\n⚠️ 이미지 파일이 존재하지 않음: {image_path}")
        
    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # 리소스 정리
        processor.release()

def test_capture_with_retry():
    """재시도 캡처 기능을 테스트합니다."""
    print("\n\n🔄 재시도 캡처 기능 테스트")
    print("=" * 50)
    
    # CCTV 프로세서 초기화
    processor = CCTVProcessor()
    
    try:
        # 테스트용 CCTV URL (실제로는 작동하지 않을 수 있음)
        test_url = "https://www.utic.go.kr/view/map/cctv.jsp?cctv_id=1"
        
        print(f"🎥 테스트 URL: {test_url}")
        print("🔄 재시도 캡처 시작 (최대 3번)...")
        
        # 재시도 캡처 시도
        result = processor._capture_with_retry(test_url, max_retries=3, retry_delay=2)
        
        if result:
            print(f"✅ 캡처 성공: {result}")
        else:
            print("❌ 모든 재시도 실패")
            
    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        # 리소스 정리
        processor.release()

def main():
    """메인 함수"""
    print("🎯 검정 화면 감지 및 재시도 기능 테스트")
    print("=" * 60)
    
    # 1. 검정 화면 감지 테스트
    test_black_image_detection()
    
    # 2. 재시도 캡처 테스트
    test_capture_with_retry()
    
    print("\n🏁 테스트 완료")

if __name__ == "__main__":
    main()
