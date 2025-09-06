import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';
import NaverMap from '../NaverMap.jsx';

const RiskRankingDetail = () => {
    const nav = useNavigate();
    const [riskData, setRiskData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summaryStats, setSummaryStats] = useState({
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        total: 0
    });
    const [showMap, setShowMap] = useState(false);

    // 위험도 데이터 조회
    useEffect(() => {
        fetchRiskData();
    }, []);

    const fetchRiskData = async () => {
        try {
            setLoading(true);
       //     const response = await fetch('http://175.45.194.114:3001/api/risk/ranking-detail');
            const response = await fetch('/api/risk/ranking-detail');
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 서버에서 받은 위험도 데이터:', data);
                console.log('📊 위험도 랭킹 데이터:', data.riskRankings);
                
                setRiskData(data.riskRankings || []);
                
                // 통계 계산
                calculateSummaryStats(data.riskRankings || []);
            } else {
                console.error('위험도 데이터 조회 실패:', response.status);
                setError('데이터를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('위험도 데이터 조회 오류:', error);
            setError('서버 연결 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 통계 계산 함수
    const calculateSummaryStats = (data) => {
        let highRisk = 0;
        let mediumRisk = 0;
        let lowRisk = 0;

        data.forEach(item => {
            if (item.totalRiskScore >= 8.0) {
                highRisk++;
            } else if (item.totalRiskScore >= 6.0) {
                mediumRisk++;
            } else {
                lowRisk++;
            }
        });

        setSummaryStats({
            highRisk,
            mediumRisk,
            lowRisk,
            total: data.length
        });
    };

    // 위험도 레벨에 따른 상태 아이콘 반환
    const getRiskStatusIcon = (score) => {
        if (score >= 8.0) return '🔴';
        if (score >= 6.0) return '🟠';
        return '🟢';
    };

    // 위험도 레벨 텍스트 반환
    const getRiskLevelText = (score) => {
        if (score >= 8.0) return '고위험';
        if (score >= 6.0) return '주의';
        return '안전';
    };

    // 위험도 점수에 따른 색상 반환
    const getRiskScoreColor = (score) => {
        if (score >= 8.0) return '#e74c3c'; // 빨간색
        if (score >= 6.0) return '#f39c12'; // 주황색
        return '#27ae60'; // 초록색
    };

    // 위험도 항목 클릭 시 처리
    const handleRiskItemClick = (item, index) => {
        console.log('🎯 위험도 항목 클릭:', { item, index });
        
        // 지도로 보기 모드로 전환
        setShowMap(true);
        
        // 지도 전환 후 약간의 지연을 두고 마커로 이동
        setTimeout(() => {
            if (window.moveToRiskMarker) {
                console.log('🚀 moveToRiskMarker 함수 호출');
                window.moveToRiskMarker(
                    item.coordinates.lat, 
                    item.coordinates.lon, 
                    item
                );
                console.log('✅ 위험도 마커 위치 이동 및 상세정보창 표시 완료');
            } else {
                console.log('⚠️ moveToRiskMarker 함수가 아직 준비되지 않음');
            }
        }, 1500); // 지도 로딩을 위한 충분한 시간
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
                   <h1> 🚨 도로 위험도 랭킹 상세</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                         대시보드로 돌아가기
                    </button>
                </div>
                <div className="loading-container">
                    <div className="loading-spinner">⏳</div>
                    <p>위험도 데이터를 불러오는 중...</p>
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
                   <h1> 🚨 도로 위험도 랭킹 상세</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                         대시보드로 돌아가기
                    </button>
                </div>
                <div className="error-container">
                    <div className="error-icon">❌</div>
                    <p>{error}</p>
                    <button onClick={fetchRiskData} className="retry-btn">다시 시도</button>
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
                   <h1>🚨 도로 위험도 랭킹 상세</h1>
                <button className="back-btn" onClick={() => nav('/dashboard')}>
                     대시보드로 돌아가기
                </button>
            </div>

            {/* 메인 컨텐츠 - 좌우 패널 구조 */}
            <div className="detail-main-content">
                {/* 왼쪽 패널 */}
                <div className="detail-left-panel">
                    {/* 요약 통계 카드 */}
                    <div className="summary-card">
                        <h2>📊 전체 현황 요약</h2>
                        <div className="summary-chart-container">
                            {/* 원 그래프 */}
                            <div className="pie-chart">
                                <svg width="200" height="200" viewBox="0 0 200 200">
                                    {summaryStats.total > 0 ? (
                                        <>
                                            {/* 고위험 구간 */}
                                            <circle
                                                cx="100"
                                                cy="100"
                                                r="80"
                                                fill="none"
                                                stroke="#e74c3c"
                                                strokeWidth="40"
                                                strokeDasharray={`${(summaryStats.highRisk / summaryStats.total) * 502.4} 502.4`}
                                                strokeDashoffset="0"
                                                transform="rotate(-90 100 100)"
                                            />
                                            {/* 주의 구간 */}
                                            <circle
                                                cx="100"
                                                cy="100"
                                                r="80"
                                                fill="none"
                                                stroke="#f39c12"
                                                strokeWidth="40"
                                                strokeDasharray={`${(summaryStats.mediumRisk / summaryStats.total) * 502.4} 502.4`}
                                                strokeDashoffset={`-${(summaryStats.highRisk / summaryStats.total) * 502.4}`}
                                                transform="rotate(-90 100 100)"
                                            />
                                            {/* 안전 구간 */}
                                            <circle
                                                cx="100"
                                                cy="100"
                                                r="80"
                                                fill="none"
                                                stroke="#27ae60"
                                                strokeWidth="40"
                                                strokeDasharray={`${(summaryStats.lowRisk / summaryStats.total) * 502.4} 502.4`}
                                                strokeDashoffset={`-${((summaryStats.highRisk + summaryStats.mediumRisk) / summaryStats.total) * 502.4}`}
                                                transform="rotate(-90 100 100)"
                                            />
                                        </>
                                    ) : (
                                        <circle
                                            cx="100"
                                            cy="100"
                                            r="80"
                                            fill="none"
                                            stroke="#e9ecef"
                                            strokeWidth="40"
                                        />
                                    )}
                                </svg>
                                <div className="chart-center">
                                    <div className="total-count">{summaryStats.total}</div>
                                    <div className="total-label">전체 구간</div>
                                </div>
                            </div>
                            
                            {/* 범례 */}
                            <div className="chart-legend">
                                <div className="legend-item">
                                    <div className="legend-color" style={{ backgroundColor: '#e74c3c' }}></div>
                                    <div className="legend-text">
                                        <span className="legend-label">고위험 구간</span>
                                        <span className="legend-count">{summaryStats.highRisk}건</span>
                                        <span className="legend-percentage">
                                            {summaryStats.total > 0 ? `${((summaryStats.highRisk / summaryStats.total) * 100).toFixed(1)}%` : '0%'}
                                        </span>
                                    </div>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color" style={{ backgroundColor: '#f39c12' }}></div>
                                    <div className="legend-text">
                                        <span className="legend-label">주의 구간</span>
                                        <span className="legend-count">{summaryStats.mediumRisk}건</span>
                                        <span className="legend-percentage">
                                            {summaryStats.total > 0 ? `${((summaryStats.mediumRisk / summaryStats.total) * 100).toFixed(1)}%` : '0%'}
                                        </span>
                                    </div>
                                </div>
                                <div className="legend-item">
                                    <div className="legend-color" style={{ backgroundColor: '#27ae60' }}></div>
                                    <div className="legend-text">
                                        <span className="legend-label">안전 구간</span>
                                        <span className="legend-count">{summaryStats.lowRisk}건</span>
                                        <span className="legend-percentage">
                                            {summaryStats.total > 0 ? `${((summaryStats.lowRisk / summaryStats.total) * 100).toFixed(1)}%` : '0%'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 액션 카드들 */}
                    <div className="action-cards">
                        <div className="action-card">
                            <h3>📋 긴급 조치사항</h3>
                            <ul>
                                <li>고위험 구간 즉시 점검 및 보수</li>
                                <li>신호등 및 안전시설 점검</li>
                                <li>교통 경찰 배치 검토</li>
                                <li>위험 구간별 맞춤형 개선안 수립</li>
                            </ul>
                        </div>
                        <div className="action-card">
                            <h3>📈 개선 계획</h3>
                            <ul>
                                <li>보행자 안전시설 강화</li>
                                <li>교통 흐름 최적화</li>
                                <li>정기적인 위험도 모니터링</li>
                                <li>시민 안전 의식 향상 교육</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 오른쪽 패널 */}
                <div className="detail-right-panel">
                    {/* 위험도 랭킹 리스트 */}
                    <div className="ranking-list">
                        <div className="ranking-header">
                            <h2>🏆 위험도 순위 ({riskData.length}개 구간)</h2>
                            <button 
                                className="map-toggle-btn"
                                onClick={() => {
                                    console.log('🗺️ 지도 보기 버튼 클릭:', !showMap);
                                    console.log('📊 현재 위험도 데이터:', riskData);
                                    setShowMap(!showMap);
                                }}
                            >
                                {showMap ? '📋 리스트 보기' : '🗺️ 지도로 보기'}
                            </button>
                        </div>
                        {showMap ? (
                            <div className="map-container">
                                <NaverMap 
                                    riskData={riskData}
                                    showRiskMarkers={true}
                                    filterType="risk"
                                    hideFilterButtons={true}
                                    key="risk-map"
                                />
                            </div>
                        ) : (
                            <>
                                {riskData.length > 0 ? (
                                    <div className="ranking-scroll-container">
                                        {riskData.map((item, index) => (
                                            <div 
                                                key={item.predIdx} 
                                                className={`ranking-item ${item.totalRiskScore >= 8.0 ? 'high-risk' : item.totalRiskScore >= 5.0 ? 'medium-risk' : 'low-risk'}`}
                                                onClick={() => handleRiskItemClick(item, index)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="rank-number">#{index + 1}</div>
                                                <div className="risk-details">
                                                    <span className="risk-level">
                                                        {getRiskStatusIcon(item.totalRiskScore)} {getRiskLevelText(item.totalRiskScore)}
                                                    </span>
                                                    <span className="risk-score" style={{ color: getRiskScoreColor(item.totalRiskScore) }}>
                                                        {item.totalRiskScore.toFixed(1)}
                                                    </span>
                                                </div>
                                                <div className="risk-info">
                                                    <div className="location-name">{item.address || '주소 정보 없음'}</div>
                                                    <div className="risk-description">
                                                        {item.riskDetail || '상세 정보가 없습니다.'}
                                                    </div>
                                                    <div className="coordinates-info">
                                                        📍 좌표: {item.coordinates?.lat?.toFixed(6)}, {item.coordinates?.lon?.toFixed(6)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-data">
                                        <p>현재 월에 해당하는 위험도 데이터가 없습니다.</p>
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

export default RiskRankingDetail;
