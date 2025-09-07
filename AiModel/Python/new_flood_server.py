from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import cv2
import numpy as np
from ultralytics import YOLO
import logging
import os
from datetime import datetime
import aiohttp
import json
import asyncio
import time

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="New Flood Analysis API", version="2.0.0")

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],  # 모든 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

# 설정값
FLOOD_CONFIDENCE_THRESHOLD = 0.7  # 침수 판단 신뢰도 임계값 (70%)
MAX_RETRIES = 3  # 최대 재시도 횟수
RETRY_DELAY = 2  # 재시도 간격 (초)

# YOLO 모델 로드
try:
    model = YOLO("../floodbest.pt")  # 상위 디렉토리의 floodbest.pt 파일 사용
    logger.info("✅ 침수 분석 모델 로드 성공")
    logger.info(f"🔧 설정값: 신뢰도 임계값 = {FLOOD_CONFIDENCE_THRESHOLD}")
    
    # 모델의 클래스 정보 출력
    if hasattr(model, 'names') and model.names:
        logger.info(f"📋 모델 클래스 정보: {model.names}")
    else:
        logger.warning("⚠️ 모델 클래스 정보를 찾을 수 없습니다.")
        
except Exception as e:
    logger.error(f"❌ 침수 분석 모델 로드 실패: {e}")
    model = None

class FloodAnalysisRequest(BaseModel):
    cctv_url: str
    cctv_idx: Optional[int] = None
    citizen_report_idx: Optional[int] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class ComplaintFloodAnalysisRequest(BaseModel):
    c_report_idx: int
    image_url: str
    lat: float
    lon: float
    c_report_detail: Optional[str] = None
    c_reporter_name: Optional[str] = None
    c_reporter_phone: Optional[str] = None

class FloodAnalysisResponse(BaseModel):
    success: bool
    flood_result: str  # 'Y' or 'N'
    confidence: float
    analysis_image: Optional[dict] = None
    message: str

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/api/analyze-flood", response_model=FloodAnalysisResponse)
async def analyze_flood(request: FloodAnalysisRequest):
    """CCTV 침수 분석 엔드포인트 (개선된 재시도 로직)"""
    logger.info("=" * 60)
    logger.info(f"🌊 CCTV 침수 분석 요청 수신")
    logger.info(f"📋 요청 데이터: CCTV_ID={request.cctv_idx}, URL={request.cctv_url}")
    logger.info(f"📍 위치: lat={request.lat}, lon={request.lon}")
    logger.info("=" * 60)
    
    try:
        logger.info(f"🌊 침수 분석 시작: {request.cctv_url}")
        
        if model is None:
            raise HTTPException(status_code=500, detail="침수 분석 모델이 로드되지 않았습니다.")
        
        # CCTV 프레임 캡처 (개선된 재시도 로직)
        frame = await capture_cctv_frame_with_retry(request.cctv_url, MAX_RETRIES)
        
        if frame is None:
            raise HTTPException(status_code=500, detail="CCTV 프레임 캡처에 실패했습니다.")
        
        logger.info(f"📸 프레임 캡처 성공: {frame.shape}")
        
        # 침수 분석 모델 추론
        results = model(frame, verbose=False)
        
        # 결과 처리
        probs = results[0].probs
        class_id = int(probs.top1)
        class_name = results[0].names[class_id]
        confidence = probs.top1conf.item()
        
        # 모든 클래스의 확률 정보 로깅
        all_probs = probs.data.cpu().numpy()
        logger.info(f"🔍 모델 예측 결과: 클래스={class_name}, 확률={confidence:.3f}, 임계값={FLOOD_CONFIDENCE_THRESHOLD}")
        logger.info(f"📊 모든 클래스 확률: {dict(zip(results[0].names.values(), all_probs))}")
        
        # 침수 여부 판단 (이진 분류 모델: 1=침수, 0=정상)
        if confidence < FLOOD_CONFIDENCE_THRESHOLD:
            # 신뢰도가 낮으면 'N' (침수 없음)으로 판단
            flood_result = 'N'
            logger.info(f"⚠️ 신뢰도가 낮아 침수 없음으로 판단: {confidence:.3f} < {FLOOD_CONFIDENCE_THRESHOLD}")
        else:
            # 신뢰도가 높으면 클래스 ID에 따라 판단
            # class_id: 1=침수, 0=정상
            flood_result = 'Y' if class_id == 1 else 'N'
            logger.info(f"✅ 신뢰도 충족하여 판단: 클래스ID={class_id}({class_name}) -> {flood_result}")
        
        logger.info(f"🔍 침수 분석 결과: {flood_result} (확률: {confidence:.2f})")
        
        # 최종 이미지 저장
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_filename = f"flood_analysis_{timestamp}.png"
        image_path = os.path.join("capture_images", image_filename)
        
        # capture_images 폴더가 없으면 생성
        os.makedirs("capture_images", exist_ok=True)
        
        cv2.imwrite(image_path, frame)
        logger.info(f"💾 최종 분석 이미지 저장: {image_path}")
        
        # 데이터베이스에 결과 저장
        try:
            await save_flood_result_to_db(
                cctv_idx=request.cctv_idx,
                citizen_report_idx=request.citizen_report_idx,
                image_path=image_path,
                lat=request.lat,
                lon=request.lon,
                flood_result=flood_result
            )
        except Exception as e:
            logger.error(f"❌ 데이터베이스 저장 실패: {e}")
            # 데이터베이스 저장 실패해도 분석 결과는 반환
        
        response_data = FloodAnalysisResponse(
            success=True,
            flood_result=flood_result,
            confidence=confidence,
            analysis_image={
                "image_path": image_path,
                "timestamp": timestamp
            },
            message="침수 분석이 완료되었습니다."
        )
        
        logger.info("=" * 60)
        logger.info(f"✅ CCTV 침수 분석 완료")
        logger.info(f"📊 분석 결과: {flood_result} (신뢰도: {confidence:.3f})")
        logger.info(f"💾 이미지 저장: {image_path}")
        logger.info("=" * 60)
        
        return response_data
        
    except Exception as e:
        logger.error(f"❌ 침수 분석 실패: {e}")
        raise HTTPException(status_code=500, detail=f"침수 분석 중 오류가 발생했습니다: {str(e)}")

async def capture_cctv_frame_with_retry(cctv_url: str, max_retries: int = 3) -> Optional[np.ndarray]:
    """CCTV 프레임 캡처 (개선된 재시도 로직)"""
    from cctv_processor import CCTVProcessor
    
    cctv_processor = CCTVProcessor()
    
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"📸 CCTV 프레임 캡처 시도 {attempt}/{max_retries}")
            
            # 프레임 캡처
            frame = cctv_processor.capture_iframe_frame(cctv_url)
            
            if frame is None:
                logger.warning(f"⚠️ CCTV 프레임 캡처 실패 (시도 {attempt}/{max_retries})")
                if attempt < max_retries:
                    wait_time = attempt * RETRY_DELAY
                    logger.info(f"🔄 {wait_time}초 후 재시도...")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    logger.error(f"❌ CCTV 프레임 캡처 최대 재시도 횟수 초과")
                    return None
            
            # 임시 이미지 저장하여 검정 화면 감지
            temp_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            temp_image_filename = f"temp_flood_analysis_{temp_timestamp}.png"
            temp_image_path = os.path.join("capture_images", temp_image_filename)
            
            # capture_images 폴더가 없으면 생성
            os.makedirs("capture_images", exist_ok=True)
            
            cv2.imwrite(temp_image_path, frame)
            logger.info(f"💾 임시 이미지 저장: {temp_image_path}")
            
            # 검정 화면 감지
            if _is_black_image(temp_image_path):
                logger.warning(f"⚠️ 검정 화면 감지 (시도 {attempt}/{max_retries}): {temp_image_path}")
                
                # 임시 파일 삭제
                try:
                    os.remove(temp_image_path)
                    logger.info(f"🗑️ 임시 파일 삭제: {temp_image_path}")
                except:
                    pass
                
                if attempt < max_retries:
                    wait_time = attempt * RETRY_DELAY
                    logger.info(f"🔄 검정 화면 감지, {wait_time}초 후 재시도...")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    logger.error(f"❌ 최대 재시도 횟수 초과, 검정 화면 문제 지속")
                    return None
            else:
                logger.info(f"✅ 검정 화면이 아닌 정상 이미지 확인 (시도 {attempt}/{max_retries})")
                
                # 임시 파일 삭제
                try:
                    os.remove(temp_image_path)
                    logger.info(f"🗑️ 임시 파일 삭제: {temp_image_path}")
                except:
                    pass
                
                return frame
                
        except Exception as e:
            logger.error(f"❌ CCTV 프레임 캡처 오류 (시도 {attempt}/{max_retries}): {e}")
            if attempt < max_retries:
                wait_time = attempt * RETRY_DELAY
                logger.info(f"🔄 {wait_time}초 후 재시도...")
                await asyncio.sleep(wait_time)
                continue
            else:
                logger.error(f"❌ CCTV 프레임 캡처 최대 재시도 횟수 초과")
                return None
    
    return None

async def save_flood_result_to_db(cctv_idx: Optional[int], citizen_report_idx: Optional[int], 
                                 image_path: str, lat: Optional[float], lon: Optional[float], 
                                 flood_result: str):
    """침수 분석 결과를 데이터베이스에 저장 (개선된 재시도 로직)"""
    max_retries = 3
    
    logger.info("💾 데이터베이스 저장 시작")
    logger.info(f"📋 저장 데이터: CCTV_ID={cctv_idx}, 제보번호={citizen_report_idx}")
    logger.info(f"📊 분석 결과: {flood_result}, 이미지: {image_path}")
    
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"💾 침수 분석 결과 저장 시도 {attempt}/{max_retries}")
            
            # AiServer에 결과 전송
            async with aiohttp.ClientSession() as session:
                payload = {
                    "cctv_idx": cctv_idx,
                    "citizen_report_idx": citizen_report_idx,
                    "image_path": image_path,
                    "lat": lat,
                    "lon": lon,
                    "flood_result": flood_result
                }
                
                async with session.post(
                    "http://175.45.194.114:3001/api/floodai/save_result",
                    json=payload,
                    timeout=10
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info("=" * 40)
                        logger.info(f"✅ 침수 분석 결과 저장 성공 (시도 {attempt}/{max_retries})")
                        logger.info(f"📊 서버 응답: {result}")
                        logger.info("=" * 40)
                        return True
                    else:
                        error_text = await response.text()
                        logger.warning(f"⚠️ 침수 분석 결과 저장 실패 (시도 {attempt}/{max_retries}): {response.status}")
                        logger.warning(f"   📋 응답 내용: {error_text}")
                        
                        if attempt < max_retries:
                            wait_time = attempt
                            logger.info(f"🔄 {wait_time}초 후 재시도...")
                            await asyncio.sleep(wait_time)
                            continue
                        else:
                            logger.error(f"❌ 침수 분석 결과 저장 최대 재시도 횟수 초과")
                            return False
                            
        except asyncio.TimeoutError:
            logger.warning(f"⏰ 침수 분석 결과 저장 타임아웃 (시도 {attempt}/{max_retries})")
            if attempt < max_retries:
                wait_time = attempt
                logger.info(f"🔄 {wait_time}초 후 재시도...")
                await asyncio.sleep(wait_time)
                continue
            else:
                logger.error(f"❌ 침수 분석 결과 저장 타임아웃으로 최대 재시도 횟수 초과")
                return False
                
        except Exception as e:
            logger.error(f"❌ 침수 분석 결과 저장 오류 (시도 {attempt}/{max_retries}): {e}")
            if attempt < max_retries:
                wait_time = attempt
                logger.info(f"🔄 {wait_time}초 후 재시도...")
                await asyncio.sleep(wait_time)
                continue
            else:
                logger.error(f"❌ 침수 분석 결과 저장 최대 재시도 횟수 초과")
                return False
    
    return False

def _is_black_image(image_path: str, threshold: float = 0.95) -> bool:
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

@app.post("/api/analyze-complaint-flood", response_model=FloodAnalysisResponse)
async def analyze_complaint_flood(request: ComplaintFloodAnalysisRequest):
    """
    시민 제보 이미지 침수 분석 엔드포인트 (개선된 재시도 로직)
    """
    logger.info("=" * 60)
    logger.info(f"🌊 시민 제보 침수 분석 요청 수신")
    logger.info(f"📋 요청 데이터: 제보번호={request.c_report_idx}")
    logger.info(f"🖼️ 이미지 URL: {request.image_url}")
    logger.info(f"📍 위치: lat={request.lat}, lon={request.lon}")
    logger.info(f"📝 제보 내용: {request.c_report_detail}")
    logger.info("=" * 60)
    
    if model is None:
        logger.error("❌ 침수 분석 모델이 로드되지 않음")
        raise HTTPException(status_code=500, detail="침수 분석 모델이 로드되지 않았습니다.")
    
    max_retries = 3
    
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"📸 시민 제보 이미지 다운로드 시도 {attempt}/{max_retries}")
            
            # 이미지 다운로드 및 분석
            async with aiohttp.ClientSession() as session:
                async with session.get(request.image_url, timeout=30) as response:
                    if response.status != 200:
                        logger.warning(f"⚠️ 이미지 다운로드 실패 (시도 {attempt}/{max_retries}): {response.status}")
                        if attempt < max_retries:
                            wait_time = attempt * RETRY_DELAY
                            logger.info(f"🔄 {wait_time}초 후 재시도...")
                            await asyncio.sleep(wait_time)
                            continue
                        else:
                            logger.error(f"❌ 이미지 다운로드 최대 재시도 횟수 초과")
                            raise HTTPException(status_code=400, detail="이미지를 다운로드할 수 없습니다.")
                    
                    image_data = await response.read()
                    
                    # 이미지 데이터를 numpy 배열로 변환
                    nparr = np.frombuffer(image_data, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    if img is None:
                        logger.warning(f"⚠️ 이미지 디코딩 실패 (시도 {attempt}/{max_retries})")
                        if attempt < max_retries:
                            wait_time = attempt * RETRY_DELAY
                            logger.info(f"🔄 {wait_time}초 후 재시도...")
                            await asyncio.sleep(wait_time)
                            continue
                        else:
                            logger.error(f"❌ 이미지 디코딩 최대 재시도 횟수 초과")
                            raise HTTPException(status_code=400, detail="이미지를 처리할 수 없습니다.")
                    
                    logger.info(f"✅ 이미지 다운로드 및 디코딩 성공 (시도 {attempt}/{max_retries}): {img.shape}")
                    
                    # 침수 분석 모델 추론
                    results = model(img, verbose=False)
                    
                    # 결과 처리
                    probs = results[0].probs
                    class_id = int(probs.top1)
                    class_name = results[0].names[class_id]
                    confidence = probs.top1conf.item()
                    
                    # 모든 클래스의 확률 정보 로깅
                    all_probs = probs.data.cpu().numpy()
                    logger.info(f"🔍 모델 예측 결과: 클래스={class_name}, 확률={confidence:.3f}, 임계값={FLOOD_CONFIDENCE_THRESHOLD}")
                    logger.info(f"📊 모든 클래스 확률: {dict(zip(results[0].names.values(), all_probs))}")
                    
                    # 침수 여부 판단
                    if confidence < FLOOD_CONFIDENCE_THRESHOLD:
                        flood_result = 'N'
                        logger.info(f"⚠️ 신뢰도가 낮아 침수 없음으로 판단: {confidence:.3f} < {FLOOD_CONFIDENCE_THRESHOLD}")
                    else:
                        flood_result = 'Y' if class_id == 1 else 'N'
                        logger.info(f"✅ 신뢰도 충족하여 판단: 클래스ID={class_id}({class_name}) -> {flood_result}")
                    
                    logger.info(f"🔍 시민 제보 침수 분석 결과: {flood_result} (확률: {confidence:.2f})")
                    
                    # 최종 이미지 저장
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    image_filename = f"complaint_flood_analysis_{timestamp}.png"
                    image_path = os.path.join("capture_images", image_filename)
                    
                    # capture_images 폴더가 없으면 생성
                    os.makedirs("capture_images", exist_ok=True)
                    
                    cv2.imwrite(image_path, img)
                    logger.info(f"💾 최종 분석 이미지 저장: {image_path}")
                    
                    # 데이터베이스에 결과 저장
                    try:
                        await save_flood_result_to_db(
                            cctv_idx=None,
                            citizen_report_idx=request.c_report_idx,
                            image_path=image_path,
                            lat=request.lat,
                            lon=request.lon,
                            flood_result=flood_result
                        )
                    except Exception as e:
                        logger.error(f"❌ 데이터베이스 저장 실패: {e}")
                        # 데이터베이스 저장 실패해도 분석 결과는 반환
                    
                    response_data = FloodAnalysisResponse(
                        success=True,
                        flood_result=flood_result,
                        confidence=confidence,
                        analysis_image={
                            "image_path": image_path,
                            "timestamp": timestamp
                        },
                        message="시민 제보 침수 분석이 완료되었습니다."
                    )
                    
                    logger.info("=" * 60)
                    logger.info(f"✅ 시민 제보 침수 분석 완료")
                    logger.info(f"📊 분석 결과: {flood_result} (신뢰도: {confidence:.3f})")
                    logger.info(f"💾 이미지 저장: {image_path}")
                    logger.info("=" * 60)
                    
                    return response_data
                    
        except asyncio.TimeoutError:
            logger.warning(f"⏰ 시민 제보 이미지 다운로드 타임아웃 (시도 {attempt}/{max_retries})")
            if attempt < max_retries:
                wait_time = attempt * RETRY_DELAY
                logger.info(f"🔄 {wait_time}초 후 재시도...")
                await asyncio.sleep(wait_time)
                continue
            else:
                logger.error(f"❌ 시민 제보 이미지 다운로드 타임아웃으로 최대 재시도 횟수 초과")
                raise HTTPException(status_code=408, detail="이미지 다운로드 타임아웃")
                
        except Exception as e:
            logger.error(f"❌ 시민 제보 침수 분석 오류 (시도 {attempt}/{max_retries}): {e}")
            if attempt < max_retries:
                wait_time = attempt * RETRY_DELAY
                logger.info(f"🔄 {wait_time}초 후 재시도...")
                await asyncio.sleep(wait_time)
                continue
            else:
                logger.error(f"❌ 시민 제보 침수 분석 최대 재시도 횟수 초과")
                raise HTTPException(status_code=500, detail=f"시민 제보 침수 분석 중 오류가 발생했습니다: {str(e)}")
    
    raise HTTPException(status_code=500, detail="시민 제보 침수 분석에 실패했습니다.")

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 New Flood Server 시작 중...")
    logger.info("=" * 60)
    logger.info("📡 서버 정보:")
    logger.info("   - 호스트: 0.0.0.0")
    logger.info("   - 포트: 8002")
    logger.info("   - 모델 상태: " + ("✅ 로드됨" if model is not None else "❌ 로드 실패"))
    logger.info("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8002)
