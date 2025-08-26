import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';
import NaverMap from '../NaverMap.jsx';

const ConstructionDetail = () => {
    const nav = useNavigate();
    const [constructionData, setConstructionData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summaryStats, setSummaryStats] = useState({
        ongoing: 0,
        completed: 0,
        total: 0
    });
    const [showMap, setShowMap] = useState(false);

    // 공사 통제 데이터 조회
    useEffect(() => {
        fetchConstructionData();
    }, []);

    const fetchConstructionData = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3001/api/construction/detail');
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 서버에서 받은 공사 통제 데이터:', data);
                console.log('📊 공사 통제 데이터:', data.constructions);
                
                setConstructionData(data.constructions || []);
                
                // 통계 계산
                calculateSummaryStats(data.constructions || []);
            } else {
                console.error('공사 통제 데이터 조회 실패:', response.status);
                setError('데이터를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('공사 통제 데이터 조회 오류:', error);
            setError('서버 연결 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 통계 계산 함수
    const calculateSummaryStats = (data) => {
        let ongoing = 0;
        let completed = 0;

        data.forEach(item => {
            if (item.control_ed_tm === null) {
                ongoing++; // 통제 종료 시간이 없으면 진행 중
            } else {
                completed++; // 통제 종료 시간이 있으면 완료
            }
        });

        setSummaryStats({
            ongoing,
            completed,
            total: data.length
        });
    };

    // 공사 상태에 따른 상태 아이콘 반환
    const getStatusIcon = (control_ed_tm) => {
        return control_ed_tm === null ? '🚧' : '✅';
    };

    // 공사 상태 텍스트 반환
    const getStatusText = (control_ed_tm) => {
        return control_ed_tm === null ? '진행 중' : '완료';
    };

    // 공사 상태에 따른 색상 반환
    const getStatusColor = (control_ed_tm) => {
        return control_ed_tm === null ? '#f39c12' : '#27ae60'; // 진행 중: 주황색, 완료: 초록색
    };

    // 공사 통제 항목 클릭 시 처리
    const handleConstructionItemClick = (item, index) => {
        console.log('🎯 공사 통제 항목 클릭:', { item, index });
        
        // 지도로 보기 모드로 전환
        setShowMap(true);
        
        // 지도 전환 후 약간의 지연을 두고 마커로 이동
        setTimeout(() => {
            if (window.moveToConstructionMarker) {
                console.log('🚀 moveToConstructionMarker 함수 호출');
                window.moveToConstructionMarker(
                    item.lat, 
                    item.lon, 
                    item
                );
                console.log('✅ 공사 통제 마커 위치 이동 완료');
            } else {
                console.log('⚠️ moveToConstructionMarker 함수가 아직 준비되지 않음');
            }
        }, 1500); // 지도 로딩을 위한 충분한 시간
    };

    if (loading) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <h1>🚧 공사 통제 상세</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                        ← 대시보드로 돌아가기
                    </button>
                </div>
                <div className="loading-container">
                    <div className="loading-spinner">⏳</div>
                    <p>공사 통제 데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <h1>🚧 공사 통제 상세</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                        ← 대시보드로 돌아가기
                    </button>
                </div>
                <div className="error-container">
                    <div className="error-icon">❌</div>
                    <p>{error}</p>
                    <button onClick={fetchConstructionData} className="retry-btn">다시 시도</button>
                </div>
            </div>
        );
    }

    return (
        <div className="detail-container">
            {/* 헤더 */}
            <div className="detail-header">
                <h1>🚧 공사 통제 상세</h1>
                <button className="back-btn" onClick={() => nav('/dashboard')}>
                    ← 대시보드로 돌아가기
                </button>
            </div>

            {/* 메인 컨텐츠 - 좌우 패널 구조 */}
            <div className="detail-main-content">
                {/* 왼쪽 패널 */}
                <div className="detail-left-panel">
                    {/* 요약 통계 카드 */}
                    <div className="summary-card">
                        <h2>📊 전체 현황 요약</h2>
                        <div className="complaint-bar-chart">
                            <div className="complaint-chart-header">
                                <div className="total-label">전체 공사 : {summaryStats.total}건</div>
                            </div>
                            
                            {/* 바 차트 */}
                            <div className="complaint-bars-container">
                                {/* 진행 중 */}
                                <div className="complaint-bar-item">
                                    <div className="complaint-bar-label">
                                        <span className="complaint-status-icon">🚧</span>
                                        <span className="complaint-status-text">진행 중</span>
                                    </div>
                                    <div className="complaint-bar-wrapper">
                                        <div 
                                            className="complaint-bar-fill in-progress"
                                            style={{ 
                                                width: summaryStats.total > 0 ? `${(summaryStats.ongoing / summaryStats.total) * 100}%` : '0%'
                                            }}
                                        >
                                            <span className="complaint-bar-value">{summaryStats.ongoing}건</span>
                                        </div>
                                        <span className="complaint-bar-percentage">
                                            {summaryStats.total > 0 ? `${((summaryStats.ongoing / summaryStats.total) * 100).toFixed(1)}%` : '0%'}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* 완료 */}
                                <div className="complaint-bar-item">
                                    <div className="complaint-bar-label">
                                        <span className="complaint-status-icon">✅</span>
                                        <span className="complaint-status-text">완료</span>
                                    </div>
                                    <div className="complaint-bar-wrapper">
                                        <div 
                                            className="complaint-bar-fill completed"
                                            style={{ 
                                                width: summaryStats.total > 0 ? `${(summaryStats.completed / summaryStats.total) * 100}%` : '0%'
                                            }}
                                        >
                                            <span className="complaint-bar-value">{summaryStats.completed}건</span>
                                        </div>
                                        <span className="complaint-bar-percentage">
                                            {summaryStats.total > 0 ? `${((summaryStats.completed / summaryStats.total) * 100).toFixed(1)}%` : '0%'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 액션 카드들 */}
                    <div className="action-cards">
                        <div className="action-card">
                            <h3>🚧 공사 관리 가이드라인</h3>
                            <ul>
                                <li>공사 구역 안전 시설 점검</li>
                                <li>교통 통제 구역 확실한 표시</li>
                                <li>공사 진행 상황 실시간 모니터링</li>
                                <li>주변 교통 영향 최소화 방안</li>
                            </ul>
                        </div>
                        <div className="action-card">
                            <h3>📈 공사 효율성 개선</h3>
                            <ul>
                                <li>공사 일정 최적화 관리</li>
                                <li>자재 및 장비 효율적 배치</li>
                                <li>작업자 안전 교육 강화</li>
                                <li>공사 품질 관리 시스템 구축</li>
                            </ul>
                        </div>
                    </div>

                </div>

                {/* 오른쪽 패널 */}
                <div className="detail-right-panel">
                    {/* 공사 통제 리스트 */}
                    <div className="ranking-list">
                        <div className="ranking-header">
                            <h2>🚧 공사 통제 목록 ({constructionData.length}개)</h2>
                            <button 
                                className="map-toggle-btn"
                                onClick={() => {
                                    console.log('🗺️ 지도 보기 버튼 클릭:', !showMap);
                                    console.log('📊 현재 공사 통제 데이터:', constructionData);
                                    setShowMap(!showMap);
                                }}
                            >
                                {showMap ? '📋 리스트 보기' : '🗺️ 지도로 보기'}
                            </button>
                        </div>
                        {showMap ? (
                            <div className="map-container">
                                <NaverMap 
                                    filterType="construction"
                                    hideFilterButtons={true}
                                    key="construction-map"
                                />
                            </div>
                        ) : (
                            <>
                                {constructionData.length > 0 ? (
                                    <div className="ranking-scroll-container">
                                        {constructionData.map((item, index) => (
                                            <div 
                                                key={item.control_idx} 
                                                className="ranking-item"
                                                onClick={() => handleConstructionItemClick(item, index)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="rank-number">#{index + 1}</div>
                                                <div className="risk-details">
                                                    <span className="risk-level">
                                                        {getStatusIcon(item.control_ed_tm)} {getStatusText(item.control_ed_tm)}
                                                    </span>
                                                    <span className="risk-score" style={{ color: getStatusColor(item.control_ed_tm) }}>
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="risk-info">
                                                    <div className="location-name">{item.control_addr || '주소 정보 없음'}</div>
                                                    <div className="risk-description">
                                                        {item.control_desc || '상세 정보가 없습니다.'}
                                                    </div>
                                                    <div className="coordinates-info">
                                                        📍 좌표: {item.lat?.toFixed(6)}, {item.lon?.toFixed(6)}
                                                    </div>
                                                    <div className="construction-details">
                                                        🕐 시작: {new Date(item.control_st_tm).toLocaleString()}
                                                        {item.control_ed_tm && (
                                                            <> | 🏁 종료: {new Date(item.control_ed_tm).toLocaleString()}</>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-data">
                                        <p>현재 공사 통제 데이터가 없습니다.</p>
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

export default ConstructionDetail;
