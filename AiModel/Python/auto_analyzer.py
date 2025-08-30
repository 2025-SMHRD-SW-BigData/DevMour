#!/usr/bin/env python3
"""
자동 이미지 분석 스케줄러
"""

import asyncio
import time
import logging
import threading
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import requests
from pathlib import Path
import sys

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from config import DB_CONFIG
from yolo_ensemble import YOLOEnsemble
from cctv_processor import CCTVProcessor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AutoImageAnalyzer:
    """자동 이미지 분석 스케줄러"""
    
    def __init__(self, 
                 analysis_interval: int = 60,  # 분석 간격 (초)
                 save_results: bool = True,    # 결과 저장 여부
                 max_retries: int = 3):       # 최대 재시도 횟수
        
        self.analysis_interval = analysis_interval
        self.save_results = save_results
        self.max_retries = max_retries
        self.is_running = False
        self.analysis_thread = None
        
        # AI 모델 및 CCTV 프로세서 초기화
        self.yolo_ensemble = None
        self.cctv_processor = None
        
        # 분석 통계
        self.stats = {
            'total_analyses': 0,
            'successful_analyses': 0,
            'failed_analyses': 0,
            'last_analysis_time': None,
            'last_analysis_result': None,
            'start_time': None
        }
    
    def initialize(self):
        """AI 모델과 CCTV 프로세서를 초기화합니다."""
        try:
            logger.info("🔧 자동 분석기 초기화 중...")
            
            # YOLO 앙상블 모델 로드
            try:
                self.yolo_ensemble = YOLOEnsemble()
                logger.info("✅ YOLO 앙상블 모델 로드 완료")
            except Exception as e:
                logger.error(f"❌ YOLO 모델 로드 실패: {e}")
                return False
            
            # CCTV 프로세서 초기화
            try:
                self.cctv_processor = CCTVProcessor()
                logger.info("✅ CCTV 프로세서 초기화 완료")
            except Exception as e:
                logger.error(f"❌ CCTV 프로세서 초기화 실패: {e}")
                return False
            
            self.stats['start_time'] = datetime.now()
            logger.info("🎯 자동 분석기 초기화 완료!")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ 자동 분석기 초기화 실패: {e}")
            import traceback
            logger.error(f"상세 오류: {traceback.format_exc()}")
            return False
    
    def start_auto_analysis(self):
        """자동 이미지 분석을 시작합니다."""
        if self.is_running:
            logger.warning("⚠️ 자동 분석이 이미 실행 중입니다.")
            return False
        
        if not self.initialize():
            logger.error("❌ 초기화 실패로 자동 분석을 시작할 수 없습니다.")
            return False
        
        self.is_running = True
        self.analysis_thread = threading.Thread(target=self._analysis_loop, daemon=True)
        self.analysis_thread.start()
        
        logger.info(f"🚀 자동 이미지 분석 시작 (간격: {self.analysis_interval}초)")
        return True
    
    def stop_auto_analysis(self):
        """자동 이미지 분석을 중지합니다."""
        if not self.is_running:
            logger.warning("⚠️ 자동 분석이 실행 중이 아닙니다.")
            return False
        
        self.is_running = False
        if self.analysis_thread:
            self.analysis_thread.join(timeout=5)
        
        logger.info("🛑 자동 이미지 분석 중지됨")
        return True
    
    def _analysis_loop(self):
        """분석 루프를 실행합니다."""
        while self.is_running:
            try:
                # 이미지 분석 수행
                result = self._perform_analysis()
                
                if result:
                    self.stats['successful_analyses'] += 1
                    logger.info(f"✅ 자동 분석 성공: {result['risk_analysis']['total_risk_score']}점")
                else:
                    self.stats['failed_analyses'] += 1
                    logger.warning("⚠️ 자동 분석 실패")
                
                self.stats['total_analyses'] += 1
                self.stats['last_analysis_time'] = datetime.now()
                self.stats['last_analysis_result'] = result
                
                # 결과를 데이터베이스에 저장
                if self.save_results and result:
                    self._save_to_database(result)
                
                # 대기
                time.sleep(self.analysis_interval)
                
            except Exception as e:
                logger.error(f"❌ 자동 분석 루프 오류: {e}")
                time.sleep(10)  # 오류 발생 시 10초 대기
    
    def _perform_analysis(self) -> Optional[Dict[str, Any]]:
        """단일 이미지 분석을 수행합니다."""
        try:
            # CCTV에서 프레임 캡처
            frame = self.cctv_processor.capture_with_retry()
            if frame is None:
                logger.warning("⚠️ CCTV 프레임 캡처 실패")
                return None
            
            # 프레임 정보
            frame_info = self.cctv_processor.get_frame_info(frame)
            
            # YOLO 앙상블 예측 수행
            detections = self.yolo_ensemble.predict(frame)
            
            # 위험도 점수 계산
            risk_analysis = self.yolo_ensemble.calculate_risk_score(detections)
            
            # 결과 구성
            result = {
                'success': True,
                'frame_info': frame_info,
                'detections': detections,
                'risk_analysis': risk_analysis,
                'timestamp': time.time(),
                'analysis_type': 'auto'
            }
            
            return result
            
        except Exception as e:
            logger.error(f"❌ 이미지 분석 실패: {e}")
            return None
    
    def _save_to_database(self, result: Dict[str, Any]):
        """분석 결과를 데이터베이스에 저장합니다."""
        try:
            risk_analysis = result['risk_analysis']
            
            payload = {
                'totalRiskScore': risk_analysis['total_risk_score'],
                'classCounts': risk_analysis['class_counts'],
                'detectionCount': risk_analysis['detection_count']
            }
            
            response = requests.post(
                DB_CONFIG['url'], 
                json=payload, 
                timeout=DB_CONFIG['timeout']
            )
            
            if response.status_code == 200:
                logger.info("💾 분석 결과 데이터베이스 저장 성공")
            else:
                logger.warning(f"⚠️ 데이터베이스 저장 실패: {response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ 데이터베이스 저장 오류: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """분석 통계를 반환합니다."""
        stats = self.stats.copy()
        
        if stats['start_time']:
            uptime = datetime.now() - stats['start_time']
            stats['uptime_seconds'] = int(uptime.total_seconds())
            stats['uptime_formatted'] = str(uptime).split('.')[0]
        
        if stats['total_analyses'] > 0:
            stats['success_rate'] = (stats['successful_analyses'] / stats['total_analyses']) * 100
        else:
            stats['success_rate'] = 0
        
        return stats
    
    def set_analysis_interval(self, interval: int):
        """분석 간격을 설정합니다."""
        if interval < 10:  # 최소 10초
            interval = 10
        
        self.analysis_interval = interval
        logger.info(f"⏰ 분석 간격을 {interval}초로 설정")
    
    def force_analysis(self) -> Optional[Dict[str, Any]]:
        """즉시 이미지 분석을 수행합니다."""
        try:
            if not self.yolo_ensemble or not self.cctv_processor:
                logger.error("❌ 분석기가 초기화되지 않았습니다.")
                # 자동으로 초기화 시도
                if not self.initialize():
                    logger.error("❌ 자동 초기화 실패")
                    return None
            
            logger.info("🔍 즉시 이미지 분석 수행 중...")
            result = self._perform_analysis()
            
            if result and self.save_results:
                self._save_to_database(result)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ 즉시 분석 중 오류 발생: {e}")
            import traceback
            logger.error(f"상세 오류: {traceback.format_exc()}")
            return None

# 전역 인스턴스
auto_analyzer = AutoImageAnalyzer()

def start_auto_analysis(interval: int = 60):
    """자동 이미지 분석을 시작합니다."""
    return auto_analyzer.start_auto_analysis()

def stop_auto_analysis():
    """자동 이미지 분석을 중지합니다."""
    return auto_analyzer.stop_auto_analysis()

def get_analysis_stats():
    """분석 통계를 반환합니다."""
    return auto_analyzer.get_stats()

def force_analysis():
    """즉시 이미지 분석을 수행합니다."""
    return auto_analyzer.force_analysis()

if __name__ == "__main__":
    # 테스트 실행
    print("🧪 자동 이미지 분석기 테스트")
    
    if auto_analyzer.initialize():
        print("✅ 초기화 성공")
        
        # 즉시 분석 테스트
        result = auto_analyzer.force_analysis()
        if result:
            print(f"✅ 분석 성공: {result['risk_analysis']['total_risk_score']}점")
        else:
            print("❌ 분석 실패")
        
        # 통계 출력
        stats = auto_analyzer.get_stats()
        print(f"📊 통계: {stats}")
    else:
        print("❌ 초기화 실패")
