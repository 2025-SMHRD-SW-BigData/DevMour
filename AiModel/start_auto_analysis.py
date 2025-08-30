#!/usr/bin/env python3
"""
자동 이미지 분석 시작 스크립트
"""

import time
import requests
import json
from datetime import datetime

def start_auto_analysis(interval: int = 60):
    """자동 이미지 분석을 시작합니다."""
    try:
        print(f"🚀 자동 이미지 분석 시작 중... (간격: {interval}초)")
        
        # 자동 분석 시작 API 호출
        response = requests.post(
            "http://localhost:8000/api/auto-analysis/start",
            params={"interval": interval},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result['message']}")
            return True
        else:
            print(f"❌ 자동 분석 시작 실패: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Python AI 서버에 연결할 수 없습니다.")
        print("   서버가 실행 중인지 확인하세요: cd AiModel/Python && python main.py")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

def stop_auto_analysis():
    """자동 이미지 분석을 중지합니다."""
    try:
        print("🛑 자동 이미지 분석 중지 중...")
        
        response = requests.post(
            "http://localhost:8000/api/auto-analysis/stop",
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result['message']}")
            return True
        else:
            print(f"❌ 자동 분석 중지 실패: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Python AI 서버에 연결할 수 없습니다.")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

def get_analysis_stats():
    """분석 통계를 조회합니다."""
    try:
        response = requests.get(
            "http://localhost:8000/api/auto-analysis/stats",
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            stats = result['stats']
            
            print("📊 자동 분석 통계")
            print("=" * 40)
            print(f"총 분석 횟수: {stats['total_analyses']}")
            print(f"성공한 분석: {stats['successful_analyses']}")
            print(f"실패한 분석: {stats['failed_analyses']}")
            
            if stats['total_analyses'] > 0:
                print(f"성공률: {stats['success_rate']:.1f}%")
            
            if stats['last_analysis_time']:
                last_time = datetime.fromtimestamp(stats['last_analysis_time'])
                print(f"마지막 분석: {last_time.strftime('%Y-%m-%d %H:%M:%S')}")
            
            if stats['start_time']:
                start_time = datetime.fromtimestamp(stats['start_time'])
                print(f"시작 시간: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
            
            if stats['uptime_formatted']:
                print(f"가동 시간: {stats['uptime_formatted']}")
            
            return True
        else:
            print(f"❌ 통계 조회 실패: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Python AI 서버에 연결할 수 없습니다.")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

def force_analysis():
    """즉시 이미지 분석을 수행합니다."""
    try:
        print("🔍 즉시 이미지 분석 수행 중...")
        
        response = requests.post(
            "http://localhost:8000/api/auto-analysis/force",
            timeout=60  # 분석 시간을 고려하여 타임아웃 증가
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ {result['message']}")
            
            # 분석 결과 출력
            if 'result' in result:
                analysis_result = result['result']
                risk_score = analysis_result['risk_analysis']['total_risk_score']
                detection_count = analysis_result['risk_analysis']['detection_count']
                print(f"   위험도 점수: {risk_score}점")
                print(f"   탐지된 객체: {detection_count}개")
            
            return True
        else:
            print(f"❌ 즉시 분석 실패: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Python AI 서버에 연결할 수 없습니다.")
        return False
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        return False

def monitor_auto_analysis(duration_minutes: int = 10):
    """자동 분석을 모니터링합니다."""
    print(f"👀 자동 분석 모니터링 시작 (지속 시간: {duration_minutes}분)")
    print("=" * 50)
    
    start_time = time.time()
    end_time = start_time + (duration_minutes * 60)
    
    try:
        while time.time() < end_time:
            current_time = datetime.now().strftime("%H:%M:%S")
            print(f"\n[{current_time}] 상태 확인 중...")
            
            # 통계 조회
            if get_analysis_stats():
                print("-" * 30)
            else:
                print("⚠️ 통계 조회 실패")
            
            # 30초 대기
            time.sleep(30)
            
    except KeyboardInterrupt:
        print("\n🛑 모니터링 중단됨")
    except Exception as e:
        print(f"\n❌ 모니터링 오류: {e}")

def main():
    """메인 함수"""
    print("🤖 AI 자동 이미지 분석 시스템")
    print("=" * 40)
    
    while True:
        print("\n📋 메뉴:")
        print("1. 자동 분석 시작 (60초 간격)")
        print("2. 자동 분석 시작 (사용자 정의 간격)")
        print("3. 자동 분석 중지")
        print("4. 분석 통계 조회")
        print("5. 즉시 분석 수행")
        print("6. 실시간 모니터링 (10분)")
        print("7. 종료")
        
        try:
            choice = input("\n선택하세요 (1-7): ").strip()
            
            if choice == "1":
                start_auto_analysis(60)
            elif choice == "2":
                try:
                    interval = int(input("분석 간격을 초 단위로 입력하세요 (최소 10초): "))
                    if interval < 10:
                        interval = 10
                        print(f"⚠️ 최소 간격은 10초입니다. {interval}초로 설정됩니다.")
                    start_auto_analysis(interval)
                except ValueError:
                    print("❌ 올바른 숫자를 입력하세요.")
            elif choice == "3":
                stop_auto_analysis()
            elif choice == "4":
                get_analysis_stats()
            elif choice == "5":
                force_analysis()
            elif choice == "6":
                monitor_auto_analysis(10)
            elif choice == "7":
                print("👋 프로그램을 종료합니다.")
                break
            else:
                print("❌ 1-7 사이의 숫자를 입력하세요.")
                
        except KeyboardInterrupt:
            print("\n👋 프로그램을 종료합니다.")
            break
        except Exception as e:
            print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    main()
