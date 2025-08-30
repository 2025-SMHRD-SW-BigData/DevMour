#!/usr/bin/env python3
"""
YOLO 앙상블 오류 수정 테스트 스크립트
"""

import sys
from pathlib import Path

# Python 폴더를 경로에 추가
python_dir = Path(__file__).parent / "Python"
sys.path.insert(0, str(python_dir))

def test_yolo_import():
    """YOLO 앙상블 모듈 import 테스트"""
    try:
        print("🔍 YOLO 앙상블 모듈 import 테스트")
        print("=" * 40)
        
        from yolo_ensemble import YOLOEnsemble
        print("✅ YOLO 앙상블 모듈 import 성공")
        
        # 클래스 인스턴스 생성 테스트
        print("\n🔍 YOLO 앙상블 인스턴스 생성 테스트")
        ensemble = YOLOEnsemble()
        print("✅ YOLO 앙상블 인스턴스 생성 성공")
        
        # 속성 확인
        print(f"   모델 수: {len(ensemble.models)}")
        print(f"   모델 이름: {ensemble.model_names}")
        print(f"   가중치: {ensemble.weights}")
        print(f"   NMS IOU 임계값: {ensemble.nms_iou_threshold}")
        print(f"   신뢰도 임계값: {ensemble.conf_threshold}")
        
        print("\n🎯 모든 테스트 통과!")
        return True
        
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_config():
    """설정 파일 테스트"""
    try:
        print("\n🔍 설정 파일 테스트")
        print("=" * 30)
        
        from config import MODEL_CONFIG
        print("✅ 설정 파일 import 성공")
        
        print(f"   NMS IOU 임계값: {MODEL_CONFIG['nms_iou_threshold']}")
        print(f"   신뢰도 임계값: {MODEL_CONFIG['confidence_threshold']}")
        print(f"   앙상블 가중치: {MODEL_CONFIG['ensemble_weights']}")
        
        return True
        
    except Exception as e:
        print(f"❌ 설정 테스트 실패: {e}")
        return False

def main():
    """메인 함수"""
    print("🚀 YOLO 앙상블 오류 수정 테스트 시작")
    print("=" * 50)
    
    # 설정 테스트
    config_success = test_config()
    
    # YOLO import 테스트
    yolo_success = test_yolo_import()
    
    print("\n" + "=" * 50)
    if config_success and yolo_success:
        print("🎉 모든 테스트 통과! YOLO 앙상블 오류가 수정되었습니다.")
    else:
        print("❌ 일부 테스트 실패. 추가 수정이 필요합니다.")
    
    return config_success and yolo_success

if __name__ == "__main__":
    main()
