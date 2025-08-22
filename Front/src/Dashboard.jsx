import React , {useState, useEffect, useContext} from "react";
import { useNavigate } from "react-router-dom";
import { InfoContext } from "./context/InfoContext";
import "./Dashboard.css";
import NaverMap from "./NaverMap";
import Modals from "./Modals";
import WeatherDisplay from "./WeatherDisplay";

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMarkerType, setSelectedMarkerType] = useState('cctv');
  const [selectedMarkerData, setSelectedMarkerData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const nav = useNavigate();
  
  // ✅ InfoContext에서 lat, lon 값과 updateLocation 함수 가져오기
  const { lat, lon, updateLocation } = useContext(InfoContext);

  // 실시간 알림 데이터 가져오기
  useEffect(() => {
    fetchRecentAlerts();
  }, []);

  const fetchRecentAlerts = async () => {
    try {
      setAlertsLoading(true);
      const response = await fetch('http://localhost:3001/api/alert/recent');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        console.error('알림 데이터 조회 실패:', response.status);
        setAlerts([]);
      }
    } catch (error) {
      console.error('알림 데이터 조회 오류:', error);
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  // 알림 클릭 시 위치 정보 가져오기 및 지도 이동
  const handleAlertClick = async (alertId) => {
    try {
      console.log('🎯 알림 클릭:', alertId);
      const response = await fetch(`http://localhost:3001/api/alert/location/${alertId}`);
      
      if (response.ok) {
        const locationData = await response.json();
        console.log('📍 알림 위치 정보:', locationData);
        
        // InfoContext 업데이트
        updateLocation(locationData.lat, locationData.lon);
        console.log('✅ InfoContext 위치 업데이트 완료:', locationData.lat, locationData.lon);
        
        // 클릭된 알림의 메시지와 레벨 정보 찾기
        const clickedAlert = alerts.find(alert => alert.id === alertId);
        if (!clickedAlert) {
          console.error('클릭된 알림 정보를 찾을 수 없습니다.');
          return;
        }
        
        // 지도 이동을 위한 이벤트 발생 (메시지와 레벨 정보 포함)
        const moveEvent = new CustomEvent('moveToLocation', {
          detail: {
            lat: locationData.lat,
            lon: locationData.lon,
            message: clickedAlert.message,
            level: clickedAlert.level
          }
        });
        
        console.log('🚀 지도 이동 이벤트 발생:', moveEvent.detail);
        window.dispatchEvent(moveEvent);
        
        console.log('✅ 지도 이동 트리거 완료');
      } else {
        console.error('알림 위치 정보 조회 실패:', response.status);
      }
    } catch (error) {
      console.error('알림 위치 정보 조회 오류:', error);
    }
  };

  // 이 함수를 NaverMap 컴포넌트 내부에서 호출할 수 있도록 props로 전달
  const handleMarkerClick = (markerType, markerData) => {
    console.log('🎯 Dashboard handleMarkerClick 호출:', { markerType, markerData });
    setSelectedMarkerType(markerType);
    setSelectedMarkerData(markerData);
    setIsModalOpen(true);
    console.log('✅ 모달 상태 업데이트 완료');
  };

  const getAlertLevelClass = (level) => {
    switch (level) {
      case '매우 위험':
        return 'red';
      case '위험':
        return 'orange';
      case '경고':
        return 'yellow';
      case '안전':
        return 'green';
      default:
        return 'yellow'; // 기본값은 경고로 설정
    }
  };

  const getAlertIcon = (level) => {
    switch (level) {
      case '매우 위험':
        return '🚨';
      case '위험':
        return '⚠️';
      case '경고':
        return '⚠️';
      case '안전':
        return '✅';
      default:
        return '⚠️'; // 기본값은 경고 아이콘
    }
  };

  return (
    <div className="container">
      {/* 헤더 */}
      <header className="header">
        <div>도로 안전 관리 시스템</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>
            📍 현재 위치: {lat ? lat.toFixed(6) : 'N/A'}, {lon ? lon.toFixed(6) : 'N/A'}
          </span>
          <span>🔍</span>
        </div>
      </header>

      {/* 왼쪽 패널 */}
      <aside className="left-panel">
        <div className="card">
          <h3>도로 위험도 랭킹</h3>
          <p>🔴 고위험 구간: 3곳</p>
          <p>🟠 주의 구간: 7곳</p>
          <p>🟢 안전 구간: 12곳</p>
          <button className="detail-btn" onClick={() => nav('/risk-ranking')}>
            상세보기 →
          </button>
        </div>
        <div className="card">
          <h3>민원 신고 접수</h3>
          <p>오늘 접수: 8건</p>
          <p>처리 완료: 5건</p>
          <button className="detail-btn" onClick={() => nav('/complaints')}>
            상세보기 →
          </button>
        </div>
        <div className="card">
          <h3>도로 보수공사</h3>
          <p>진행 중: 4개</p>
          <div className="bar">
            <div className="bar-fill"></div>
          </div>
          <button className="detail-btn" onClick={() => nav('/construction')}>
            상세보기 →
          </button>
        </div>
      </aside>

      {/* 메인 */}
      <main className="main">
        <NaverMap onMarkerClick={handleMarkerClick}/>
        <Modals 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          markerType={selectedMarkerType}
          markerData={selectedMarkerData}
        />
        <div className="card">
          <h3>날씨 정보 및 예측</h3>
          <WeatherDisplay/>
          <div className="weather">
            {/* <div className="weather-item">
              <h4>☀️ 맑음</h4>
              <p>22℃</p>
            </div>
            <div className="weather-item">
              <h4>☁️ 흐림</h4>
              <p>18℃</p>
            </div>
            <div className="weather-item">
              <h4>🌧️ 비</h4>
              <p>15℃</p>
            </div>
            <div className="weather-item">
              <h4>❄️ 눈</h4>
              <p>-2℃</p>
            </div> */}
          </div>
        </div>
      </main>

      {/* 오른쪽 패널 */}
      <aside className="right-panel">
        <div className="card" style={{ textAlign: "center" }}>
          <h3>종합 위험도 점수</h3>
          <div className="score-circle">6.5</div>
          <p>오늘 평균 위험도 (보통 수준)</p>
          <button className="detail-btn" onClick={() => nav('/risk-score')}>
            상세보기 →
          </button>
        </div>

        <div className="card">
          <h3>전년도 동기간 대비</h3>
          <p>민원 건수 비교</p>
          <div className="bar">
            <div className="bar-fill" style={{ width: "65%" }}></div>
          </div>
          <p>위험도 비교</p>
          <div className="bar">
            <div
              className="bar-fill"
              style={{ width: "80%", background: "#2ecc71" }}
            ></div>
          </div>
          <button className="detail-btn" onClick={() => nav('/comparison')}>
            상세보기 →
          </button>
        </div>

        <div className="card">
          <h3>실시간 알림 현황</h3>
          {alertsLoading ? (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '16px', marginBottom: '5px' }}>⏳</div>
              <p style={{ fontSize: '12px', margin: 0 }}>알림 로딩 중...</p>
            </div>
          ) : alerts.length > 0 ? (
            alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`alert ${getAlertLevelClass(alert.level)} ${alert.isRead ? 'read' : 'unread'}`}
                title={`${new Date(alert.sentAt).toLocaleString('ko-KR')} - ${alert.recipientType}`}
                onClick={() => handleAlertClick(alert.id)} // 알림 클릭 시 위치 정보 가져오기
              >
                {getAlertIcon(alert.level)} {alert.message}
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
              <p style={{ fontSize: '12px', margin: 0 }}>새로운 알림이 없습니다</p>
            </div>
          )}
          
          {/* 디버깅용 테스트 버튼 */}
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button 
              onClick={() => {
                console.log('🧪 테스트 지도 이동 이벤트 발생');
                const testEvent = new CustomEvent('moveToLocation', {
                  detail: { 
                    lat: 37.5665, 
                    lon: 127.0018,
                    message: '테스트 알림 - 강남대로 구간 위험도 급상승',
                    level: '매우 위험'
                  }
                });
                window.dispatchEvent(testEvent);
              }}
              style={{
                fontSize: '10px',
                padding: '4px 8px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🧪 테스트 지도 이동
            </button>
          </div>
          
          <button className="detail-btn" onClick={() => nav('/alerts')}>
            상세보기 →
          </button>
        </div>
      </aside>

    </div>
  );
};

export default Dashboard;
