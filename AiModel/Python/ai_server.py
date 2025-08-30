from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import logging
import time
from typing import Dict, List, Optional
import numpy as np
from PIL import Image
import io
import sys
from pathlib import Path

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from config import SERVER_CONFIG, DB_CONFIG, MODEL_CONFIG
from yolo_ensemble import YOLOEnsemble
from cctv_processor import CCTVProcessor
from auto_analyzer import start_auto_analysis, stop_auto_analysis, get_analysis_stats, force_analysis
from db_manager import save_road_score_to_db

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="AI 도로 위험도 분석 서버",
    description="YOLO 앙상블 모델을 사용한 도로 손상 탐지 및 위험도 분석 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CCTV 분석 요청 모델
class CCTVAnalysisRequest(BaseModel):
       cctv_idx: Optional[int] = None  # CCTV 고유번호  ← 이 줄 추가
       cctv_url: Optional[str] = None
       cctv_name: Optional[str] = None
       cctv_location: Optional[Dict] = None
       lat: Optional[float] = None # 위도
       lon: Optional[float] = None # 경도
       analysis_type: Optional[str] = "cctv_realtime"
       zoom_factor: Optional[float] = None
       crop_coords: Optional[Dict] = None

# 전역 변수
yolo_ensemble: Optional[YOLOEnsemble] = None
cctv_processor: Optional[CCTVProcessor] = None

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 초기화"""
    global yolo_ensemble, cctv_processor
    
    try:
        logger.info("🚀 AI 서버 시작 중...")
        
        # YOLO 앙상블 모델 로드
        yolo_ensemble = YOLOEnsemble()
        logger.info("✔️ YOLO 앙상블 모델 로드 완료")
        
        # 모델 설정값 로그
        logger.info(f"⚙️ 모델 설정값:")
        logger.info(f"   📊 신뢰도 임계값: {MODEL_CONFIG.get('confidence_threshold', 'N/A')}")
        logger.info(f"   🎯 NMS IoU 임계값: {MODEL_CONFIG.get('nms_iou_threshold', 'N/A')}")
        logger.info(f"   ⚖️ 앙상블 가중치: {MODEL_CONFIG.get('ensemble_weights', 'N/A')}")
        logger.info(f"   🏷️ 클래스 이름: {MODEL_CONFIG.get('class_names', 'N/A')}")
        
        # CCTV 프로세서 초기화
        cctv_processor = CCTVProcessor()
        logger.info("✔️ CCTV 프로세서 초기화 완료")
        
        logger.info("🎯 AI 서버 시작 완료!")
        
    except Exception as e:
        logger.error(f"❌ 서버 초기화 실패: {e}")
        raise

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "AI 도로 위험도 분석 서버",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "models_loaded": yolo_ensemble is not None,
        "cctv_connected": cctv_processor is not None
    }

@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """업로드된 이미지를 분석합니다."""
    if yolo_ensemble is None:
        raise HTTPException(status_code=500, detail="AI 모델이 로드되지 않았습니다")
    
    try:
        # 이미지 파일 읽기
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # PIL 이미지를 numpy 배열로 변환
        image_array = np.array(image)
        
        # RGB로 변환 (RGBA인 경우)
        if image_array.shape[2] == 4:
            image_array = image_array[:, :, :3]
        
        logger.info(f"🖼️ 이미지 분석 시작: {file.filename}")
        logger.info(f"📊 이미지 정보: 크기 {len(contents)} bytes, 해상도 {image_array.shape[1]}x{image_array.shape[0]}")
        
        # YOLO 앙상블 예측 수행
        logger.info("🚀 YOLO 앙상블 예측 시작")
        detections = yolo_ensemble.predict(image_array)
        
        # 위험도 점수 계산
        logger.info("💰 위험도 점수 계산 시작")
        risk_analysis = yolo_ensemble.calculate_risk_score(detections)
        
        # 결과에 이미지 정보 추가
        image_info = {
            'filename': file.filename,
            'size': len(contents),
            'dimensions': f"{image_array.shape[1]}x{image_array.shape[0]}"
        }
        
        result = {
            'success': True,
            'image_info': image_info,
            'detections': detections,
            'risk_analysis': risk_analysis,
            'timestamp': time.time()
        }
        
        logger.info(f"✅ 이미지 분석 완료: {len(detections)}개 객체 탐지")
        logger.info(f"📈 최종 결과: 위험도 총점 {risk_analysis['total_risk_score']}, 클래스별 개수 {risk_analysis['class_counts']}")
        return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"이미지 분석 실패: {e}")
        raise HTTPException(status_code=500, detail=f"이미지 분석 실패: {str(e)}")

@app.post("/api/analyze-cctv")
async def analyze_cctv(request: CCTVAnalysisRequest):
    """CCTV 스트림에서 프레임을 캡처하고 분석합니다."""
    if yolo_ensemble is None:
        raise HTTPException(status_code=500, detail="AI 모델이 초기화되지 않았습니다")
    
    try:
        # 요청 데이터 파싱
        cctv_url = request.cctv_url
        cctv_name = request.cctv_name or 'Unknown CCTV'
        analysis_type = request.analysis_type or 'cctv_realtime'
        
        logger.info(f"CCTV 분석 시작: {cctv_name} ({cctv_url})")
        
        # CCTV URL이 제공된 경우
        if cctv_url:
            try:
                logger.info(f"🎥 CCTV 분석 시작: {cctv_url}")
                
                # CCTV 프로세서 초기화
                local_cctv_processor = CCTVProcessor()
                
                try:
                    # 검정 화면이 아닌 이미지가 캡처될 때까지 재시도
                    frame = local_cctv_processor._capture_with_retry(cctv_url, max_retries=3, retry_delay=2)
                    
                    if frame is None:
                        logger.error("❌ 검정 화면이 아닌 이미지 캡처 실패")
                        return JSONResponse(
                            status_code=500,
                            content={
                                "error": "CCTV 이미지 캡처 실패",
                                "details": "검정 화면이 아닌 이미지를 캡처할 수 없습니다."
                            }
                        )
                    
                    logger.info(f"✅ CCTV 이미지 캡처 완료: {frame.shape if hasattr(frame, 'shape') else 'Unknown'}")
                    
                    # AI 분석 수행
                    detections = yolo_ensemble.predict(frame)
                    risk_analysis = yolo_ensemble.calculate_risk_score(detections)
                    
                    # 🎨 탐지 결과 이미지에 바운딩 박스 그리기 및 저장
                    try:
                        logger.info("🎨 탐지 결과 이미지 생성 시작")
                        
                        # 결과 이미지 파일명 생성
                        timestamp = time.strftime("%Y%m%d_%H%M%S")
                        result_filename = f"detection_result_{cctv_name}_{timestamp}.png"
                        result_path = f"result/{result_filename}"
                        
                        # 바운딩 박스가 그려진 이미지 생성 및 저장
                        annotated_image = local_cctv_processor.draw_detection_boxes(
                            frame, detections, save_path=result_path
                        )
                        
                        logger.info(f"✅ 탐지 결과 이미지 생성 완료: {result_path}")
                        
                        # 결과에 이미지 경로 추가
                        result_image_info = {
                            "result_image_path": result_path,
                            "detection_count": len(detections),
                            "annotated": True
                        }
                        
                    except Exception as image_error:
                        logger.error(f"❌ 탐지 결과 이미지 생성 실패: {image_error}")
                        result_image_info = {
                            "result_image_path": None,
                            "detection_count": len(detections),
                            "annotated": False
                        }
                    
                    # 분석 결과 구성
                    result = {
                        "success": True,
                        "cctv_url": cctv_url,
                        "cctv_name": cctv_name,
                        "frame_shape": frame.shape if hasattr(frame, 'shape') else None,
                        "risk_analysis": risk_analysis,
                        "analysis_type": analysis_type,
                        "capture_method": "retry_capture",
                        "result_image": result_image_info
                    }
                    
                    # 도로 점수 저장
                    if request.cctv_idx and request.lat and request.lon:
                        logger.info("💾 도로 점수 저장 시작")
                        await save_road_score_to_db(
                            cctv_idx=request.cctv_idx,  
                            cctv_name=cctv_name,
                            cctv_url=cctv_url,
                             lat=request.lat,  
                            lon=request.lon, 
                            risk_score=risk_analysis['total_risk_score'],
                            class_counts=risk_analysis['class_counts'],
                             analysis_type=analysis_type,
                              frame_info={"frame_shape": frame.shape if hasattr(frame, 'shape') else None}
                         )
                        logger.info("💾 도로 점수 저장 완료")
                        
                        # 🌤️ 날씨 정보 조회 및 저장
                        try:
                            logger.info("🌤️ 날씨 정보 조회 시작")
                            from db_manager import get_weather_info, save_weather_to_db
                            
                            # 날씨 정보 조회
                            weather_info = await get_weather_info(request.lat, request.lon)
                            
                            if weather_info:
                                logger.info(f"🌤️ 날씨 정보 조회 성공: {weather_info}")
                                
                                # 날씨 점수 계산
                                weather_score = cctv_processor.calculate_weather_score(
                                    weather_info['temperature'],
                                    weather_info['rain'],
                                    weather_info['snow']
                                )
                                
                                # 날씨 정보 저장
                                weather_saved = await save_weather_to_db(
                                    lat=request.lat,
                                    lon=request.lon,
                                    temperature=weather_info['temperature'],
                                    rain=weather_info['rain'],
                                    snow=weather_info['snow'],
                                    weather_type=weather_info['weather_type'],
                                    weather_score=weather_score,
                                    cctv_idx=request.cctv_idx
                                )
                                
                                if weather_saved:
                                    logger.info(f"✅ 날씨 정보 저장 완료: 점수 {weather_score}점")
                                    
                                    # 🎯 종합 점수 계산 및 저장
                                    try:
                                        logger.info("🎯 종합 점수 계산 시작")
                                        from db_manager import save_total_score_to_db
                                        
                                        # 종합 점수 계산: 도로점수 x (1 + 날씨점수/10)
                                        total_score = round(risk_analysis['total_risk_score'] * (1 + weather_score / 10), 1)
                                        logger.info(f"🎯 종합 점수 계산 완료: 도로점수 {risk_analysis['total_risk_score']} x (1 + {weather_score}/10) = {total_score}")
                                        
                                        # 클래스별 개수 추출
                                        crack_cnt = risk_analysis['class_counts'].get('crack', 0)
                                        break_cnt = risk_analysis['class_counts'].get('break', 0)
                                        ali_crack_cnt = risk_analysis['class_counts'].get('ali_crack', 0)
                                        
                                        # 종합 점수 저장
                                        total_saved = await save_total_score_to_db(
                                            cctv_idx=request.cctv_idx,
                                            lat=request.lat,
                                            lon=request.lon,
                                            road_score=risk_analysis['total_risk_score'],
                                            weather_score=weather_score,
                                            total_score=total_score,
                                            crack_cnt=crack_cnt,
                                            break_cnt=break_cnt,
                                            ali_crack_cnt=ali_crack_cnt,
                                            precipitation=weather_info['rain'],
                                            temp=weather_info['temperature'],
                                            wh_type=weather_info['weather_type'],
                                            snowfall=weather_info['snow']
                                        )
                                        
                                        if total_saved:
                                            logger.info(f"✅ 종합 점수 저장 완료: {total_score}점")
                                        else:
                                            logger.warning("⚠️ 종합 점수 저장 실패")
                                            
                                    except Exception as total_error:
                                        logger.error(f"❌ 종합 점수 처리 중 오류: {total_error}")
                                        import traceback
                                        logger.error(f"📋 종합 점수 오류 상세: {traceback.format_exc()}")
                                        
                                else:
                                    logger.warning("⚠️ 날씨 정보 저장 실패")
                            else:
                                logger.warning("⚠️ 날씨 정보 조회 실패")
                                
                        except Exception as weather_error:
                            logger.error(f"❌ 날씨 정보 처리 중 오류: {weather_error}")
                            import traceback
                            logger.error(f"📋 날씨 오류 상세: {traceback.format_exc()}")
                    
                    return result
                    
                finally:
                    # CCTV 프로세서 정리
                    local_cctv_processor.release()
                    
            except Exception as e:
                logger.error(f"❌ CCTV 분석 실패: {e}")
                import traceback
                logger.error(f"📋 상세 오류: {traceback.format_exc()}")
                
                return JSONResponse(
                    status_code=500,
                    content={
                        "error": "CCTV 분석 실패",
                        "details": str(e)
                    }
                )
        else:
            # 기본 CCTV 스트림 사용
            logger.info("기본 CCTV 스트림으로 분석 시작")
            
            # CCTV에서 프레임 캡처
            frame = cctv_processor.capture_with_retry()
            if frame is None:
                raise HTTPException(status_code=500, detail="CCTV 프레임 캡처 실패")
            
            # 프레임 정보
            frame_info = cctv_processor.get_frame_info(frame)
            logger.info(f"📊 기본 CCTV 프레임 정보: {frame_info}")
            
            # YOLO 앙상블 예측 수행
            logger.info("🚀 기본 CCTV YOLO 앙상블 예측 시작")
            detections = yolo_ensemble.predict(frame)
            
            # 위험도 점수 계산
            logger.info("💰 기본 CCTV 위험도 점수 계산 시작")
            risk_analysis = yolo_ensemble.calculate_risk_score(detections)
            
            # 도로 점수 저장
            logger.info("💾 도로 점수 저장 시작")
            await save_road_score_to_db(
                cctv_name='Default CCTV',
                cctv_url=None, # 기본 스트림은 URL이 없음
                cctv_location=None, # 기본 스트림은 위치 정보가 없음
                risk_score=risk_analysis['total_risk_score'],
                class_counts=risk_analysis['class_counts'],
                analysis_type='default_cctv',
                frame_info=frame_info
            )
            logger.info("💾 도로 점수 저장 완료")
            
            # 결과
            result = {
                'success': True,
                'cctv_name': 'Default CCTV',
                'frame_info': frame_info,
                'detections': detections,
                'risk_analysis': risk_analysis,
                'timestamp': time.time(),
                'analysis_type': 'default_cctv'
            }
            
            logger.info(f"✅ 기본 CCTV 분석 완료: {len(detections)}개 객체 탐지")
            logger.info(f"📈 기본 CCTV 분석 결과: 위험도 총점 {risk_analysis['total_risk_score']}, 클래스별 개수 {risk_analysis['class_counts']}")
            return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"CCTV 분석 실패: {e}")
        raise HTTPException(status_code=500, detail=f"CCTV 분석 실패: {str(e)}")

@app.post("/api/analyze-cctv-zoomed")
async def analyze_cctv_zoomed(request: CCTVAnalysisRequest):
    """CCTV 스트림을 확대하여 고해상도로 분석합니다."""
    if yolo_ensemble is None or cctv_processor is None:
        raise HTTPException(status_code=500, detail="AI 모델 또는 CCTV 프로세서가 초기화되지 않았습니다")
    
    try:
        # 요청 데이터 파싱
        cctv_url = request.cctv_url
        cctv_name = request.cctv_name or 'Unknown CCTV'
        analysis_type = request.analysis_type or 'cctv_zoomed'
        zoom_factor = request.zoom_factor or 3.0  # 요청에서 zoom_factor 가져오기
        
        logger.info(f"🔍 CCTV 확대 분석 시작: {cctv_name} ({cctv_url}) - {zoom_factor}배")
        
        # CCTV URL이 제공된 경우 해당 URL로 분석
        if cctv_url:
            # 원래 URL 저장 (스코프 문제 해결)
            original_url = cctv_processor.url
            
            try:
                # iframe 확대 방식으로 프레임 캡처
                logger.info(f"🔍 iframe 확대 방식으로 CCTV 캡처 시도 ({zoom_factor}배)")
                frame = cctv_processor.capture_zoomed_iframe(cctv_url, zoom_factor=zoom_factor, save_captures=True)
                
                if frame is None:
                    logger.warning("⚠️ iframe 확대 캡처 실패, 기존 방식으로 재시도")
                    # 기존 방식으로 재시도
                    cctv_processor.url = cctv_url
                    try:
                        frame = cctv_processor.capture_with_retry()
                    finally:
                        cctv_processor.url = original_url
                
                if frame is None:
                    raise HTTPException(status_code=500, detail="CCTV 프레임 캡처 실패")
                
                # 프레임 정보
                frame_info = cctv_processor.get_frame_info(frame)
                
                # YOLO 앙상블 예측 수행
                detections = yolo_ensemble.predict(frame)
                
                # 위험도 점수 계산
                risk_analysis = yolo_ensemble.calculate_risk_score(detections)
                
                # 도로 점수 저장
                logger.info("💾 도로 점수 저장 시작")
                await save_road_score_to_db(
                    cctv_idx=request.cctv_idx,  # 요청에서 받은 cctv_idx 사용
                    cctv_name=cctv_name,
                    cctv_url=cctv_url,
                    cctv_location=request.cctv_location,  # 위치 정보 전달
                    risk_score=risk_analysis['total_risk_score'],
                    class_counts=risk_analysis['class_counts'],
                    analysis_type=f'zoomed_iframe_capture_{zoom_factor}x',
                    frame_info=frame_info
                )
                logger.info("💾 도로 점수 저장 완료")
                
                # 결과
                result = {
                    'success': True,
                    'cctv_name': cctv_name,
                    'cctv_url': cctv_url,
                    'frame_info': frame_info,
                    'detections': detections,
                    'risk_analysis': risk_analysis,
                    'timestamp': time.time(),
                    'analysis_type': f'zoomed_iframe_capture_{zoom_factor}x',
                    'zoom_factor': zoom_factor
                }
                
                logger.info(f"✅ CCTV 확대 분석 완료: {cctv_name} - {len(detections)}개 객체 탐지 ({zoom_factor}배)")
                return JSONResponse(content=result)
                
            finally:
                # 원래 URL로 복원
                cctv_processor.url = original_url
        else:
            # 기본 CCTV 스트림 사용
            logger.info("기본 CCTV 스트림으로 확대 분석 시작")
            
            # CCTV에서 프레임 캡처
            frame = cctv_processor.capture_with_retry()
            if frame is None:
                raise HTTPException(status_code=500, detail="CCTV 프레임 캡처 실패")
            
            # 프레임 정보
            frame_info = cctv_processor.get_frame_info(frame)
            
            # YOLO 앙상블 예측 수행
            detections = yolo_ensemble.predict(frame)
            
            # 위험도 점수 계산
            risk_analysis = yolo_ensemble.calculate_risk_score(detections)
            
            # 도로 점수 저장
            logger.info("💾 도로 점수 저장 시작")
            await save_road_score_to_db(
                cctv_name='Default CCTV',
                cctv_url=None, # 기본 스트림은 URL이 없음
                cctv_location=None, # 기본 스트림은 위치 정보가 없음
                risk_score=risk_analysis['total_risk_score'],
                class_counts=risk_analysis['class_counts'],
                analysis_type=f'default_cctv_zoomed_{zoom_factor}x',
                frame_info=frame_info
            )
            logger.info("💾 도로 점수 저장 완료")
            
            # 결과
            result = {
                'success': True,
                'cctv_name': 'Default CCTV',
                'frame_info': frame_info,
                'detections': detections,
                'risk_analysis': risk_analysis,
                'timestamp': time.time(),
                'analysis_type': f'default_cctv_zoomed_{zoom_factor}x',
                'zoom_factor': zoom_factor
            }
            
            logger.info(f"기본 CCTV 확대 분석 완료: {len(detections)}개 객체 탐지 ({zoom_factor}배)")
            return JSONResponse(content=result)
        
    except Exception as e:
        logger.error(f"CCTV 확대 분석 실패: {e}")
        raise HTTPException(status_code=500, detail=f"CCTV 확대 분석 실패: {str(e)}")

@app.get("/api/models")
async def get_models_info():
    """로드된 모델 정보를 반환합니다."""
    if yolo_ensemble is None:
        raise HTTPException(status_code=500, detail="AI 모델이 로드되지 않았습니다")
    
    try:
        models_info = []
        for i, model_name in enumerate(yolo_ensemble.model_names):
            models_info.append({
                'name': model_name,
                'weight': yolo_ensemble.weights[i],
                'status': 'loaded'
            })
        
        return {
            'models': models_info,
            'total_models': len(models_info),
            'ensemble_weights': yolo_ensemble.weights
        }
        
    except Exception as e:
        logger.error(f"모델 정보 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=f"모델 정보 조회 실패: {str(e)}")

@app.get("/api/classes")
async def get_classes_info():
    """지원하는 클래스 정보를 반환합니다."""
    from config import CLASS_NAMES, RISK_SCORES
    
    return {
        'final_classes': CLASS_NAMES['final'],
        'model3_local_classes': CLASS_NAMES['model3_local'],
        'risk_scores': RISK_SCORES
    }

# =========================
# 5) 자동 분석 관련 엔드포인트
# =========================

@app.post("/api/auto-analysis/start")
async def start_auto_analysis_endpoint(interval: int = 60):
    """자동 이미지 분석을 시작합니다."""
    try:
        success = start_auto_analysis(interval)
        if success:
            return {
                "success": True,
                "message": f"자동 이미지 분석이 시작되었습니다 (간격: {interval}초)",
                "interval": interval
            }
        else:
            raise HTTPException(status_code=500, detail="자동 분석 시작 실패")
    except Exception as e:
        logger.error(f"자동 분석 시작 오류: {e}")
        raise HTTPException(status_code=500, detail=f"자동 분석 시작 오류: {str(e)}")

@app.post("/api/auto-analysis/stop")
async def stop_auto_analysis_endpoint():
    """자동 이미지 분석을 중지합니다."""
    try:
        success = stop_auto_analysis()
        if success:
            return {
                "success": True,
                "message": "자동 이미지 분석이 중지되었습니다"
            }
        else:
            raise HTTPException(status_code=500, detail="자동 분석 중지 실패")
    except Exception as e:
        logger.error(f"자동 분석 중지 오류: {e}")
        raise HTTPException(status_code=500, detail=f"자동 분석 중지 오류: {str(e)}")

@app.get("/api/auto-analysis/stats")
async def get_auto_analysis_stats():
    """자동 분석 통계를 반환합니다."""
    try:
        stats = get_analysis_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"자동 분석 통계 조회 오류: {e}")
        raise HTTPException(status_code=500, detail=f"자동 분석 통계 조회 오류: {str(e)}")

@app.post("/api/auto-analysis/force")
async def force_analysis_endpoint():
    """즉시 이미지 분석을 수행합니다."""
    try:
        logger.info("🔍 즉시 이미지 분석 요청 받음")
        result = force_analysis()
        
        if result:
            logger.info("✅ 즉시 분석 완료")
            return {
                "success": True,
                "message": "즉시 이미지 분석 완료",
                "result": result
            }
        else:
            logger.warning("⚠️ 즉시 분석 실패 - 결과 없음")
            raise HTTPException(status_code=500, detail="즉시 분석 실패 - 결과 없음")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"즉시 분석 오류: {e}")
        import traceback
        logger.error(f"상세 오류: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"즉시 분석 오류: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "ai_server:app",
        host=SERVER_CONFIG['host'],
        port=SERVER_CONFIG['port'],
        reload=SERVER_CONFIG['debug']
    )
