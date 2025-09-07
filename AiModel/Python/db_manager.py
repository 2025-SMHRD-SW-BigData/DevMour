"""
데이터베이스 관리 모듈
AiServer와의 통신을 담당합니다.
"""

import requests
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

async def save_road_score_to_db(
    cctv_idx: int,
    cctv_name: str,
    cctv_url: Optional[str],
    lat: float,
    lon: float,
    risk_score: float,
    class_counts: Dict,
    analysis_type: str,
    frame_info: Optional[Dict] = None
) -> bool:
    """도로 점수를 AiServer 데이터베이스에 저장합니다."""
    try:
        import aiohttp
        from config import DB_CONFIG
        
        logger.info(f"🔍 save_road_score_to_db 함수 시작")
        logger.info(f"   📊 입력 데이터: cctv_idx={cctv_idx}, cctv_name={cctv_name}, risk_score={risk_score}")
        logger.info(f"   📍 cctv_location: {lat}, {lon}")
        logger.info(f"   📍 DB_CONFIG: {DB_CONFIG}")
        
        # 클래스별 개수 추출
        crack_cnt = class_counts.get('crack', 0)
        break_cnt = class_counts.get('break', 0)
        ali_crack_cnt = class_counts.get('ali_crack', 0)
        
        # AiServer로 데이터 전송
        payload = {
            'cctv_idx': cctv_idx,
            'lat': lat,
            'lon': lon,
            'road_score': risk_score,
            'crack_cnt': crack_cnt,
            'break_cnt': break_cnt,
            'ali_crack_cnt': ali_crack_cnt
        }
        
        logger.info(f"💾 도로 점수 비동기 저장 시도: CCTV {cctv_idx} ({cctv_name})")
        logger.info(f"   📍 위치: ({lat}, {lon})")
        logger.info(f"   🎯 위험도: {risk_score}")
        logger.info(f"   📊 클래스별 개수: 균열 {crack_cnt}, 포트홀 {break_cnt}, 거북등 {ali_crack_cnt}")
        logger.info(f"   🌐 전송 URL: {DB_CONFIG['road_score_url']}")
        logger.info(f"   📦 전송 데이터: {payload}")
        
        # aiohttp를 사용한 비동기 요청
        timeout = aiohttp.ClientTimeout(total=DB_CONFIG['timeout'])
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(DB_CONFIG['road_score_url'], json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ 도로 점수 비동기 저장 성공: ID {result.get('road_score_idx')}")
                    return True
                else:
                    logger.error(f"❌ 도로 점수 비동기 저장 실패: {response.status} - {response.text}")
                    return False

    except ImportError as e:
        logger.error(f"❌ aiohttp 모듈을 찾을 수 없습니다: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ 도로 점수 저장 오류: {e}")
        return False

async def save_risk_prediction_to_db(risk_analysis: Dict) -> bool:
    """위험도 예측 결과를 기존 데이터베이스에 저장합니다."""
    try:
        from config import DB_CONFIG
        
        # 위험도 점수 계산
        total_risk_score = risk_analysis.get('total_risk_score', 0.0)
        class_counts = risk_analysis.get('class_counts', {})
        detection_count = risk_analysis.get('detection_count', 0)
        
        # 기존 데이터베이스로 데이터 전송
        payload = {
            'totalRiskScore': total_risk_score,
            'classCounts': class_counts,
            'detectionCount': detection_count
        }
        
        logger.info(f"💾 위험도 예측 저장 시도: 총점 {total_risk_score}, 탐지 {detection_count}개")
        
        response = requests.post(
            DB_CONFIG['url'],
            json=payload,
            timeout=DB_CONFIG['timeout']
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"✅ 위험도 예측 저장 성공")
            return True
        else:
            logger.error(f"❌ 위험도 예측 저장 실패: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ 위험도 예측 저장 오류: {e}")
        return False

async def get_weather_info(lat: float, lon: float) -> Optional[Dict]:
    """
    위도, 경도 기반으로 날씨 정보를 조회합니다.
    
    Args:
        lat: 위도
        lon: 경도
    
    Returns:
        Dict: 날씨 정보 또는 None
    """
    # 로거 설정을 먼저 수행
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        import aiohttp
        
        # OpenWeatherMap API 설정
        API_KEY = 'c1c00ab7cd918d1121e2b38128a14709'
        BASE_URL = 'https://api.openweathermap.org/data/2.5'
        
        logger.info(f"🌤️ 날씨 정보 조회 시작: lat={lat}, lon={lon}")
        
        # 날씨 API 호출
        async with aiohttp.ClientSession() as session:
            url = f"{BASE_URL}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': API_KEY,
                'units': 'metric',
                'lang': 'kr'
            }
            
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    weather_data = await response.json()
                    
                    # 필요한 날씨 정보 추출
                    weather_info = {
                        'temperature': weather_data['main']['temp'],
                        'rain': weather_data.get('rain', {}).get('1h', 0) if weather_data.get('rain') else 0,
                        'snow': weather_data.get('snow', {}).get('1h', 0) if weather_data.get('snow') else 0,
                        'weather_type': weather_data['weather'][0]['main'],
                        'description': weather_data['weather'][0]['description'],
                        'humidity': weather_data['main']['humidity'],
                        'wind_speed': weather_data['wind']['speed']
                    }
                    
                    logger.info(f"✅ 날씨 정보 조회 성공: {weather_info}")
                    return weather_info
                else:
                    logger.error(f"❌ 날씨 API 호출 실패: {response.status}")
                    return None
                    
    except ImportError as e:
        logger.error(f"❌ aiohttp 모듈을 찾을 수 없습니다: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ 날씨 정보 조회 실패: {e}")
        return None

async def save_weather_to_db(
    lat: float,
    lon: float,
    temperature: float,
    rain: float,
    snow: float,
    weather_type: str,
    weather_score: int,
    cctv_idx: int
) -> bool:
    """
    날씨 정보를 t_weather 테이블에 저장합니다.
    
    Args:
        lat: 위도
        lon: 경도
        temperature: 기온
        rain: 강수량
        snow: 강설량
        weather_type: 날씨 구분
        weather_score: 날씨 점수
        cctv_idx: CCTV 고유번호
    
    Returns:
        bool: 저장 성공 여부
    """
    # 로거 설정을 먼저 수행
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        import aiohttp
        from config import DB_CONFIG
        
        # AiServer의 날씨 저장 API 호출
        weather_url = f"{DB_CONFIG['road_score_url'].replace('/api/save-road-score', '/api/weather/save_weather')}"
        
        weather_data = {
            'lat': lat,
            'lon': lon,
            'temperature': temperature,
            'rain': rain,
            'snow': snow,
            'weather': weather_type,
            'weather_score': weather_score,
            'cctv_idx': cctv_idx
        }
        
        logger.info(f"💾 날씨 정보 저장 시작: {weather_data}")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(weather_url, json=weather_data) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get('success'):
                        logger.info(f"✅ 날씨 정보 저장 성공: {result.get('message')}")
                        return True
                    else:
                        logger.warning(f"⚠️ 날씨 정보 저장 실패: {result.get('message')}")
                        return False
                else:
                    logger.error(f"❌ 날씨 정보 저장 API 호출 실패: {response.status}")
                    return False
                    
    except ImportError as e:
        logger.error(f"❌ aiohttp 모듈을 찾을 수 없습니다: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ 날씨 정보 저장 실패: {e}")
        return False

async def save_total_score_to_db(
    cctv_idx: int,
    lat: float,
    lon: float,
    road_score: float,
    weather_score: int,
    total_score: float,
    crack_cnt: int,
    break_cnt: int,
    ali_crack_cnt: int,
    precipitation: float,
    temp: float,
    wh_type: str,
    snowfall: float
) -> bool:
    """
    종합 점수를 t_total 테이블에 저장합니다.
    
    Args:
        cctv_idx: CCTV 고유번호
        lat: 위도
        lon: 경도
        road_score: 도로 위험 점수
        weather_score: 날씨 점수
        total_score: 종합 점수
        crack_cnt: 균열 개수
        break_cnt: 포트홀 개수
        ali_crack_cnt: 거북등 균열 개수
        precipitation: 강수량
        temp: 기온
        wh_type: 날씨 구분
        snowfall: 강설량
    
    Returns:
        bool: 저장 성공 여부
    """
    # 로거 설정을 먼저 수행
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        import aiohttp
        from config import DB_CONFIG
        
        # AiServer의 종합 점수 저장 API 호출
        total_url = f"{DB_CONFIG['road_score_url'].replace('/api/save-road-score', '/api/total/save_total')}"
        
        total_data = {
            'cctv_idx': cctv_idx,
            'lat': lat,
            'lon': lon,
            'road_score': road_score,
            'weather_score': weather_score,
            'total_score': total_score,
            'crack_cnt': crack_cnt,
            'break_cnt': break_cnt,
            'ali_crack_cnt': ali_crack_cnt,
            'precipitation': precipitation,
            'temp': temp,
            'wh_type': wh_type,
            'snowfall': snowfall
        }
        
        logger.info(f"🎯 종합 점수 저장 시작: {total_data}")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(total_url, json=total_data) as response:
                if response.status == 200:
                    result = await response.json()
                    if result.get('success'):
                        logger.info(f"✅ 종합 점수 저장 성공: {result.get('message')}")
                        return True
                    else:
                        logger.warning(f"⚠️ 종합 점수 저장 실패: {result.get('message')}")
                        return False
                else:
                    logger.error(f"❌ 종합 점수 저장 API 호출 실패: {response.status}")
                    return False
                    
    except ImportError as e:
        logger.error(f"❌ aiohttp 모듈을 찾을 수 없습니다: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ 종합 점수 저장 실패: {e}")
        return False

async def save_citizen_result_to_db(
    c_report_idx: int,
    c_reporter_name: Optional[str],
    c_reporter_phone: Optional[str],
    cr_type: str,
    lat: float,
    lon: float,
    road_score: float,
    weather_score: int,
    total_score: float,
    crack_cnt: int,
    break_cnt: int,
    ali_crack_cnt: int,
    precipitation: float,
    temp: float,
    wh_type: str,
    snowfall: float,
    image_path: str
) -> bool:
    """시민 제보 분석 결과를 t_citizen_result 테이블에 저장합니다."""
    try:
        from config import DB_CONFIG
        
        logger.info(f"🔍 save_citizen_result_to_db 함수 시작")
        logger.info(f"   📊 입력 데이터: c_report_idx={c_report_idx}, cr_type={cr_type}")
        logger.info(f"   📍 위치: ({lat}, {lon})")
        logger.info(f"   🎯 점수: 도로={road_score}, 날씨={weather_score}, 총점={total_score}")
        
        # AiServer로 데이터 전송
        payload = {
            'c_report_idx': c_report_idx,
            'c_reporter_name': c_reporter_name,
            'c_reporter_phone': c_reporter_phone,
            'cr_type': cr_type,
            'lat': lat,
            'lon': lon,
            'road_score': road_score,
            'weather_score': weather_score,
            'total_score': total_score,
            'crack_cnt': crack_cnt,
            'break_cnt': break_cnt,
            'ali_crack_cnt': ali_crack_cnt,
            'precipitation': precipitation,
            'temp': temp,
            'wh_type': wh_type,
            'snowfall': snowfall,
            'image_path': image_path
        }
        
        logger.info(f"💾 시민 제보 결과 저장 시도: 제보번호 {c_report_idx}")
        logger.info(f"   📦 전송 데이터: {payload}")
        
        # 시민 제보 분석 결과 저장 엔드포인트로 전송
        response = requests.post(
            f"{DB_CONFIG['base_url']}/api/complaint/citizen-result",
            json=payload,
            timeout=DB_CONFIG['timeout']
        )
        
        logger.info(f"📡 HTTP 응답: 상태코드 {response.status_code}")
        logger.info(f"📡 응답 내용: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"✅ 시민 제보 결과 저장 성공: ID {result.get('citizen_result_idx')}")
            return True
        else:
            logger.error(f"❌ 시민 제보 결과 저장 실패: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ 시민 제보 결과 저장 오류: {e}")
        import traceback
        logger.error(f"📋 상세 오류: {traceback.format_exc()}")
        return False
