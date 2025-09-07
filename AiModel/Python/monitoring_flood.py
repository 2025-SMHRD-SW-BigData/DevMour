#!/usr/bin/env python3
"""
1시간 단위로 CCTV 정보를 모니터링하여 실시간 날씨를 조회하고,
강수량이 20을 넘으면 flood_detected_all.py를 자동 실행하는 스크립트
"""

import asyncio
import sys
import time
import logging
import requests
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime, timedelta

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('monitoring_flood.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FloodMonitoring:
    """침수 모니터링 클래스"""
    
    def __init__(self, test_mode=False):
        # Back 서버 포트(3001)로 변경
        self.db_server_url = "http://175.45.194.114:3001"
        
        # config.py에서 날씨 API 설정 가져오기
        try:
            from config import WEATHER_CONFIG
            self.weather_api_key = WEATHER_CONFIG['api_key']
            self.weather_base_url = WEATHER_CONFIG['base_url']
            self.weather_timeout = WEATHER_CONFIG['timeout']
        except ImportError:
            self.weather_api_key = "c1c00ab7cd918d1121e2b38128a14709"
            self.weather_base_url = "http://api.openweathermap.org/data/2.5/weather"
            self.weather_timeout = 10
        
        # 테스트 모드일 때는 5분 간격, 일반 모드일 때는 1시간 간격
        self.monitoring_interval = 300 if test_mode else 3600  # 5분 또는 1시간
        self.rain_threshold = 3  # 강수량 임계값 (mm)
        self.flood_script_path = Path(__file__).parent / "flood_detected_all.py"
        self.test_mode = test_mode
        
    async def get_all_cctv_data(self) -> List[Dict]:
        """t_cctv 테이블에서 모든 CCTV 데이터를 가져옵니다."""
        try:
            logger.info("🔍 t_cctv 테이블에서 모든 CCTV 데이터 조회 중...")
            
            # AiServer에서 CCTV 데이터 조회
            response = requests.get(f"{self.db_server_url}/api/cctv/all")
            
            if response.status_code == 200:
                raw = response.json()
                # 배열 또는 { data: [...] } 형태 모두 대응
                if isinstance(raw, list):
                    cctv_list = raw
                elif isinstance(raw, dict) and 'data' in raw and isinstance(raw['data'], list):
                    cctv_list = raw['data']
                else:
                    logger.error(f"❌ 알 수 없는 CCTV 응답 형식: {type(raw)}")
                    return []

                logger.info(f"✅ CCTV 데이터 {len(cctv_list)}개 조회 완료")
                return cctv_list
            else:
                logger.error(f"❌ CCTV 데이터 조회 실패: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ CCTV 데이터 조회 오류: {e}")
            return []
    
    async def get_weather_data(self, lat: float, lon: float) -> Optional[Dict]:
        """OpenWeatherMap API를 사용하여 실시간 날씨 데이터를 가져옵니다."""
        try:
            # OpenWeatherMap API URL
            weather_url = self.weather_base_url
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.weather_api_key,
                'units': 'metric'  # 섭씨 온도 사용
            }
            
            logger.info(f"🌤️ 날씨 데이터 조회 중: ({lat}, {lon})")
            
            response = requests.get(weather_url, params=params, timeout=self.weather_timeout)
            
            if response.status_code == 200:
                weather_data = response.json()
                
                # 강수량 정보 추출 (1시간 강수량)
                rain_1h = weather_data.get('rain', {}).get('1h', 0)
                rain_3h = weather_data.get('rain', {}).get('3h', 0)
                
                # 현재 시간
                current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                
                weather_info = {
                    'timestamp': current_time,
                    'lat': lat,
                    'lon': lon,
                    'temperature': weather_data.get('main', {}).get('temp', 0),
                    'humidity': weather_data.get('main', {}).get('humidity', 0),
                    'rain_1h': rain_1h,
                    'rain_3h': rain_3h,
                    'weather_main': weather_data.get('weather', [{}])[0].get('main', ''),
                    'weather_description': weather_data.get('weather', [{}])[0].get('description', ''),
                    'wind_speed': weather_data.get('wind', {}).get('speed', 0)
                }
                
                logger.info(f"✅ 날씨 데이터 조회 완료: 강수량(1h)={rain_1h}mm, 강수량(3h)={rain_3h}mm")
                return weather_info
            else:
                logger.error(f"❌ 날씨 데이터 조회 실패: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ 날씨 데이터 조회 오류: {e}")
            return None
    
    async def monitor_all_cctv_weather(self) -> List[Dict]:
        """모든 CCTV의 날씨 데이터를 모니터링합니다."""
        try:
            logger.info("🌊 CCTV 날씨 모니터링 시작...")
            
            # CCTV 데이터 가져오기
            cctv_list = await self.get_all_cctv_data()
            
            if not cctv_list:
                logger.warning("⚠️ CCTV 데이터가 없습니다.")
                return []
            
            weather_data_list = []
            
            # 각 CCTV의 날씨 데이터 조회
            for cctv in cctv_list:
                try:
                    cctv_idx = cctv.get('cctv_idx')
                    cctv_name = cctv.get('cctv_name')
                    lat = float(cctv.get('lat', 0))
                    lon = float(cctv.get('lon', 0))
                    
                    if lat == 0 or lon == 0:
                        logger.warning(f"⚠️ CCTV {cctv_idx} ({cctv_name})의 좌표가 유효하지 않습니다.")
                        continue
                    
                    logger.info(f"🌤️ CCTV {cctv_idx} ({cctv_name}) 날씨 조회 중...")
                    
                    # 날씨 데이터 조회
                    weather_data = await self.get_weather_data(lat, lon)
                    
                    if weather_data:
                        # CCTV 정보 추가
                        weather_data['cctv_idx'] = cctv_idx
                        weather_data['cctv_name'] = cctv_name
                        weather_data['cctv_url'] = cctv.get('cctv_url', '')
                        
                        weather_data_list.append(weather_data)
                        
                        # 강수량 체크
                        rain_1h = weather_data.get('rain_1h', 0)
                        rain_3h = weather_data.get('rain_3h', 0)
                        
                        if rain_1h > self.rain_threshold or rain_3h > self.rain_threshold:
                            logger.warning(f"⚠️ CCTV {cctv_idx} ({cctv_name}) 강수량 임계값 초과!")
                            logger.warning(f"   🌧️ 1시간 강수량: {rain_1h}mm, 3시간 강수량: {rain_3h}mm")
                    
                    # API 호출 간격 조절 (서버 부하 방지)
                    await asyncio.sleep(1)
                    
                except Exception as e:
                    logger.error(f"❌ CCTV {cctv.get('cctv_idx', 'Unknown')} 날씨 조회 오류: {e}")
                    continue
            
            logger.info(f"✅ 날씨 모니터링 완료: {len(weather_data_list)}개 CCTV")
            return weather_data_list
            
        except Exception as e:
            logger.error(f"❌ 날씨 모니터링 오류: {e}")
            return []
    
    async def check_flood_condition(self, weather_data_list: List[Dict]) -> bool:
        """강수량 임계값을 체크하여 침수 감지 조건을 확인합니다."""
        try:
            logger.info("🔍 침수 감지 조건 확인 중...")
            
            for weather_data in weather_data_list:
                rain_1h = weather_data.get('rain_1h', 0)
                rain_3h = weather_data.get('rain_3h', 0)
                cctv_idx = weather_data.get('cctv_idx')
                cctv_name = weather_data.get('cctv_name')
                
                # 강수량 임계값 체크
                if rain_1h >= self.rain_threshold or rain_3h > self.rain_threshold:
                    logger.warning(f"🚨 침수 감지 조건 만족!")
                    logger.warning(f"   📍 CCTV {cctv_idx} ({cctv_name})")
                    logger.warning(f"   🌧️ 1시간 강수량: {rain_1h}mm (임계값: {self.rain_threshold}mm)")
                    logger.warning(f"   🌧️ 3시간 강수량: {rain_3h}mm (임계값: {self.rain_threshold}mm)")
                    return True
            
            logger.info("✅ 모든 CCTV의 강수량이 정상 범위입니다.")
            return False
            
        except Exception as e:
            logger.error(f"❌ 침수 감지 조건 확인 오류: {e}")
            return False
    
    async def execute_flood_detection(self):
        """flood_detected_all.py 스크립트를 실행합니다."""
        try:
            logger.info("🚀 flood_detected_all.py 실행 시작...")
            
            if not self.flood_script_path.exists():
                logger.error(f"❌ flood_detected_all.py 파일을 찾을 수 없습니다: {self.flood_script_path}")
                return False
            
            # Python 스크립트 실행
            result = subprocess.run([
                sys.executable, 
                str(self.flood_script_path)
            ], capture_output=True, text=True, timeout=2400)  # 40분 타임아웃
            
            if result.returncode == 0:
                logger.info("✅ flood_detected_all.py 실행 완료")
                logger.info(f"📋 실행 결과: {result.stdout}")
                return True
            else:
                logger.error(f"❌ flood_detected_all.py 실행 실패")
                logger.error(f"📋 오류 내용: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error("❌ flood_detected_all.py 실행 타임아웃 (40분 초과)")
            return False
        except Exception as e:
            logger.error(f"❌ flood_detected_all.py 실행 오류: {e}")
            return False
    
    async def save_weather_data_to_db(self, weather_data_list: List[Dict]) -> bool:
        """날씨 데이터를 데이터베이스에 저장합니다."""
        try:
            logger.info("💾 날씨 데이터 저장 중...")
            
            # 날씨 데이터를 JSON 형태로 저장
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            weather_file = Path(f"weather_data_{timestamp}.json")
            
            with open(weather_file, 'w', encoding='utf-8') as f:
                json.dump(weather_data_list, f, ensure_ascii=False, indent=2)
            
            logger.info(f"✅ 날씨 데이터 저장 완료: {weather_file}")
            return True
            
        except Exception as e:
            logger.error(f"❌ 날씨 데이터 저장 오류: {e}")
            return False
    
    async def monitoring_cycle(self):
        """한 번의 모니터링 사이클을 실행합니다."""
        try:
            logger.info("🔄 모니터링 사이클 시작...")
            
            # 1. 모든 CCTV의 날씨 데이터 조회
            weather_data_list = await self.monitor_all_cctv_weather()
            
            if not weather_data_list:
                logger.warning("⚠️ 날씨 데이터가 없어 모니터링을 중단합니다.")
                return
            
            # 2. 날씨 데이터 저장
            await self.save_weather_data_to_db(weather_data_list)
            
            # 3. 침수 감지 조건 확인
            flood_condition_met = await self.check_flood_condition(weather_data_list)
            
            # 4. 침수 감지 조건이 만족되면 flood_detected_all.py 실행
            if flood_condition_met:
                logger.warning("🚨 침수 감지 조건 만족! flood_detected_all.py 실행...")
                await self.execute_flood_detection()
            else:
                logger.info("✅ 침수 감지 조건이 만족되지 않았습니다.")
            
            logger.info("🔄 모니터링 사이클 완료")
            
        except Exception as e:
            logger.error(f"❌ 모니터링 사이클 오류: {e}")
    
    async def start_monitoring_async(self):
        """비동기 모니터링을 시작합니다."""
        try:
            interval_text = "5분" if self.test_mode else "1시간"
            logger.info("🌊 침수 모니터링 시스템 시작...")
            logger.info(f"⏰ 모니터링 간격: {self.monitoring_interval}초 ({interval_text})")
            logger.info(f"🌧️ 강수량 임계값: {self.rain_threshold}mm")
            logger.info(f"📁 flood 스크립트 경로: {self.flood_script_path}")
            if self.test_mode:
                logger.info("🧪 테스트 모드로 실행 중...")
            
            # 즉시 첫 번째 모니터링 실행
            logger.info("🚀 첫 번째 모니터링 실행...")
            await self.monitoring_cycle()
            
            # 주기적 모니터링 실행
            while True:
                try:
                    # 설정된 간격만큼 대기
                    await asyncio.sleep(self.monitoring_interval)
                    
                    # 모니터링 실행
                    await self.monitoring_cycle()
                    
                except asyncio.CancelledError:
                    logger.info("🛑 모니터링 시스템 종료...")
                    break
                except Exception as e:
                    logger.error(f"❌ 모니터링 실행 오류: {e}")
                    await asyncio.sleep(60)  # 오류 발생 시 1분 대기 후 재시도
                
        except Exception as e:
            logger.error(f"❌ 모니터링 시스템 오류: {e}")
    
    def start_monitoring(self):
        """모니터링을 시작합니다."""
        try:
            # 비동기 모니터링 실행
            asyncio.run(self.start_monitoring_async())
        except KeyboardInterrupt:
            logger.info("🛑 모니터링 시스템 종료...")
        except Exception as e:
            logger.error(f"❌ 모니터링 시스템 오류: {e}")

def main():
    """메인 함수"""
    try:
        # 명령행 인수 확인 (테스트 모드)
        test_mode = "--test" in sys.argv
        run_once = "--once" in sys.argv

        # 모니터링 시스템 초기화
        monitor = FloodMonitoring(test_mode=test_mode)

        # 단일 사이클 실행 옵션 처리
        if run_once:
            # 단일 이벤트 루프에서 한 번만 수행
            asyncio.run(monitor.monitoring_cycle())
        else:
            # 모니터링 시작 (단일 이벤트 루프 사용)
            monitor.start_monitoring()

    except Exception as e:
        logger.error(f"❌ 메인 함수 오류: {e}")

if __name__ == "__main__":
    # 메인 함수 실행 (중첩 이벤트 루프 방지)
    main()
