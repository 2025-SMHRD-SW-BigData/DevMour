import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';
import NaverMap from '../NaverMap.jsx';
import Modals from '../Modals.jsx';

const ConstructionDetail = () => {
    const nav = useNavigate();
//    const [constructionData, setConstructionData] = useState([]);
    const [controlData, setControlData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summaryStats, setSummaryStats] = useState({
        ongoing: 0,
        completed: 0,
        total: 0,
        construction: 0,
        flood: 0
    });
    const [showMap, setShowMap] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMarkerType, setSelectedMarkerType] = useState(null);
    const [selectedMarkerData, setSelectedMarkerData] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isEditLoading, setIsEditLoading] = useState(false);

    // 통제 데이터 조회
    useEffect(() => {
        fetchControlData();
    }, []);

    const fetchControlData = async () => {
        try {
            setLoading(true);
            // construction과 flood 데이터를 병렬로 가져오기
            const [constructionResponse, floodResponse] = await Promise.all([
                fetch('/api/construction/list'),
                fetch('/api/road-control/all')
            ]);
            
            let allControlData = [];
            
            // construction 데이터 처리
            if (constructionResponse.ok) {
                const constructionData = await constructionResponse.json();
                const constructions = Array.isArray(constructionData.constructions) 
                    ? constructionData.constructions.map(item => ({
                        ...item,
                        control_type: 'construction'
                    }))
                    : [];
                allControlData = [...allControlData, ...constructions];
                console.log('🔍 공사 통제 데이터:', constructions);
            } else {
                console.error('공사 통제 데이터 조회 실패:', constructionResponse.status);
            }
            
            // flood 데이터 처리
            if (floodResponse.ok) {
                const allRoadControlData = await floodResponse.json();
                const floods = (Array.isArray(allRoadControlData) ? allRoadControlData : [])
                    .filter(item => item.control_type === 'flood')
                    .map(item => ({
                        ...item,
                        lat: parseFloat(item.lat),
                        lon: parseFloat(item.lon),
                        control_st_tm: item.control_st_tm,
                        control_ed_tm: item.control_ed_tm,
                        created_at: item.created_at
                    }));
                allControlData = [...allControlData, ...floods];
                console.log('🌊 침수 통제 데이터:', floods);
            } else {
               console.error('침수 통제 데이터 조회 실패:', floodResponse.status);
            }
            // 생성일 기준으로 정렬 (최신순)
            allControlData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            console.log('📊 전체 통제 데이터:', allControlData);
            setControlData(allControlData || []);            
            // 통계 계산
            calculateSummaryStats(allControlData || []);
            
        } catch (error) {
            console.error(' 통제 데이터 조회 오류:', error);
            setError('서버 연결 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 통계 계산 함수
    const calculateSummaryStats = (data) => {
        let ongoing = 0;
        let completed = 0;
        let construction = 0;
        let flood = 0;

        // data가 배열인지 확인
        if (!Array.isArray(data)) {
            console.warn('⚠️ calculateSummaryStats: data가 배열이 아닙니다:', data);
            setSummaryStats({ ongoing: 0, completed: 0, total: 0, construction: 0, flood: 0 });
            return;
        }

        data.forEach(item => {
            if (item.control_ed_tm === null) {
                ongoing++; // 통제 종료 시간이 없으면 진행 중
            } else {
                completed++; // 통제 종료 시간이 있으면 완료
            }

            // 타입별 카운트
            if (item.control_type === 'construction') {
                construction++;
            } else if (item.control_type === 'flood') {
                flood++;
            }
        });

        setSummaryStats({
            ongoing,
            completed,
            total: data.length,
            construction,
            flood
        });
    };

    // 통제 타입에 따른 아이콘 반환
    const getTypeIcon = (control_type) => {
        return control_type === 'construction' ? '🚧' : '🌊';
    };

    // 통제 타입에 따른 텍스트 반환
    const getTypeText = (control_type) => {
        return control_type === 'construction' ? '공사 통제' : '침수 통제';
    };

    // 통제 상태에 따른 상태 아이콘 반환
    const getStatusIcon = (control_ed_tm) => {
        return control_ed_tm === null ? '⏳' : '✅';
    };

    // 통제 상태 텍스트 반환
    const getStatusText = (control_ed_tm) => {
        return control_ed_tm === null ? '진행 중' : '완료';
    };

    // 통제 상태에 따른 색상 반환
    const getStatusColor = (control_ed_tm) => {
        return control_ed_tm === null ? '#f39c12' : '#27ae60'; // 진행 중: 주황색, 완료: 초록색
    };

    // 통제 구역 항목 클릭 시 처리
    const handleControlItemClick = (item, index) => {
        console.log('🎯 통제 구역 항목 클릭:', { item, index });        
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
            }
        }, 100);
    };

    // 마커 클릭 핸들러 (Dashboard.jsx와 동일한 방식)
    const handleMarkerClick = (markerType, markerData) => {
        console.log('🎯 ConstructionDetail handleMarkerClick 호출:', { markerType, markerData });
        setSelectedMarkerType(markerType);
        
        // ✅ 마커 데이터 구조 확인 및 변환
        if (markerData) {
            // control_idx가 있는 경우 (도로 통제 마커)
            if (markerData.control_idx) {
                setSelectedMarkerData({
                    ...markerData,
                    marker_id: markerData.control_idx, // control_idx를 marker_id로 사용
                    type: markerData.type || markerType,
                    icon: markerData.icon || '🚧'
                });
            } else {
                // cctv_idx가 있는 경우 (CCTV 마커)
                setSelectedMarkerData({
                    ...markerData,
                    marker_id: markerData.cctv_idx || markerData.marker_id,
                    type: markerData.type || markerType,
                    icon: markerData.icon || '📹'
                });
            }
        }
        
        setIsModalOpen(true);
        console.log('✅ 공사중 모달 상태 업데이트 완료');
    };

    // 수정 버튼 클릭 핸들러
    const handleEditClick = async (item) => {
        console.log('✏️ 수정 버튼 클릭:', item);
        
        // 데이터 유효성 검사
        if (!item || !item.control_idx) {
            console.error('❌ 수정할 데이터가 유효하지 않습니다:', item);
            alert('수정할 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        // 필수 데이터 확인
        const requiredFields = ['lat', 'lon', 'control_desc'];
        const missingFields = requiredFields.filter(field => !item[field]);
        
        if (missingFields.length > 0) {
            console.warn('⚠️ 일부 데이터가 누락되었습니다:', missingFields);
            console.log('📊 현재 데이터 상태:', item);
        }
        
        // 수정 버튼 로딩 상태 표시
        setIsEditLoading(true);
        
        try {
            // 데이터 준비
            const markerData = {
                marker_id: item.control_idx,
                control_idx: item.control_idx,
                road_idx: item.road_idx || item.control_idx,
                icon: getTypeIcon(item.control_type),
                lat: item.lat,
                lng: item.lon,
                type: item.control_type,
                name: item.control_desc || getTypeText(item.control_type),
                ...item
            };
            
            console.log('📊 전달할 데이터:', markerData);
            
            // 데이터 설정
            setSelectedMarkerType(item.control_type);
            setSelectedMarkerData(markerData);
            
            // 약간의 딜레이 후 모달 열기 (데이터가 완전히 설정되도록)
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setIsEditMode(true);
            setIsModalOpen(true);
            
            console.log('✅ 통제 구역  모달 수정 모드 열기 완료');
            
        } catch (error) {
            console.error('❌ 수정 모드 설정 중 오류:', error);
            alert('수정 모드를 열 수 없습니다. 다시 시도해주세요.');
        } finally {
            setIsEditLoading(false);
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
                   <h1>🚧🌊 통제 구역 상세</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                         대시보드로 돌아가기
                    </button>
                </div>
                <div className="loading-container">
                    <div className="loading-spinner">⏳</div>
                    <p>통제구역 데이터를 불러오는 중...</p>
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
                   <h1>🚧🌊 통제 구역 상세</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                         대시보드로 돌아가기
                    </button>
                </div>
                <div className="error-container">
                    <div className="error-icon">❌</div>
                    <p>{error}</p>
                    <button onClick={fetchControlData} className="retry-btn">다시 시도</button>
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
                   <h1>🚧🌊 통제 구역 상세</h1>
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
                        <div className="complaint-bar-chart">
                            <div className="complaint-chart-header">
                                <div className="total-label">전체 통제 : {summaryStats.total}건 (공사: {summaryStats.construction}건, 침수: {summaryStats.flood}건)</div>
                            </div>
                            
                            {/* 바 차트 */}
                            <div className="complaint-bars-container">
                                {/* 진행 중 */}
                                <div className="complaint-bar-item">
                                    <div className="complaint-bar-label">
                                        <span className="complaint-status-icon">⏳</span>
                                        <span className="complaint-status-text">진행 중</span>
                                    </div>
                                    <div className="complaint-bar-wrapper">
                                        <div 
                                            className="complaint-bar-fill in-progress"
                                            style={{ 
                                                width: summaryStats.total > 0 ? `${Math.max((summaryStats.ongoing / summaryStats.total) * 100, 5)}%` : '5%'
                                            }}
                                        >
                                            <span className="complaint-bar-value">{summaryStats.ongoing}건</span>
                                        </div>
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
                                                width: summaryStats.total > 0 ? `${Math.max((summaryStats.completed / summaryStats.total) * 100, 5)}%` : '5%'
                                            }}
                                        >
                                            <span className="complaint-bar-value">{summaryStats.completed}건</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 액션 카드들 */}
                    <div className="action-cards">
                        <div className="action-card">
                            <h3>🚧 공사 통제  관리</h3>
                            <ul>
                                <li>공사 구역 안전 시설 점검</li>
                                <li>교통 통제 구역 확실한 표시</li>
                                <li>공사 진행 상황 실시간 모니터링</li>
                                <li>주변 교통 영향 최소화 방안</li>
                            </ul>
                        </div>
                        <div className="action-card">
                            <h3>🌊 침수 통제 관리 </h3>
                            <ul>
                                <li>침수 위험 구역 사전 점검</li>
                                <li>배수 시설 정상 작동 확인</li>
                                <li>기상 상황 실시간 모니터링</li>
                                <li>긴급 대응 체계 구축</li>
                            </ul>
                        </div>
                    </div>

                </div>

                {/* 오른쪽 패널 */}
                <div className="detail-right-panel">
                    {/* 통제구역 리스트 */}
                    <div className="ranking-list">
                        <div className="ranking-header">
                            <h2>🚧🌊 통제 구역 목록 ({controlData.length}개)</h2>
                            <button 
                                className="map-toggle-btn"
                                onClick={() => {
                                    console.log('🗺️ 지도 보기 버튼 클릭:', !showMap);
                                    console.log('📊 현재 통제 구역 데이터:', controlData);
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
                                    onMarkerClick={handleMarkerClick}
                                />
                            </div>
                        ) : (
                            <>
                                {controlData && controlData.length > 0 ? (
                                    <div className="ranking-scroll-container">
                                        {controlData.map((item, index) => {
                                            // item이 유효한지 확인
                                            if (!item || !item.control_idx) {
                                                console.warn('⚠️ 유효하지 않은 아이템:', item);
                                                return null;
                                            }
                                            
                                            return (
                                            <div 
                                                key={item.control_idx} 
                                                className="ranking-item"
                                                onClick={() => handleControlItemClick(item, index)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="rank-number">#{index + 1}</div>
                                                <div className="risk-details">
                                                    <span className="risk-level">
                                                        {getTypeIcon(item.control_type)} {getTypeText(item.control_type)}
                                                    </span>
                                                    <span className="risk-score" style={{ color: getStatusColor(item.control_ed_tm) }}>
                                                        {getStatusIcon(item.control_ed_tm)} {getStatusText(item.control_ed_tm)}
                                                    </span>
                                                </div>
                                                
                                                {/* 수정 버튼을 risk-details 아래로 이동 */}
                                                <div className="edit-button-container">
                                                    <button 
                                                        className="edit-item-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditClick(item);
                                                        }}
                                                        title="수정"
                                                        disabled={isEditLoading}
                                                    >
                                                        {isEditLoading ? '⏳ 로딩 중...' : '✏️ 수정'}
                                                    </button>
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
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="no-data">
                                        <p>현재 통제 구역 데이터가 없습니다.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 통제 구역  모달 */}
            <Modals 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    setIsEditMode(false);
                }}
                markerType={selectedMarkerType}
                markerData={selectedMarkerData}
                isEditMode={isEditMode}
            />
        </div>
    );
};

export default ConstructionDetail;
