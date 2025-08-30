#!/usr/bin/env python3
"""
AI 서버 테스트 클라이언트
"""

import requests
import json
import time
from pathlib import Path

class AITestClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def test_health(self):
        """서버 상태 확인"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            print(f"✅ 헬스 체크 성공: {response.status_code}")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
            return True
        except Exception as e:
            print(f"❌ 헬스 체크 실패: {e}")
            return False
    
    def test_models(self):
        """모델 정보 조회"""
        try:
            response = self.session.get(f"{self.base_url}/api/models")
            print(f"✅ 모델 정보 조회 성공: {response.status_code}")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
            return True
        except Exception as e:
            print(f"❌ 모델 정보 조회 실패: {e}")
            return False
    
    def test_classes(self):
        """클래스 정보 조회"""
        try:
            response = self.session.get(f"{self.base_url}/api/classes")
            print(f"✅ 클래스 정보 조회 성공: {response.status_code}")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
            return True
        except Exception as e:
            print(f"❌ 클래스 정보 조회 실패: {e}")
            return False
    
    def test_cctv_analysis(self):
        """CCTV 분석 테스트"""
        try:
            response = self.session.post(f"{self.base_url}/api/analyze-cctv")
            print(f"✅ CCTV 분석 성공: {response.status_code}")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
            return True
        except Exception as e:
            print(f"❌ CCTV 분석 실패: {e}")
            return False
    
    def test_image_analysis(self, image_path):
        """이미지 분석 테스트"""
        try:
            if not Path(image_path).exists():
                print(f"❌ 이미지 파일을 찾을 수 없음: {image_path}")
                return False
            
            with open(image_path, 'rb') as f:
                files = {'file': f}
                response = self.session.post(f"{self.base_url}/api/analyze-image", files=files)
            
            print(f"✅ 이미지 분석 성공: {response.status_code}")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
            return True
        except Exception as e:
            print(f"❌ 이미지 분석 실패: {e}")
            return False
    
    def run_all_tests(self):
        """모든 테스트 실행"""
        print("🧪 AI 서버 테스트 시작")
        print("=" * 50)
        
        tests = [
            ("헬스 체크", self.test_health),
            ("모델 정보 조회", self.test_models),
            ("클래스 정보 조회", self.test_classes),
            ("CCTV 분석", self.test_cctv_analysis),
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"\n🔍 {test_name} 테스트 중...")
            result = test_func()
            results.append((test_name, result))
            time.sleep(1)
        
        print("\n" + "=" * 50)
        print("📊 테스트 결과 요약")
        print("=" * 50)
        
        for test_name, result in results:
            status = "✅ 성공" if result else "❌ 실패"
            print(f"{test_name}: {status}")
        
        success_count = sum(1 for _, result in results if result)
        total_count = len(results)
        
        print(f"\n총 {total_count}개 테스트 중 {success_count}개 성공")
        
        if success_count == total_count:
            print("🎉 모든 테스트가 성공했습니다!")
        else:
            print("⚠️ 일부 테스트가 실패했습니다.")

def main():
    """메인 함수"""
    client = AITestClient()
    
    # 모든 테스트 실행
    client.run_all_tests()
    
    # 이미지 분석 테스트 (이미지 파일이 있는 경우)
    test_image = "test_image.jpg"
    if Path(test_image).exists():
        print(f"\n🔍 이미지 분석 테스트 ({test_image})")
        client.test_image_analysis(test_image)

if __name__ == "__main__":
    main()
