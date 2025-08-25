import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';
import NaverMap from '../NaverMap.jsx';

const ComplaintDetail = () => {
    const nav = useNavigate();
    const [complaintData, setComplaintData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summaryStats, setSummaryStats] = useState({
        completed: 0,
        inProgress: 0,
        received: 0,
        total: 0
    });
    const [showMap, setShowMap] = useState(false);

    // 시민 제보 데이터 조회
    useEffect(() => {
        fetchComplaintData();
    }, []);

    const fetchComplaintData = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3001/api/complaint/detail');
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 서버에서 받은 시민 제보 데이터:', data);
                console.log('📊 시민 제보 데이터:', data.complaints);
                
                setComplaintData(data.complaints || []);
                
                // 통계 계산
                calculateSummaryStats(data.complaints || []);
            } else {
                console.error('시민 제보 데이터 조회 실패:', response.status);
                setError('데이터를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('시민 제보 데이터 조회 오류:', error);
            setError('서버 연결 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 통계 계산 함수
    const calculateSummaryStats = (data) => {
        let completed = 0;
        let inProgress = 0;
        let received = 0;

        data.forEach(item => {
            switch (item.c_report_status) {
                case 'C': // 처리 완료
                    completed++;
                    break;
                case 'P': // 처리 중
                    inProgress++;
                    break;
                case 'R': // 접수 완료
                    received++;
                    break;
                default:
                    received++;
            }
        });

        setSummaryStats({
            completed,
            inProgress,
            received,
            total: data.length
        });
    };

    // 처리 상태에 따른 상태 아이콘 반환
    const getStatusIcon = (status) => {
        switch (status) {
            case 'C': return '✅';
            case 'P': return '🔄';
            case 'R': return '📝';
            default: return '📋';
        }
    };

    // 처리 상태 텍스트 반환
    const getStatusText = (status) => {
        switch (status) {
            case 'C': return '처리 완료';
            case 'P': return '처리 중';
            case 'R': return '접수 완료';
            default: return '접수 완료';
        }
    };

    // 처리 상태에 따른 색상 반환
    const getStatusColor = (status) => {
        switch (status) {
            case 'C': return '#27ae60'; // 초록색
            case 'P': return '#f39c12'; // 주황색
            case 'R': return '#3498db'; // 파란색
            default: return '#95a5a6'; // 회색
        }
    };

    // 시민 제보 항목 클릭 시 처리
    const handleComplaintItemClick = (item, index) => {
        console.log('🎯 시민 제보 항목 클릭:', { item, index });
        
        // 지도로 보기 모드로 전환
        setShowMap(true);
        
        // 지도 전환 후 약간의 지연을 두고 마커로 이동
        setTimeout(() => {
            if (window.moveToComplaintMarker) {
                console.log('🚀 moveToComplaintMarker 함수 호출');
                window.moveToComplaintMarker(
                    item.lat, 
                    item.lon, 
                    item
                );
                console.log('✅ 시민 제보 마커 위치 이동 및 상세정보창 표시 완료');
            } else {
                console.log('⚠️ moveToComplaintMarker 함수가 아직 준비되지 않음');
            }
        }, 1500); // 지도 로딩을 위한 충분한 시간
    };

    if (loading) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <h1>📋 시민 제보 상세</h1>
                    <button className="back-btn" onClick={() => nav('/')}>
                        ← 대시보드로 돌아가기
                    </button>
                </div>
                <div className="loading-container">
                    <div className="loading-spinner">⏳</div>
                    <p>시민 제보 데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <h1>📋 시민 제보 상세</h1>
                    <button className="back-btn" onClick={() => nav('/')}>
                        ← 대시보드로 돌아가기
                    </button>
                </div>
                <div className="error-container">
                    <div className="error-icon">❌</div>
                    <p>{error}</p>
                    <button onClick={fetchComplaintData} className="retry-btn">다시 시도</button>
                </div>
            </div>
        );
    }

    return (
        <div className="detail-container">
            {/* 헤더 */}
            <div className="detail-header">
                <h1>📋 시민 제보 상세</h1>
                <button className="back-btn" onClick={() => nav('/')}>
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
                                <div className="total-label">전체 제보 : {summaryStats.total}건</div>
                            </div>
                            
                            {/* 바 차트 */}
                            <div className="complaint-bars-container">
                                {/* 처리 완료 */}
                                <div className="complaint-bar-item">
                                    <div className="complaint-bar-label">
                                        <span className="complaint-status-icon">✅</span>
                                        <span className="complaint-status-text">처리 완료</span>
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
                                
                                {/* 처리 중 */}
                                <div className="complaint-bar-item">
                                    <div className="complaint-bar-label">
                                        <span className="complaint-status-icon">🔄</span>
                                        <span className="complaint-status-text">처리 중</span>
                                    </div>
                                    <div className="complaint-bar-wrapper">
                                        <div 
                                            className="complaint-bar-fill in-progress"
                                            style={{ 
                                                width: summaryStats.total > 0 ? `${(summaryStats.inProgress / summaryStats.total) * 100}%` : '0%'
                                            }}
                                        >
                                            <span className="complaint-bar-value">{summaryStats.inProgress}건</span>
                                        </div>
                                        <span className="complaint-bar-percentage">
                                            {summaryStats.total > 0 ? `${((summaryStats.inProgress / summaryStats.total) * 100).toFixed(1)}%` : '0%'}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* 접수 완료 */}
                                <div className="complaint-bar-item">
                                    <div className="complaint-bar-label">
                                        <span className="complaint-status-icon">📝</span>
                                        <span className="complaint-status-text">접수 완료</span>
                                    </div>
                                    <div className="complaint-bar-wrapper">
                                        <div 
                                            className="complaint-bar-fill received"
                                            style={{ 
                                                width: summaryStats.total > 0 ? `${(summaryStats.received / summaryStats.total) * 100}%` : '0%'
                                            }}
                                        >
                                            <span className="complaint-bar-value">{summaryStats.received}건</span>
                                        </div>
                                        <span className="complaint-bar-percentage">
                                            {summaryStats.total > 0 ? `${((summaryStats.received / summaryStats.total) * 100).toFixed(1)}%` : '0%'}
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
                                <li>높은 우선순위 민원 즉시 처리</li>
                                <li>처리 지연 민원 우선 배정</li>
                                <li>담당팀별 처리 현황 점검</li>
                                <li>민원인 만족도 향상 방안 수립</li>
                            </ul>
                        </div>
                        <div className="action-card">
                            <h3>📈 개선 계획</h3>
                            <ul>
                                <li>민원 접수 시스템 자동화</li>
                                <li>실시간 처리 현황 모니터링</li>
                                <li>담당팀별 전문성 향상 교육</li>
                                <li>민원 처리 품질 관리 강화</li>
                            </ul>
                        </div>
                    </div>

                </div>

                {/* 오른쪽 패널 */}
                <div className="detail-right-panel">
                    {/* 시민 제보 리스트 */}
                    <div className="ranking-list">
                        <div className="ranking-header">
                            <h2>📝 시민 제보 목록 ({complaintData.length}개)</h2>
                            <button 
                                className="map-toggle-btn"
                                onClick={() => {
                                    console.log('🗺️ 지도 보기 버튼 클릭:', !showMap);
                                    console.log('📊 현재 시민 제보 데이터:', complaintData);
                                    setShowMap(!showMap);
                                }}
                            >
                                {showMap ? '📋 리스트 보기' : '🗺️ 지도로 보기'}
                            </button>
                        </div>
                        {showMap ? (
                            <div className="map-container">
                                <NaverMap 
                                    complaintData={complaintData}
                                    showComplaintMarkers={true}
                                    filterType="complaint"
                                    hideFilterButtons={true}
                                    key="complaint-map"
                                />
                            </div>
                        ) : (
                            <>
                                {complaintData.length > 0 ? (
                                    <div className="ranking-scroll-container">
                                        {complaintData.map((item, index) => (
                                            <div 
                                                key={item.c_report_idx} 
                                                className="ranking-item"
                                                onClick={() => handleComplaintItemClick(item, index)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="rank-number">#{index + 1}</div>
                                                <div className="risk-details">
                                                    <span className="risk-level">
                                                        {getStatusIcon(item.c_report_status)} {getStatusText(item.c_report_status)}
                                                    </span>
                                                    <span className="risk-score" style={{ color: getStatusColor(item.c_report_status) }}>
                                                        {new Date(item.c_reported_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="risk-info">
                                                    <div className="location-name">{item.addr || '주소 정보 없음'}</div>
                                                    <div className="risk-description">
                                                        {item.c_report_detail || '상세 정보가 없습니다.'}
                                                    </div>
                                                    <div className="coordinates-info">
                                                        📍 좌표: {item.lat?.toFixed(6)}, {item.lon?.toFixed(6)}
                                                    </div>
                                                    <div className="reporter-info">
                                                        👤 제보자: {item.c_reporter_name} | 📞 {item.c_reporter_phone}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-data">
                                        <p>현재 시민 제보 데이터가 없습니다.</p>
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

export default ComplaintDetail;
