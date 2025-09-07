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

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Flood Analysis API", version="1.0.0")

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

# YOLO 모델 로드
try:
    model = YOLO("../floodbest.pt")  # 상위 디렉토리의 floobest.pt 파일 사용
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
    image_path: Optional[str] = None
    message: str

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/api/analyze-flood", response_model=FloodAnalysisResponse)
async def analyze_flood(request: FloodAnalysisRequest):
    try:
        logger.info(f"🌊 침수 분석 시작: {request.cctv_url}")
        
        if model is None:
            raise HTTPException(status_code=500, detail="침수 분석 모델이 로드되지 않았습니다.")
        
        # CCTV 프레임 캡처 (cctv_processor.py 방식 사용)
        from cctv_processor import CCTVProcessor
        
        cctv_processor = CCTVProcessor()
        frame = cctv_processor.capture_iframe_frame(request.cctv_url)
        
        if frame is None:
            raise HTTPException(status_code=500, detail="CCTV 프레임 캡처에 실패했습니다.")
        
        logger.info(f"📸 프레임 캡처 성공: {frame.shape}")
        
        # 임시 이미지 저장하여 검정 화면 감지
        temp_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        temp_image_filename = f"temp_flood_analysis_{temp_timestamp}.png"
        temp_image_path = os.path.join("capture_images", temp_image_filename)
        
        # capture_images 폴더가 없으면 생성
        os.makedirs("capture_images", exist_ok=True)
        
        cv2.imwrite(temp_image_path, frame)
        logger.info(f"💾 임시 이미지 저장: {temp_image_path}")
        
        # 검정 화면 감지 (침수 분석 전에 먼저 수행)
        max_retries = 3
        for retry_attempt in range(1, max_retries + 1):
            if _is_black_image(temp_image_path):
                logger.warning(f"⚠️ 검정 화면 감지 (시도 {retry_attempt}/{max_retries}): {temp_image_path}")
                
                if retry_attempt < max_retries:
                    logger.info(f"🔄 전체 페이지를 다시 로드하여 재시도 중...")
                    
                    # 기존 임시 파일 삭제
                    try:
                        os.remove(temp_image_path)
                        logger.info(f"🗑️ 임시 파일 삭제: {temp_image_path}")
                    except:
                        pass
                    
                    # 새로운 프레임 캡처 시도
                    frame = cctv_processor.capture_iframe_frame(request.cctv_url)
                    
                    if frame is None:
                        logger.error(f"❌ 재시도 {retry_attempt}번째 CCTV 프레임 캡처 실패")
                        continue
                    
                    logger.info(f"📸 재시도 {retry_attempt}번째 프레임 캡처 성공: {frame.shape}")
                    
                    # 새로운 임시 이미지 저장
                    temp_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    temp_image_filename = f"temp_flood_analysis_{temp_timestamp}.png"
                    temp_image_path = os.path.join("capture_images", temp_image_filename)
                    cv2.imwrite(temp_image_path, frame)
                    logger.info(f"💾 새로운 임시 이미지 저장: {temp_image_path}")
                    
                    continue
                else:
                    logger.error(f"❌ 최대 재시도 횟수 초과, 검정 화면 문제 지속")
                    raise HTTPException(status_code=500, detail="CCTV 이미지 캡처 실패: 검정 화면이 감지되었습니다.")
            else:
                logger.info(f"✅ 검정 화면이 아닌 정상 이미지 확인")
                break
        
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
        
        # 최종 이미지 저장 (임시 파일을 최종 파일로 이동)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        image_filename = f"flood_analysis_{timestamp}.png"
        image_path = os.path.join("capture_images", image_filename)
        
        # 임시 파일을 최종 파일로 이동
        try:
            import shutil
            shutil.move(temp_image_path, image_path)
            logger.info(f"💾 최종 분석 이미지 저장: {image_path}")
        except Exception as e:
            logger.error(f"❌ 이미지 파일 이동 실패: {e}")
            # 이동 실패 시 복사로 대체
            cv2.imwrite(image_path, frame)
            logger.info(f"💾 최종 분석 이미지 복사 저장: {image_path}")
        
        # 데이터베이스에 결과 저장
        await save_flood_result_to_db(
            cctv_idx=request.cctv_idx,
            citizen_report_idx=request.citizen_report_idx,
            image_path=image_path,
            lat=request.lat,
            lon=request.lon,
            flood_result=flood_result
        )
        
        return FloodAnalysisResponse(
            success=True,
            flood_result=flood_result,
            confidence=confidence,
            image_path=image_path,
            message="침수 분석이 완료되었습니다."
        )
        
    except Exception as e:
        logger.error(f"❌ 침수 분석 실패: {e}")
        raise HTTPException(status_code=500, detail=f"침수 분석 중 오류가 발생했습니다: {str(e)}")

async def save_flood_result_to_db(cctv_idx: Optional[int], citizen_report_idx: Optional[int], 
                                 image_path: str, lat: Optional[float], lon: Optional[float], 
                                 flood_result: str):
    """침수 분석 결과를 데이터베이스에 저장"""
    try:
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
                json=payload
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ 침수 분석 결과 저장 성공: {result}")
                else:
                    logger.error(f"❌ 침수 분석 결과 저장 실패: {response.status}")
                    
    except Exception as e:
        logger.error(f"❌ 침수 분석 결과 저장 중 오류: {e}")

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
    시민 제보 이미지 침수 분석 엔드포인트
    """
    logger.info(f"🌊 시민 제보 침수 분석 시작: 제보번호 {request.c_report_idx}")
    
    if model is None:
        logger.error("❌ 침수 분석 모델이 로드되지 않음")
        raise HTTPException(status_code=500, detail="침수 분석 모델이 로드되지 않았습니다.")
    
    try:
        # 이미지 다운로드 및 분석
        async with aiohttp.ClientSession() as session:
            async with session.get(request.image_url) as response:
                if response.status != 200:
                    logger.error(f"❌ 이미지 다운로드 실패: {response.status}")
                    raise HTTPException(status_code=400, detail="이미지를 다운로드할 수 없습니다.")
                
                image_data = await response.read()
                
                # 임시 파일로 저장
                temp_image_path = f"temp_complaint_flood_{request.c_report_idx}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                
                with open(temp_image_path, 'wb') as f:
                    f.write(image_data)
                
                logger.info(f"📸 이미지 저장 완료: {temp_image_path}")
                
                # 결과 이미지 저장 경로 설정
                result_folder = "flood_result"
                os.makedirs(result_folder, exist_ok=True)
                result_image_path = os.path.join(result_folder, f"complaint_flood_{request.c_report_idx}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg")
                
                # 검정 화면 확인
                if _is_black_image(temp_image_path):
                    logger.warning("⚠️ 검정 화면 감지 - 침수 없음으로 판단")
                    flood_result = 'N'
                    confidence = 0.0
                    message = "검정 화면으로 인해 침수 분석을 수행할 수 없습니다."
                    
                    # 검정 화면인 경우에도 원본 이미지를 결과 폴더에 복사
                    import shutil
                    shutil.copy2(temp_image_path, result_image_path)
                    logger.info(f"📸 검정 화면 이미지 복사 완료: {result_image_path}")
                else:
                    # YOLO 모델로 침수 분석
                    results = model(temp_image_path, conf=FLOOD_CONFIDENCE_THRESHOLD)
                    
                    # 결과 분석
                    flood_detected = False
                    max_confidence = 0.0
                    
                    for result in results:
                        if result.boxes is not None and len(result.boxes) > 0:
                            for box in result.boxes:
                                confidence = float(box.conf[0])
                                if confidence > max_confidence:
                                    max_confidence = confidence
                                flood_detected = True
                                logger.info(f"🌊 침수 감지: 신뢰도 {confidence:.3f}")
                    
                    if flood_detected:
                        flood_result = 'Y'
                        confidence = max_confidence
                        message = f"침수가 감지되었습니다. (신뢰도: {confidence:.3f})"
                    else:
                        flood_result = 'N'
                        confidence = 0.0
                        message = "침수가 감지되지 않았습니다."
                    
                    # 분석 결과 이미지 저장 (바운딩 박스가 그려진 이미지)
                    if results and len(results) > 0:
                        # 결과 이미지 저장
                        results[0].save(result_image_path)
                        logger.info(f"📸 침수 분석 결과 이미지 저장 완료: {result_image_path}")
                    else:
                        # 결과가 없는 경우 원본 이미지 복사
                        import shutil
                        shutil.copy2(temp_image_path, result_image_path)
                        logger.info(f"📸 원본 이미지 복사 완료: {result_image_path}")
                
                # 결과 저장
                await save_complaint_flood_result(
                    request.c_report_idx,
                    request.c_reporter_name,
                    request.c_reporter_phone,
                    request.lat,
                    request.lon,
                    flood_result,
                    result_image_path  # 로컬 결과 이미지 경로 사용
                )
                
                # 임시 파일 삭제
                try:
                    os.remove(temp_image_path)
                    logger.info(f"🗑️ 임시 파일 삭제 완료: {temp_image_path}")
                except Exception as e:
                    logger.warning(f"⚠️ 임시 파일 삭제 실패: {e}")
                
                logger.info(f"✅ 시민 제보 침수 분석 완료: {flood_result} (신뢰도: {confidence:.3f})")
                
                return FloodAnalysisResponse(
                    success=True,
                    flood_result=flood_result,
                    confidence=confidence,
                    image_path=request.image_url,
                    message=message
                )
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 시민 제보 침수 분석 실패: {e}")
        raise HTTPException(status_code=500, detail=f"침수 분석 중 오류가 발생했습니다: {str(e)}")

async def save_complaint_flood_result(
    c_report_idx: int,
    c_reporter_name: Optional[str],
    c_reporter_phone: Optional[str],
    lat: float,
    lon: float,
    flood_result: str,
    image_path: str
):
    """
    시민 제보 침수 분석 결과를 데이터베이스에 저장합니다.
    """
    try:
        payload = {
            'c_report_idx': c_report_idx,
            'c_reporter_name': c_reporter_name,
            'c_reporter_phone': c_reporter_phone,
            'cr_type': '도로 침수',
            'lat': lat,
            'lon': lon,
            'flood_result': flood_result,
            'image_path': image_path
        }
        
        logger.info(f"💾 시민 제보 침수 분석 결과 저장 시도: 제보번호 {c_report_idx}")
        logger.info(f"   📦 전송 데이터: {payload}")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://175.45.194.114:3001/api/complaint/flood-result",
                json=payload
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"✅ 시민 제보 침수 분석 결과 저장 성공: {result}")
                else:
                    logger.error(f"❌ 시민 제보 침수 분석 결과 저장 실패: {response.status}")
                    
    except Exception as e:
        logger.error(f"❌ 시민 제보 침수 분석 결과 저장 중 오류: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
