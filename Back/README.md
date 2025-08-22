# DevMour Backend API

## 개요
DevMour 프로젝트의 백엔드 API 서버입니다. 마커 정보 관리, CCTV 모니터링, 도로 통제 정보 등을 제공합니다.

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 설정
- MySQL 데이터베이스 연결 정보는 `server.js`에서 설정
- 포트: 3001

### 3. 서버 실행
```bash
node server.js
```

## API 엔드포인트

### 마커 관련 API

#### 1. 모든 마커 정보 조회
```
GET /api/marker/allmarkers
```
- 모든 마커의 기본 정보를 반환합니다.

#### 2. 마커 상세 정보 조회
```
GET /api/marker/detail/:markerId
```
- 특정 마커의 상세 정보를 반환합니다.
- 마커 타입에 따라 CCTV, 공사, 침수 정보를 함께 반환합니다.

**응답 예시:**
```json
{
  "marker": {
    "marker_id": 1,
    "lat": 37.4979,
    "lon": 127.0276,
    "marker_type": "cctv",
    "cctv_idx": 1
  },
  "detail": {
    "cctv_idx": 1,
    "cctv_name": "강남역 CCTV-01",
    "lat": 37.4979,
    "lon": 127.0276,
    "cctv_status": "A",
    "cctv_url": "http://example.com/cctv1/stream"
  }
}
```

#### 3. 마커 정보 저장
```
POST /api/marker/updatemarker
```
- 새로운 마커 정보를 데이터베이스에 저장합니다.

**요청 본문:**
```json
{
  "lat": 37.4979,
  "lon": 127.0276,
  "marker_type": "cctv"
}
```

### 알림 관련 API

#### `GET /api/alert/recent`
최근 알림 5개를 조회합니다.

**응답 예시:**
```json
{
  "alerts": [
    {
      "id": 1,
      "message": "장한로 구간 위험도 급상승 - 즉시 현장 확인 필요",
      "level": "매우 위험",
      "sentAt": "2024-01-20T10:30:00.000Z",
      "isRead": false,
      "recipientType": "admin",
      "predIdx": 1,
      "roadIdx": 101
    }
  ]
}
```

#### `GET /api/alert/location/:alertId`
특정 알림의 위치 정보를 조회합니다.

**응답 예시:**
```json
{
  "alertId": 1,
  "lat": 37.5665,
  "lon": 127.0018,
  "anomalyType": "포트홀",
  "severityLevel": "위험"
}
```

### 기상 관련 API

#### `GET /weather`
현재 날씨 정보를 조회합니다.

### 보고서 생성 API
```
POST /api/report/generate-cctv-report
```
- CCTV 보고서를 PDF 형태로 생성합니다.

## 데이터베이스 스키마

### t_markers (마커 테이블)
- `marker_id`: 마커 고유 번호 (Primary Key)
- `lat`: 위도
- `lon`: 경도
- `marker_type`: 마커 타입 (cctv, construction, flood)
- `control_idx`: 도로 통제 인덱스 (construction, flood 타입일 때)
- `cctv_idx`: CCTV 인덱스 (cctv 타입일 때)

### t_cctv (CCTV 테이블)
- `cctv_idx`: CCTV 고유 번호 (Primary Key)
- `cctv_name`: 카메라 이름
- `lat`: 위도
- `lon`: 경도
- `cctv_status`: 카메라 상태
- `cctv_url`: 스트리밍 URL
- `created_at`: 등록 일자

### t_road_control (도로 통제 테이블)
- `control_idx`: 통제 고유 번호 (Primary Key)
- `pred_idx`: 예측 고유 번호
- `control_desc`: 통제 구역 설명
- `control_st_tm`: 통제 시작 시간
- `control_ed_tm`: 통제 종료 시간
- `control_addr`: 통제 주소
- `control_type`: 통제 타입 (construction, flood)

## 샘플 데이터

테스트를 위해 `sample_data.sql` 파일에 샘플 데이터가 포함되어 있습니다.

```bash
mysql -u username -p database_name < sample_data.sql
```

## 주의사항

1. 데이터베이스 연결은 각 쿼리마다 `conn.connect()`를 호출하는 방식으로 구현되어 있습니다.
2. 에러 처리가 포함되어 있어 데이터베이스 연결 실패 시 적절한 에러 메시지를 반환합니다.
3. CORS가 활성화되어 있어 프론트엔드에서 API를 호출할 수 있습니다.
