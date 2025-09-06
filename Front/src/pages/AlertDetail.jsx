import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';
import AlertMap from '../AlertMap.jsx';

const AlertDetail = () => {
    const nav = useNavigate();
    const [alertData, setAlertData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summaryStats, setSummaryStats] = useState({
        total: 0,
        read: 0,
        unread: 0,
        veryHigh: 0,    // 매우 위험
        high: 0,         // 위험
        warning: 0,      // 경고
        safe: 0          // 안전
    });
    const [showMap, setShowMap] = useState(false);

    // 알림 데이터 조회
    useEffect(() => {
        fetchAlertData();
    }, []);

    const fetchAlertData = async () => {
        try {
            setLoading(true);
            // 새로운 monthly API를 사용하여 현재 월의 알림 데이터 가져오기
//            const response = await fetch('http://175.45.194.114:3001/api/alert/monthly');
            const response = await fetch('/api/alert/monthly');
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 서버에서 받은 월별 알림 데이터:', data);
                console.log('📊 알림 데이터:', data.alerts);
                
                setAlertData(data.alerts || []);
                
                // 통계 계산
                calculateSummaryStats(data.alerts || []);
            } else {
                console.error('알림 데이터 조회 실패:', response.status);
                setError('데이터를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('알림 데이터 조회 오류:', error);
            setError('서버 연결 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 통계 계산 함수
    const calculateSummaryStats = (data) => {
        let read = 0;
        let unread = 0;
        let veryHigh = 0;    // 매우 위험
        let high = 0;         // 위험
        let warning = 0;      // 경고
        let safe = 0;         // 안전

        data.forEach(item => {
            if (item.is_read === 'Y') {
                read++;
            } else {
                unread++;
            }

            switch (item.alert_level) {
                case '매우 위험':
                    veryHigh++;
                    break;
                case '위험':
                    high++;
                    break;
                case '경고':
                    warning++;
                    break;
                case '안전':
                    safe++;
                    break;
                default:
                    safe++; // 기본값은 안전으로 처리
            }
        });

        setSummaryStats({
            total: data.length,
            read,
            unread,
            veryHigh,
            high,
            warning,
            safe
        });
    };

    // 알림 수신자 유형에 따른 아이콘 반환
    const getRecipientIcon = (recipientType) => {
        switch (recipientType) {
            case 'admin': return '👨‍💼';
            case 'citizen': return '👥';
            case 'all': return '🌍';
            default: return '📢';
        }
    };

    // 알림 수신자 유형 텍스트 반환
    const getRecipientText = (recipientType) => {
        switch (recipientType) {
            case 'admin': return '관리자';
            case 'citizen': return '시민';
            case 'all': return '전체';
            default: return '기타';
        }
    };

    // 알림 심각도에 따른 색상 반환
    const getAlertLevelColor = (alertLevel) => {
        switch (alertLevel) {
            case '매우 위험': return '#e74c3c'; // 빨간색 (가장 위험)
            case '위험': return '#f39c12';      // 주황색
            case '경고': return '#f1c40f';      // 노란색
            case '안전': return '#27ae60';      // 초록색
            default: return '#95a5a6';          // 회색
        }
    };

    // 알림 심각도 텍스트 반환
    const getAlertLevelText = (alertLevel) => {
        switch (alertLevel) {
            case '매우 위험': return '매우 위험';
            case '위험': return '위험';
            case '경고': return '경고';
            case '안전': return '안전';
            default: return '기타';
        }
    };

    // 위험 레벨에 따른 배경 색상 반환
    const getRiskLevelBackgroundColor = (alertLevel) => {
        switch (alertLevel) {
            case '매우 위험': return '#ffeaea'; // 연한 빨간색 배경
            case '위험': return '#fff3e0';       // 연한 주황색 배경
            case '경고': return '#fef9e7';       // 연한 노란색 배경
            case '안전': return '#e8f5e8';       // 연한 초록색 배경
            default: return '#f5f5f5';           // 연한 회색 배경
        }
    };

    // 위험 레벨에 따른 테두리 색상 반환
    const getRiskLevelBorderColor = (alertLevel) => {
        switch (alertLevel) {
            case '매우 위험': return '#e74c3c'; // 빨간색 테두리
            case '위험': return '#f39c12';       // 주황색 테두리
            case '경고': return '#f1c40f';       // 노란색 테두리
            case '안전': return '#27ae60';       // 초록색 테두리
            default: return '#95a5a6';           // 회색 테두리
        }
    };

    // 알림 읽음 상태에 따른 아이콘 반환
    const getReadStatusIcon = (isRead) => {
        return isRead === 'Y' ? '✅' : '📬';
    };

    // 알림 읽음 상태 텍스트 반환
    const getReadStatusText = (isRead) => {
        return isRead === 'Y' ? '읽음' : '안읽음';
    };

    // 알림 항목 클릭 시 처리
    const handleAlertItemClick = async (item, index) => {
        console.log('🎯 알림 항목 클릭:', { item, index });
        
        // 지도로 보기 모드로 전환
        setShowMap(true);
        
        // AlertMap에서 직접 lat, lon 데이터 사용 (별도 API 호출 불필요)
        if (item.lat && item.lon) {
            console.log('📍 알림 위치 정보 (직접 데이터):', { lat: item.lat, lon: item.lon });
            
            // 지도 전환 후 약간의 지연을 두고 마커로 이동
            setTimeout(() => {
                if (window.moveToAlertMarker) {
                    console.log('🚀 AlertMap의 moveToAlertMarker 함수 호출');
                    window.moveToAlertMarker(
                        item.lat, 
                        item.lon, 
                        item
                    );
                    console.log('✅ 알림 마커 위치 이동 완료');
                } else {
                    console.log('⚠️ moveToAlertMarker 함수가 아직 준비되지 않음');
                }
            }, 1500);
        } else {
            console.log('⚠️ 해당 알림에 위치 정보가 없음:', item.alert_idx);
        }
    };

    if (loading) {
        return (
            <div className="detail-container">
                <div className="detail-header">
               
                    {/* 🖼️ 로고 이미지 */}
                    <img
                    src="./logo.png" // public 폴더에 있는 이미지
                    alt="로고"
                    style={{
                    width: 'auto',
                    height: '50px',
                    borderRadius: '8px'
                    }}
                    />
                   <h1> 🚨 알림 상세</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                        ← 대시보드로 돌아가기
                    </button>
                </div>
                <div className="loading-container">
                    <div className="loading-spinner">⏳</div>
                    <p>알림 데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    {/* 🖼️ 로고 이미지 */}
                    <img
                    src="./logo.png" // public 폴더에 있는 이미지
                    alt="로고"
                    style={{
                    width: 'auto',
                    height: '50px',
                    borderRadius: '8px'
                    }}
                    />
                   <h1>  🚨 알림 상세</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                        ← 대시보드로 돌아가기
                    </button>
                </div>
                <div className="error-container">
                    <div className="error-icon">❌</div>
                    <p>{error}</p>
                    <button onClick={fetchAlertData} className="retry-btn">다시 시도</button>
                </div>
            </div>
        );
    }

    return (
        <div className="detail-container">
            {/* 헤더 */}
            <div className="detail-header">
                                   {/* 🖼️ 로고 이미지 */}
                    <img
                    src="./logo.png" // public 폴더에 있는 이미지
                    alt="로고"
                    style={{
                    width: 'auto',
                    height: '50px',
                    borderRadius: '8px'
                    }}
                    />
                   <h1> 🚨 알림 상세</h1>
                <button className="back-btn" onClick={() => nav('/dashboard')}>
                    ← 대시보드로 돌아가기
                </button>
            </div>

            {/* 메인 컨텐츠 - 좌우 패널 구조 */}
            <div className="detail-main-content">
                {/* 왼쪽 패널 */}
                <div className="detail-left-panel">
                    {/*요약 통계 카드*/}
                    

                    {/* 위험 레벨별 통계 카드 */}
                     <div className="summary-card">
                         <h2>🚨 위험 레벨별 현황</h2>
                         <div className="complaint-bar-chart">
                             <div className="complaint-bars-container">
                                                                   {/* 매우 위험 */}
                                  <div className="complaint-bar-item">
                                      <div className="complaint-bar-label">
                                          <span className="complaint-status-icon" style={{ color: '#e74c3c' }}>🔴</span>
                                          <span className="complaint-status-text">매우 위험</span>
                                      </div>
                                      <div className="complaint-bar-wrapper">
                                          <div 
                                              className="complaint-bar-fill"
                                              style={{ 
                                                  width: summaryStats.total > 0 ? `${(summaryStats.veryHigh / summaryStats.total) * 100}%` : '0%',
                                                  backgroundColor: '#e74c3c'
                                              }}
                                          >
                                              <span className="complaint-bar-value">{summaryStats.veryHigh}건</span>
                                          </div>
                                          <span className="complaint-bar-percentage">
                                              {summaryStats.total > 0 ? `${((summaryStats.veryHigh / summaryStats.total) * 100).toFixed(1)}%` : '0%'}
                                          </span>
                                      </div>
                                  </div>
                                  
                                  {/* 위험 */}
                                  <div className="complaint-bar-item">
                                      <div className="complaint-bar-label">
                                          <span className="complaint-status-icon" style={{ color: '#f39c12' }}>🟠</span>
                                          <span className="complaint-status-text">위험</span>
                                      </div>
                                      <div className="complaint-bar-wrapper">
                                          <div 
                                              className="complaint-bar-fill"
                                              style={{ 
                                                  width: summaryStats.total > 0 ? `${(summaryStats.high / summaryStats.total) * 100}%` : '0%',
                                                  backgroundColor: '#f39c12'
                                              }}
                                          >
                                              <span className="complaint-bar-value">{summaryStats.high}건</span>
                                          </div>
                                          <span className="complaint-bar-percentage">
                                              {summaryStats.total > 0 ? `${((summaryStats.high / summaryStats.total) * 100).toFixed(1)}%` : '0%'}
                                          </span>
                                      </div>
                                  </div>
                                  
                                  {/* 경고 */}
                                  <div className="complaint-bar-item">
                                      <div className="complaint-bar-label">
                                          <span className="complaint-status-icon" style={{ color: '#f1c40f' }}>🟡</span>
                                          <span className="complaint-status-text">경고</span>
                                      </div>
                                      <div className="complaint-bar-wrapper">
                                          <div 
                                              className="complaint-bar-fill"
                                              style={{ 
                                                  width: summaryStats.total > 0 ? `${(summaryStats.warning / summaryStats.total) * 100}%` : '0%',
                                                  backgroundColor: '#f1c40f'
                                              }}
                                          >
                                              <span className="complaint-bar-value">{summaryStats.warning}건</span>
                                          </div>
                                          <span className="complaint-bar-percentage">
                                              {summaryStats.total > 0 ? `${((summaryStats.warning / summaryStats.total) * 100).toFixed(1)}%` : '0%'}
                                          </span>
                                      </div>
                                  </div>
                                 
                                 {/* 안전 */}
                                 <div className="complaint-bar-item">
                                     <div className="complaint-bar-label">
                                         <span className="complaint-status-icon" style={{ color: '#27ae60' }}>🟢</span>
                                         <span className="complaint-status-text">안전</span>
                                     </div>
                                     <div className="complaint-bar-wrapper">
                                         <div 
                                             className="complaint-bar-fill"
                                             style={{ 
                                                 width: summaryStats.total > 0 ? `${(summaryStats.safe / summaryStats.total) * 100}%` : '0%',
                                                 backgroundColor: '#27ae60'
                                             }}
                                         >
                                             <span className="complaint-bar-value">{summaryStats.safe}건</span>
                                         </div>
                                         <span className="complaint-bar-percentage">
                                             {summaryStats.total > 0 ? `${((summaryStats.safe / summaryStats.total) * 100).toFixed(1)}%` : '0%'}
                                         </span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>

                    {/* 액션 카드들 */}
                    <div className="action-cards">
                        <div className="action-card">
                            <h3>🚨 알림 관리 가이드라인</h3>
                            <ul>
                                <li>높은 심각도 알림 즉시 처리</li>
                                <li>읽지 않은 알림 우선 확인</li>
                                <li>알림 응답 시간 모니터링</li>
                                <li>알림 전송 품질 관리</li>
                            </ul>
                        </div>
                        <div className="action-card">
                            <h3>📈 알림 시스템 개선</h3>
                            <ul>
                                <li>알림 우선순위 체계 정립</li>
                                <li>수신자별 맞춤 알림 설정</li>
                                <li>알림 히스토리 관리 시스템</li>
                                <li>알림 효과성 분석 강화</li>
                            </ul>
                        </div>
                    </div>

                </div>

                {/* 오른쪽 패널 */}
                <div className="detail-right-panel">
                    {/* 알림 리스트 */}
                    <div className="ranking-list">
                        <div className="ranking-header">
                            <h2>🚨 알림 목록 ({alertData.length}개)</h2>
                            <button 
                                className="map-toggle-btn"
                                onClick={() => {
                                    console.log('🗺️ 지도 보기 버튼 클릭:', !showMap);
                                    console.log('📊 현재 알림 데이터:', alertData);
                                    setShowMap(!showMap);
                                }}
                            >
                                {showMap ? '📋 리스트 보기' : '🗺️ 지도로 보기'}
                            </button>
                        </div>
                        {showMap ? (
                            <div className="map-container">
                                
                                <AlertMap 
                                    alertData={alertData}
                                    key="alert-map"
                                />
                                {/* 디버그 정보를 더 자세히 표시 */}
                                <div style={{ padding: '10px', backgroundColor: '#e8f5e8', marginTop: '10px', fontSize: '12px' }}>
                                    <strong>🔍 상세 디버그 정보:</strong><br/>
                                    • alertData 길이: {alertData.length}<br/>
                                    • showMap 상태: {showMap.toString()}<br/>
                                    • 첫 번째 항목 lat: {alertData.length > 0 ? alertData[0].lat : 'N/A'}<br/>
                                    • 첫 번째 항목 lon: {alertData.length > 0 ? alertData[0].lon : 'N/A'}<br/>
                                    • 첫 번째 항목 addr: {alertData.length > 0 ? alertData[0].addr : 'N/A'}
                                </div>
                            </div>
                        ) : (
                            <>
                                {alertData.length > 0 ? (
                                    <div className="ranking-scroll-container">
                                        {alertData.map((item, index) => (
                                                                                         <div 
                                                 key={item.alert_idx} 
                                                 className="ranking-item"
                                                 onClick={() => handleAlertItemClick(item, index)}
                                                 style={{ 
                                                     cursor: 'pointer',
                                                     backgroundColor: getRiskLevelBackgroundColor(item.alert_level),
                                                     border: `2px solid ${getRiskLevelBorderColor(item.alert_level)}`,
                                                     borderRadius: '8px',
                                                     transition: 'all 0.3s ease',
                                                     boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                 }}
                                                 onMouseEnter={(e) => {
                                                     e.currentTarget.style.transform = 'translateY(-2px)';
                                                     e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                                 }}
                                                 onMouseLeave={(e) => {
                                                     e.currentTarget.style.transform = 'translateY(0)';
                                                     e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                 }}
                                             >
                                                <div className="rank-number">#{index + 1}</div>
                                                                                                 <div className="risk-details">
                                                     <span className="risk-level" style={{ 
                                                         backgroundColor: getAlertLevelColor(item.alert_level),
                                                         color: 'white',
                                                         padding: '4px 8px',
                                                         borderRadius: '4px',
                                                         fontSize: '12px',
                                                         fontWeight: 'bold'
                                                     }}>
                                                         {getAlertLevelText(item.alert_level)}
                                                     </span>
                                                     <span className="risk-score" style={{ 
                                                         color: getAlertLevelColor(item.alert_level),
                                                         fontSize: '12px',
                                                         fontWeight: '500'
                                                     }}>
                                                         {new Date(item.sented_at).toLocaleDateString()}
                                                     </span>
                                                 </div>
                                                <div className="risk-info">
                                                    <div className="location-name">
                                                        {getRecipientIcon(item.recepient_type)} {getRecipientText(item.recepient_type)} 대상
                                                    </div>
                                                    <div className="risk-description">
                                                        {item.alert_msg || '알림 메시지가 없습니다.'}
                                                    </div>
                                                    <div className="coordinates-info">
                                                        📍 도로 ID: {item.road_idx} | 예측 ID: {item.pred_idx}
                                                        {item.addr && (
                                                            <> | 🏠 주소: {item.addr}</>
                                                        )}
                                                    </div>
                                                    <div className="alert-details">
                                                        📤 전송: {new Date(item.sented_at).toLocaleString()} | 
                                                        {getReadStatusIcon(item.is_read)} {getReadStatusText(item.is_read)} | 
                                                        👨‍💼 관리자: {item.admin_id}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-data">
                                        <p>현재 알림 데이터가 없습니다.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertDetail;
