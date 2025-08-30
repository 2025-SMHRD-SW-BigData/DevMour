#!/usr/bin/env python3
"""
AI 서버 상태 확인 스크립트
"""

import requests
import time
import json
from pathlib import Path

def check_server(url, name):
    """서버 상태 확인"""
    try:
        response = requests.get(f"{url}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ {name} 서버 정상: {url}")
            try:
                data = response.json()
                print(f"   상태: {data.get('status', 'unknown')}")
                if 'models_loaded' in data:
                    print(f"   모델 로드: {data['models_loaded']}")
                if 'cctv_connected' in data:
                    print(f"   CCTV 연결: {data['cctv_connected']}")
            except:
                pass
            return True
        else:
            print(f"⚠️ {name} 서버 응답 오류: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {name} 서버 연결 실패: {url}")
        return False
    except requests.exceptions.Timeout:
        print(f"⏰ {name} 서버 타임아웃: {url}")
        return False
    except Exception as e:
        print(f"❌ {name} 서버 확인 중 오류: {e}")
        return False

def main():
    """메인 함수"""
    print("🔍 AI 서버 상태 확인 중...")
    print("=" * 50)
    
    # 서버 URL들
    servers = [
        ("http://localhost:8000", "Python AI 서버"),
        ("http://localhost:3000", "Node.js AI 서버")
    ]
    
    results = []
    for url, name in servers:
        print(f"\n🔍 {name} 확인 중...")
        result = check_server(url, name)
        results.append((name, result))
        time.sleep(1)
    
    print("\n" + "=" * 50)
    print("📊 서버 상태 요약")
    print("=" * 50)
    
    for name, result in results:
        status = "✅ 정상" if result else "❌ 오류"
        print(f"{name}: {status}")
    
    success_count = sum(1 for _, result in results if result)
    total_count = len(results)
    
    print(f"\n총 {total_count}개 서버 중 {success_count}개 정상")
    
    if success_count == total_count:
        print("🎉 모든 서버가 정상 작동 중입니다!")
    elif success_count == 0:
        print("❌ 모든 서버에 연결할 수 없습니다.")
        print("\n🔧 해결 방법:")
        print("1. Python AI 서버 실행: cd AiModel/Python && python main.py")
        print("2. Node.js AI 서버 실행: cd AiModel/AiServer && npm run dev")
    else:
        print("⚠️ 일부 서버에 문제가 있습니다.")
    
    print("\n📋 API 엔드포인트:")
    print("- Python AI 서버: http://localhost:8000")
    print("- Node.js AI 서버: http://localhost:3000")
    print("- Python API 문서: http://localhost:8000/docs")

if __name__ == "__main__":
    main()
