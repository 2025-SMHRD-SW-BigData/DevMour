import torch
import numpy as np
from ultralytics import YOLO
from torchvision.ops import nms
from typing import List, Dict, Tuple, Optional
import logging
import sys
from pathlib import Path

# 현재 파일의 디렉토리를 Python 경로에 추가
current_dir = Path(__file__).parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

from config import MODEL_PATHS, MODEL_CONFIG, CLASS_NAMES, CLASS_MAPPING

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class YOLOEnsemble:
    """YOLO 앙상블 모델 클래스"""
    
    def __init__(self):
        self.models = []
        self.model_names = []
        self.weights = MODEL_CONFIG['ensemble_weights']

        self.nms_iou_threshold = MODEL_CONFIG['nms_iou_threshold']
        self.conf_threshold = MODEL_CONFIG.get('confidence_threshold', 0.25)  # 기본값 0.25
        
        self._load_models()
    
    def _load_models(self):
        """모든 YOLO 모델을 로드합니다."""
        logger.info("🔍 YOLO 앙상블 모델 로드 중...")
        
        for name, path in MODEL_PATHS.items():
            try:
                if path.exists():
                    model = YOLO(str(path))
                    self.models.append(model)
                    self.model_names.append(name)
                    logger.info(f"✔️ 모델 로드 완료: {name} ({path})")
                else:
                    logger.warning(f"⚠️ 모델 파일을 찾을 수 없음: {path}")
            except Exception as e:
                logger.error(f"❌ 모델 로드 실패: {name} - {e}")
        
        if not self.models:
            raise RuntimeError("로드된 모델이 없습니다.")
        
        logger.info(f"총 {len(self.models)}개 모델 로드 완료")
    
    def predict(self, image: np.ndarray) -> List[Dict]:
        """이미지에 대해 앙상블 예측을 수행합니다."""
        logger.info("🚀 YOLO 앙상블 예측 시작")
        logger.info(f"📊 설정값 - 신뢰도 임계값: {self.conf_threshold}, NMS IoU 임계값: {self.nms_iou_threshold}")
        logger.info(f"⚖️ 앙상블 가중치: {self.weights}")
        
        all_detections = []
        
        for i, model in enumerate(self.models):
            try:
                logger.info(f"🔍 모델 {self.model_names[i]} 예측 중... (가중치: {self.weights[i]})")
                
                # 모델별 예측 수행
                results = model(image, conf=self.conf_threshold, verbose=False)[0]
                
                if results.boxes is not None and len(results.boxes.xyxy) > 0:
                    detections = self._process_model_results(
                        results, i, self.model_names[i]
                    )
                    all_detections.extend(detections)
                    logger.info(f"✅ 모델 {self.model_names[i]}: {len(detections)}개 객체 탐지")
                else:
                    logger.info(f"⚠️ 모델 {self.model_names[i]}: 탐지된 객체 없음")
                    
            except Exception as e:
                logger.error(f"❌ 모델 {self.model_names[i]} 예측 실패: {e}")
        
        logger.info(f"📈 총 탐지된 객체: {len(all_detections)}개")
        
        # 앙상블 결과 통합 및 NMS 적용
        final_detections = self._ensemble_nms(all_detections)
        
        logger.info(f"🎯 NMS 적용 후 최종 객체: {len(final_detections)}개")
        return final_detections
    
    def _process_model_results(self, results, model_idx: int, model_name: str) -> List[Dict]:
        """개별 모델의 결과를 처리합니다."""
        detections = []
        
        boxes = results.boxes.xyxy.cpu().float()
        scores = results.boxes.conf.cpu().float()
        class_ids = results.boxes.cls.cpu().float()
        
        logger.info(f"📊 모델 {model_name} 원시 결과: {len(boxes)}개 박스, {len(scores)}개 점수, {len(class_ids)}개 클래스")
        
        # model3 (yolov8s)의 경우 클래스 매핑 적용
        if model_name == 'yolov8s':
            logger.info(f"🔄 yolov8s 클래스 매핑 적용 전: {class_ids.tolist()}")
            class_ids = self._remap_classes(class_ids)
            logger.info(f"🔄 yolov8s 클래스 매핑 적용 후: {class_ids.tolist()}")
        
        for i in range(len(boxes)):
            if class_ids[i] >= 0:  # 유효한 클래스인 경우만
                detection = {
                    'bbox': boxes[i].tolist(),
                    'score': scores[i].item(),
                    'class_id': int(class_ids[i].item()),
                    'class_name': CLASS_NAMES['final'][int(class_ids[i].item())],
                    'model_name': model_name,
                    'weight': self.weights[model_idx]
                }
                detections.append(detection)
                
                logger.info(f"🎯 객체 {i+1}: {detection['class_name']} (신뢰도: {detection['score']:.3f}, 가중치: {detection['weight']:.2f})")
                logger.info(f"   📍 위치: ({detection['bbox'][0]:.1f}, {detection['bbox'][1]:.1f}) ~ ({detection['bbox'][2]:.1f}, {detection['bbox'][3]:.1f})")
        
        return detections
    
    def _remap_classes(self, class_ids: torch.Tensor) -> torch.Tensor:
        """model3의 로컬 클래스를 최종 클래스로 변환합니다."""
        remapped_ids = torch.full_like(class_ids, -1.0)
        
        for local_name, final_name in CLASS_MAPPING.items():
            local_idx = CLASS_NAMES['model3_local'].index(local_name)
            final_idx = CLASS_NAMES['final'].index(final_name)
            
            mask = (class_ids == local_idx)
            remapped_ids[mask] = final_idx
        
        return remapped_ids
    
    def _ensemble_nms(self, detections: List[Dict]) -> List[Dict]:
        """앙상블 결과에 NMS를 적용합니다."""
        if not detections:
            logger.info("⚠️ NMS 적용할 탐지 결과가 없습니다.")
            return []
        
        logger.info(f"🔍 NMS 적용 시작: 총 {len(detections)}개 탐지 결과")
        
        # 클래스별로 그룹화
        class_groups = {}
        for det in detections:
            class_id = det['class_id']
            if class_id not in class_groups:
                class_groups[class_id] = []
            class_groups[class_id].append(det)
        
        logger.info(f"📊 클래스별 그룹화: {len(class_groups)}개 클래스")
        for class_id, class_dets in class_groups.items():
            class_name = CLASS_NAMES['final'][class_id]
            logger.info(f"   📋 {class_name}: {len(class_dets)}개 탐지")
        
        final_detections = []
        
        for class_id, class_dets in class_groups.items():
            class_name = CLASS_NAMES['final'][class_id]
            logger.info(f"🎯 클래스 '{class_name}' NMS 처리 중...")
            
            if len(class_dets) == 1:
                logger.info(f"   ✅ 단일 탐지: {class_name} 추가")
                final_detections.append(class_dets[0])
                continue
            
            logger.info(f"   🔄 {len(class_dets)}개 중복 탐지 - 가중 평균 점수 계산 및 NMS 적용")
            
            # 가중 평균 점수 계산
            weighted_scores = []
            weighted_boxes = []
            
            for i, det in enumerate(class_dets):
                weight = det['weight']
                weighted_score = det['score'] * weight
                weighted_scores.append(weighted_score)
                weighted_boxes.append(det['bbox'])
                logger.info(f"      📊 탐지 {i+1}: 원본 점수 {det['score']:.3f} × 가중치 {weight:.2f} = {weighted_score:.3f}")
            
            # NMS 적용
            boxes_tensor = torch.tensor(weighted_boxes, dtype=torch.float32)
            scores_tensor = torch.tensor(weighted_scores, dtype=torch.float32)
            
            logger.info(f"   ✂️ NMS 적용 (IoU 임계값: {self.nms_iou_threshold})")
            keep_indices = nms(boxes_tensor, scores_tensor, self.nms_iou_threshold)
            
            logger.info(f"   🎯 NMS 후 유지된 탐지: {len(keep_indices)}개")
            for idx in keep_indices:
                final_detections.append(class_dets[idx])
                logger.info(f"      ✅ 유지: {class_dets[idx]['class_name']} (신뢰도: {class_dets[idx]['score']:.3f})")
        
        logger.info(f"🎉 NMS 완료: {len(detections)}개 → {len(final_detections)}개")
        return final_detections
    
    def calculate_risk_score(self, detections: List[Dict]) -> Dict:
        """탐지 결과를 바탕으로 위험도 점수를 계산합니다."""
        from config import RISK_SCORES
        
        logger.info("💰 위험도 점수 계산 시작")
        logger.info(f"📊 위험도 점수 설정: {RISK_SCORES}")
        
        total_score = 0
        class_counts = {name: 0 for name in CLASS_NAMES['final']}
        
        for i, det in enumerate(detections):
            class_name = det['class_name']
            if class_name in RISK_SCORES:
                risk_score = RISK_SCORES[class_name]
                total_score += risk_score
                class_counts[class_name] += 1
                logger.info(f"🎯 객체 {i+1}: {class_name} → 위험도 점수 +{risk_score} (총점: {total_score})")
            else:
                logger.warning(f"⚠️ 알 수 없는 클래스: {class_name} (위험도 점수 없음)")
        
        logger.info(f"📈 클래스별 개수: {class_counts}")
        logger.info(f"🏆 최종 위험도 총점: {total_score}")
        
        result = {
            'total_risk_score': total_score,
            'class_counts': class_counts,
            'detection_count': len(detections)
        }
        
        logger.info(f"✅ 위험도 점수 계산 완료: {result}")
        return result
