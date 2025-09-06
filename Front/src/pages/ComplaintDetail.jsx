import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';
import NaverMap from '../NaverMap.jsx';
import Modals from '../Modals.jsx';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [isStatsUpdating, setIsStatsUpdating] = useState(false);

    // 시민 제보 데이터 조회
    useEffect(() => {
        fetchComplaintData();
    }, []);

    const fetchComplaintData = async () => {
        try {
            setLoading(true);
//            const response = await fetch('http://175.45.194.114:3001/api/complaint/detail');
            const response = await fetch('/api/complaint/list');
            
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

   const handleComplaintItemClick = (item, index) => {
        console.log('🎯 시민 제보 항목 클릭:', { item, index });
    
        // 모달 데이터 설정
        setModalData({
            marker_id: item.c_report_idx,
            type: 'complaint',
            lat: item.lat,
            lng: item.lon,
            c_report_idx: item.c_report_idx,
            icon: '📝'
        });
    
        // 모달 열기
        setIsModalOpen(true);
    };
    // 시민 제보 모달 열기 (지도 마커 클릭 시 - 일반 모드)
    const openComplaintModal = (data) => {
        console.log('📝 시민 제보 모달 열기 (일반 모드):', data);
        setModalData(data);
        setIsModalOpen(true);
        // 지도 마커 클릭 시에는 편집 모드가 아닌 일반 모드로 열기
    };

    // 시민 제보 모달 닫기
    const closeComplaintModal = () => {
        console.log('📝 시민 제보 모달 닫기');
        setIsModalOpen(false);
        setModalData(null);
    };

    // 모달에서 업데이트 완료 후 호출되는 함수
    const handleModalUpdateComplete = () => {
        console.log('🔄 모달 업데이트 완료 - 통계 재계산 시작');
        setIsStatsUpdating(true);
        
        // 시민 제보 데이터를 다시 가져와서 통계 업데이트
        fetchComplaintData().finally(() => {
            // 통계 업데이트 완료 후 로딩 상태 해제
            setTimeout(() => {
                setIsStatsUpdating(false);
            }, 500); // 0.5초 후 로딩 상태 해제
        });
    };

    // 민원 편집 버튼 클릭 핸들러
    const handleEditComplaint = (item) => {
        console.log('✏️ 민원 편집 버튼 클릭:', item);
        setModalData({
            marker_id: item.c_report_idx,
            type: 'complaint',
            lat: item.lat,
            lng: item.lon,
            c_report_idx: item.c_report_idx,
            icon: '📝'
        });
        setIsModalOpen(true);
        // 모달이 열린 후 편집 모드로 설정
        setTimeout(() => {
            if (window.openComplaintModalInEditMode) {
                window.openComplaintModalInEditMode();
            }
        }, 100);
    };

    // 전역 함수로 모달 열기 함수 등록
    useEffect(() => {
        window.openComplaintModal = openComplaintModal;
        
        return () => {
            window.openComplaintModal = null;
        };
    }, []);

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
                   <h1> 📋 시민 제보 상세</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                         대시보드로 돌아가기
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
                   <h1> 📋 시민 제보 상세</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                         대시보드로 돌아가기
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
                   <h1> 📋 시민 제보 상세</h1>
                <button className="back-btn" onClick={() => nav('/dashboard')}>
                     대시보드로 돌아가기
                </button>
            </div>

            {/* 메인 컨텐츠 - 좌우 패널 구조 */}
            <div className="detail-main-content">
                {/* 왼쪽 패널 */}
                <div className="detail-left-panel">
                    {/* 요약 통계 카드 */}
                    <div className={`summary-card ${isStatsUpdating ? 'updating' : ''}`}>
                        <h2>
                            📊 전체 현황 요약
                            {isStatsUpdating && <span className="updating-indicator">🔄 업데이트 중...</span>}
                        </h2>
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
                                                width: summaryStats.total > 0 ? `${Math.max((summaryStats.completed / summaryStats.total) * 100, 5)}%` : '5%'
                                            }}
                                        >
                                            <span className="complaint-bar-value">{summaryStats.completed}건</span>
                                        </div>
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
                                                width: summaryStats.total > 0 ? `${Math.max((summaryStats.inProgress / summaryStats.total) * 100, 5)}%` : '5%'
                                            }}
                                        >
                                            <span className="complaint-bar-value">{summaryStats.inProgress}건</span>
                                        </div>
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
                                                width: summaryStats.total > 0 ? `${Math.max((summaryStats.received / summaryStats.total) * 100, 5)}%` : '5%'
                                            }}
                                        >
                                            <span className="complaint-bar-value">{summaryStats.received}건</span>
                                        </div>
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
                                                <button 
                                                    className="edit-item-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditComplaint(item);
                                                    }}
                                                    style={{ 
                                                        marginLeft: '15px',
                                                        marginRight: '15px',
                                                        alignSelf: 'center'
                                                    }}
                                                >
                                                    ✏️ 수정
                                                </button>
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
            
            {/* 시민 제보 모달 */}
            <Modals
                isOpen={isModalOpen}
                onClose={closeComplaintModal}
                markerType="complaint"
                markerData={modalData}
                onUpdateComplete={handleModalUpdateComplete}
            />
        </div>
    );
};

export default ComplaintDetail;
