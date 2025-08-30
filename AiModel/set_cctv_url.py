#!/usr/bin/env python3
"""
CCTV URL 설정 스크립트
"""

import os
from pathlib import Path

def set_cctv_url():
    """CCTV URL을 설정합니다."""
    print("🔧 CCTV URL 설정")
    print("=" * 40)
    
    # 현재 설정된 CCTV URL 확인
    current_url = os.getenv('CCTV_URL', 'http://localhost:8080/video')
    print(f"현재 CCTV URL: {current_url}")
    
    print("\n📋 사용 가능한 CCTV URL 옵션:")
    print("1. 로컬 테스트용: http://localhost:8080/video")
    print("2. 실제 CCTV 스트림: rtsp://192.168.1.100:554/stream1")
    print("3. HTTP 스트림: http://192.168.1.100:8080/video")
    print("4. 사용자 정의 URL 입력")
    print("5. 환경 변수 설정 (영구)")
    
    try:
        choice = input("\n선택하세요 (1-5): ").strip()
        
        if choice == "1":
            new_url = "http://localhost:8080/video"
        elif choice == "2":
            new_url = "rtsp://192.168.1.100:554/stream1"
        elif choice == "3":
            new_url = "http://192.168.1.100:8080/video"
        elif choice == "4":
            new_url = input("CCTV URL을 입력하세요: ").strip()
        elif choice == "5":
            set_environment_variable()
            return
        else:
            print("❌ 잘못된 선택입니다.")
            return
        
        if new_url:
            # 환경 변수로 설정 (현재 세션용)
            os.environ['CCTV_URL'] = new_url
            print(f"✅ CCTV URL이 설정되었습니다: {new_url}")
            print("⚠️ 이 설정은 현재 터미널 세션에만 적용됩니다.")
            print("   영구 설정을 원하면 5번을 선택하세요.")
        
    except KeyboardInterrupt:
        print("\n👋 설정이 취소되었습니다.")
    except Exception as e:
        print(f"❌ 오류 발생: {e}")

def set_environment_variable():
    """환경 변수를 영구적으로 설정합니다."""
    print("\n🌍 환경 변수 영구 설정")
    print("=" * 30)
    
    print("Windows에서 환경 변수를 설정하려면:")
    print("1. 시스템 환경 변수 편집")
    print("2. 새로 만들기 → 변수 이름: CCTV_URL")
    print("3. 변수 값에 CCTV URL 입력")
    print("4. 확인 후 터미널 재시작")
    
    print("\n또는 .env 파일을 생성하여 설정할 수 있습니다:")
    
    # .env 파일 생성
    env_file = Path(__file__).parent / "Python" / ".env"
    
    try:
        cctv_url = input("CCTV URL을 입력하세요: ").strip()
        if cctv_url:
            with open(env_file, 'w', encoding='utf-8') as f:
                f.write(f"CCTV_URL={cctv_url}\n")
                f.write("CCTV_TIMEOUT=10\n")
                f.write("CCTV_RETRY_COUNT=3\n")
                f.write("DB_URL=http://localhost:3000/api/save-risk\n")
                f.write("HOST=0.0.0.0\n")
                f.write("PORT=8000\n")
                f.write("DEBUG=true\n")
            
            print(f"✅ .env 파일이 생성되었습니다: {env_file}")
            print(f"   CCTV_URL={cctv_url}")
            print("   서버를 재시작하면 설정이 적용됩니다.")
        
    except Exception as e:
        print(f"❌ .env 파일 생성 실패: {e}")

def test_cctv_connection():
    """CCTV 연결을 테스트합니다."""
    print("\n🧪 CCTV 연결 테스트")
    print("=" * 30)
    
    try:
        import requests
        from pathlib import Path
        
        # Python 폴더를 경로에 추가
        python_dir = Path(__file__).parent / "Python"
        import sys
        sys.path.insert(0, str(python_dir))
        
        from cctv_processor import CCTVProcessor
        
        # CCTV 프로세서 생성
        processor = CCTVProcessor()
        
        print("CCTV 연결 테스트 중...")
        frame = processor.capture_with_retry()
        
        if frame is not None:
            print("✅ CCTV 연결 성공!")
            print(f"   프레임 크기: {frame.shape}")
            print(f"   프레임 타입: {frame.dtype}")
        else:
            print("❌ CCTV 연결 실패")
            
    except Exception as e:
        print(f"❌ CCTV 테스트 실패: {e}")

def main():
    """메인 함수"""
    print("🔧 CCTV 설정 및 테스트 도구")
    print("=" * 50)
    
    while True:
        print("\n📋 메뉴:")
        print("1. CCTV URL 설정")
        print("2. 환경 변수 영구 설정")
        print("3. CCTV 연결 테스트")
        print("4. 종료")
        
        try:
            choice = input("\n선택하세요 (1-4): ").strip()
            
            if choice == "1":
                set_cctv_url()
            elif choice == "2":
                set_environment_variable()
            elif choice == "3":
                test_cctv_connection()
            elif choice == "4":
                print("👋 프로그램을 종료합니다.")
                break
            else:
                print("❌ 1-4 사이의 숫자를 입력하세요.")
                
        except KeyboardInterrupt:
            print("\n👋 프로그램을 종료합니다.")
            break
        except Exception as e:
            print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    main()
