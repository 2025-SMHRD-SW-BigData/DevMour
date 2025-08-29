import React, { useState, useEffect } from 'react';
import ReportPreview from './components/ReportPreview';
import './Modal.css';



const Modals = ({ isOpen, onClose, markerType, markerData, isEditMode: initialEditMode = false, onUpdateComplete }) => {
    const [detailData, setDetailData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [isEditMode, setIsEditMode] = useState(initialEditMode);
    const [editFormData, setEditFormData] = useState({});
    const [updateLoading, setUpdateLoading] = useState(false);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [reportData, setReportData] = useState(null);

    // CCTV 보고서 생성 함수
    const generateCCTVReport = async (markerData) => {
        try {
            console.log('🔍 generateCCTVReport 함수 실행됨');
            console.log('🔍 markerData:', markerData);
            
            // 보고서 데이터 준비
            const reportData = {
                cctvId: markerData?.cctv_idx || 'CCTV-001',
                location: markerData?.cctv_name || '광주공항사거리',
                riskLevel: '위험',
                agency: '경찰청',
                date: new Date().toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                }),
                time: new Date().toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                department: '도로관리과',
                author: '관리자',
                position: '대리',
                description: `${markerData?.cctv_name || 'CCTV'}에서 도로상태 이상이 감지되었습니다. 즉시 현장 확인 및 조치가 필요합니다.`,
                riskScore: Math.floor(Math.random() * 50) + 50 // 50-100 사이 랜덤 점수
            };

            console.log('🔍 준비된 reportData:', reportData);
            console.log('🔍 showReportPreview 상태 변경 전:', showReportPreview);

            // 미리보기 창 표시
            setReportData(reportData);
            setShowReportPreview(true);
            
            console.log('🔍 showReportPreview 상태 변경 후:', true);
            console.log('🔍 reportData 상태 변경 후:', reportData);
            
        } catch (error) {
            console.error('보고서 생성 오류:', error);
            alert('보고서 생성 중 오류가 발생했습니다.');
        }
    };

    // 마커 상세 정보 가져오기
    useEffect(() => {
        // ✅ isOpen이 true일 때만 실행
        if (!isOpen) {
            return;
        }
        
        console.log('🔍 Modals useEffect 실행:', { isOpen, markerData, isEditMode });
        
        if (markerData) {
            // ✅ 수정 모드인 경우: API 호출 없이 직접 데이터 사용
            if (isEditMode && markerData.control_idx) {
                console.log('✅ 수정 모드: 직접 데이터 사용');
                setDetailData({
                    marker: {
                        marker_id: markerData.control_idx,
                        marker_type: 'construction',
                        control_idx: markerData.control_idx,
                        lat: markerData.lat,
                        lon: markerData.lng || markerData.lon
                    },
                    detail: markerData
                });
                
                // ✅ 수정 모드에서 editFormData도 함께 설정
                setEditFormData({
                    control_desc: markerData.control_desc || '',
                    control_st_tm: markerData.control_st_tm ? markerData.control_st_tm.slice(0, 16) : '',
                    control_ed_tm: markerData.control_ed_tm ? markerData.control_ed_tm.slice(0, 16) : '',
                    control_addr: markerData.control_addr || '',
                    control_type: markerData.control_type || 'construction'
                });
                
                setLoading(false);
            } else if (markerData.marker_id) {
                // ✅ 일반 모드: API 호출하여 상세 정보 가져오기
                console.log('✅ 일반 모드: API 호출하여 상세 정보 요청:', markerData.marker_id);
                fetchMarkerDetail(markerData.marker_id, markerData.type || markerType);
                
                // CCTV 마커인 경우 iframe 로딩 상태 초기화
                if (markerData.type === 'cctv' || markerType === 'cctv') {
                    setVideoLoading(true);
                    setVideoError(false);
                }
            } else {
                console.log('❌ marker_id가 설정되지 않음:', markerData);
                setDetailData(null);
                setLoading(false);
            }
        } else {
            console.log('❌ 마커 상세 정보 요청 조건 불충족:', { 
                isOpen, 
                hasMarkerData: !!markerData, 
                markerId: markerData?.marker_id,
                isEditMode
            });
        }
    }, [isOpen, markerData, isEditMode]);

    // ✅ isEditMode prop이 변경될 때 상태 업데이트
    useEffect(() => {
        setIsEditMode(initialEditMode);
    }, [initialEditMode]);

    const fetchMarkerDetail = async (markerId, markerType) => {
        console.log('🚀 fetchMarkerDetail 시작:', { markerId, markerType });
        setLoading(true);
        
        try {
            let apiUrl;
            
            // ✅ 마커 타입에 따라 다른 API 엔드포인트 사용
            if (markerType === 'construction' || markerType === 'flood') {
                // 도로 통제 마커: road-control API 사용
                apiUrl = `http://localhost:3001/api/road-control/detail/${markerId}`;
                console.log('🚧 도로 통제 API 호출:', apiUrl);
            } else if (markerType === 'complaint') {
                // 시민 제보 마커: complaint API 사용
                apiUrl = `http://localhost:3001/api/complaint/${markerId}`;
                console.log('📝 시민 제보 API 호출:', apiUrl);
            } else {
                // CCTV 마커: marker API 사용 (기존 방식)
                apiUrl = `http://localhost:3001/api/marker/detail/${markerId}`;
                console.log('📹 CCTV API 호출:', apiUrl);
            }
            
            const response = await fetch(apiUrl);
            console.log('📡 API 응답:', response.status, response.ok);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 받은 데이터:', data);
                
                // 시민 제보 데이터 구조 맞추기
                if (markerType === 'complaint') {
                    setDetailData({
                        marker: {
                            marker_id: data.complaint.c_report_idx,
                            marker_type: 'complaint',
                            lat: data.complaint.lat,
                            lon: data.complaint.lon
                        },
                        detail: data.complaint
                    });
                } else {
                    setDetailData(data);
                }
            } else {
                console.error('❌ 마커 상세 정보 조회 실패:', response.status);
                setDetailData(null);
            }
        } catch (error) {
            console.error('❌ 마커 상세 정보 조회 오류:', error);
            setDetailData(null);
        } finally {
            setLoading(false);
        }
    };

    // 비디오 로딩 핸들러
    const handleVideoLoadStart = () => {
        setVideoLoading(true);
        setVideoError(false);
    };

    const handleVideoCanPlay = () => {
        setVideoLoading(false);
        setVideoError(false);
    };

    const handleVideoError = () => {
        setVideoLoading(false);
        setVideoError(true);
    };

    // 수정 모드 전환
    const handleEditMode = () => {
        if (detailData?.detail) {
            if (markerType === 'complaint') {
                // 시민 제보 수정 모드
                setEditFormData({
                    c_report_status: detailData.detail.c_report_status || 'R',
                    c_report_detail: detailData.detail.c_report_detail || '',
                    addr: detailData.detail.addr || ''
                });
            } else {
                // 기존 도로 통제 수정 모드
                setEditFormData({
                    control_desc: detailData.detail.control_desc || '',
                    control_st_tm: detailData.detail.control_st_tm ? detailData.detail.control_st_tm.split('T')[0] : '',
                    control_ed_tm: detailData.detail.control_ed_tm ? detailData.detail.control_ed_tm.split('T')[0] : '',
                    control_addr: detailData.detail.control_addr || '',
                    control_type: detailData.detail.control_type || 'construction'
                });
            }
        }
        setIsEditMode(true);
    };

    // 전역 함수로 편집 모드로 모달 열기
    useEffect(() => {
        window.openComplaintModalInEditMode = () => {
            console.log('🔄 편집 모드로 모달 열기');
            if (detailData?.detail) {
                handleEditMode();
            }
        };
        
        return () => {
            window.openComplaintModalInEditMode = null;
        };
    }, [detailData]);

    // 수정 모드 취소
    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditFormData({});
    };

    // 폼 데이터 변경 핸들러
    const handleFormChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 데이터 업데이트
    const handleUpdate = async () => {
        setUpdateLoading(true);
        try {
            let response;
            
            if (markerType === 'complaint') {
                // 시민 제보 업데이트
                const reportIdx = detailData?.detail?.c_report_idx || 
                                 markerData?.c_report_idx || 
                                 detailData?.detail?.marker_id || 
                                 markerData?.marker_id;
                
                if (!reportIdx) {
                    alert('업데이트할 시민 제보를 찾을 수 없습니다. c_report_idx가 필요합니다.');
                    return;
                }

                response = await fetch('http://localhost:3001/api/complaint/update', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        c_report_idx: reportIdx,
                        ...editFormData
                    }),
                });
            } else {
                // 기존 도로 통제 업데이트
                const controlIdx = detailData?.detail?.control_idx || 
                                  markerData?.control_idx || 
                                  detailData?.detail?.marker_id || 
                                  markerData?.marker_id;
                
                if (!controlIdx) {
                    alert('업데이트할 데이터를 찾을 수 없습니다. control_idx가 필요합니다.');
                    return;
                }

                response = await fetch('http://localhost:3001/api/update/road-control', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        control_idx: controlIdx,
                        ...editFormData
                    }),
                });
            }

            if (response.ok) {
                const result = await response.json();
                alert('성공적으로 업데이트되었습니다.');
                setIsEditMode(false);
                setEditFormData({});
                
                // 시민 제보 업데이트 완료 시 부모 컴포넌트에 알림
                if (markerType === 'complaint' && onUpdateComplete) {
                    console.log('✅ 시민 제보 업데이트 완료 - 부모 컴포넌트에 알림');
                    onUpdateComplete();
                }
                
                // 데이터 새로고침
                if (markerType === 'complaint') {
                    fetchMarkerDetail(markerData?.c_report_idx || markerData?.marker_id);
                } else {
                    fetchMarkerDetail(markerData.marker_id);
                }
            } else {
                const errorData = await response.json();
                alert(`업데이트 실패: ${errorData.message || '알 수 없는 오류가 발생했습니다.'}`);
            }
        } catch (error) {
            console.error('업데이트 오류:', error);
            alert('업데이트 중 오류가 발생했습니다.');
        } finally {
            setUpdateLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderCCTVModal = () => {
        const cctvData = detailData?.detail;
        
        // 안전한 좌표 변환 함수
        const safeCoordinate = (value, fallback) => {
            if (value === null || value === undefined) return fallback;
            const num = parseFloat(value);
            return isNaN(num) ? fallback : num;
        };
        
        const cctvLat = safeCoordinate(cctvData?.lat, markerData?.lat);
        const cctvLon = safeCoordinate(cctvData?.lon, markerData?.lng);
        
        return (
            <>
                <div className="modal-header cctv">
                    <h2>{markerData?.icon || '📹'} CCTV 모니터링 - {cctvData?.cctv_name || 'CCTV'}</h2>
                    <span className="close" onClick={onClose}>&times;</span>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
                            <p>정보를 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            <div className="cctv-feed" style={{ 
                            width: '100%', 
                            height: '470px',
                            position: 'relative',
                            marginBottom: '20px'
                        }}>
                            <div className="feed-overlay" style={{
                                position: 'absolute',
                                top: '10px',
                                left: '10px',
                                background: 'rgba(0,0,0,0.7)',
                                color: 'white',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                zIndex: 5
                            }}>실시간 스트리밍</div>
                            {cctvData?.cctv_url ? (
                                <div className="video-player-container" style={{ 
                                    position: 'relative',
                                    width: '100%',
                                    height: '100%'
                                }}>
                                    {/* iframe으로 CCTV 페이지 임베드 */}
                                    <iframe
                                        src={cctvData.cctv_url}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            border: 'none',
                                            borderRadius: '8px',
                                            backgroundColor: '#000',
                                            transform: 'scale(2.0)',
                                            transformOrigin: 'center center',
                                            marginTop: '140px'
                                        }}
                                        title="CCTV 스트리밍"
                                        allowFullScreen
                                        sandbox="allow-scripts allow-same-origin allow-forms"
                                        onLoad={() => {
                                            console.log('✅ CCTV iframe 로딩 완료');
                                            setVideoLoading(false);
                                            setVideoError(false);
                                        }}
                                        onError={() => {
                                            console.error('❌ CCTV iframe 로딩 실패');
                                            setVideoLoading(false);
                                            setVideoError(true);
                                        }}
                                    />
                                    {videoLoading && (
                                        <div className="video-loading" style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            zIndex: 10
                                        }}>
                                            <div className="spinner"></div>
                                            <span>스트리밍 연결 중...</span>
                                        </div>
                                    )}
                                    {videoError && (
                                        <div className="video-loading" style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            zIndex: 10,
                                            backgroundColor: 'rgba(0,0,0,0.8)',
                                            padding: '20px',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>❌</div>
                                            <span>스트리밍 연결 실패</span>
                                            <p style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                                                새 창에서 열어보세요
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📹</div>
                                    <p>CCTV 피드 연결 중...</p>
                                    <small>위치: {cctvLat?.toFixed(6) || 'N/A'}, {cctvLon?.toFixed(6) || 'N/A'}</small>
                                    <p style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
                                        스트리밍 URL이 설정되지 않았습니다.
                                    </p>
                                </div>
                            )}
                        </div>
                            {cctvData?.cctv_url && (
                                <div className="streaming-link-container">
                                    <a 
                                        href={cctvData.cctv_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="streaming-link"
                                    >
                                        📺 새 창에서 스트리밍 보기
                                    </a>
                                </div>
                            )}

                            <div className="analysis-results">
                                <div className="analysis-card">
                                    <h4>🚨 위험 감지 현황</h4>
                                    <div className="detections">
                                        <div className="detection-item">
                                            <span>차량 정지</span>
                                            <span className="marker-type-cctv">3건</span>
                                        </div>
                                        <div className="detection-item">
                                            <span>보행자 횡단</span>
                                            <span className="marker-type-cctv">12건</span>
                                        </div>
                                        <div className="detection-item">
                                            <span>교통 위반</span>
                                            <span className="marker-type-cctv">5건</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="analysis-card">
                                    <h4>📊 교통량 분석</h4>
                                    <p>시간대별 교통량: 1,234대/시간</p>
                                    <p>평균 속도: 45km/h</p>
                                    <p>혼잡도: 보통</p>
                                </div>
                            </div>

                            <div className="risk-score">
                                <h4>위험도 점수</h4>
                                <div className="risk-gauge">
                                    <div className="risk-value">7.2</div>
                                </div>
                                <p>주의 단계 (10점 만점)</p>
                            </div>

                            <div className="recommendations-card">
                                <h4>💡 권장사항</h4>
                                <ul>
                                    <li>교통 신호 개선 필요</li>
                                    <li>보행자 횡단보도 안전장치 설치 검토</li>
                                    <li>정기적인 CCTV 점검 및 유지보수</li>
                                </ul>
                            </div>

                            
                        </>
                    )}
                </div>
            </>
        );
    };

    const renderConstructionModal = () => {
        const controlData = detailData?.detail;
        
        // 안전한 좌표 변환 함수
        const safeCoordinate = (value, fallback) => {
            if (value === null || value === undefined) return fallback;
            const num = parseFloat(value);
            return isNaN(num) ? fallback : num;
        };
        
        const controlLat = safeCoordinate(controlData?.lat, markerData?.lat);
        const controlLon = safeCoordinate(controlData?.lon, markerData?.lng);
        
        return (
            <>
                <div className="modal-header construction">
                    <h2>{markerData?.icon || '🚧'} 공사 현황 - {controlData?.control_type === 'construction' ? '공사중' : '통제중'}</h2>
                    <div className="header-actions">
                        {!isEditMode && controlData && (
                            <button 
                                className="edit-btn" 
                                onClick={handleEditMode}
                                style={{
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    marginRight: '10px'
                                }}
                            >
                                ✏️ 수정
                            </button>
                        )}
                        <span className="close" onClick={onClose}>&times;</span>
                    </div>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
                            <p>정보를 불러오는 중...</p>
                        </div>
                    ) : !controlData ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
                            <p>상세 정보가 설정되지 않았습니다.</p>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                이 마커는 기본 정보만 포함하고 있습니다.
                            </p>
                            <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                <p><strong>마커 타입:</strong> {markerData?.type || 'construction'}</p>
                                <p><strong>위치:</strong> {controlLat?.toFixed(6) || 'N/A'}, {controlLon?.toFixed(6) || 'N/A'}</p>
                                <p><strong>상태:</strong> 기본 정보만 표시</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isEditMode ? (
                                <div className="edit-form">
                                    <h4>✏️ 공사 정보 수정</h4>
                                    <div className="form-group">
                                        <label>공사 종류:</label>
                                        <input
                                            type="text"
                                            value={editFormData.control_desc || ''}
                                            onChange={(e) => handleFormChange('control_desc', e.target.value)}
                                            placeholder="공사 종류를 입력하세요"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>시작일:</label>
                                        <input
                                            type="date"
                                            value={editFormData.control_st_tm || ''}
                                            onChange={(e) => handleFormChange('control_st_tm', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>예상 완료일:</label>
                                        <input
                                            type="date"
                                            value={editFormData.control_ed_tm || ''}
                                            onChange={(e) => handleFormChange('control_ed_tm', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>통제 주소:</label>
                                        <input
                                            type="text"
                                            value={editFormData.control_addr || ''}
                                            onChange={(e) => handleFormChange('control_addr', e.target.value)}
                                            placeholder="통제 주소를 입력하세요"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>통제 타입:</label>
                                        <select
                                            value={editFormData.control_type || 'construction'}
                                            onChange={(e) => handleFormChange('control_type', e.target.value)}
                                        >
                                            <option value="construction">공사중</option>
                                            <option value="flood">홍수 통제</option>
                                        </select>
                                    </div>
                                    <div className="form-actions">
                                        <button 
                                            className="cancel-btn" 
                                            onClick={handleCancelEdit}
                                            style={{
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                marginRight: '10px'
                                            }}
                                        >
                                            ❌ 취소
                                        </button>
                                        <button 
                                            className="update-btn" 
                                            onClick={handleUpdate}
                                            disabled={updateLoading}
                                            style={{
                                                background: updateLoading ? '#ccc' : '#4CAF50',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: updateLoading ? 'not-allowed' : 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {updateLoading ? '⏳ 업데이트 중...' : '✅ 수정 완료'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="construction-status" >
                                    {/* <h4 style={{ whiteSpace: 'nowrap' }}>🏗️ 공사 진행 상황</h4><br></br> */}
                                    <p><strong>공사 종류</strong><br></br> {controlData?.control_desc || '도로 포장 공사'}</p>
                                    <p><strong>시작일</strong><br></br> {controlData?.control_st_tm ? new Date(controlData.control_st_tm).toLocaleDateString('ko-KR') : '2024년 1월 15일'}</p>
                                    <p style={{ whiteSpace: 'nowrap' }}><strong>예상 완료일</strong><br></br> {controlData?.control_ed_tm ? new Date(controlData.control_ed_tm).toLocaleDateString('ko-KR') : '2024년 3월 20일'}</p>
                                    <p><strong>현재 단계</strong> <br></br>포장층 시공 중</p>
                                    {controlData?.control_addr && (
                                        <p><strong>통제 주소</strong><br></br> {controlData.control_addr}</p>
                                    )}
                                    <p><strong>위치</strong><br></br> {controlLat?.toFixed(6) || 'N/A'}, {controlLon?.toFixed(6) || 'N/A'}</p>
                                </div>
                            )}

                            {!isEditMode && (
                                <div className="construction-progress">
                                    <h4>📈 공사 진행률</h4>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: '65%' }}></div>
                                    </div>
                                    <p>65% 완료 (예상 35일 남음)</p>
                                </div>
                            )}

                            {!isEditMode && (
                                <>
                                    <div className="analysis-results">
                                        <div className="analysis-card">
                                            <h4>⚠️ 안전 관리 현황</h4>
                                            <div className="detection-item">
                                                <span>안전장비 착용률</span>
                                                <span className="marker-type-construction">98%</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>안전사고 발생</span>
                                                <span className="marker-type-construction">0건</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>교통 통제 준수</span>
                                                <span className="marker-type-construction">100%</span>
                                            </div>
                                        </div>
                                        <div className="analysis-card">
                                            <h4>🚦 교통 영향</h4>
                                            <p>차선 축소: 2차선 → 1차선</p>
                                            <p>제한속도: 30km/h</p>
                                            <p>우회로: 북쪽 500m 지점</p>
                                        </div>
                                    </div>

                                    <div className="recommendations-card">
                                        <h4>💡 주의사항</h4>
                                        <ul>
                                            <li>공사 구간 진입 시 속도 감속 필수</li>
                                            <li>안전 표지판 및 신호 준수</li>
                                            <li>공사 차량 우선 통행</li>
                                            <li>야간 운전 시 주의</li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </>
        );
    };

    const renderFloodModal = () => {
        const controlData = detailData?.detail;
        
        // 안전한 좌표 변환 함수
        const safeCoordinate = (value, fallback) => {
            if (value === null || value === undefined) return fallback;
            const num = parseFloat(value);
            return isNaN(num) ? fallback : num;
        };
        
        const controlLat = safeCoordinate(controlData?.lat, markerData?.lat);
        const controlLon = safeCoordinate(controlData?.lon, markerData?.lng);
        
        return (
            <>
                <div className="modal-header flood">
                    <h2>{markerData?.icon || '🌊'} 침수 현황 - {controlData?.control_type === 'flood' ? '침수' : '통제중'}</h2>
                    <div className="header-actions">
                        {!isEditMode && controlData && (
                            <button 
                                className="edit-btn" 
                                onClick={handleEditMode}
                                style={{
                                    background: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    marginRight: '10px'
                                }}
                            >
                                ✏️ 수정
                            </button>
                        )}
                        <span className="close" onClick={onClose}>&times;</span>
                    </div>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
                            <p>정보를 불러오는 중...</p>
                        </div>
                    ) : !controlData ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
                            <p>상세 정보가 설정되지 않았습니다.</p>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                이 마커는 기본 정보만 포함하고 있습니다.
                            </p>
                            <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                <p><strong>마커 타입:</strong> {markerData?.type || 'flood'}</p>
                                <p><strong>위치:</strong> {controlLat?.toFixed(6) || 'N/A'}, {controlLon?.toFixed(6) || 'N/A'}</p>
                                <p><strong>상태:</strong> 기본 정보만 표시</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isEditMode ? (
                                <div className="edit-form">
                                    <h4>✏️ 침수 정보 수정</h4>
                                    <div className="form-group">
                                        <label>침수 원인/설명:</label>
                                        <input
                                            type="text"
                                            value={editFormData.control_desc || ''}
                                            onChange={(e) => handleFormChange('control_desc', e.target.value)}
                                            placeholder="침수 원인이나 상세 설명을 입력하세요"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>침수 시작일:</label>
                                        <input
                                            type="date"
                                            value={editFormData.control_st_tm || ''}
                                            onChange={(e) => handleFormChange('control_st_tm', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>예상 완료일:</label>
                                        <input
                                            type="date"
                                            value={editFormData.control_ed_tm || ''}
                                            onChange={(e) => handleFormChange('control_ed_tm', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>침수 주소:</label>
                                        <input
                                            type="text"
                                            value={editFormData.control_addr || ''}
                                            onChange={(e) => handleFormChange('control_addr', e.target.value)}
                                            placeholder="침수 주소를 입력하세요"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>통제 타입:</label>
                                        <select
                                            value={editFormData.control_type || 'flood'}
                                            onChange={(e) => handleFormChange('control_type', e.target.value)}
                                        >
                                            <option value="construction">공사중</option>
                                            <option value="flood">홍수 통제</option>
                                        </select>
                                    </div>
                                    <div className="form-actions">
                                        <button 
                                            className="cancel-btn" 
                                            onClick={handleCancelEdit}
                                            style={{
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                marginRight: '10px'
                                            }}
                                        >
                                            ❌ 취소
                                        </button>
                                        <button 
                                            className="update-btn" 
                                            onClick={handleUpdate}
                                            disabled={updateLoading}
                                            style={{
                                                background: updateLoading ? '#ccc' : '#2196F3',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: updateLoading ? 'not-allowed' : 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {updateLoading ? '⏳ 업데이트 중...' : '✅ 수정 완료'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flood-info">
                                    <h4>💧 침수 정보</h4>
                                    <p><strong>침수 원인:</strong> {controlData?.control_desc || '집중 호우'}</p>
                                    <p><strong>침수 시작:</strong> {controlData?.control_st_tm ? new Date(controlData.control_st_tm).toLocaleString('ko-KR') : '2024년 1월 20일 14:30'}</p>
                                    <p><strong>현재 상태:</strong> 침수 지속 중</p>
                                    <p><strong>영향 구간:</strong> 150m 구간</p>
                                    {controlData?.control_addr && (
                                        <p><strong>침수 주소:</strong> {controlData.control_addr}</p>
                                    )}
                                    <p><strong>위치:</strong> {controlLat?.toFixed(6) || 'N/A'}, {controlLon?.toFixed(6) || 'N/A'}</p>
                                </div>
                            )}

                            {!isEditMode && (
                                <>
                                    <div className="water-level">
                                        <h4>📊 수위 현황</h4>
                                        <div className="water-gauge">
                                            <div className="water-level-value">85</div>
                                        </div>
                                        <p>수위: 85cm (위험 수위: 100cm)</p>
                                        <p>예상 완료: 2시간 후</p>
                                    </div>

                                    <div className="analysis-results">
                                        <div className="analysis-card">
                                            <h4>🚨 위험도 분석</h4>
                                            <div className="detection-item">
                                                <span>차량 통행 가능</span>
                                                <span className="marker-type-flood">불가</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>보행자 통행</span>
                                                <span className="marker-type-flood">위험</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>하수도 상태</span>
                                                <span className="marker-type-flood">포화</span>
                                            </div>
                                        </div>
                                        <div className="analysis-card">
                                            <h4>🌧️ 기상 정보</h4>
                                            <p>강수량: 45mm/시간</p>
                                            <p>습도: 95%</p>
                                            <p>풍속: 8m/s</p>
                                            <p>예보: 2시간 후 개선 예상</p>
                                        </div>
                                    </div>

                                    <div className="recommendations-card">
                                        <h4>💡 긴급 조치사항</h4>
                                        <ul>
                                            <li>해당 구간 진입 금지</li>
                                            <li>우회로 이용 권장</li>
                                            <li>긴급 상황 시 119 신고</li>
                                            <li>침수 완료까지 대기</li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </>
        );
    };

    const renderComplaintModal = () => {
        const complaintData = detailData?.detail;
        
        // 안전한 좌표 변환 함수
        const safeCoordinate = (value, fallback) => {
            if (value === null || value === undefined) return fallback;
            const num = parseFloat(value);
            return isNaN(num) ? fallback : num;
        };
        
        const complaintLat = safeCoordinate(complaintData?.lat, markerData?.lat);
        const complaintLon = safeCoordinate(complaintData?.lon, markerData?.lon);
        
        return (
            <>
                <div className="modal-header complaint">
                    <h2>{markerData?.icon || '📝'} 시민 제보 상세</h2>
                    <div className="header-actions">
                        {!isEditMode && complaintData && (
                            <button 
                                className="edit-btn" 
                                onClick={handleEditMode}
                                style={{
                                    background: '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    marginRight: '10px'
                                }}
                            >
                                ✏️ 수정
                            </button>
                        )}
                        <span className="close" onClick={onClose}>&times;</span>
                    </div>
                </div>
                <div className="modal-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏳</div>
                            <p>정보를 불러오는 중...</p>
                        </div>
                    ) : !complaintData ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
                            <p>상세 정보가 설정되지 않았습니다.</p>
                            <p style={{ fontSize: '14px', color: '#666' }}>
                                이 마커는 기본 정보만 포함하고 있습니다.
                            </p>
                            <div style={{ marginTop: '20px', textAlign: 'left' }}>
                                <p><strong>마커 타입:</strong> {markerData?.type || 'complaint'}</p>
                                <p><strong>위치:</strong> {complaintLat?.toFixed(6) || 'N/A'}, {complaintLon?.toFixed(6) || 'N/A'}</p>
                                <p><strong>상태:</strong> 기본 정보만 표시</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isEditMode ? (
                                <div className="edit-form">
                                    <h4>✏️ 시민 제보 정보 수정</h4>
                                    <div className="form-group">
                                        <label>처리 상태:</label>
                                        <select
                                            value={editFormData.c_report_status || ''}
                                            onChange={(e) => handleFormChange('c_report_status', e.target.value)}
                                        >
                                            <option value="R">접수 완료</option>
                                            <option value="P">처리 중</option>
                                            <option value="C">처리 완료</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ color: '#999' }}>상세 설명: (편집 불가)</label>
                                        <textarea
                                            value={editFormData.c_report_detail || ''}
                                            onChange={(e) => handleFormChange('c_report_detail', e.target.value)}
                                            placeholder="상세 설명을 입력하세요"
                                            rows="4"
                                            disabled
                                            style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ color: '#999' }}>주소: (편집 불가)</label>
                                        <input
                                            type="text"
                                            value={editFormData.addr || ''}
                                            onChange={(e) => handleFormChange('addr', e.target.value)}
                                            placeholder="주소를 입력하세요"
                                            disabled
                                            style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button 
                                            className="cancel-btn" 
                                            onClick={handleCancelEdit}
                                            style={{
                                                background: '#f44336',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                marginRight: '10px'
                                            }}
                                        >
                                            ❌ 취소
                                        </button>
                                        <button 
                                            className="update-btn" 
                                            onClick={handleUpdate}
                                            disabled={updateLoading}
                                            style={{
                                                background: updateLoading ? '#ccc' : '#3498db',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '4px',
                                                cursor: updateLoading ? 'not-allowed' : 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {updateLoading ? '⏳ 업데이트 중...' : '✅ 수정 완료'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="complaint-info">
                                    <h4>📝 제보 정보</h4>
                                    <p><strong>제보 번호:</strong> #{complaintData?.c_report_idx}</p>
                                    <p><strong>처리 상태:</strong> {getComplaintStatusText(complaintData?.c_report_status)}</p>
                                    <p><strong>제보 일시:</strong> {complaintData?.c_reported_at ? new Date(complaintData.c_reported_at).toLocaleString('ko-KR') : 'N/A'}</p>
                                    <p><strong>위치:</strong> {complaintData?.addr || '주소 정보 없음'}</p>
                                    <p><strong>상세 내용:</strong> {complaintData?.c_report_detail || '상세 정보가 없습니다.'}</p>
                                    <p><strong>제보자:</strong> {complaintData?.c_reporter_name}</p>
                                    <p><strong>연락처:</strong> {complaintData?.c_reporter_phone}</p>
                                    <p><strong>좌표:</strong> {complaintLat?.toFixed(6) || 'N/A'}, {complaintLon?.toFixed(6) || 'N/A'}</p>
                                    
                                    {/* 첨부 파일 정보 */}
                                    {(complaintData?.c_report_file1 || complaintData?.c_report_file2 || complaintData?.c_report_file3) && (
                                        <div className="attachment-info">
                                            <h4>📎 첨부 파일</h4>
                                            {complaintData?.c_report_file1 && (
                                                <p><strong>파일 1:</strong> {complaintData.c_report_file1}</p>
                                            )}
                                            {complaintData?.c_report_file2 && (
                                                <p><strong>파일 2:</strong> {complaintData.c_report_file2}</p>
                                            )}
                                            {complaintData?.c_report_file3 && (
                                                <p><strong>파일 3:</strong> {complaintData.c_report_file3}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isEditMode && (
                                <>
                                    <div className="analysis-results">
                                        <div className="analysis-card">
                                            <h4>📊 처리 현황</h4>
                                            <div className="detection-item">
                                                <span>접수 일시</span>
                                                <span className="marker-type-complaint">
                                                    {complaintData?.c_reported_at ? new Date(complaintData.c_reported_at).toLocaleDateString('ko-KR') : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="detection-item">
                                                <span>처리 담당자</span>
                                                <span className="marker-type-complaint">
                                                    {complaintData?.admin_id || '미배정'}
                                                </span>
                                            </div>
                                            <div className="detection-item">
                                                <span>우선순위</span>
                                                <span className="marker-type-complaint">
                                                    {complaintData?.c_report_status === 'C' ? '완료' : 
                                                     complaintData?.c_report_status === 'P' ? '높음' : '보통'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="analysis-card">
                                            <h4>📍 위치 정보</h4>
                                            <p>주소: {complaintData?.addr || '주소 정보 없음'}</p>
                                            <p>좌표: {complaintLat?.toFixed(6) || 'N/A'}, {complaintLon?.toFixed(6) || 'N/A'}</p>
                                            <p>제보자: {complaintData?.c_reporter_name}</p>
                                            <p>연락처: {complaintData?.c_reporter_phone}</p>
                                        </div>
                                    </div>

                                    <div className="recommendations-card">
                                        <h4>💡 처리 가이드</h4>
                                        <ul>
                                            <li>접수 완료 상태: 담당자 배정 및 현장 확인</li>
                                            <li>처리 중 상태: 진행 상황 업데이트 및 소통</li>
                                            <li>처리 완료 상태: 결과 확인 및 민원인 통보</li>
                                            <li>긴급 민원: 즉시 현장 출동 및 조치</li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </>
        );
    };

    // 시민 제보 상태 텍스트 반환 함수
    const getComplaintStatusText = (status) => {
        switch (status) {
            case 'C': return '처리 완료';
            case 'P': return '처리 중';
            case 'R': return '접수 완료';
            default: return '접수 완료';
        }
    };

    const renderModalContent = () => {
        switch (markerType) {
            case 'cctv':
                return renderCCTVModal();
            case 'construction':
                return renderConstructionModal();
            case 'flood':
                return renderFloodModal();
            case 'complaint':
                return renderComplaintModal();
            default:
                return renderCCTVModal();
        }
    };

    return (
        <>
            <div className="modal" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    {renderModalContent()}
                    <div className="modal-footer">
                        <button className="btn btn-primary" onClick={onClose}>
                            확인
                        </button>
                        {markerType === 'cctv' && (
                            <button 
                                className="btn btn-success" 
                                onClick={() => generateCCTVReport(markerData)}
                            >
                                📄 보고서 생성
                            </button>
                        )}
                        <button className="btn btn-warning">
                            {markerType === 'cctv' && '상세 분석'}
                            {markerType === 'construction' && '공사 일정'}
                            {markerType === 'flood' && '긴급 신고'}
                            {markerType === 'complaint' && '긴급 출동'}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* PDF 미리보기 창 */}
            <ReportPreview
                isOpen={showReportPreview}
                onClose={() => setShowReportPreview(false)}
                reportData={reportData}
            />
        </>
    );
};

export default Modals;
