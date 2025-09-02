import cv2
import numpy as np
import requests
import time

import logging
from typing import Optional, Tuple
import sys
from pathlib import Path
from PIL import Image
import io

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from config import CCTV_CONFIG

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CCTVProcessor:
    """CCTV 스트림 처리 클래스"""
    
    def __init__(self):
        self.url = CCTV_CONFIG['url']
        self.timeout = CCTV_CONFIG['timeout']
        self.retry_count = CCTV_CONFIG['retry_count']
        self.cap = None
    
    def connect(self) -> bool:
        """CCTV 스트림에 연결합니다."""
        try:
            self.cap = cv2.VideoCapture(self.url)
            if self.cap.isOpened():
                logger.info(f"✔️ CCTV 스트림 연결 성공: {self.url}")
                return True
            else:
                logger.error(f"❌ CCTV 스트림 연결 실패: {self.url}")
                return False
        except Exception as e:
            logger.error(f"❌ CCTV 연결 오류: {e}")
            return False
    
    def capture_frame(self) -> Optional[np.ndarray]:
        """현재 프레임을 캡처합니다."""
        if self.cap is None or not self.cap.isOpened():
            if not self.connect():
                return None
        
        try:
            ret, frame = self.cap.read()
            if ret:
                # BGR을 RGB로 변환
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                logger.info("✔️ 프레임 캡처 성공")
                return rgb_frame
            else:
                logger.warning("⚠️ 프레임 캡처 실패")
                return None
        except Exception as e:
            logger.error(f"❌ 프레임 캡처 오류: {e}")
            return None

    def capture_iframe_frame(self, iframe_url: str, iframe_selector: str = None, save_captures: bool = True, video_only: bool = False, zoom_factor: float = None, crop_coords: dict = None, attempt_number: int = 1) -> Optional[np.ndarray]:
        """웹 페이지를 캡처하고 고정된 좌표로 자동 크롭합니다.
        
        Args:
            iframe_url: 캡처할 웹 페이지 URL
            iframe_selector: 사용하지 않음 (기본값: None)
            save_captures: 캡처 이미지 저장 여부 (기본값: True)
            video_only: 사용하지 않음 (기본값: False)
            zoom_factor: 사용하지 않음 (기본값: None)
            crop_coords: 사용하지 않음 (기본값: None) - 고정 좌표로 자동 크롭
            attempt_number: 재시도 시도 번호 (기본값: 1)
        
        Note:
            고정 크롭 좌표: 시작 지점 (473, 57) ~ 종료 지점 (793, 272)
            해상도 향상: Chrome 2K 해상도 + DPI 2배 스케일링으로 고해상도 캡처
            재시도 시 페이지를 완전히 새로 로드하여 캡처
        """
        try:
            import requests
            from selenium import webdriver
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            from selenium.webdriver.chrome.options import Options
            import time
            
            logger.info(f"🔍 [{attempt_number}번째 시도] 페이지 캡처 시작: {iframe_url}")
            
            # 캡처 이미지 저장 폴더 생성
            if save_captures:
                capture_dir = Path("captured_images")
                capture_dir.mkdir(exist_ok=True)
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                logger.info(f"📁 캡처 이미지 저장 폴더: {capture_dir.absolute()}")
            
            # Chrome 옵션 설정 (헤드리스 모드 + 고해상도)
            chrome_options = Options()
            chrome_options.add_argument("--headless")  # 백그라운드 실행
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            chrome_options.add_argument("--disable-features=VizDisplayCompositor")
            
            # 🆕 고해상도 Chrome 옵션 설정
            chrome_options.add_argument("--window-size=2560,1440")  # 2K 해상도로 향상
            chrome_options.add_argument("--force-device-scale-factor=2")  # DPI 2배로 향상
            chrome_options.add_argument("--high-dpi-support=1")  # 고해상도 지원 활성화
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            logger.info(f"🔍 [{attempt_number}번째 시도] 페이지 캡처 모드 (고해상도 자동 크롭: 473,57 ~ 793,272)")
            
            # 페이지 로딩 대기 시간 (재시도 시 더 오래 대기)
            page_load_wait = 3 + (attempt_number - 1) * 2  # 첫 시도: 3초, 재시도마다 2초씩 증가
            
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            
            # WebDriver 초기화 (자동 설치) - 매번 새로운 인스턴스 생성
            try:
                driver = webdriver.Chrome(options=chrome_options)
            except:
                # Chrome WebDriver가 없으면 자동 설치
                from webdriver_manager.chrome import ChromeDriverManager
                from selenium.webdriver.chrome.service import Service
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=chrome_options)
            
            try:
                # 페이지 로드 (재시도 시 완전히 새로 로드)
                logger.info(f"📄 [{attempt_number}번째 시도] 페이지 로드 시작...")
                driver.get(iframe_url)
                logger.info(f"📄 [{attempt_number}번째 시도] 페이지 로드 완료")
                
                # 페이지 로딩 완료 후 전체 페이지 스크린샷 캡처
                logger.info(f"🔍 [{attempt_number}번째 시도] 전체 페이지 캡처 시작 (대기: {page_load_wait}초)")
                time.sleep(page_load_wait)  # 페이지 로딩 대기
                full_page_screenshot = driver.get_screenshot_as_png()
                
                # 전체 페이지 스크린샷 저장
                if save_captures:
                    full_page_filename = capture_dir / f"01_full_page_{timestamp}_attempt{attempt_number}.png"
                    with open(full_page_filename, 'wb') as f:
                        f.write(full_page_screenshot)
                    logger.info(f"💾 [{attempt_number}번째 시도] 전체 페이지 스크린샷 저장: {full_page_filename}")
                
                # 이미지 처리
                pil_image = Image.open(io.BytesIO(full_page_screenshot))
                full_frame = np.array(pil_image)
                logger.info(f"🔍 [{attempt_number}번째 시도] 전체 페이지 캡처 완료: {full_frame.shape}")
                
                # RGB로 변환 (RGBA인 경우)
                if len(full_frame.shape) == 3 and full_frame.shape[2] == 4:
                    full_frame = full_frame[:, :, :3]
                
                # 고정된 크롭 좌표로 자동 크롭 (시작 지점: x=463, y=107, 종료 지점: x=825, y=362)
                x1, y1 = 2226, 117  # 시작 지점 (좌상단)
                x2, y2 = 2866, 546  # 종료 지점 (우하단)
                
                logger.info(f"✂️ [{attempt_number}번째 시도] 고정 좌표로 자동 크롭: ({x1}, {y1}) ~ ({x2}, {y2})")
                
                # 🆕 고해상도 크롭: Chrome에서 이미 고해상도로 캡처되었으므로 원본 좌표 사용
                logger.info(f"🔍 [{attempt_number}번째 시도] 고해상도 크롭: Chrome 2K 해상도로 캡처된 이미지에서 크롭")
                
                # 좌표가 이미지 범위 내에 있는지 확인 (고해상도 이미지 기준)
                height, width = pil_image.size[1], pil_image.size[0]
                x1 = max(0, min(x1, width))
                y1 = max(0, min(y1, height))
                x2 = max(x1, min(x2, width))
                y2 = max(y1, min(y2, height))
                
                # PIL로 크롭 (고해상도 이미지에서)
                cropped_image = pil_image.crop((x1, y1, x2, y2))
                frame = np.array(cropped_image)
                
                logger.info(f"✂️ [{attempt_number}번째 시도] 크롭 완료: {frame.shape} (원본: {full_frame.shape})")
                logger.info(f"📐 [{attempt_number}번째 시도] 크롭 영역: {x2 - x1} x {y2 - y1} 픽셀")
                logger.info(f"🚀 [{attempt_number}번째 시도] 고해상도 캡처: Chrome 2K 해상도 + DPI 2배로 향상된 이미지")
                
                # 최종 결과 이미지 저장 (항상 크롭된 결과)
                if save_captures:
                    final_filename = capture_dir / f"04_cropped_result_{timestamp}_attempt{attempt_number}.jpg"
                    summary_filename = capture_dir / f"cropped_capture_summary_{timestamp}_attempt{attempt_number}.txt"
                    
                    final_pil_image = Image.fromarray(frame)
                    final_pil_image.save(final_filename, "JPEG", quality=95)
                    logger.info(f"💾 [{attempt_number}번째 시도] 최종 결과 저장: {final_filename}")
                    
                    # 캡처 요약 정보 저장
                    with open(summary_filename, 'w', encoding='utf-8') as f:
                        f.write(f"CCTV 페이지 자동 크롭 캡처 요약 (시도 {attempt_number})\n")
                        f.write(f"=" * 50 + "\n")
                        f.write(f"시도 번호: {attempt_number}\n")
                        f.write(f"고정 크롭 좌표: (473, 57) ~ (793, 272)\n")
                        f.write(f"크롭 영역: {x2 - x1} x {y2 - y1} 픽셀\n")
                        f.write(f"Chrome 해상도: 2560x1440 (2K)\n")
                        f.write(f"DPI 스케일링: 2배\n")
                        f.write(f"고해상도 지원: 활성화\n")
                        f.write(f"페이지 로딩 대기 시간: {page_load_wait}초\n")
                        f.write(f"캡처 시간: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                        f.write(f"URL: {iframe_url}\n")
                        f.write(f"원본 이미지 크기: {full_frame.shape}\n")
                        f.write(f"최종 이미지 크기: {frame.shape}\n")
                        f.write(f"저장된 파일들:\n")
                        f.write(f"  1. 전체 페이지: 01_full_page_{timestamp}_attempt{attempt_number}.png\n")
                        f.write(f"  2. 크롭된 결과: {final_filename.name}\n")
                    
                    logger.info(f"📋 [{attempt_number}번째 시도] 캡처 요약 정보 저장: {summary_filename}")
                
                logger.info(f"✅ [{attempt_number}번째 시도] 페이지 캡처 완료: {frame.shape}")
                return frame
                    
            finally:
                driver.quit()
                
        except Exception as e:
            logger.error(f"❌ [{attempt_number}번째 시도] iframe 캡처 실패: {e}")
            return None
    
    def capture_zoomed_iframe(self, iframe_url: str, zoom_factor: float = 3.0, save_captures: bool = True) -> Optional[np.ndarray]:
        """iframe을 확대하여 고해상도로 캡처합니다.
        
        Args:
            iframe_url: iframe이 있는 페이지 URL
            zoom_factor: 확대 배율 (기본값: 3.0 = 3배 확대)
            save_captures: 캡처 이미지 저장 여부 (기본값: True)
        """
        try:
            import requests
            from selenium import webdriver
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            from selenium.webdriver.chrome.options import Options
            import time
            
            logger.info(f"🔍 iframe 확대 캡처 시작: {iframe_url} (배율: {zoom_factor}x)")
            
            # 캡처 이미지 저장 폴더 생성
            if save_captures:
                capture_dir = Path("captured_images")
                capture_dir.mkdir(exist_ok=True)
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                logger.info(f"📁 캡처 이미지 저장 폴더: {capture_dir.absolute()}")
            
            # Chrome 옵션 설정 (고해상도 + 확대)
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            chrome_options.add_argument("--disable-features=VizDisplayCompositor")
            
            # 확대 모드 - Chrome DevTools Protocol로 실제 확대
            chrome_options.add_argument("--window-size=1280,720")  # 기본 크기 유지
            chrome_options.add_argument("--force-device-scale-factor=1")  # 기본 스케일 유지
            chrome_options.add_argument("--remote-debugging-port=9223")  # DevTools Protocol 활성화 (다른 포트)
            chrome_options.add_argument("--disable-features=TranslateUI")  # 번역 UI 비활성화
            chrome_options.add_argument("--disable-extensions")  # 확장 프로그램 비활성화
            logger.info(f"🔍 Chrome DevTools 확대 모드: {zoom_factor}배")
            
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            
            # WebDriver 초기화 (자동 설치)
            try:
                driver = webdriver.Chrome(options=chrome_options)
            except:
                from webdriver_manager.chrome import ChromeDriverManager
                from selenium.webdriver.chrome.service import Service
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=chrome_options)
            
            try:
                # 페이지 로드
                driver.get(iframe_url)
                logger.info("📄 페이지 로드 완료")
                
                # 확대된 전체 페이지 스크린샷 저장
                if save_captures:
                    time.sleep(3)  # 페이지 로딩 대기 (확대 모드에서는 더 오래 대기)
                    full_page_screenshot = driver.get_screenshot_as_png()
                    full_page_filename = capture_dir / f"01_zoomed_full_page_{timestamp}.png"
                    with open(full_page_filename, 'wb') as f:
                        f.write(full_page_screenshot)
                    logger.info(f"💾 확대된 전체 페이지 스크린샷 저장: {full_page_filename}")
                
                # iframe이 로드될 때까지 대기
                wait = WebDriverWait(driver, 15)  # 확대 모드에서는 더 오래 대기
                
                # iframe 찾기
                iframe = None
                try:
                    # 방법 1: video 태그가 있는 iframe 찾기
                    iframe = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "iframe[src*='video'], iframe[src*='stream']")))
                except:
                    try:
                        # 방법 2: 일반적인 iframe 찾기
                        iframes = driver.find_elements(By.TAG_NAME, "iframe")
                        if iframes:
                            iframe = iframes[0]  # 첫 번째 iframe 사용
                    except:
                        pass
                
                if iframe:
                    logger.info("✅ iframe 발견 - 확대 모드로 캡처")
                    
                    # iframe으로 전환
                    driver.switch_to.frame(iframe)
                    
                    # iframe 내부 확대 스크린샷 저장
                    if save_captures:
                        time.sleep(3)  # iframe 로딩 대기
                        iframe_screenshot = driver.get_screenshot_as_png()
                        iframe_filename = capture_dir / f"02_zoomed_iframe_content_{timestamp}.png"
                        with open(iframe_filename, 'wb') as f:
                            f.write(iframe_screenshot)
                        logger.info(f"💾 확대된 iframe 내부 스크린샷 저장: {iframe_filename}")
                    
                    # Chrome DevTools Protocol로 실제 화면 확대
                    logger.info(f"🔍 Chrome DevTools {zoom_factor}배로 실제 화면 확대")
                    
                    # Device Metrics Override로 실제 화면 확대
                    driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride', {
                        'width': 1280,
                        'height': 720,
                        'deviceScaleFactor': zoom_factor,  # 실제 화면 확대
                        'mobile': False
                    })
                    
                    # 확대된 화면이 렌더링될 때까지 대기
                    time.sleep(3)
                    
                    # 확대된 iframe 전체를 numpy 배열로 변환
                    screenshot = driver.get_screenshot_as_png()
                    pil_image = Image.open(io.BytesIO(screenshot))
                    frame = np.array(pil_image)
                    
                    # RGB로 변환 (RGBA인 경우)
                    if len(frame.shape) == 3 and frame.shape[2] == 4:
                        frame = frame[:, :, :3]
                    
                    # 최종 확대 결과 이미지 저장
                    if save_captures:
                        final_filename = capture_dir / f"04_zoomed_final_result_{timestamp}.jpg"
                        final_pil_image = Image.fromarray(frame)
                        final_pil_image.save(final_filename, "JPEG", quality=95)
                        logger.info(f"💾 확대된 최종 결과 이미지 저장: {final_filename}")
                        
                        # 확대 캡처 요약 정보 저장
                        summary_filename = capture_dir / f"zoomed_capture_summary_{timestamp}.txt"
                        with open(summary_filename, 'w', encoding='utf-8') as f:
                            f.write(f"CCTV iframe 확대 캡처 요약\n")
                            f.write(f"=" * 40 + "\n")
                            f.write(f"캡처 시간: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                            f.write(f"URL: {iframe_url}\n")
                            f.write(f"확대 배율: {zoom_factor}x\n")
                            f.write(f"이미지 크기: {frame.shape}\n")
                            f.write(f"저장된 파일들:\n")
                            f.write(f"  1. 확대 전체 페이지: 01_zoomed_full_page_{timestamp}.png\n")
                            f.write(f"  2. 확대 iframe 내부: 02_zoomed_iframe_content_{timestamp}.png\n")
                            f.write(f"  3. 확대 최종 결과: 04_zoomed_final_result_{timestamp}.jpg\n")
                        logger.info(f"📋 확대 캡처 요약 정보 저장: {summary_filename}")
                    
                    logger.info(f"✅ iframe 확대 캡처 완료: {frame.shape} (배율: {zoom_factor}x)")
                    return frame
                else:
                    logger.warning("⚠️ iframe을 찾을 수 없음, 확대된 전체 페이지 캡처")
                    # iframe이 없으면 확대된 전체 페이지 캡처
                    time.sleep(3)
                    screenshot = driver.get_screenshot_as_png()
                    pil_image = Image.open(io.BytesIO(screenshot))
                    frame = np.array(pil_image)
                    if len(frame.shape) == 3 and frame.shape[2] == 4:
                        frame = frame[:, :, :3]
                    logger.info(f"✅ 확대된 전체 페이지 캡처 완료: {frame.shape}")
                    return frame
                    
            finally:
                driver.quit()
                
        except Exception as e:
            logger.error(f"❌ iframe 확대 캡처 실패: {e}")
            return None
    
    def _capture_video_area(self, driver, video_element, save_captures: bool, capture_dir: Path, timestamp: str) -> Optional[np.ndarray]:
        """Video 요소의 영역만 크롭하여 캡처합니다."""
        try:
            logger.info("📐 Video 영역 크롭 캡처 시작")
            
            # 비디오 요소의 위치와 크기 가져오기
            location = video_element.location
            size = video_element.size
            
            if not location or not size:
                logger.warning("⚠️ Video 요소 위치/크기 정보 없음")
                return None
            
            logger.info(f"Video 요소 위치: {location}, 크기: {size}")
            
            # 전체 페이지 스크린샷 캡처
            screenshot = driver.get_screenshot_as_png()
            pil_image = Image.open(io.BytesIO(screenshot))
            
            # 비디오 영역만 크롭
            left = location['x']
            top = location['y']
            right = left + size['width']
            bottom = top + size['height']
            
            # PIL로 비디오 영역만 크롭
            cropped_image = pil_image.crop((left, top, right, bottom))
            frame = np.array(cropped_image)
            
            # 크롭된 비디오 영역 이미지 저장
            if save_captures:
                cropped_filename = capture_dir / f"03_video_cropped_{timestamp}.jpg"
                cropped_image.save(cropped_filename, "JPEG", quality=95)
                logger.info(f"💾 비디오 영역 크롭 이미지 저장: {cropped_filename}")
            
            logger.info(f"✅ 비디오 영역 크롭 완료: {frame.shape}")
            return frame
            
        except Exception as e:
            logger.error(f"❌ Video 영역 크롭 실패: {e}")
            return None
    
    def _capture_full_iframe(self, driver, save_captures: bool, capture_dir: Path, timestamp: str) -> np.ndarray:
        """전체 iframe 영역을 캡처합니다."""
        try:
            logger.info("🖼️ 전체 iframe 영역 캡처")
            
            # iframe 내부 스크린샷 캡처
            screenshot = driver.get_screenshot_as_png()
            pil_image = Image.open(io.BytesIO(screenshot))
            frame = np.array(pil_image)
            
            # 전체 iframe 이미지 저장
            if save_captures:
                iframe_filename = capture_dir / f"03_full_iframe_{timestamp}.jpg"
                pil_image.save(iframe_filename, "JPEG", quality=95)
                logger.info(f"💾 전체 iframe 이미지 저장: {iframe_filename}")
            
            return frame
            
        except Exception as e:
            logger.error(f"❌ 전체 iframe 캡처 실패: {e}")
            # 최소한의 더미 이미지 반환
            return np.ones((480, 640, 3), dtype=np.uint8) * 128
    
    def capture_with_retry(self) -> Optional[np.ndarray]:
        """재시도를 포함한 프레임 캡처를 수행합니다."""
        for attempt in range(self.retry_count):
            frame = self.capture_frame()
            if frame is not None:
                return frame
            
            logger.warning(f"재시도 {attempt + 1}/{self.retry_count}")
            time.sleep(1)
        
        # CCTV 연결 실패 시 테스트용 더미 이미지 생성
        logger.warning("CCTV 연결 실패, 테스트용 더미 이미지 생성")
        return self._generate_dummy_frame()
    
    def _generate_dummy_frame(self) -> np.ndarray:
        """테스트용 더미 이미지를 생성합니다."""
        try:
            # 640x480 크기의 테스트 이미지 생성
            height, width = 480, 640
            frame = np.zeros((height, width, 3), dtype=np.uint8)
            
            # 그라데이션 배경 생성
            for y in range(height):
                for x in range(width):
                    frame[y, x] = [
                        int(255 * x / width),      # R
                        int(255 * y / height),     # G
                        int(128)                   # B
                    ]
            
            # 테스트 텍스트 추가 (OpenCV 사용)
            import cv2
            cv2.putText(frame, 'TEST FRAME', (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            cv2.putText(frame, 'CCTV Connection Failed', (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, 'Using Dummy Image', (50, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            logger.info("✅ 테스트용 더미 이미지 생성 완료")
            return frame
            
        except Exception as e:
            logger.error(f"❌ 더미 이미지 생성 실패: {e}")
            # 최소한의 더미 이미지 반환
            return np.ones((480, 640, 3), dtype=np.uint8) * 128
    
    def save_frame(self, frame: np.ndarray, filename: str = None) -> bool:
        """프레임을 이미지 파일로 저장합니다."""
        try:
            if filename is None:
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                filename = f"captured_frame_{timestamp}.jpg"
            
            # RGB를 BGR로 변환하여 저장
            bgr_frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            cv2.imwrite(filename, bgr_frame)
            logger.info(f"✔️ 프레임 저장 완료: {filename}")
            return True
        except Exception as e:
            logger.error(f"❌ 프레임 저장 실패: {e}")
            return False
    
    def get_frame_info(self, frame: np.ndarray) -> dict:
        """프레임 정보를 반환합니다."""
        if frame is None:
            return {}
        
        height, width = frame.shape[:2]
        channels = frame.shape[2] if len(frame.shape) > 2 else 1
        
        return {
            'width': width,
            'height': height,
            'channels': channels,
            'dtype': str(frame.dtype),
            'size_bytes': frame.nbytes
        }
    
    def release(self):
        """리소스를 해제합니다."""
        if self.cap is not None:
            self.cap.release()
            self.cap = None
            logger.info("CCTV 연결 해제")
    
    def __enter__(self):
        """컨텍스트 매니저 진입"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """컨텍스트 매니저 종료"""
        self.release()

    def _is_black_image(self, image_path: str, threshold: float = 0.95) -> bool:
        """
        이미지가 검정 화면인지 확인합니다.
        
        Args:
            image_path: 이미지 파일 경로
            threshold: 검정 화면 판단 임계값 (기본값: 0.95)
        
        Returns:
            bool: 검정 화면이면 True, 아니면 False
        """
        try:
            import cv2
            import numpy as np
            
            # 이미지 로드
            img = cv2.imread(image_path)
            if img is None:
                logger.warning(f"⚠️ 이미지를 로드할 수 없음: {image_path}")
                return True
            
            # 그레이스케일 변환
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # 평균 밝기 계산
            mean_brightness = np.mean(gray)
            
            # 검정 화면 판단 (평균 밝기가 10 이하면 검정 화면으로 간주)
            is_black = mean_brightness < 10
            
            logger.info(f"🔍 이미지 밝기 분석: {image_path}")
            logger.info(f"   📊 평균 밝기: {mean_brightness:.2f}")
            logger.info(f"   🖤 검정 화면 여부: {is_black}")
            
            return is_black
            
        except Exception as e:
            logger.error(f"❌ 이미지 밝기 분석 실패: {e}")
            return False  # 분석 실패 시 검정 화면이 아닌 것으로 간주
    
    def calculate_weather_score(self, temperature: float, rain: float, snow: float) -> int:
        """
        온도, 강수량, 강설량을 기반으로 날씨 점수를 계산합니다.
        
        Args:
            temperature: 기온 (섭씨)
            rain: 강수량 (mm)
            snow: 강설량 (mm)
        
        Returns:
            int: 날씨 점수 (0~5점)
        """
        try:
            logger.info(f"🌤️ 날씨 점수 계산 시작: 온도={temperature}°C, 강수량={rain}mm, 강설량={snow}mm")
            
            # 온도와 강수량 기반 점수 계산
            if temperature < 0 and rain > 0:
                # 영하에서 비가 오는 경우 (가장 위험)
                temp_rain_score = 5
                logger.info(f"❄️ 영하 온도 + 강수: {temp_rain_score}점")
            elif temperature >= 0:
                # 영상 온도에서 강수량에 따른 점수
                if rain == 0 :
                    temp_rain_score = 0
                elif rain > 0 and rain < 3 :
                    temp_rain_score = 1
                elif rain < 15:
                    temp_rain_score = 2
                elif rain < 30:
                    temp_rain_score = 3
                elif rain < 50:
                    temp_rain_score = 4
                else:  # rain >= 50
                    temp_rain_score = 5
                logger.info(f"🌧️ 영상 온도 + 강수량 {rain}mm: {temp_rain_score}점")
            else:
                # 영하에서 비가 오지 않는 경우
                temp_rain_score = 1
                logger.info(f"❄️ 영하 온도 + 무강수: {temp_rain_score}점")
            
            # 강설량 기반 점수 계산
            if snow == 0:
                snow_score = 0
            elif snow > 0 and snow < 1:
                snow_score = 1
            elif snow < 5:
                snow_score = 2
            elif snow < 10:
                snow_score = 3
            elif snow < 20:
                snow_score = 4
            else:  # snow >= 20
                snow_score = 5
            logger.info(f"❄️ 강설량 {snow}mm: {snow_score}점")
            
            # 최종 날씨 점수 (온도+강수와 강설 중 높은 점수 선택)
            final_weather_score = max(temp_rain_score, snow_score)
            
            logger.info(f"🌤️ 최종 날씨 점수: {final_weather_score}점 (온도+강수: {temp_rain_score}점, 강설: {snow_score}점)")
            
            return final_weather_score
            
        except Exception as e:
            logger.error(f"❌ 날씨 점수 계산 실패: {e}")
            return 0  # 기본값으로 0점 반환
    
    def draw_detection_boxes(self, image: np.ndarray, detections: list, save_path: str = None) -> np.ndarray:
        """
        탐지된 객체들을 바운딩 박스로 표시한 이미지를 생성합니다.
        
        Args:
            image: 원본 이미지 (numpy array)
            detections: YOLO 탐지 결과 리스트
            save_path: 저장할 경로 (None이면 저장하지 않음)
        
        Returns:
            np.ndarray: 바운딩 박스가 그려진 이미지
        """
        try:
            import cv2
            from config import CLASS_NAMES
            
            # 이미지 복사 (원본 보존)
            result_image = image.copy()
            
            # 클래스별 색상 정의 (BGR 형식)
            colors = {
                'crack': (0, 255, 0),      # 초록색 (균열)
                'break': (0, 0, 255),      # 빨간색 (포트홀)
                'ali_crack': (255, 0, 0)   # 파란색 (거북등 균열)
            }
            
            # 클래스별 한글 이름
            class_names_kr = {
                'crack': 'crack',
                'break': 'port_hole', 
                'ali_crack': 'ali_crack'
            }
            
            logger.info(f"🎨 바운딩 박스 그리기 시작: {len(detections)}개 객체")
            
            for i, detection in enumerate(detections):
                try:
                    # 탐지 결과에서 정보 추출
                    bbox = detection.get('bbox', [])
                    class_id = detection.get('class_id', 0)
                    confidence = detection.get('confidence', 0.0)
                    
                    if len(bbox) == 4:
                        x1, y1, x2, y2 = map(int, bbox)
                        
                        # 클래스 이름 가져오기
                        class_name = CLASS_NAMES['final'][class_id] if class_id < len(CLASS_NAMES['final']) else f'class_{class_id}'
                        class_name_kr = class_names_kr.get(class_name, class_name)
                        
                        # 색상 가져오기
                        color = colors.get(class_name, (128, 128, 128))  # 기본값: 회색
                        
                        # 바운딩 박스 그리기
                        cv2.rectangle(result_image, (x1, y1), (x2, y2), color, 2)
                        
                        # 클래스 이름 표시 (한글)
                        label = f"{class_name_kr}"
                        label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                        
                        # 라벨 배경 그리기
                        cv2.rectangle(result_image, 
                                    (x1, y1 - label_size[1] - 10), 
                                    (x1 + label_size[0], y1), 
                                    color, -1)
                        
                        # 라벨 텍스트 그리기 (흰색)
                        cv2.putText(result_image, label, (x1, y1 - 5), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                        
                        logger.info(f"   📦 객체 {i+1}: {class_name_kr} - 좌표 ({x1}, {y1}) ~ ({x2}, {y2})")
                        
                except Exception as e:
                    logger.warning(f"⚠️ 객체 {i+1} 바운딩 박스 그리기 실패: {e}")
                    continue
            
            # 결과 이미지 저장
            if save_path:
                try:
                    # result 폴더 생성
                    result_dir = Path(save_path).parent
                    result_dir.mkdir(exist_ok=True)
                    
                    # BGR로 변환 (OpenCV 저장용)
                    if len(result_image.shape) == 3 and result_image.shape[2] == 3:
                        bgr_image = cv2.cvtColor(result_image, cv2.COLOR_RGB2BGR)
                    else:
                        bgr_image = result_image
                    
                    # 이미지 저장
                    cv2.imwrite(save_path, bgr_image)
                    logger.info(f"💾 탐지 결과 이미지 저장 완료: {save_path}")
                    
                except Exception as e:
                    logger.error(f"❌ 탐지 결과 이미지 저장 실패: {e}")
            
            logger.info(f"✅ 바운딩 박스 그리기 완료: {len(detections)}개 객체")
            return result_image
            
        except Exception as e:
            logger.error(f"❌ 바운딩 박스 그리기 오류: {e}")
            return image
    
    def _capture_with_retry(self, url: str, max_retries: int = 3, retry_delay: int = 2) -> Optional[np.ndarray]:
        """
        검정 화면이 아닌 이미지가 캡처될 때까지 재시도합니다.
        검정 화면 감지 시 페이지를 완전히 새로 로드하여 전체 페이지 캡처부터 다시 시도합니다.
        
        Args:
            url: CCTV URL
            max_retries: 최대 재시도 횟수
            retry_delay: 재시도 간 대기 시간(초)
        
        Returns:
            np.ndarray: 성공적으로 캡처된 이미지 배열 또는 None
        """
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"🔄 [{attempt}/{max_retries}] CCTV 캡처 시도 중...")
                
                # 이미지 캡처 (시도 번호 전달)
                frame = self.capture_iframe_frame(url, attempt_number=attempt)
                
                if frame is not None:
                    # numpy 배열을 임시 파일로 저장하여 검정 화면 확인
                    import tempfile
                    import cv2
                    
                    with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
                        temp_path = temp_file.name
                        # BGR에서 RGB로 변환하여 저장
                        if len(frame.shape) == 3 and frame.shape[2] == 3:
                            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        else:
                            rgb_frame = frame
                        
                        # PIL로 저장
                        from PIL import Image
                        pil_image = Image.fromarray(rgb_frame)
                        pil_image.save(temp_path)
                    
                    # 검정 화면 확인
                    if not self._is_black_image(temp_path):
                        logger.info(f"✅ [{attempt}/{max_retries}] 정상 이미지 캡처 완료")
                        # 임시 파일 삭제
                        try:
                            Path(temp_path).unlink()
                        except:
                            pass
                        return frame
                    else:
                        logger.warning(f"⚠️ [{attempt}/{max_retries}] 검정 화면 감지, 페이지 새로 로드 후 재시도 예정...")
                        
                        # 임시 파일 삭제
                        try:
                            Path(temp_path).unlink()
                        except:
                            pass
                        
                        # 마지막 시도가 아니면 대기 후 재시도
                        if attempt < max_retries:
                            logger.info(f"⏳ {retry_delay}초 후 페이지 새로 로드하여 재시도...")
                            time.sleep(retry_delay)
                        else:
                            logger.error(f"❌ [{attempt}/{max_retries}] 최대 재시도 횟수 초과")
                            return None
                else:
                    logger.warning(f"⚠️ [{attempt}/{max_retries}] 이미지 캡처 실패")
                    
                    if attempt < max_retries:
                        logger.info(f"⏳ {retry_delay}초 후 재시도...")
                        time.sleep(retry_delay)
                    else:
                        logger.error(f"❌ [{attempt}/{max_retries}] 최대 재시도 횟수 초과")
                        return None
                        
            except Exception as e:
                logger.error(f"❌ [{attempt}/{max_retries}] 캡처 재시도 중 오류: {e}")
                
                if attempt < max_retries:
                    logger.info(f"⏳ {retry_delay}초 후 재시도...")
                    time.sleep(retry_delay)
                else:
                    logger.error(f"❌ [{attempt}/{max_retries}] 최대 재시도 횟수 초과")
                    return None
        
        return None
