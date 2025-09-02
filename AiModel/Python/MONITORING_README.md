# 🌊 침수 모니터링 시스템 사용법

## 개요

이 시스템은 1시간 단위로 데이터베이스의 CCTV 정보를 가져와서 실시간 날씨를 조회하고, 강수량이 20mm를 넘으면 자동으로 `flood_detected_all.py`를 실행하여 침수 감지 분석을 수행합니다.

## 🚀 설치 및 설정

### 1. 의존성 설치

```bash
pip install -r requirements.txt
```

> **참고**: `schedule` 라이브러리는 더 이상 필요하지 않습니다. `asyncio`를 사용하여 더 안정적인 스케줄링을 구현했습니다.

### 2. OpenWeatherMap API 키 설정

1. [OpenWeatherMap](https://openweathermap.org/api)에서 무료 API 키를 발급받습니다.
2. 환경 변수로 설정하거나 `config.py`에서 직접 설정합니다.

#### 환경 변수로 설정 (권장)
```bash
export WEATHER_API_KEY=your_api_key_here
```

#### config.py에서 직접 설정
```python
WEATHER_CONFIG = {
    'api_key': 'your_api_key_here',
    'base_url': 'http://api.openweathermap.org/data/2.5/weather',
    'timeout': 10
}
```

## 🏃‍♂️ 실행 방법

### Windows에서 실행
```bash
# 일반 모드 (1시간 간격)
start_monitoring_flood.bat

# 테스트 모드 (5분 간격)
start_monitoring_flood_test.bat
```

### Linux/Mac에서 실행
```bash
# 일반 모드 (1시간 간격)
chmod +x start_monitoring_flood.sh
./start_monitoring_flood.sh

# 테스트 모드 (5분 간격)
chmod +x start_monitoring_flood_test.sh
./start_monitoring_flood_test.sh
```

### 직접 실행
```bash
# 일반 모드 (1시간 간격)
python monitoring_flood.py

# 테스트 모드 (5분 간격)
python monitoring_flood.py --test
```

## ⚙️ 설정 옵션

`monitoring_flood.py` 파일에서 다음 설정을 변경할 수 있습니다:

```python
class FloodMonitoring:
    def __init__(self):
        self.monitoring_interval = 3600  # 모니터링 간격 (초)
        self.rain_threshold = 20         # 강수량 임계값 (mm)
```

## 📊 모니터링 과정

1. **CCTV 데이터 조회**: `t_cctv` 테이블에서 모든 CCTV 정보를 가져옵니다.
2. **날씨 데이터 조회**: 각 CCTV의 위도/경도로 OpenWeatherMap API를 호출하여 실시간 날씨를 가져옵니다.
3. **강수량 체크**: 1시간 및 3시간 강수량이 임계값(20mm)을 초과하는지 확인합니다.
4. **침수 감지 실행**: 강수량이 임계값을 초과하면 `flood_detected_all.py`를 자동 실행합니다.
5. **데이터 저장**: 날씨 데이터를 JSON 파일로 저장합니다.

## 🧪 테스트 모드

테스트 모드에서는 5분 간격으로 모니터링을 실행하여 시스템을 빠르게 테스트할 수 있습니다.

```bash
# 테스트 모드 실행
python monitoring_flood.py --test
```

## 📁 출력 파일

- `monitoring_flood.log`: 모니터링 로그 파일
- `weather_data_YYYYMMDD_HHMMSS.json`: 날씨 데이터 저장 파일

## 🔍 로그 확인

실시간 로그를 확인하려면:
```bash
tail -f monitoring_flood.log
```

## 🛑 시스템 중지

`Ctrl+C`를 눌러 모니터링 시스템을 중지할 수 있습니다.

## ⚠️ 주의사항

1. **API 키 보안**: OpenWeatherMap API 키를 안전하게 보관하세요.
2. **서버 부하**: API 호출 간격을 조절하여 서버 부하를 방지합니다.
3. **네트워크 연결**: 안정적인 인터넷 연결이 필요합니다.
4. **데이터베이스 연결**: AiServer가 실행 중이어야 합니다.

## 🐛 문제 해결

### CCTV 데이터 조회 실패
- AiServer가 실행 중인지 확인
- 데이터베이스 연결 상태 확인

### 날씨 API 호출 실패
- API 키가 올바른지 확인
- 네트워크 연결 상태 확인
- API 호출 한도 확인

### flood_detected_all.py 실행 실패
- 파일 경로가 올바른지 확인
- Python 환경 확인
- 의존성 설치 확인
