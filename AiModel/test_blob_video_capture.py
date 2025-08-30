#!/usr/bin/env python3
"""
Blob URL을 가진 Video 태그 캡처 테스트 스크립트
"""

import sys
from pathlib import Path

# Python 폴더를 경로에 추가
python_dir = Path(__file__).parent / "Python"
sys.path.insert(0, str(python_dir))

from cctv_processor import CCTVProcessor
import cv2
import time

def test_blob_video_capture():
    """Blob URL을 가진 Video 태그 캡처를 테스트합니다."""
    print("🎬 Blob URL Video 태그 캡처 테스트")
    print("=" * 50)
    
    # 테스트할 CCTV URL (Blob URL을 가진 video 태그가 있는 페이지)
    test_url = "https://www.utic.go.kr/jsp/map/cctvStream.jsp?cctvid=L310086&cctvname=%25EB%25AC%25B4%25EA%25B0%2581%25EC%2582%25AC%25EC%2582%25BC%25EA%25B1%25B0%25EB%25A6%25AC&kind=v&cctvip=undefined&cctvch=4&id=2118&cctvpasswd=undefined&cctvport=undefined&minX=126.81182033656034&minY=35.12821182727551&maxX=126.90874682853571&maxY=35.18958135938832"
    
    print(f"테스트 URL: {test_url}")
    print("\n🎯 Blob URL Video 태그 탐지 및 캡처 시작...")
    
    try:
        # CCTV 프로세서 생성
        processor = CCTVProcessor()
        
        # Blob Video 전용 캡처 수행
        start_time = time.time()
        frame = processor.capture_iframe_frame(test_url, save_captures=True, video_only=True)
        end_time = time.time()
        
        if frame is not None:
            print(f"✅ Blob Video 캡처 성공!")
            print(f"   프레임 크기: {frame.shape}")
            print(f"   프레임 타입: {frame.dtype}")
            print(f"   캡처 시간: {end_time - start_time:.2f}초")
            
            # 캡처된 이미지 저장
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"blob_video_capture_{timestamp}.jpg"
            
            # RGB를 BGR로 변환하여 저장
            bgr_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            cv2.imwrite(filename, bgr_frame)
            print(f"   이미지 저장: {filename}")
            
            # 이미지 미리보기
            try:
                cv2.imshow("Blob Video Capture", bgr_frame)
                print("   이미지 미리보기 창이 열렸습니다. 아무 키나 누르면 닫힙니다.")
                cv2.waitKey(0)
                cv2.destroyAllWindows()
            except:
                print("   이미지 미리보기 실패 (GUI 환경이 아닐 수 있음)")
            
        else:
            print("❌ Blob Video 캡처 실패")
            
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()

def test_blob_video_detection():
    """Blob URL Video 태그 탐지 기능을 테스트합니다."""
    print("\n🔍 Blob URL Video 태그 탐지 테스트")
    print("=" * 40)
    
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
            
            print("Video 태그 탐지 중...")
            
            # 1. ID가 "video"인 video 태그 찾기
            try:
                video_element = driver.find_element(By.CSS_SELECTOR, "video#video")
                print("✅ ID가 'video'인 video 태그 발견!")
                
                # 상세 정보 확인
                video_src = video_element.get_attribute("src")
                video_width = video_element.get_attribute("width")
                video_height = video_element.get_attribute("height")
                video_autoplay = video_element.get_attribute("autoplay")
                video_muted = video_element.get_attribute("muted")
                
                print(f"   Src: {video_src}")
                print(f"   Width: {video_width}")
                print(f"   Height: {video_height}")
                print(f"   Autoplay: {video_autoplay}")
                print(f"   Muted: {video_muted}")
                
                if video_src and video_src.startswith("blob:"):
                    print("🎯 Blob URL을 가진 Video 태그 확인!")
                else:
                    print("⚠️ Blob URL이 아닙니다.")
                    
            except:
                print("❌ ID가 'video'인 video 태그를 찾을 수 없습니다.")
            
            # 2. 모든 video 태그 찾기
            try:
                all_videos = driver.find_elements(By.TAG_NAME, "video")
                print(f"\n📹 발견된 모든 video 태그 수: {len(all_videos)}")
                
                for i, video in enumerate(all_videos):
                    try:
                        video_src = video.get_attribute("src")
                        video_id = video.get_attribute("id")
                        video_width = video.get_attribute("width")
                        video_height = video.get_attribute("height")
                        
                        print(f"Video {i+1}:")
                        print(f"   ID: {video_id}")
                        print(f"   Src: {video_src}")
                        print(f"   Width: {video_width}")
                        print(f"   Height: {video_height}")
                        
                        if video_src and video_src.startswith("blob:"):
                            print("   🎯 Blob URL 확인!")
                            
                    except Exception as e:
                        print(f"   ❌ Video {i+1} 정보 읽기 실패: {e}")
                        
            except Exception as e:
                print(f"❌ Video 태그 탐지 실패: {e}")
            
            # 3. iframe 확인
            try:
                iframes = driver.find_elements(By.TAG_NAME, "iframe")
                print(f"\n🖼️ 발견된 iframe 수: {len(iframes)}")
                
                for i, iframe in enumerate(iframes):
                    try:
                        src = iframe.get_attribute("src")
                        print(f"iframe {i+1}: src={src}")
                    except:
                        print(f"iframe {i+1}: src 속성 읽기 실패")
                        
            except Exception as e:
                print(f"❌ iframe 탐지 실패: {e}")
            
        finally:
            driver.quit()
            
    except Exception as e:
        print(f"❌ Blob Video 탐지 테스트 실패: {e}")
        import traceback
        traceback.print_exc()

def main():
    """메인 함수"""
    print("🚀 Blob URL Video 태그 캡처 테스트 시작")
    print("=" * 60)
    
    # Blob Video 탐지 테스트
    test_blob_video_detection()
    
    # Blob Video 캡처 테스트
    test_blob_video_capture()
    
    print("\n🎯 테스트 완료!")
    print("\n📁 저장된 이미지들을 확인하려면:")
    print("   python view_captures.py")
    print("\n🔍 Blob Video 캡처 과정을 자세히 보려면:")
    print("   captured_images 폴더의 로그 파일들을 확인하세요")

if __name__ == "__main__":
    main()
