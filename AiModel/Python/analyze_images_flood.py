#!/usr/bin/env python3
"""
images 폴더의 모든 이미지를 침수 분석하여 flood_result 폴더에 저장하는 스크립트
"""

import os
import cv2
import numpy as np
from ultralytics import YOLO
import logging
from datetime import datetime
from pathlib import Path
import shutil

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ImageFloodAnalyzer:
    """이미지 침수 분석 클래스"""
    
    def __init__(self):
        self.input_folder = "images"  # 입력 이미지 폴더
        self.output_folder = "flood_result"  # 결과 저장 폴더
        self.flood_confidence_threshold = 0.7  # 침수 판단 신뢰도 임계값
        
        # YOLO 모델 로드
        try:
            self.model = YOLO("../floodbest.pt")  # 상위 디렉토리의 floobest.pt 파일 사용
            logger.info("✅ 침수 분석 모델 로드 성공")
            logger.info(f"🔧 설정값: 신뢰도 임계값 = {self.flood_confidence_threshold}")
            
            # 모델의 클래스 정보 출력
            if hasattr(self.model, 'names') and self.model.names:
                logger.info(f"📋 모델 클래스 정보: {self.model.names}")
            else:
                logger.warning("⚠️ 모델 클래스 정보를 찾을 수 없습니다.")
                
        except Exception as e:
            logger.error(f"❌ 침수 분석 모델 로드 실패: {e}")
            self.model = None
    
    def create_output_folder(self):
        """출력 폴더 생성"""
        try:
            if not os.path.exists(self.output_folder):
                os.makedirs(self.output_folder)
                logger.info(f"📁 출력 폴더 생성: {self.output_folder}")
            else:
                logger.info(f"📁 출력 폴더 이미 존재: {self.output_folder}")
        except Exception as e:
            logger.error(f"❌ 출력 폴더 생성 실패: {e}")
            return False
        return True
    
    def get_image_files(self):
        """입력 폴더에서 이미지 파일 목록 가져오기"""
        try:
            if not os.path.exists(self.input_folder):
                logger.error(f"❌ 입력 폴더가 존재하지 않습니다: {self.input_folder}")
                return []
            
            # 지원하는 이미지 확장자
            image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}
            
            image_files = []
            for file in os.listdir(self.input_folder):
                file_path = os.path.join(self.input_folder, file)
                if os.path.isfile(file_path):
                    file_ext = Path(file).suffix.lower()
                    if file_ext in image_extensions:
                        image_files.append(file_path)
            
            logger.info(f"📸 발견된 이미지 파일: {len(image_files)}개")
            for img_file in image_files:
                logger.info(f"   📷 {img_file}")
            
            return image_files
            
        except Exception as e:
            logger.error(f"❌ 이미지 파일 목록 조회 실패: {e}")
            return []
    
    def analyze_image(self, image_path):
        """단일 이미지 침수 분석"""
        try:
            logger.info(f"🔍 이미지 분석 시작: {image_path}")
            
            if self.model is None:
                logger.error("❌ 침수 분석 모델이 로드되지 않았습니다")
                return None
            
            # 이미지 로드
            img = cv2.imread(image_path)
            if img is None:
                logger.error(f"❌ 이미지를 로드할 수 없습니다: {image_path}")
                return None
            
            logger.info(f"📸 이미지 로드 성공: {img.shape}")
            
            # 침수 분석 모델 추론
            results = self.model(img, verbose=False)
            
            # 결과 처리
            probs = results[0].probs
            class_id = int(probs.top1)
            class_name = results[0].names[class_id]
            confidence = probs.top1conf.item()
            
            # 모든 클래스의 확률 정보 로깅
            all_probs = probs.data.cpu().numpy()
            logger.info(f"🔍 모델 예측 결과: 클래스={class_name}, 확률={confidence:.3f}, 임계값={self.flood_confidence_threshold}")
            logger.info(f"📊 모든 클래스 확률: {dict(zip(results[0].names.values(), all_probs))}")
            
            # 침수 여부 판단 (이진 분류 모델: 1=침수, 0=정상)
            if confidence < self.flood_confidence_threshold:
                # 신뢰도가 낮으면 'N' (침수 없음)으로 판단
                flood_result = 'N'
                logger.info(f"⚠️ 신뢰도가 낮아 침수 없음으로 판단: {confidence:.3f} < {self.flood_confidence_threshold}")
            else:
                # 신뢰도가 높으면 클래스 ID에 따라 판단
                # class_id: 1=침수, 0=정상
                flood_result = 'Y' if class_id == 1 else 'N'
                logger.info(f"✅ 신뢰도 충족하여 판단: 클래스ID={class_id}({class_name}) -> {flood_result}")
            
            logger.info(f"🔍 침수 분석 결과: {flood_result} (확률: {confidence:.2f})")
            
            return {
                'flood_result': flood_result,
                'confidence': confidence,
                'class_id': class_id,
                'class_name': class_name,
                'all_probs': all_probs
            }
            
        except Exception as e:
            logger.error(f"❌ 이미지 분석 실패: {e}")
            return None
    
    def save_result(self, image_path, analysis_result):
        """분석 결과를 파일로 저장 (이미지에 텍스트 표기 포함)"""
        try:
            # 원본 이미지 파일명에서 확장자 제거
            base_name = Path(image_path).stem
            extension = Path(image_path).suffix
            
            # 결과 파일명 생성
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            result_filename = f"{base_name}_flood_{analysis_result['flood_result']}_{timestamp}{extension}"
            result_path = os.path.join(self.output_folder, result_filename)
            
            # 원본 이미지 로드
            img = cv2.imread(image_path)
            if img is None:
                logger.error(f"❌ 이미지를 로드할 수 없습니다: {image_path}")
                return None, None
            
            # 이미지에 분석 결과 텍스트 표기
            img_with_text = self.draw_analysis_result(img, analysis_result)
            
            # 결과 이미지 저장
            cv2.imwrite(result_path, img_with_text)
            logger.info(f"💾 분석 결과 저장 (텍스트 표기 포함): {result_path}")
            
            # 분석 정보를 텍스트 파일로 저장
            info_filename = f"{base_name}_flood_info_{timestamp}.txt"
            info_path = os.path.join(self.output_folder, info_filename)
            
            with open(info_path, 'w', encoding='utf-8') as f:
                f.write(f"침수 분석 결과\n")
                f.write(f"================\n")
                f.write(f"원본 이미지: {image_path}\n")
                f.write(f"분석 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"침수 여부: {analysis_result['flood_result']}\n")
                f.write(f"신뢰도: {analysis_result['confidence']:.3f}\n")
                f.write(f"클래스 ID: {analysis_result['class_id']}\n")
                f.write(f"클래스명: {analysis_result['class_name']}\n")
                f.write(f"임계값: {self.flood_confidence_threshold}\n")
                f.write(f"\n모든 클래스 확률:\n")
                for i, prob in enumerate(analysis_result['all_probs']):
                    f.write(f"  클래스 {i}: {prob:.3f}\n")
            
            logger.info(f"📝 분석 정보 저장: {info_path}")
            
            return result_path, info_path
            
        except Exception as e:
            logger.error(f"❌ 분석 결과 저장 실패: {e}")
            return None, None
    
    def draw_analysis_result(self, img, analysis_result):
        """이미지에 분석 결과 텍스트 표기"""
        try:
            # 이미지 복사
            img_with_text = img.copy()
            
            # 이미지 크기 정보
            height, width = img.shape[:2]
            
            # 텍스트 설정
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 1.0
            thickness = 2
            
            # 배경 색상 설정 (침수 여부에 따라)
            if analysis_result['flood_result'] == 'Y':
                # 침수 감지 시 빨간색 배경
                bg_color = (0, 0, 255)  # BGR: 빨간색
                text_color = (255, 255, 255)  # BGR: 흰색
            else:
                # 정상 시 초록색 배경
                bg_color = (0, 255, 0)  # BGR: 초록색
                text_color = (0, 0, 0)  # BGR: 검은색
            
            # 메인 텍스트 (클래스명: 확률만 표기)
            main_text = f"{analysis_result['class_name']}: {analysis_result['confidence']:.3f}"
            main_text_size = cv2.getTextSize(main_text, font, font_scale, thickness)[0]
            
            # 텍스트 위치 계산 (이미지 상단 중앙)
            text_x = (width - main_text_size[0]) // 2
            text_y = 50
            
            # 배경 사각형 그리기
            padding = 10
            rect_top = text_y - main_text_size[1] - padding
            rect_bottom = text_y + main_text_size[1] + padding
            rect_left = text_x - padding
            rect_right = text_x + main_text_size[0] + padding
            
            cv2.rectangle(img_with_text, (rect_left, rect_top), (rect_right, rect_bottom), bg_color, -1)
            
            # 메인 텍스트 그리기
            cv2.putText(img_with_text, main_text, (text_x, text_y), font, font_scale, text_color, thickness)
            
            # 추가 정보 (이미지 하단에 작은 텍스트로)
            info_text = f"detect time: {datetime.now().strftime('%H:%M:%S')}"
            info_text_size = cv2.getTextSize(info_text, font, font_scale * 0.5, thickness)[0]
            info_x = width - info_text_size[0] - 10
            info_y = height - 10
            
            # 정보 텍스트 배경
            info_rect_top = info_y - info_text_size[1] - 5
            info_rect_bottom = info_y + 5
            info_rect_left = info_x - 5
            info_rect_right = info_x + info_text_size[0] + 5
            
            cv2.rectangle(img_with_text, (info_rect_left, info_rect_top), (info_rect_right, info_rect_bottom), (0, 0, 0), -1)
            cv2.putText(img_with_text, info_text, (info_x, info_y), font, font_scale * 0.5, (255, 255, 255), thickness)
            
            logger.info(f"📝 이미지에 분석 결과 텍스트 표기 완료")
            
            return img_with_text
            
        except Exception as e:
            logger.error(f"❌ 이미지 텍스트 표기 실패: {e}")
            return img
    
    def process_all_images(self):
        """모든 이미지 처리"""
        try:
            logger.info("🚀 이미지 침수 분석 시작")
            
            # 모델 로드 확인
            if self.model is None:
                logger.error("❌ 침수 분석 모델이 로드되지 않았습니다")
                return
            
            # 출력 폴더 생성
            if not self.create_output_folder():
                return
            
            # 이미지 파일 목록 가져오기
            image_files = self.get_image_files()
            
            if not image_files:
                logger.warning("⚠️ 분석할 이미지 파일이 없습니다")
                return
            
            logger.info(f"📋 총 {len(image_files)}개의 이미지 처리 예정")
            
            success_count = 0
            fail_count = 0
            
            for i, image_path in enumerate(image_files, 1):
                logger.info(f"🔄 [{i}/{len(image_files)}] 이미지 처리 중: {image_path}")
                
                try:
                    # 이미지 분석
                    analysis_result = self.analyze_image(image_path)
                    
                    if analysis_result:
                        # 결과 저장
                        result_path, info_path = self.save_result(image_path, analysis_result)
                        
                        if result_path and info_path:
                            success_count += 1
                            logger.info(f"✅ 이미지 {i} 처리 완료")
                        else:
                            fail_count += 1
                            logger.error(f"❌ 이미지 {i} 결과 저장 실패")
                    else:
                        fail_count += 1
                        logger.error(f"❌ 이미지 {i} 분석 실패")
                
                except Exception as e:
                    fail_count += 1
                    logger.error(f"❌ 이미지 {i} 처리 중 오류: {e}")
            
            # 최종 결과 요약
            logger.info("=" * 50)
            logger.info("📊 이미지 침수 분석 완료 요약")
            logger.info(f"   ✅ 성공: {success_count}개")
            logger.info(f"   ❌ 실패: {fail_count}개")
            logger.info(f"   📋 총 처리: {len(image_files)}개")
            logger.info(f"   📁 결과 저장 위치: {self.output_folder}")
            logger.info("=" * 50)
            
        except Exception as e:
            logger.error(f"❌ 이미지 처리 중 예상치 못한 오류: {e}")

def main():
    """메인 함수"""
    try:
        analyzer = ImageFloodAnalyzer()
        analyzer.process_all_images()
    except KeyboardInterrupt:
        logger.info("⏹️ 사용자에 의해 중단됨")
    except Exception as e:
        logger.error(f"❌ 예상치 못한 오류: {e}")

if __name__ == "__main__":
    main()
