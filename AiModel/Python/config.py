import os
from pathlib import Path

# .env 파일 로드 (python-dotenv가 설치된 경우)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# 프로젝트 루트 경로
ROOT_DIR = Path(__file__).parent.parent

# 모델 경로 설정
MODEL_PATHS = {
    'yolov8n': ROOT_DIR / 'yolov8nbest.pt',
    'yolov8s': ROOT_DIR / 'yolov8sbest.pt', 
    'yolov8l': ROOT_DIR / 'yolov8lbest.pt'
}

# 모델 설정
MODEL_CONFIG = {
    'nms_iou_threshold': 0.2,
    'confidence_threshold': 0.01,  # 신뢰도 임계값
    'ensemble_weights': [0.2, 0.5, 0.3]  # yolov8n, yolov8s, yolov8l 가중치
}

# 클래스 설정
CLASS_NAMES = {
    'final': ['crack', 'break', 'ali_crack'],
    'model3_local': ['D20', 'D43', 'D50', 'D44', 'D00', 'D10', 'D40']
}

# 클래스 매핑 (model3의 로컬 클래스를 최종 클래스로 변환)
CLASS_MAPPING = {
    'D00': 'crack',    # 균열
    'D10': 'crack',    # 균열  
    'D40': 'break',    # 포트홀
    'D20': 'ali_crack' # 거북등 균열
}

# 위험도 점수 설정
RISK_SCORES = {
    'crack': 0.65,      # 균열
    'break': 0.8,      # 포트홀
    'ali_crack': 0.7   # 거북등 균열
}

# 서버 설정
SERVER_CONFIG = {
    'host': '0.0.0.0',
    'port': 8000,
    'debug': True
}

# CCTV 설정
CCTV_CONFIG = {
    'url': os.getenv('CCTV_URL', 'https://www.utic.go.kr/e639679b-16a7-429f-aadc-36fac694d82b'),  # 기본 CCTV URL
    'timeout': int(os.getenv('CCTV_TIMEOUT', '10')),
    'retry_count': int(os.getenv('CCTV_RETRY_COUNT', '3'))
}

# 데이터베이스 설정
DB_CONFIG = {
    'url': os.getenv('DB_URL', 'http://localhost:3000/api/save-risk'),
    'road_score_url': os.getenv('ROAD_SCORE_URL', 'http://localhost:3000/api/save-road-score'),
    'base_url': os.getenv('BASE_URL', 'http://175.45.194.114:3001'),
    'timeout': 10
}

# 날씨 API 설정
WEATHER_CONFIG = {
    'api_key': os.getenv('c1c00ab7cd918d1121e2b38128a14709', 'c1c00ab7cd918d1121e2b38128a14709'),
    'base_url': 'http://api.openweathermap.org/data/2.5/weather',
    'timeout': 10
}
