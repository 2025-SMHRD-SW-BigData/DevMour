#!/usr/bin/env python3
"""
AI 서버 original_url 오류 수정 테스트 스크립트
"""

import sys
from pathlib import Path

# Python 폴더를 경로에 추가
python_dir = Path(__file__).parent / "Python"
sys.path.insert(0, str(python_dir))

def test_server_import():
    """AI 서버 모듈 import 테스트"""
    try:
        print("🔍 AI 서버 모듈 import 테스트")
        print("=" * 40)
        
        from ai_server import app
        print("✅ AI 서버 모듈 import 성공")
        
        # FastAPI 앱 확인
        print(f"   앱 제목: {app.title}")
        print(f"   앱 버전: {app.version}")
        
        return True
        
    except Exception as e:
        print(f"❌ AI 서버 import 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_cctv_processor():
    """CCTV 프로세서 모듈 테스트"""
    try:
        print("\n🔍 CCTV 프로세서 모듈 테스트")
        print("=" * 40)
        
        from cctv_processor import CCTVProcessor
        print("✅ CCTV 프로세서 모듈 import 성공")
        
        # 인스턴스 생성 테스트
        processor = CCTVProcessor()
        print("✅ CCTV 프로세서 인스턴스 생성 성공")
        
        print(f"   기본 URL: {processor.url}")
        print(f"   타임아웃: {processor.timeout}")
        print(f"   재시도 횟수: {processor.retry_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ CCTV 프로세서 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_yolo_ensemble():
    """YOLO 앙상블 모듈 테스트"""
    try:
        print("\n🔍 YOLO 앙상블 모듈 테스트")
        print("=" * 40)
        
        from yolo_ensemble import YOLOEnsemble
        print("✅ YOLO 앙상블 모듈 import 성공")
        
        # 인스턴스 생성 테스트
        ensemble = YOLOEnsemble()
        print("✅ YOLO 앙상블 인스턴스 생성 성공")
        
        print(f"   모델 수: {len(ensemble.models)}")
        print(f"   신뢰도 임계값: {ensemble.conf_threshold}")
        
        return True
        
    except Exception as e:
        print(f"❌ YOLO 앙상블 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """메인 함수"""
    print("🚀 AI 서버 original_url 오류 수정 테스트 시작")
    print("=" * 60)
    
    # 각 모듈 테스트
    server_success = test_server_import()
    cctv_success = test_cctv_processor()
    yolo_success = test_yolo_ensemble()
    
    print("\n" + "=" * 60)
    if server_success and cctv_success and yolo_success:
        print("🎉 모든 테스트 통과! AI 서버 오류가 수정되었습니다.")
        print("이제 CCTV 분석이 정상적으로 작동할 것입니다.")
    else:
        print("❌ 일부 테스트 실패. 추가 수정이 필요합니다.")
    
    return server_success and cctv_success and yolo_success

if __name__ == "__main__":
    main()
