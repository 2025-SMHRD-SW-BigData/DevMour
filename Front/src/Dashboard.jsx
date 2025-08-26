import React , {useState, useEffect, useContext} from "react";
import { useNavigate } from "react-router-dom";
import { InfoContext } from "./context/InfoContext.jsx";
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
  const [riskRankings, setRiskRankings] = useState([]);
  const [riskRankingsLoading, setRiskRankingsLoading] = useState(true);
  const [averageRiskScore, setAverageRiskScore] = useState(0);
  const [averageRiskLoading, setAverageRiskLoading] = useState(true);
  const [citizenReportStats, setCitizenReportStats] = useState({ completedCount: 0, pendingCount: 0, totalCount: 0 });
  const [citizenReportLoading, setCitizenReportLoading] = useState(true);
  const [roadConstructionStats, setRoadConstructionStats] = useState({ completedCount: 0, inProgressCount: 0, totalCount: 0 });
  const [roadConstructionLoading, setRoadConstructionLoading] = useState(true);
  const [yearOverYearData, setYearOverYearData] = useState(null);
  const [yearOverYearLoading, setYearOverYearLoading] = useState(true);
  const nav = useNavigate();
  
  // ✅ InfoContext에서 lat, lon 값과 updateLocation 함수 가져오기
  const { lat, lon, updateLocation } = useContext(InfoContext);

  // 실시간 알림 데이터 가져오기
  useEffect(() => {
    fetchRecentAlerts();
    fetchRiskRankings();
    fetchRiskDetailData();
    fetchAverageRiskScore();
    fetchCitizenReportStats();
    fetchRoadConstructionStats();
    fetchYearOverYearData();
  }, []);

  // 실시간 알림 데이터 가져오기
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

  // 위험도 랭킹 데이터 가져오기
  const fetchRiskRankings = async () => {
    try {
      setRiskRankingsLoading(true);
      const response = await fetch('http://localhost:3001/api/risk/ranking');
      if (response.ok) {
        const data = await response.json();
        setRiskRankings(data.riskRankings || []);
      } else {
        console.error('위험도 랭킹 데이터 조회 실패:', response.status);
        setRiskRankings([]);
      }
    } catch (error) {
      console.error('위험도 랭킹 데이터 조회 오류:', error);
      setRiskRankings([]);
    } finally {
      setRiskRankingsLoading(false);
    }
  };

  // 위험도 상세 데이터 가져오기 (지도용)
  const [riskDetailData, setRiskDetailData] = useState([]);
  const [riskDetailLoading, setRiskDetailLoading] = useState(true);

  const fetchRiskDetailData = async () => {
    try {
      setRiskDetailLoading(true);
      const response = await fetch('http://localhost:3001/api/risk/ranking-detail');
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Dashboard에서 받은 위험도 상세 데이터:', data);
        setRiskDetailData(data.riskRankings || []);
      } else {
        console.error('위험도 상세 데이터 조회 실패:', response.status);
        setRiskDetailData([]);
      }
    } catch (error) {
      console.error('위험도 상세 데이터 조회 오류:', error);
      setRiskDetailData([]);
    } finally {
      setRiskDetailLoading(false);
    }
  };



  // 전체 위험도 점수 평균 조회
  const fetchAverageRiskScore = async () => {
    try {
      setAverageRiskLoading(true);
      const response = await fetch('http://localhost:3001/api/risk/average');
      if (response.ok) {
        const data = await response.json();
        setAverageRiskScore(data.averageScore || 0);
      } else {
        console.error('평균 위험도 점수 조회 실패:', response.status);
        setAverageRiskScore(0);
      }
    } catch (error) {
      console.error('평균 위험도 점수 조회 오류:', error);
      setAverageRiskScore(0);
    } finally {
      setAverageRiskLoading(false);
    }
  };

  // 민원 신고 통계 조회
  const fetchCitizenReportStats = async () => {
    try {
      setCitizenReportLoading(true);
      const response = await fetch('http://localhost:3001/api/risk/citizen-report/stats');
      if (response.ok) {
        const data = await response.json();
        setCitizenReportStats({
          completedCount: data.completedCount || 0,
          pendingCount: data.pendingCount || 0,
          totalCount: data.totalCount || 0
        });
      } else {
        console.error('민원 신고 통계 조회 실패:', response.status);
        setCitizenReportStats({ completedCount: 0, pendingCount: 0, totalCount: 0 });
      }
    } catch (error) {
      console.error('민원 신고 통계 조회 오류:', error);
      setCitizenReportStats({ completedCount: 0, pendingCount: 0, totalCount: 0 });
    } finally {
      setCitizenReportLoading(false);
    }
  };

  // 도로 보수공사 통계 조회
  const fetchRoadConstructionStats = async () => {
    try {
      setRoadConstructionLoading(true);
      const response = await fetch('http://localhost:3001/api/risk/road-construction/stats');
      if (response.ok) {
        const data = await response.json();
        setRoadConstructionStats({
          completedCount: data.completedCount || 0,
          inProgressCount: data.inProgressCount || 0,
          totalCount: data.totalCount || 0
        });
      } else {
        console.error('도로 보수공사 통계 조회 실패:', response.status);
        setRoadConstructionStats({ completedCount: 0, inProgressCount: 0, totalCount: 0 });
      }
    } catch (error) {
      console.error('도로 보수공사 통계 조회 오류:', error);
      setRoadConstructionStats({ completedCount: 0, inProgressCount: 0, totalCount: 0 });
    } finally {
      setRoadConstructionLoading(false);
    }
  };

  // 차이에 따른 바 색상 결정 함수 (큰 값은 차이에 따른 색상, 작은 값은 회색)
  const getBarColor = (change, currentValue, lastYearValue) => {
    const absChange = Math.abs(change);
    let color;
    
    if (absChange <= 10) {
      color = '#f39c12'; // 노란색 (차이 적음)
    } else if (absChange <= 25) {
      color = '#e67e22'; // 주황색 (차이 보통)
    } else {
      color = '#e74c3c'; // 빨간색 (차이 큼)
    }
    
    // 작은 값은 회색, 큰 값은 차이에 따른 색상
    return currentValue >= lastYearValue ? color : '#95a5a6';
  };

  // 변화율에 따른 텍스트 색상 결정 함수
  const getChangeColor = (change) => {
    const absChange = Math.abs(change);
    if (absChange <= 10) {
      return '#f39c12'; // 노란색
    } else if (absChange <= 25) {
      return '#e67e22'; // 주황색
    } else {
      return '#e74c3c'; // 빨간색
    }
  };

  // 전년도 동기간 대비 데이터 조회
  const fetchYearOverYearData = async () => {
    try {
      setYearOverYearLoading(true);
      const response = await fetch('http://localhost:3001/api/comparison/year-over-year');
      if (response.ok) {
        const data = await response.json();
        setYearOverYearData(data);
      } else {
        console.error('전년도 동기간 대비 데이터 조회 실패:', response.status);
        setYearOverYearData(null);
      }
    } catch (error) {
      console.error('전년도 동기간 대비 데이터 조회 오류:', error);
      setYearOverYearData(null);
    } finally {
      setYearOverYearLoading(false);
    }
  };

  // 위험도 랭킹 카드 클릭 시 위치 이동
  const handleRiskRankingClick = (riskItem) => {
    try {
      console.log('🎯 위험도 랭킹 클릭:', riskItem);
      
      // InfoContext 업데이트
      updateLocation(riskItem.coordinates.lat, riskItem.coordinates.lon);
      console.log('✅ InfoContext 위치 업데이트 완료:', riskItem.coordinates.lat, riskItem.coordinates.lon);
      
      // 맵에 이미 표시된 위험도 마커의 위치로 이동하고 상세정보창 띄우기
      if (window.moveToRiskMarker) {
        console.log('🚀 moveToRiskMarker 함수 호출');
        window.moveToRiskMarker(
          riskItem.coordinates.lat, 
          riskItem.coordinates.lon, 
          riskItem
        );
        console.log('✅ 위험도 마커 위치 이동 및 상세정보창 표시 완료');
      } else {
        console.log('⚠️ moveToRiskMarker 함수가 아직 준비되지 않음, 기존 방식으로 대체');
        // 기존 방식으로 대체 (지도 이동만)
        const moveEvent = new CustomEvent('moveToRiskLocation', {
          detail: {
            lat: riskItem.coordinates.lat,
            lon: riskItem.coordinates.lon,
            message: `위험도 ${riskItem.totalRiskScore.toFixed(1)} - ${riskItem.address}`,
            level: getRiskLevel(riskItem.totalRiskScore),
            riskDetail: riskItem.riskDetail,
            totalRiskScore: riskItem.totalRiskScore
          }
        });
        
        console.log('🚀 위험도 위치 이동 이벤트 발생:', moveEvent.detail);
        window.dispatchEvent(moveEvent);
        
        console.log('✅ 위험도 위치 이동 트리거 완료');
      }
    } catch (error) {
      console.error('위험도 위치 이동 오류:', error);
    }
  };

  // 위험도 점수에 따른 레벨 반환
  const getRiskLevel = (score) => {
    if (score >= 8.0) return '매우 위험';
    if (score >= 7.0) return '위험';
    if (score >= 6.0) return '경고';
    return '안전';
  };

  // 위험도 점수에 따른 색상 반환 (20.0 기준)
  const getRiskScoreColor = (score) => {
    if (score >= 15.0) return '#ff0000'; // 빨간색
    if (score >= 11.0) return '#ff8800'; // 주황색
    if (score >= 8.0) return '#ffcc00';  // 노란색
    if (score >= 5.0) return '#00cc00';  // 초록색
    return '#008800'; // 진한 초록색
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
        <div className="header-title">도로 안전 관리 시스템</div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
            <h3>&nbsp;도로 위험도 랭킹</h3>
            <button className="detail-btn" onClick={() => nav('/risk-ranking')}>
              상세보기
            </button>
          </div>
          {riskRankingsLoading ? (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>⏳</div>
              <p style={{ fontSize: '12px', margin: 0 }}>위험도 랭킹 로딩 중...</p>
            </div>
          ) : riskRankings.length > 0 ? (
            <div className="risk-rankings">
              {riskRankings.map((item) => (
                <div 
                  key={item.predIdx} 
                  className="risk-ranking-item"
                  onClick={() => handleRiskRankingClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="ranking-content">
                    <div className="ranking-info">
                      <div className="ranking-address">{item.address}</div>
                      <div className="ranking-detail">{item.riskDetail}</div>
                    </div>
                    <div className="risk-score-circle">
                      {item.totalRiskScore.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
              <p style={{ fontSize: '12px', margin: 0 }}>위험도 데이터가 없습니다</p>
            </div>
          )}
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
            <h3>&nbsp;민원 신고 접수</h3>
            <button className="detail-btn" onClick={() => nav('/complaints')}>
              상세보기
            </button>
          </div>
          {citizenReportLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
              <p style={{ fontSize: '14px', margin: 0 }}>민원 통계 로딩 중...</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: '#27ae60',
                    marginBottom: '5px'
                  }}>
                    {citizenReportStats.completedCount}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    처리 완료
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: '#e74c3c',
                    marginBottom: '5px'
                  }}>
                    {citizenReportStats.pendingCount}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    미처리
                  </div>
                </div>
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666', 
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                총 접수: {citizenReportStats.totalCount}건
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
            <h3>&nbsp;도로 보수공사</h3>
            <button className="detail-btn" onClick={() => nav('/construction')}>
              상세보기
            </button>
          </div>
          {roadConstructionLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
              <p style={{ fontSize: '14px', margin: 0 }}>도로 보수공사 통계 로딩 중...</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: '#27ae60',
                    marginBottom: '5px'
                  }}>
                    {roadConstructionStats.completedCount}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    완료
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '32px', 
                    fontWeight: 'bold', 
                    color: '#e74c3c',
                    marginBottom: '5px'
                  }}>
                    {roadConstructionStats.inProgressCount}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    진행 중
                  </div>
                </div>
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666', 
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                총 공사: {roadConstructionStats.totalCount}건
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 메인 */}
      <main className="main">
        <div className="map-container">
          <NaverMap 
            onMarkerClick={handleMarkerClick}
            riskData={riskDetailData}
            showRiskMarkers={true}
          />
        </div>
        
        <Modals 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          markerType={selectedMarkerType}
          markerData={selectedMarkerData}
        />
        
        <div className="weather-card">
          <h3>🌤️ 날씨 정보 및 예측</h3>
          <WeatherDisplay/>
        </div>
      </main>

      {/* 오른쪽 패널 */}
      <aside className="right-panel">
        <div className="card" style={{ textAlign: "center" }}>
          
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
         <h3>&nbsp;종합 위험도 점수</h3>
            <button className="detail-btn" onClick={() => nav('/risk-score')}>
              상세보기
            </button>
          </div>
          {averageRiskLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
              <p style={{ fontSize: '14px', margin: 0 }}>위험도 점수 로딩 중...</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '5px' }}>
              <div 
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: getRiskScoreColor(averageRiskScore),
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  margin: '0 auto 15px auto',
                  border: '4px solid white',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}
              >
                {averageRiskScore.toFixed(1)}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '1px' }}>
                전체 평균 위험도
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
            <h3>&nbsp;전년도 동기간 대비</h3>
            <button className="detail-btn" onClick={() => nav('/comparison')}>
              상세보기
            </button>
          </div>
          {yearOverYearLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
              <p style={{ fontSize: '12px', margin: 0 }}>데이터 로딩 중...</p>
            </div>
          ) : yearOverYearData ? (
            <div>
              {/* 도로 위험도 예측과 민원 신고를 한 줄에 배치 */}
              <div className="comparison-row">
                {/* 도로 위험도 예측 비교 */}
                <div className="comparison-item-compact">
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '35px', textAlign: 'center' }}>
                    도로 위험도 예측
                  </div>                  
                  {/* 수직 바 차트 */}
                  <div className="bar-chart-container-compact">
                    <div className="bar-chart-compact">
                      <div className="bar-group-compact">
                        <div className="bar-wrapper-compact">
                          <div 
                            className="bar-compact last-year-compact" 
                            style={{ 
                              height: `${Math.max(15, (yearOverYearData.riskPrediction.lastYear.count / Math.max(yearOverYearData.riskPrediction.current.count, yearOverYearData.riskPrediction.lastYear.count, 1)) * 100)}%`,
                              backgroundColor: getBarColor(yearOverYearData.riskPrediction.countChange, yearOverYearData.riskPrediction.lastYear.count, yearOverYearData.riskPrediction.current.count)
                            }}
                          ></div>
                        </div>
                        <div className="bar-value-compact">{yearOverYearData.riskPrediction.lastYear.count}건</div>
                        <div className="bar-score-compact">{yearOverYearData.riskPrediction.lastYear.avgScore}점</div>
                        <div className="bar-label-compact">작년</div>
                      </div>
                      
                      <div className="bar-group-compact">
                        <div className="bar-wrapper-compact">
                          <div 
                            className="bar-compact current-year-compact" 
                            style={{ 
                              height: `${Math.max(15, (yearOverYearData.riskPrediction.current.count / Math.max(yearOverYearData.riskPrediction.current.count, yearOverYearData.riskPrediction.lastYear.count, 1)) * 100)}%`,
                              backgroundColor: getBarColor(yearOverYearData.riskPrediction.countChange, yearOverYearData.riskPrediction.current.count, yearOverYearData.riskPrediction.lastYear.count)
                            }}
                          ></div>
                        </div>
                        <div className="bar-value-compact">{yearOverYearData.riskPrediction.current.count}건</div>
                        <div className="bar-score-compact">{yearOverYearData.riskPrediction.current.avgScore}점</div>
                        <div className="bar-label-compact">올해</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    textAlign: 'center', 
                    fontSize: '10px', 
                    fontWeight: 'bold',
                    color: getChangeColor(yearOverYearData.riskPrediction.countChange),
                    marginTop: '6px',
                    padding: '4px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '3px'
                  }}>
                    {yearOverYearData.riskPrediction.countChange >= 0 ? '+' : ''}{yearOverYearData.riskPrediction.countChange}%
                  </div>
                </div>

                {/* 민원 신고 비교 */}
                <div className="comparison-item-compact">
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '35px', textAlign: 'center' }}>
                    민원 신고 접수
                  </div>
                  
                  {/* 수직 바 차트 */}
                  <div className="bar-chart-container-compact">
                    <div className="bar-chart-compact">
                      <div className="bar-group-compact">
                        <div className="bar-wrapper-compact">
                          <div 
                            className="bar-compact last-year-compact" 
                            style={{ 
                              height: `${Math.max(15, (yearOverYearData.citizenReport.lastYear.count / Math.max(yearOverYearData.citizenReport.current.count, yearOverYearData.citizenReport.lastYear.count, 1)) * 100)}%`,
                              backgroundColor: getBarColor(yearOverYearData.citizenReport.countChange, yearOverYearData.citizenReport.lastYear.count, yearOverYearData.citizenReport.current.count)
                            }}
                          ></div>
                        </div>
                        <div className="bar-value-compact">{yearOverYearData.citizenReport.lastYear.count}건</div>
                        <div className="bar-label-compact">작년</div>
                      </div>
                      
                      <div className="bar-group-compact">
                        <div className="bar-wrapper-compact">
                          <div 
                            className="bar-compact current-year-compact" 
                            style={{ 
                              height: `${Math.max(15, (yearOverYearData.citizenReport.current.count / Math.max(yearOverYearData.citizenReport.current.count, yearOverYearData.citizenReport.lastYear.count, 1)) * 100)}%`,
                              backgroundColor: getBarColor(yearOverYearData.citizenReport.countChange, yearOverYearData.citizenReport.current.count, yearOverYearData.citizenReport.lastYear.count)
                            }}
                          ></div>
                        </div>
                        <div className="bar-value-compact">{yearOverYearData.citizenReport.current.count}건</div>
                        <div className="bar-label-compact">올해</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    textAlign: 'center', 
                    fontSize: '10px', 
                    fontWeight: 'bold',
                    color: getChangeColor(yearOverYearData.citizenReport.countChange),
                    marginTop: '10px',
                    padding: '4px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '3px'
                  }}>
                    {yearOverYearData.citizenReport.countChange >= 0 ? '+' : ''}{yearOverYearData.citizenReport.countChange}%
                  </div>
                </div>
              </div>

              {/* 기간 정보 */}
              <div style={{ 
                fontSize: '10px', 
                color: '#95a5a6', 
                textAlign: 'center', 
                padding: '1px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                marginTop: '5px'
              }}>
                {yearOverYearData.period.lastYear} vs {yearOverYearData.period.current} 
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              <p style={{ fontSize: '12px', margin: 0 }}>데이터를 불러올 수 없습니다</p>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
            <h3>&nbsp;실시간 알림 현황</h3>
            <button className="detail-btn" onClick={() => nav('/alerts')}>
              상세보기
            </button>
          </div>
          {alertsLoading ? (
            <div style={{ textAlign: 'center', padding: '1px' }}>
              <div style={{ fontSize: '16px', marginBottom: '1px' }}>⏳</div>
              <p style={{ fontSize: '12px', margin: 0 }}>알림 로딩 중...</p>
            </div>
          ) : alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`alert ${getAlertLevelClass(alert.level)} ${alert.isRead ? 'read' : 'unread'}`}
                title={`${new Date(alert.sentAt).toLocaleString('ko-KR')} - ${alert.recipientType}`}
                onClick={() => handleAlertClick(alert.id)}
              >
                {getAlertIcon(alert.level)} {alert.message}
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '1px', color: '#666' }}>
              <p style={{ fontSize: '12px', margin: 0 }}>새로운 알림이 없습니다</p>
            </div>
          )}
          
        </div>

        {/* CCTV 추가 카드 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>&nbsp;📹 CCTV 관리</h3>
            <button className="detail-btn" onClick={() => nav('/cctv-add')}>
              CCTV 추가
            </button>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📹</div>
            <p style={{ fontSize: '12px', margin: '0 0 15px 0' }}>새로운 CCTV를 추가하여</p>
            <p style={{ fontSize: '12px', margin: '0 0 15px 0' }}>실시간 모니터링을 확장하세요</p>
            <button 
              className="detail-btn" 
              onClick={() => nav('/cctv-add')}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              📹 CCTV 추가하기
            </button>
          </div>
        </div>
      </aside>

    </div>
  );
};

export default Dashboard;
