#!/usr/bin/env python3
"""
iframe 캡처 기능 테스트 스크립트
"""

import sys
from pathlib import Path

# Python 폴더를 경로에 추가
python_dir = Path(__file__).parent / "Python"
sys.path.insert(0, str(python_dir))

from cctv_processor import CCTVProcessor
import cv2
import time

def test_iframe_capture():
    """iframe 캡처 기능을 테스트합니다."""
    print("🧪 iframe 캡처 기능 테스트")
    print("=" * 40)
    
    # 테스트할 CCTV URL
    test_url = "https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=L310086&cctvname=%25EB%25AC%25B4%25EA%25B0%2581%25EC%2582%25AC%25EC%2582%25BC%25EA%25B1%25B0%25EB%25A6%25AC&kind=v&cctvip=undefined&cctvch=4&id=2118&cctvpasswd=undefined&cctvport=undefined&minX=126.81182033656034&minY=35.12821182727551&maxX=126.90874682853571&maxY=35.18958135938832"
    
    print(f"테스트 URL: {test_url}")
    print("\niframe 캡처 시작...")
    
    try:
        # CCTV 프로세서 생성
        processor = CCTVProcessor()
        
        # iframe 캡처 수행 (이미지 저장 활성화, video만 캡처)
        start_time = time.time()
        frame = processor.capture_iframe_frame(test_url, save_captures=True, video_only=True)
        end_time = time.time()
        
        if frame is not None:
            print(f"✅ iframe 캡처 성공!")
            print(f"   프레임 크기: {frame.shape}")
            print(f"   프레임 타입: {frame.dtype}")
            print(f"   캡처 시간: {end_time - start_time:.2f}초")
            
            # 캡처된 이미지 저장
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"iframe_capture_{timestamp}.jpg"
            
            # RGB를 BGR로 변환하여 저장
            bgr_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            cv2.imwrite(filename, bgr_frame)
            print(f"   이미지 저장: {filename}")
            
            # 이미지 미리보기 (선택사항)
            try:
                cv2.imshow("Captured Frame", bgr_frame)
                print("   이미지 미리보기 창이 열렸습니다. 아무 키나 누르면 닫힙니다.")
                cv2.waitKey(0)
                cv2.destroyAllWindows()
            except:
                print("   이미지 미리보기 실패 (GUI 환경이 아닐 수 있음)")
            
        else:
            print("❌ iframe 캡처 실패")
            
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()

def test_traditional_capture():
    """기존 방식의 캡처 기능을 테스트합니다."""
    print("\n🔍 기존 방식 캡처 테스트")
    print("=" * 30)
    
    try:
        processor = CCTVProcessor()
        
        print("기존 방식으로 캡처 시도...")
        start_time = time.time()
        frame = processor.capture_with_retry()
        end_time = time.time()
        
        if frame is not None:
            print(f"✅ 기존 방식 캡처 성공!")
            print(f"   프레임 크기: {frame.shape}")
            print(f"   캡처 시간: {end_time - start_time:.2f}초")
        else:
            print("❌ 기존 방식 캡처 실패")
            
    except Exception as e:
        print(f"❌ 기존 방식 테스트 실패: {e}")

def test_simple_capture():
    """간단한 iframe 캡처 테스트"""
    print("\n🔍 간단한 iframe 캡처 테스트")
    print("=" * 30)
    
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        import time
        
        # Chrome 옵션 설정
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1280,720")
        
        print("Chrome WebDriver 초기화 중...")
        driver = webdriver.Chrome(options=chrome_options)
        
        try:
            test_url = "https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=L310086&cctvname=%25EB%25AC%25B4%25EA%25B0%2581%25EC%2582%25AC%25EC%2582%25BC%25EA%25B1%25B0%25EB%25A6%25AC&kind=v&cctvip=undefined&cctvch=4&id=2118&cctvpasswd=undefined&cctvport=undefined&minX=126.81182033656034&minY=35.12821182727551&maxX=126.90874682853571&maxY=35.18958135938832"
            
            print(f"페이지 로드 중: {test_url}")
            driver.get(test_url)
            time.sleep(5)  # 페이지 로딩 대기
            
            print("페이지 요소 확인 중...")
            page_source = driver.page_source
            print(f"페이지 소스 길이: {len(page_source)}")
            
            # iframe 찾기
            iframes = driver.find_elements(By.TAG_NAME, "iframe")
            print(f"발견된 iframe 수: {len(iframes)}")
            
            for i, iframe in enumerate(iframes):
                try:
                    src = iframe.get_attribute("src")
                    print(f"iframe {i+1}: src={src}")
                except:
                    print(f"iframe {i+1}: src 속성 읽기 실패")
            
            # 스크린샷 캡처
            print("스크린샷 캡처 중...")
            screenshot = driver.get_screenshot_as_png()
            
            # 이미지 저장
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"simple_capture_{timestamp}.png"
            
            with open(filename, 'wb') as f:
                f.write(screenshot)
            
            print(f"✅ 간단한 캡처 완료: {filename}")
            
        finally:
            driver.quit()
            
    except Exception as e:
        print(f"❌ 간단한 캡처 테스트 실패: {e}")
        import traceback
        traceback.print_exc()

def main():
    """메인 함수"""
    print("🚀 iframe 캡처 테스트 시작")
    print("=" * 50)
    
    # 간단한 캡처 테스트 먼저 실행
    test_simple_capture()
    
    # iframe 캡처 테스트
    test_iframe_capture()
    
    # 기존 방식 테스트
    test_traditional_capture()
    
    print("\n🎯 테스트 완료!")

if __name__ == "__main__":
    main()
