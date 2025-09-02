# AI 도로 위험도 분석 시스템

YOLO 앙상블 모델을 사용한 도로 손상 탐지 및 위험도 분석 시스템입니다.

## 🌊 침수 모니터링 시스템

1시간 단위로 CCTV 정보를 모니터링하여 실시간 날씨를 조회하고, 강수량이 20mm를 넘으면 자동으로 침수 감지 분석을 실행하는 시스템입니다.

## 🏗️ 시스템 구조

```
AiModel/
├── Python/                 # Python AI 모델 서버
│   ├── config.py          # 설정 파일
│   ├── yolo_ensemble.py   # YOLO 앙상블 클래스
│   ├── cctv_processor.py  # CCTV 처리 클래스
│   ├── ai_server.py       # FastAPI AI 서버
│   ├── main.py            # 메인 실행 파일
│   ├── monitoring_flood.py # 침수 모니터링 시스템
│   ├── flood_detected_all.py # 침수 감지 분석
│   ├── start_monitoring_flood.bat # Windows 실행 스크립트
│   ├── start_monitoring_flood.sh # Linux/Mac 실행 스크립트
│   └── requirements.txt   # Python 의존성
├── AiServer/              # Node.js AI 서버
│   ├── server.js          # Express 서버
│   ├── db.js              # 데이터베이스 연결
│   ├── ai_client.js       # AI 서버 클라이언트
│   ├── package.json       # Node.js 의존성
│   └── env.example        # 환경 변수 예시
├── yolov8nbest.pt         # YOLOv8n 모델 (6MB)
├── yolov8sbest.pt         # YOLOv8s 모델 (50MB)
└── yolov8lbest.pt         # YOLOv8l 모델 (250MB)
```

## 🚀 빠른 시작

### 1. Python AI 서버 실행

```bash
cd AiModel/Python

# 의존성 설치
pip install -r requirements.txt

# AI 서버 실행
python main.py
```

AI 서버는 `http://localhost:8000`에서 실행됩니다.

### 2. 자동 이미지 분석 시작

```bash
cd AiModel

# 자동 분석 시작
python start_auto_analysis.py

# 또는 Windows에서
start_auto_analysis.bat
```

자동 분석은 설정된 간격(기본 60초)으로 CCTV에서 이미지를 캡처하고 분석합니다.

### 3. Node.js AI 서버 실행

```bash
cd AiModel/AiServer

# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env
# .env 파일을 편집하여 데이터베이스 정보 입력

# 서버 실행
npm run dev
```

Node.js 서버는 `http://localhost:3000`에서 실행됩니다.

### 4. 침수 모니터링 시스템 실행

```bash
cd AiModel/Python

# 의존성 설치 (schedule 라이브러리 추가)
pip install -r requirements.txt

# OpenWeatherMap API 키 설정
# monitoring_flood.py 파일에서 self.weather_api_key 값을 설정

# 모니터링 시스템 실행
python monitoring_flood.py

# 또는 Windows에서
start_monitoring_flood.bat

# 또는 Linux/Mac에서
chmod +x start_monitoring_flood.sh
./start_monitoring_flood.sh
```

침수 모니터링 시스템은 1시간마다 자동으로 실행되며, 강수량이 20mm를 넘으면 자동으로 침수 감지 분석을 실행합니다.

## 📊 API 엔드포인트

### Python AI 서버 (포트 8000)

- `GET /` - 서버 상태
- `GET /health` - 헬스 체크
- `POST /api/analyze-image` - 이미지 분석
- `POST /api/analyze-cctv` - CCTV 분석
- `GET /api/models` - 모델 정보
- `GET /api/classes` - 클래스 정보

#### 🚀 자동 분석 API
- `POST /api/auto-analysis/start` - 자동 이미지 분석 시작
- `POST /api/auto-analysis/stop` - 자동 이미지 분석 중지
- `GET /api/auto-analysis/stats` - 자동 분석 통계 조회
- `POST /api/auto-analysis/force` - 즉시 이미지 분석 수행

### Node.js AI 서버 (포트 3000)

- `GET /health` - 전체 시스템 상태
- `GET /api/ai/status` - AI 서버 상태
- `GET /api/ai/models` - AI 모델 정보
- `GET /api/ai/classes` - AI 클래스 정보
- `POST /api/ai/analyze-image` - 이미지 분석 (파일 업로드)
- `POST /api/ai/analyze-cctv` - CCTV 분석
- `POST /api/save-risk` - 위험도 점수 저장
- `GET /api/scores` - 점수 조회

## 🔧 설정

### 환경 변수 설정

`.env` 파일을 생성하고 다음 정보를 설정하세요:

```bash
# 서버 설정
SERVER_PORT=3000
NODE_ENV=development

# 데이터베이스 설정
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
DB_PORT=3306

# AI 모델 서버 설정
AI_SERVER_URL=http://localhost:8000
AI_SERVER_TIMEOUT=30000

# CCTV 설정
CCTV_URL=http://192.168.x.x:8080/video
```

### 모델 설정

`Python/config.py`에서 모델 경로, 가중치, 클래스 등을 설정할 수 있습니다.

## 📱 사용 예시

### 이미지 분석

```bash
# Python 서버에 직접 요청
curl -X POST "http://localhost:8000/api/analyze-image" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@road_image.jpg"

# Node.js 서버를 통한 요청
curl -X POST "http://localhost:3000/api/ai/analyze-image" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@road_image.jpg"
```

### CCTV 분석

```bash
# Python 서버에 직접 요청
curl -X POST "http://localhost:8000/api/analyze-cctv"

# Node.js 서버를 통한 요청
curl -X POST "http://localhost:3000/api/ai/analyze-cctv"
```

## 🔍 탐지 클래스

- **crack** (균열): 위험도 3점
- **break** (포트홀): 위험도 5점  
- **ali_crack** (거북등 균열): 위험도 4점

## 📈 위험도 점수 계산

각 탐지된 객체의 위험도 점수를 합산하여 총 위험도 점수를 계산합니다.

```
총 위험도 = Σ(클래스별 위험도 × 탐지 개수)
```

## 🛠️ 개발

### Python 코드 수정

- `config.py`: 모델 설정, 클래스, 가중치 등
- `yolo_ensemble.py`: YOLO 앙상블 로직
- `cctv_processor.py`: CCTV 처리 로직
- `ai_server.py`: FastAPI 서버

### Node.js 코드 수정

- `server.js`: Express 서버 및 라우트
- `ai_client.js`: Python AI 서버와의 통신
- `db.js`: 데이터베이스 연결 및 쿼리

## 📝 로그

- Python 서버: `ai_system.log` 파일에 로그 저장
- Node.js 서버: 콘솔에 로그 출력

## 🔧 문제 해결

### 모델 로드 실패

1. 모델 파일 경로 확인
2. CUDA/GPU 드라이버 확인 (GPU 사용 시)
3. 메모리 부족 여부 확인

### CCTV 연결 실패

1. CCTV URL 확인
2. 네트워크 연결 상태 확인
3. CCTV 스트림 형식 확인

### 데이터베이스 연결 실패

1. 데이터베이스 서버 상태 확인
2. 연결 정보 확인
3. 데이터베이스 스키마 확인

## 📚 추가 정보

- [Ultralytics YOLO](https://github.com/ultralytics/ultralytics)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Express.js](https://expressjs.com/)
- [MySQL2](https://github.com/sidorares/node-mysql2)
