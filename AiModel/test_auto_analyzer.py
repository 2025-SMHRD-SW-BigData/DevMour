#!/usr/bin/env python3
"""
자동 분석기 테스트 스크립트
"""

import sys
from pathlib import Path

# Python 폴더를 Python 경로에 추가
python_dir = Path(__file__).parent / "Python"
sys.path.insert(0, str(python_dir))

def test_imports():
    """모듈 import 테스트"""
    print("🧪 모듈 import 테스트 시작")
    
    try:
        print("1. config 모듈 import 테스트...")
        from config import MODEL_PATHS, CLASS_NAMES
        print("   ✅ config 모듈 import 성공")
        print(f"   모델 경로: {list(MODEL_PATHS.keys())}")
        print(f"   클래스: {CLASS_NAMES['final']}")
        
    except Exception as e:
        print(f"   ❌ config 모듈 import 실패: {e}")
        return False
    
    try:
        print("2. yolo_ensemble 모듈 import 테스트...")
        from yolo_ensemble import YOLOEnsemble
        print("   ✅ yolo_ensemble 모듈 import 성공")
        
    except Exception as e:
        print(f"   ❌ yolo_ensemble 모듈 import 실패: {e}")
        return False
    
    try:
        print("3. cctv_processor 모듈 import 테스트...")
        from cctv_processor import CCTVProcessor
        print("   ✅ cctv_processor 모듈 import 성공")
        
    except Exception as e:
        print(f"   ❌ cctv_processor 모듈 import 실패: {e}")
        return False
    
    try:
        print("4. auto_analyzer 모듈 import 테스트...")
        from auto_analyzer import AutoImageAnalyzer
        print("   ✅ auto_analyzer 모듈 import 성공")
        
    except Exception as e:
        print(f"   ❌ auto_analyzer 모듈 import 실패: {e}")
        return False
    
    return True

def test_auto_analyzer():
    """자동 분석기 테스트"""
    print("\n🧪 자동 분석기 테스트 시작")
    
    try:
        from auto_analyzer import AutoImageAnalyzer
        
        # 인스턴스 생성
        analyzer = AutoImageAnalyzer(analysis_interval=120)  # 2분 간격
        print("✅ AutoImageAnalyzer 인스턴스 생성 성공")
        
        # 초기화 테스트
        print("초기화 테스트 중...")
        success = analyzer.initialize()
        
        if success:
            print("✅ 초기화 성공")
            
            # 통계 확인
            stats = analyzer.get_stats()
            print(f"📊 초기 통계: {stats}")
            
            # 즉시 분석 테스트
            print("즉시 분석 테스트 중...")
            result = analyzer.force_analysis()
            
            if result:
                print("✅ 즉시 분석 성공")
                risk_score = result['risk_analysis']['total_risk_score']
                print(f"   위험도 점수: {risk_score}점")
            else:
                print("⚠️ 즉시 분석 실패")
            
        else:
            print("❌ 초기화 실패")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ 자동 분석기 테스트 실패: {e}")
        import traceback
        print(f"상세 오류: {traceback.format_exc()}")
        return False

def main():
    """메인 함수"""
    print("🔍 AI 자동 분석기 테스트 시작")
    print("=" * 50)
    
    # 1. Import 테스트
    if not test_imports():
        print("\n❌ Import 테스트 실패")
        return
    
    print("\n✅ 모든 모듈 import 성공!")
    
    # 2. 자동 분석기 테스트
    if test_auto_analyzer():
        print("\n🎉 자동 분석기 테스트 성공!")
    else:
        print("\n❌ 자동 분석기 테스트 실패")
    
    print("\n📋 테스트 완료")

if __name__ == "__main__":
    main()
