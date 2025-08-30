#!/usr/bin/env python3
"""
캡처된 이미지들을 확인하는 뷰어 스크립트
"""

import os
import sys
from pathlib import Path
import subprocess
import platform

def open_folder(folder_path):
    """운영체제에 맞게 폴더를 엽니다."""
    try:
        if platform.system() == "Windows":
            os.startfile(folder_path)
        elif platform.system() == "Darwin":  # macOS
            subprocess.run(["open", folder_path])
        else:  # Linux
            subprocess.run(["xdg-open", folder_path])
        print(f"✅ 폴더가 열렸습니다: {folder_path}")
    except Exception as e:
        print(f"❌ 폴더 열기 실패: {e}")

def list_captured_images():
    """캡처된 이미지들을 나열합니다."""
    capture_dir = Path("captured_images")
    
    if not capture_dir.exists():
        print("❌ captured_images 폴더가 존재하지 않습니다.")
        print("   먼저 iframe 캡처를 실행해주세요.")
        return
    
    print(f"📁 캡처된 이미지 폴더: {capture_dir.absolute()}")
    print("=" * 50)
    
    # 폴더 내 파일들을 시간순으로 정렬
    files = list(capture_dir.glob("*"))
    files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    
    if not files:
        print("   폴더가 비어있습니다.")
        return
    
    # 파일들을 그룹별로 분류
    image_groups = {}
    for file in files:
        if file.suffix.lower() in ['.png', '.jpg', '.jpeg']:
            # 파일명에서 타임스탬프 추출
            timestamp = file.stem.split('_')[-1] if '_' in file.stem else 'unknown'
            if timestamp not in image_groups:
                image_groups[timestamp] = []
            image_groups[timestamp].append(file)
    
    # 각 그룹별로 출력
    for timestamp, group_files in sorted(image_groups.items(), reverse=True):
        print(f"\n🕐 캡처 시간: {timestamp}")
        print("-" * 30)
        
        for file in sorted(group_files):
            file_size = file.stat().st_size / 1024  # KB
            print(f"   📸 {file.name} ({file_size:.1f} KB)")
            
            # 요약 파일이 있으면 내용 표시
            summary_file = capture_dir / f"capture_summary_{timestamp}.txt"
            if summary_file.exists() and file.name.startswith("capture_summary"):
                try:
                    with open(summary_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        print(f"      📋 요약 정보:")
                        for line in content.split('\n'):
                            if line.strip():
                                print(f"         {line}")
                except:
                    pass

def main():
    """메인 함수"""
    print("🖼️  캡처된 이미지 뷰어")
    print("=" * 30)
    
    while True:
        print("\n📋 메뉴:")
        print("1. 캡처된 이미지 목록 보기")
        print("2. 이미지 폴더 열기")
        print("3. 종료")
        
        try:
            choice = input("\n선택하세요 (1-3): ").strip()
            
            if choice == "1":
                list_captured_images()
            elif choice == "2":
                capture_dir = Path("captured_images")
                if capture_dir.exists():
                    open_folder(capture_dir.absolute())
                else:
                    print("❌ captured_images 폴더가 존재하지 않습니다.")
            elif choice == "3":
                print("👋 프로그램을 종료합니다.")
                break
            else:
                print("❌ 1-3 사이의 숫자를 입력하세요.")
                
        except KeyboardInterrupt:
            print("\n👋 프로그램을 종료합니다.")
            break
        except Exception as e:
            print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    main()
