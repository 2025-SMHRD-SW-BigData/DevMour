#!/usr/bin/env python3
"""
t_cctv 테이블의 모든 CCTV를 순차적으로 침수 분석하여 결과를 저장하는 스크립트
"""

import asyncio
import sys
import time
import logging
from pathlib import Path
from typing import List, Dict, Optional
import requests
import json

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FloodDetector:
    """CCTV 침수 감지 및 분석 클래스"""
    
    def __init__(self):
        self.flood_server_url = "http://localhost:8002"  # 침수 분석 서버
        # CCTV 목록 조회: Back 서버 
        self.cctv_server_url = "http://175.45.194.114:3001"
        
    async def get_all_cctv_data(self) -> List[Dict]:
        """t_cctv 테이블에서 모든 CCTV 데이터를 가져옵니다."""
        try:
            logger.info("🔍 t_cctv 테이블에서 모든 CCTV 데이터 조회 중...")
            
            # Back 서버에서 CCTV 데이터 조회
            response = requests.get(f"{self.cctv_server_url}/api/cctv/all")
            
            if response.status_code == 200:
                raw = response.json()
                # 배열 또는 { data: [...] } 형태 모두 대응
                if isinstance(raw, list):
                    cctv_list = raw
                elif isinstance(raw, dict) and 'data' in raw and isinstance(raw['data'], list):
                    cctv_list = raw['data']
                else:
                    logger.error(f"❌ 예상하지 못한 응답 형태: {type(raw)}")
                    return []
                
                logger.info(f"✅ CCTV 데이터 {len(cctv_list)}개 조회 완료")
                return cctv_list
            else:
                logger.error(f"❌ CCTV 데이터 조회 실패: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ CCTV 데이터 조회 오류: {e}")
            return []
    
    async def analyze_flood(self, cctv_data: Dict, max_retries: int = 3) -> Optional[Dict]:
        """CCTV 침수 분석을 수행합니다."""
        cctv_idx = cctv_data.get('cctv_idx')
        cctv_url = cctv_data.get('cctv_url')
        lat = cctv_data.get('lat')
        lon = cctv_data.get('lon')
        
        if not cctv_idx or not cctv_url:
            logger.error(f"❌ CCTV {cctv_idx} 필수 데이터 누락")
            return None
            
        logger.info(f"📤 침수 분석 요청 전송: {{'cctv_idx': {cctv_idx}, 'cctv_url': '{cctv_url}', 'lat': {lat}, 'lon': {lon}}}")
        
        for attempt in range(1, max_retries + 1):
            try:
                # 침수 분석 서버에 요청
                analysis_data = {
                    'cctv_idx': cctv_idx,
                    'cctv_url': cctv_url,
                    'lat': lat,
                    'lon': lon
                }
                
                response = requests.post(
                    f"{self.flood_server_url}/api/analyze-flood",
                    json=analysis_data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"✅ CCTV {cctv_idx} 침수 분석 완료 (시도 {attempt}번)")
                    logger.info(f"   🌊 침수 여부: {result.get('flood_result', 'N')}")
                    logger.info(f"   📊 신뢰도: {result.get('confidence', 0.0)}")
                    
                    # 분석 이미지 정보
                    analysis_image = result.get('analysis_image')
                    if analysis_image:
                        logger.info(f"   📷 분석 이미지: {analysis_image.get('image_path')}")
                    else:
                        logger.warning(f"   ⚠️ 분석 이미지 정보 없음")
                    
                    return result
                else:
                    error_msg = response.text
                    logger.warning(f"⚠️ CCTV {cctv_idx} 침수 분석 실패 (시도 {attempt}번): {response.status_code}")
                    logger.warning(f"   📋 응답 내용: {error_msg}")
                    
                    # 검정 화면 오류인 경우 재시도
                    if "검정 화면" in error_msg or "CCTV 이미지 캡처 실패" in error_msg or "timeout" in error_msg.lower():
                        if attempt < max_retries:
                            wait_time = attempt * 2  # 점진적으로 대기 시간 증가
                            logger.info(f"🔄 검정 화면/타임아웃 감지, {wait_time}초 후 재시도...")
                            await asyncio.sleep(wait_time)
                            continue
                        else:
                            logger.error(f"❌ CCTV {cctv_idx} 최대 재시도 횟수 초과")
                            return None
                    else:
                        # 다른 오류인 경우 재시도하지 않음
                        logger.error(f"❌ CCTV {cctv_idx} 다른 오류로 재시도 중단")
                        return None
                        
            except requests.exceptions.Timeout:
                logger.warning(f"⏰ CCTV {cctv_idx} 침수 분석 타임아웃 (시도 {attempt}번)")
                if attempt < max_retries:
                    wait_time = attempt * 2
                    logger.info(f"🔄 {wait_time}초 후 재시도...")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    logger.error(f"❌ CCTV {cctv_idx} 타임아웃으로 최대 재시도 횟수 초과")
                    return None
                    
            except Exception as e:
                logger.error(f"❌ CCTV {cctv_idx} 침수 분석 요청 오류 (시도 {attempt}번): {e}")
                if attempt < max_retries:
                    wait_time = attempt * 2
                    logger.info(f"🔄 {wait_time}초 후 재시도...")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    logger.error(f"❌ CCTV {cctv_idx} 최대 재시도 횟수 초과")
                    return None
        
        return None
                
    
    async def process_all_cctv(self):
        """모든 CCTV를 순차적으로 처리합니다."""
        logger.info("🚀 침수 분석 시작")
        
        # CCTV 데이터 조회
        cctv_list = await self.get_all_cctv_data()
        
        if not cctv_list:
            logger.error("❌ CCTV 데이터를 가져올 수 없습니다")
            return
        
        logger.info(f"📋 총 {len(cctv_list)}개의 CCTV 처리 예정")
        
        success_count = 0
        fail_count = 0
        
        for i, cctv_data in enumerate(cctv_list, 1):
            cctv_idx = cctv_data.get('cctv_idx')
            logger.info(f"🔄 [{i}/{len(cctv_list)}] CCTV {cctv_idx} 처리 중...")
            
            try:
                # 침수 분석 수행
                analysis_result = await self.analyze_flood(cctv_data)
                
                if analysis_result:
                    # flood_server.py에서 이미 결과를 저장하므로 여기서는 저장하지 않음
                    success_count += 1
                    logger.info(f"✅ CCTV {cctv_idx} 처리 완료 (flood_server.py에서 자동 저장됨)")
                else:
                    fail_count += 1
                    logger.error(f"❌ CCTV {cctv_idx} 분석 실패")
                
            except Exception as e:
                fail_count += 1
                logger.error(f"❌ CCTV {cctv_idx} 처리 중 오류: {e}")
            
            # 다음 CCTV 처리 전 대기
            if i < len(cctv_list):
                logger.info("⏳ 5초 대기 후 다음 CCTV 처리...")
                await asyncio.sleep(5)
        
        # 최종 결과 요약
        logger.info("=" * 50)
        logger.info("📊 침수 분석 완료 요약")
        logger.info(f"   ✅ 성공: {success_count}개")
        logger.info(f"   ❌ 실패: {fail_count}개")
        logger.info(f"   📋 총 처리: {len(cctv_list)}개")
        logger.info("=" * 50)

async def main():
    """메인 함수"""
    try:
        detector = FloodDetector()
        await detector.process_all_cctv()
    except KeyboardInterrupt:
        logger.info("⏹️ 사용자에 의해 중단됨")
    except Exception as e:
        logger.error(f"❌ 예상치 못한 오류: {e}")

if __name__ == "__main__":
    asyncio.run(main())
