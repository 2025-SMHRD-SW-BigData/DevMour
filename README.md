# DevMour
관리자 사용자를 위한 도로시(SEE) 웹 대시보드
# 프로젝트 소개
YOLOv8을 활용한 실시간 도로 손상 감지 및 위험도 평가 서비스
CCTV 영상과 AI를 활용하여 도로 파손을 실시간으로 감지하고, 도로 손상 유형을 자동 분류하여 종합적인 도로 상태 평가 시스템 구축하고자 합니다.
# 개발 기간
2025.07.29~25.09.10
# 개발자 소개(역할분담 상세)
팀장 : 김상중 - 프로젝트 총괄 PM, AI 모델링, AI 모델링 서버 연결, AI 모델 라벨링

팀원 : 전혜미 - 프로젝트 기획, 산출문서 작성, UI 설계, AI 모델 라벨링

팀원 : 박주진 - 서버 배포 총괄, AI 서버 컴퓨팅, DB 설계구현, API 통합 관리

팀원 : 박보라 - 날씨 API 연동, 지오코딩 API 활용, 앱 지도 API 활용, 웹 UI/UX

팀원 : 최정운 - 반응형 로그인 페이지, 앱 민원 페이지, 자동 PDF 보고서, 웹 UI/UX

팀원 : 송달상 - 앱 PUSH 알림 기능, 앱 소셜 로그인 기능, 앱 알림 내역 구현, CCTV API 연동
![팀원소개](https://github.com/2025-SMHRD-SW-BigData/DevMour/blob/master/%ED%8C%80%EC%9B%90%EC%86%8C%EA%B0%9C.jpg?raw=true)
# 개발환경
VisualStudio Code, Colab, Android Studio, Ubuntu
# 기술스택
![기술스택](https://github.com/2025-SMHRD-SW-BigData/DevMour/blob/master/%EA%B8%B0%EC%88%A0%20%EC%8A%A4%ED%83%9D.jpg?raw=true)
# 주요기능
+ 웹 대시보드 구현
  + 맵에 CCTV, 공사중, 침수, 위험지역 마커 표시
  + CCTV 마커 클릭시 실시간 영상 확인, AI 모델을 통한 도로파손, 침수 탐지, 자동 보고서 생성
  + 매일 정해진 시간에 자동으로 모든 CCTV 구역 자동 검사후 도로 점수 갱신
  + 일정 주기마다 날씨 확인후 강수량 20mm 이상시 자동 침수 탐지 모델 작동
  + 각종 통계와 현황 분석을 위한 기능별 상세 페이지
  + 앱을 통한 민원신고 접수시 실시간 알림 표시 기능
  + 앱을 통한 민원신고을 확인하여 AI 도로분석을 통해 상태 확인 후 관리자의 판단하에 통제 구역 추가 및 추가시 앱 알림

# 프로젝트 아키텍쳐
![프로젝트 아키텍처](https://raw.githubusercontent.com/2025-SMHRD-SW-BigData/DevMour/refs/heads/master/devmour%20%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98.jpg?token=GHSAT0AAAAAADKKYC3ODCGSVT3HQOHDWCTW2GCIJUQ)

# 시연영상
https://www.youtube.com/watch?si=M73OB3VOOP5eas6v&v=o9kYfwejQRQ&feature=youtu.be

# 최종 발표자료
[(https://www.canva.com/design/DAGyomBQRs0/4u21qiH1jrva4l-i-febYQ/edit?utm_content=DAGyomBQRs0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)](https://www.canva.com/design/DAGyomBQRs0/4u21qiH1jrva4l-i-febYQ/edit?utm_content=DAGyomBQRs0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)
