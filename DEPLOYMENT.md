# 🚀 DevMour 배포 가이드

## 📋 서비스 포트 구성

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Frontend (Vite) | 5173 | React 개발 서버 |
| Backend (Express) | 3001 | API 서버 |
| Node.js AI Server | 3000 | AI 분석 서버 |
| Python AI Server | 8000 | 도로 위험도 분석 서버 |
| Python Flood Server | 8002 | 침수 분석 서버 |

## 🔧 환경변수 설정

### Frontend (Front/.env)
```env
# Frontend 환경변수
VITE_API_BASE_URL=http://175.45.194.114:3001/api
VITE_AI_SERVER_URL=http://175.45.194.114:8000
VITE_FLOOD_SERVER_URL=http://175.45.194.114:8002
```

### Backend (Back/.env)
```env
# Backend 환경변수
PORT=3001
HOST=175.45.194.114
DB_HOST=project-db-campus.smhrd.com
DB_PORT=3307
DB_USER=campus_25SW_BD_p3_2
DB_PASSWORD=smhrd2
DB_NAME=campus_25SW_BD_p3_2
ALLOWED_ORIGINS=http://175.45.194.114:5173,http://175.45.194.114:3000,http://175.45.194.114:3001
```

### Node.js AI Server (AiModel/AiServer/.env)
```env
# Node.js AI Server 환경변수
SERVER_PORT=3000
HOST=175.45.194.114
AI_SERVER_URL=http://175.45.194.114:8000
AI_SERVER_TIMEOUT=30000
```

### Python AI Server (AiModel/Python/.env)
```env
# Python AI Server 환경변수
HOST=175.45.194.114
PORT=8002
FLOOD_CONFIDENCE_THRESHOLD=0.7
MODEL_PATH=../floodbest.pt
BACKEND_SERVER_URL=http://175.45.194.114:3001
DB_URL=http://175.45.194.114:3000/api/save-risk
ROAD_SCORE_URL=http://175.45.194.114:3000/api/save-road-score
AI_SERVER_URL=http://175.45.194.114:8000
DB_SERVER_URL=http://175.45.194.114:3000
FLOOD_SERVER_URL=http://175.45.194.114:8002
CCTV_SERVER_URL=http://175.45.194.114:3001
RESULT_SERVER_URL=http://175.45.194.114:3000
```

## 🛠️ 배포 단계

### 1. 의존성 설치

#### Frontend
```bash
cd Front
npm install
```

#### Backend
```bash
cd Back
npm install
```

#### Node.js AI Server
```bash
cd AiModel/AiServer
npm install
```

#### Python AI Server
```bash
cd AiModel/Python
pip install -r requirements.txt
```

### 2. 서비스 시작

#### Backend 서버 시작
```bash
cd Back
node server.js
```

#### Node.js AI 서버 시작
```bash
cd AiModel/AiServer
node server.js
```

#### Python AI 서버 시작
```bash
cd AiModel/Python
python main.py
```

#### Frontend 개발 서버 시작
```bash
cd Front
npm run dev
```

### 3. 서비스 접속

- **Frontend**: http://175.45.194.114:5173
- **Backend API**: http://175.45.194.114:3001
- **Node.js AI Server**: http://175.45.194.114:3000
- **Python AI Server**: http://175.45.194.114:8000
- **Python Flood Server**: http://175.45.194.114:8002

## 🔒 보안 주의사항

1. **방화벽 설정**: 필요한 포트만 열어두세요
2. **환경변수 보호**: `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
3. **HTTPS 설정**: 프로덕션 환경에서는 HTTPS 사용 권장

## 📝 로그 확인

각 서비스의 로그를 확인하여 정상 작동 여부를 모니터링하세요:

- Backend: `Back/server.js` 콘솔 출력
- Node.js AI Server: `AiModel/AiServer/server.js` 콘솔 출력
- Python AI Server: `AiModel/Python/ai_system.log`
- Python Flood Server: `AiModel/Python/monitoring_flood.log`

## 🚨 문제 해결

### 포트 충돌
- 각 서비스가 다른 포트를 사용하는지 확인
- 이미 사용 중인 포트는 `netstat -an` 명령으로 확인

### 데이터베이스 연결 실패
- 데이터베이스 서버가 실행 중인지 확인
- 환경변수의 데이터베이스 정보가 올바른지 확인

### AI 모델 로드 실패
- 모델 파일이 올바른 경로에 있는지 확인
- Python 의존성이 모두 설치되었는지 확인
