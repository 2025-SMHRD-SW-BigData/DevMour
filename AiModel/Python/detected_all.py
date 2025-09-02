#!/usr/bin/env python3
"""
t_cctv 테이블의 모든 CCTV를 순차적으로 AI 분석하여 결과를 저장하는 스크립트
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

class CCTVDetector:
    """CCTV 감지 및 분석 클래스"""
    
    def __init__(self):
        self.ai_server_url = os.getenv('AI_SERVER_URL', "http://0.0.0.0:8000")
        self.db_server_url = os.getenv('DB_SERVER_URL', "http://0.0.0.0:3000")
        
    async def get_all_cctv_data(self) -> List[Dict]:
        """t_cctv 테이블에서 모든 CCTV 데이터를 가져옵니다."""
        try:
            logger.info("🔍 t_cctv 테이블에서 모든 CCTV 데이터 조회 중...")
            
            # AiServer에서 CCTV 데이터 조회
            response = requests.get(f"{self.db_server_url}/api/cctv-list")
            
            if response.status_code == 200:
                data = response.json()
                cctv_list = data.get('data', [])
                logger.info(f"✅ CCTV 데이터 {len(cctv_list)}개 조회 완료")
                return cctv_list
            else:
                logger.error(f"❌ CCTV 데이터 조회 실패: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ CCTV 데이터 조회 오류: {e}")
            return []
    
    async def analyze_single_cctv(self, cctv_data: Dict) -> Optional[Dict]:
        """단일 CCTV를 AI 분석합니다."""
        try:
            cctv_idx = cctv_data.get('cctv_idx')
            cctv_name = cctv_data.get('cctv_name')
            cctv_url = cctv_data.get('cctv_url')
            lat = cctv_data.get('lat')
            lon = cctv_data.get('lon')
            
            logger.info(f"🚀 CCTV {cctv_idx} ({cctv_name}) AI 분석 시작")
            logger.info(f"   📍 위치: ({lat}, {lon})")
            logger.info(f"   🌐 URL: {cctv_url}")
            
            # AI 서버로 분석 요청 (재시도 로직 포함)
            analysis_request = {
                "cctv_idx": cctv_idx,
                "cctv_url": cctv_url,
                "cctv_name": cctv_name,
                "lat": float(lat) if lat else 37.5665,
                "lon": float(lon) if lon else 126.9780,
                "analysis_type": "cctv_batch_analysis"
            }
            
            logger.info(f"📤 AI 분석 요청 전송: {analysis_request}")
            
            # 최대 3번까지 재시도
            max_retries = 3
            for attempt in range(1, max_retries + 1):
                try:
                    response = requests.post(
                        f"{self.ai_server_url}/api/analyze-cctv",
                        json=analysis_request,
                        timeout=60  # 60초 타임아웃
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        logger.info(f"✅ CCTV {cctv_idx} AI 분석 완료 (시도 {attempt}번)")
                        logger.info(f"   📊 탐지 결과: {result.get('detections', [])}")
                        logger.info(f"   🎯 위험도 점수: {result.get('risk_analysis', {}).get('total_risk_score', 0)}")
                        logger.info(f"   📷 캡처 방법: {result.get('capture_method', 'unknown')}")
                        
                        # 🎨 탐지 결과 이미지 정보 로깅
                        result_image = result.get('result_image', {})
                        if result_image and result_image.get('annotated'):
                            logger.info(f"   🖼️ 결과 이미지: {result_image.get('result_image_path')}")
                            logger.info(f"   📦 탐지된 객체: {result_image.get('detection_count')}개")
                        else:
                            logger.warning(f"   ⚠️ 결과 이미지 생성 실패")
                        return result
                    else:
                        error_msg = response.text
                        logger.warning(f"⚠️ CCTV {cctv_idx} AI 분석 실패 (시도 {attempt}번): {response.status_code}")
                        logger.warning(f"   📋 응답 내용: {error_msg}")
                        
                        # 검정 화면 오류인 경우 재시도
                        if "검정 화면" in error_msg or "CCTV 이미지 캡처 실패" in error_msg:
                            if attempt < max_retries:
                                logger.info(f"🔄 검정 화면 감지, {attempt}초 후 재시도...")
                                await asyncio.sleep(attempt)  # 점진적으로 대기 시간 증가
                                continue
                            else:
                                logger.error(f"❌ CCTV {cctv_idx} 최대 재시도 횟수 초과")
                                return None
                        else:
                            # 다른 오류인 경우 재시도하지 않음
                            logger.error(f"❌ CCTV {cctv_idx} 다른 오류로 재시도 중단")
                            return None
                            
                except requests.exceptions.Timeout:
                    logger.warning(f"⏰ CCTV {cctv_idx} AI 분석 타임아웃 (시도 {attempt}번)")
                    if attempt < max_retries:
                        logger.info(f"🔄 {attempt}초 후 재시도...")
                        await asyncio.sleep(attempt)
                        continue
                    else:
                        logger.error(f"❌ CCTV {cctv_idx} 타임아웃으로 최대 재시도 횟수 초과")
                        return None
                        
                except Exception as e:
                    logger.error(f"❌ CCTV {cctv_idx} AI 분석 요청 오류 (시도 {attempt}번): {e}")
                    if attempt < max_retries:
                        logger.info(f"🔄 {attempt}초 후 재시도...")
                        await asyncio.sleep(attempt)
                        continue
                    else:
                        logger.error(f"❌ CCTV {cctv_idx} 최대 재시도 횟수 초과")
                        return None
            
            return None
                
        except Exception as e:
            logger.error(f"❌ CCTV {cctv_data.get('cctv_idx', 'Unknown')} 분석 오류: {e}")
            return None
    
    async def save_analysis_result(self, cctv_data: Dict, analysis_result: Dict) -> bool:
        """분석 결과를 데이터베이스에 저장합니다."""
        try:
            if not analysis_result:
                logger.warning(f"⚠️ CCTV {cctv_data.get('cctv_idx')} 분석 결과가 없어 저장 건너뜀")
                return False
            
            # 위험도 분석 결과 추출
            risk_analysis = analysis_result.get('risk_analysis', {})
            total_risk_score = risk_analysis.get('total_risk_score', 0.0)
            class_counts = risk_analysis.get('class_counts', {})
            
            # 클래스별 개수 추출
            crack_cnt = class_counts.get('crack', 0)
            break_cnt = class_counts.get('break', 0)
            ali_crack_cnt = class_counts.get('ali_crack', 0)
            
            # 도로 점수 저장 요청
            save_request = {
                'cctv_idx': cctv_data.get('cctv_idx'),
                'lat': cctv_data.get('lat'),
                'lon': cctv_data.get('lon'),
                'road_score': total_risk_score,
                'crack_cnt': crack_cnt,
                'break_cnt': break_cnt,
                'ali_crack_cnt': ali_crack_cnt
            }
            
            logger.info(f"💾 CCTV {cctv_data.get('cctv_idx')} 분석 결과 저장 중...")
            logger.info(f"   📊 저장 데이터: {save_request}")
            
            response = requests.post(
                f"{self.db_server_url}/api/save-road-score",
                json=save_request,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ CCTV {cctv_data.get('cctv_idx')} 분석 결과 저장 완료")
                logger.info(f"   🆔 저장된 ID: {result.get('road_score_idx')}")
                return True
            else:
                logger.error(f"❌ CCTV {cctv_data.get('cctv_idx')} 분석 결과 저장 실패: {response.status_code}")
                logger.error(f"   📋 응답 내용: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ CCTV {cctv_data.get('cctv_idx')} 분석 결과 저장 오류: {e}")
            return False
    
    async def process_all_cctv(self, delay_seconds: int = 5):
        """모든 CCTV를 순차적으로 처리합니다."""
        try:
            logger.info("🚀 전체 CCTV AI 분석 프로세스 시작")
            logger.info("=" * 60)
            
            # 1. 모든 CCTV 데이터 조회
            cctv_list = await self.get_all_cctv_data()
            
            if not cctv_list:
                logger.warning("⚠️ 처리할 CCTV 데이터가 없습니다.")
                return
            
            logger.info(f"📋 총 {len(cctv_list)}개 CCTV 처리 예정")
            logger.info("=" * 60)
            
            # 2. 순차적으로 AI 분석 및 저장
            success_count = 0
            fail_count = 0
            
            for i, cctv_data in enumerate(cctv_list, 1):
                logger.info(f"🔄 [{i}/{len(cctv_list)}] CCTV {cctv_data.get('cctv_idx')} 처리 중...")
                
                try:
                    # AI 분석 수행
                    analysis_result = await self.analyze_single_cctv(cctv_data)
                    
                    if analysis_result:
                        # 분석 결과 저장
                        save_success = await self.save_analysis_result(cctv_data, analysis_result)
                        
                        if save_success:
                            success_count += 1
                            logger.info(f"✅ CCTV {cctv_data.get('cctv_idx')} 처리 완료")
                        else:
                            fail_count += 1
                            logger.error(f"❌ CCTV {cctv_data.get('cctv_idx')} 저장 실패")
                    else:
                        fail_count += 1
                        logger.error(f"❌ CCTV {cctv_data.get('cctv_idx')} 분석 실패")
                    
                    # 다음 CCTV 처리 전 대기 (서버 부하 방지)
                    if i < len(cctv_list):
                        logger.info(f"⏳ {delay_seconds}초 대기 후 다음 CCTV 처리...")
                        await asyncio.sleep(delay_seconds)
                    
                except Exception as e:
                    fail_count += 1
                    logger.error(f"❌ CCTV {cctv_data.get('cctv_idx')} 처리 중 오류: {e}")
                    continue
                
                logger.info("-" * 40)
            
            # 3. 최종 결과 요약
            logger.info("=" * 60)
            logger.info("🏁 전체 CCTV AI 분석 프로세스 완료")
            logger.info(f"📊 처리 결과:")
            logger.info(f"   ✅ 성공: {success_count}개")
            logger.info(f"   ❌ 실패: {fail_count}개")
            logger.info(f"   📋 총 처리: {len(cctv_list)}개")
            logger.info("=" * 60)
            
        except Exception as e:
            logger.error(f"❌ 전체 CCTV 처리 프로세스 오류: {e}")
            import traceback
            logger.error(f"📋 상세 오류: {traceback.format_exc()}")

async def main():
    """메인 함수"""
    try:
        logger.info("🎯 CCTV 일괄 AI 분석 스크립트 시작")
        
        # CCTV 감지기 초기화
        detector = CCTVDetector()
        
        # 사용자 입력 받기
        print("\n" + "=" * 60)
        print("🎥 CCTV 일괄 AI 분석 도구")
        print("=" * 60)
        
        try:
            delay_input = input("📝 CCTV 간 처리 대기 시간(초, 기본값: 5): ").strip()
            delay_seconds = int(delay_input) if delay_input else 5
        except ValueError:
            delay_seconds = 5
            print("⚠️ 잘못된 입력, 기본값 5초 사용")
        
        print(f"⏰ CCTV 간 대기 시간: {delay_seconds}초")
        print("🚀 분석을 시작합니다...")
        print("=" * 60)
        
        # 전체 CCTV 처리 시작
        await detector.process_all_cctv(delay_seconds)
        
    except KeyboardInterrupt:
        logger.info("⏹️ 사용자에 의해 중단됨")
    except Exception as e:
        logger.error(f"❌ 메인 프로세스 오류: {e}")
        import traceback
        logger.error(f"📋 상세 오류: {traceback.format_exc()}")

if __name__ == "__main__":
    # 비동기 메인 함수 실행
    asyncio.run(main())
