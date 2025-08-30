import React, { useState, useEffect } from 'react';
import './Modal.css';

// CCTV 보고서 생성 함수
const generateCCTVReport = async (markerData) => {
    try {
        const response = await fetch('http://localhost:3001/api/report/generate-cctv-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ markerData }),
        });

        if (response.ok) {
            // PDF 파일 다운로드
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cctv-report-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            console.error('보고서 생성 실패');
            alert('보고서 생성에 실패했습니다.');
        }
    } catch (error) {
        console.error('보고서 생성 오류:', error);
        alert('보고서 생성 중 오류가 발생했습니다.');
    }
};

// CCTV AI 분석 함수
const performCCTVAnalysis = async (cctvData) => {
    try {
        console.log('🔍 CCTV AI 분석 시작:', cctvData);

        // CCTV 정보를 Python AI 서버로 전송
        const response = await fetch('http://localhost:8000/api/analyze-cctv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cctv_idx: cctvData.cctv_idx || cctvData.control_idx, // cctv_idx 또는 control_idx 사용
                cctv_url: cctvData.cctv_url,
                cctv_name: cctvData.cctv_name,
                lat: cctvData.lat,
                lon: cctvData.lon || cctvData.lng,
                analysis_type: 'cctv_realtime'
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ AI 분석 완료:', result);

            // 분석 결과를 상태에 저장하여 UI에 표시
            return result;
        } else {
            console.error('AI 분석 실패:', response.status);
            throw new Error(`AI 분석 실패: ${response.status}`);
        }
    } catch (error) {
        console.error('AI 분석 오류:', error);
        throw error;
    }
};

const Modals = ({ isOpen, onClose, markerType, markerData, isEditMode: initialEditMode = false, onUpdateComplete }) => {
    const [detailData, setDetailData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [isEditMode, setIsEditMode] = useState(initialEditMode);
    const [editFormData, setEditFormData] = useState({});
    const [updateLoading, setUpdateLoading] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
    const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
    const [cctvRiskData, setCctvRiskData] = useState(null);
    const [cctvRiskLoading, setCctvRiskLoading] = useState(false);

        // 종합점수와 도로점수용 색상 반환 함수 (10점 만점)
    const getTotalRoadScoreColor = (score) => {
        // console.log(`🚀 getTotalRoadScoreColor 함수 호출됨! 입력값: ${score}, 타입: ${typeof score}`);
        
        if (typeof score !== 'number' || isNaN(score)) {
            // console.log(`❌ 숫자가 아님: ${score} (${typeof score})`);
            return '#ccc';
         }
        
        // console.log(`🔍 종합/도로 점수 색상 계산: 점수=${score}`);
        
        if (score >= 0 && score < 2) {
            // console.log(`✅ 초록색 적용: ${score} >= 0 && ${score} < 2`);
            return '#4CAF50'; // 초록색
        }
        if (score >= 2 && score < 5) {
            // console.log(`✅ 노란색 적용: ${score} >= 2 && ${score} < 5`);
            return '#FFC107'; // 노란색
        }
        if (score >= 5 && score < 8) {
            // console.log(`✅ 주황색 적용: ${score} >= 5 && ${score} < 8`);
            return '#FF9800'; // 주황색
        }
        if (score >= 8) {
            // console.log(`✅ 빨간색 적용: ${score} >= 8`);
            return '#F44336'; // 빨간색
        }
        
        // console.log(`❌ 기본색 적용: ${score}는 어떤 범위에도 속하지 않음`);
        return '#ccc'; // 기본색
    };

    // 기상점수용 색상 반환 함수 (5점 만점, 2배로 계산)
    const getWeatherScoreColor = (score) => {
        if (typeof score !== 'number' || isNaN(score)) return '#ccc';
        
        // 기상 점수는 2배로 계산 (5점 → 10점으로 변환)
        const normalizedScore = score * 2;
        
        // console.log(`🔍 기상 점수 색상 계산: 원본 점수=${score}, 정규화된 점수=${normalizedScore}`);
        
        if (normalizedScore >= 0 && normalizedScore < 2) {
            // console.log(`✅ 초록색 적용: ${normalizedScore} >= 0 && ${normalizedScore} < 2`);
            return '#4CAF50'; // 초록색
        }
        if (normalizedScore >= 2 && normalizedScore < 5) {
            // console.log(`✅ 노란색 적용: ${normalizedScore} >= 2 && ${normalizedScore} < 5`);
            return '#FFC107'; // 노란색
        }
        if (normalizedScore >= 5 && normalizedScore < 8) {
            // console.log(`✅ 주황색 적용: ${normalizedScore} >= 5 && ${normalizedScore} < 8`);
            return '#FF9800'; // 주황색
        }
        if (normalizedScore >= 8) {
            // console.log(`✅ 빨간색 적용: ${normalizedScore} >= 8`);
            return '#F44336'; // 빨간색
        }
        
        // console.log(`❌ 기본색 적용: ${normalizedScore}는 어떤 범위에도 속하지 않음`);
        return '#ccc'; // 기본색
    };

    // CCTV 위험도 데이터 가져오기
    const fetchCCTVRiskData = async (cctvIdx) => {
        if (!cctvIdx) return;
        
        setCctvRiskLoading(true);
        try {
            console.log('🚀 CCTV 위험도 데이터 요청 시작:', cctvIdx);
            const response = await fetch(`http://localhost:3001/api/cctv/risk/${cctvIdx}`);
            console.log('📡 API 응답 상태:', response.status, response.ok);
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 CCTV 위험도 데이터 수신:', data);
                console.log('📊 데이터 타입 확인:', {
                    total_score: typeof data.total_score,
                    road_score: typeof data.road_score,
                    weather_score: typeof data.weather_score,
                    total_score_value: data.total_score,
                    road_score_value: data.road_score,
                    weather_score_value: data.weather_score
                });
                
                // 점수 데이터를 숫자로 변환
                const processedData = {
                    ...data,
                    total_score: parseFloat(data.total_score) || 0,
                    road_score: parseFloat(data.road_score) || 0,
                    weather_score: parseFloat(data.weather_score) || 0
                };
                
                console.log('🔄 변환된 데이터:', {
                    total_score: typeof processedData.total_score,
                    road_score: typeof processedData.road_score,
                    weather_score: typeof processedData.weather_score,
                    total_score_value: processedData.total_score,
                    road_score_value: processedData.road_score,
                    weather_score_value: processedData.weather_score
                });
                
                // 데이터 유효성 검사
                if (processedData.total_score === 0 && processedData.road_score === 0 && processedData.weather_score === 0) {
                    console.warn('⚠️ 모든 점수가 0입니다. 데이터베이스에 데이터가 없을 수 있습니다.');
                }
                
                setCctvRiskData(processedData);
            } else {
                console.error('❌ CCTV 위험도 데이터 조회 실패:', response.status);
                const errorText = await response.text();
                console.error('❌ 에러 상세:', errorText);
            }
        } catch (error) {
            console.error('❌ CCTV 위험도 데이터 조회 오류:', error);
        } finally {
            setCctvRiskLoading(false);
        }
    };

    // 마커 상세 정보 가져오기
    useEffect(() => {
        // ✅ isOpen이 true일 때만 실행
        if (!isOpen) {
            return;
        }

        console.log('🔍 Modals useEffect 실행:', { isOpen, markerData, isEditMode });

        // 모달이 열릴 때마다 AI 분석 결과 초기화
        setAiAnalysisResult(null);

        if (markerData) {
            // CCTV 모달인 경우 위험도 데이터 가져오기
            if (markerType === 'cctv' && markerData.cctv_idx) {
                fetchCCTVRiskData(markerData.cctv_idx);
            }

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
                            {/* {cctvData?.cctv_url && (
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
                            )} */}

                            <div className="risk-score">

                                {cctvRiskLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                                        <p>점수를 불러오는 중...</p>
                                    </div>
                                ) : cctvRiskData ? (
                                    <>
                                        {/* <div className="risk-gauge">
                                            <div className="risk-value">
                                                {typeof cctvRiskData.total_score === 'number'
                                                    ? cctvRiskData.total_score.toFixed(1)
                                                    : cctvRiskData.total_score || 'N/A'}
                                            </div>
                                        </div> */}
                                        <p>종합 위험도 점수 </p><p>탐지 일시 : {cctvRiskData.detected_at ? new Date(cctvRiskData.detected_at).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        }) : 'N/A'}</p>
                                                                                   <div className="score-circles">
                                              <div className="score-circle-container">
                                                  <div className="score-circle total-score" 
                                                       style={{
                                                           backgroundColor: getTotalRoadScoreColor(cctvRiskData.total_score),
                                                           '--dynamic-bg': getTotalRoadScoreColor(cctvRiskData.total_score)
                                                       }}>
                                                     <span className="score-number">
                                                         {typeof cctvRiskData.total_score === 'number'
                                                             ? cctvRiskData.total_score.toFixed(1)
                                                             : cctvRiskData.total_score || 'N/A'}
                                                     </span>
                                                  </div>
                                                  <span className="score-label">종합 점수</span>
                                              </div>
                                              <div className="score-circle-container">
                                                  <div className="score-circle road-score"
                                                       style={{
                                                           backgroundColor: getTotalRoadScoreColor(cctvRiskData.road_score),
                                                           '--dynamic-bg': getTotalRoadScoreColor(cctvRiskData.road_score)
                                                       }}>
                                                     <span className="score-number">
                                                         {typeof cctvRiskData.road_score === 'number'
                                                             ? cctvRiskData.road_score.toFixed(1)
                                                             : cctvRiskData.road_score || 'N/A'}
                                                     </span>
                                                  </div>
                                                  <span className="score-label">도로 점수</span>
                                              </div>
                                              <div className="score-circle-container">
                                                  <div className="score-circle weather-score"
                                                       style={{
                                                           backgroundColor: getWeatherScoreColor(cctvRiskData.weather_score),
                                                           '--dynamic-bg': getWeatherScoreColor(cctvRiskData.weather_score)
                                                       }}>
                                                     <span className="score-number">
                                                         {typeof cctvRiskData.weather_score === 'number'
                                                             ? cctvRiskData.weather_score.toFixed(1)
                                                             : cctvRiskData.weather_score || 'N/A'}
                                                     </span>
                                                  </div>
                                                  <span className="score-label">기상 점수</span>
                                              </div>
                                          </div>
                                
                                    </>
                                ) : (
                                    <>
                                        <div className="risk-gauge">
                                            <div className="risk-value">-</div>
                                        </div>
                                        <p>데이터 없음</p>
                                    </>
                                )}
                            </div>

                            <div className="analysis-results">
                                <div className="analysis-card">
                                    <h4>🚨 위험 감지 현황</h4>
                                    {cctvRiskLoading ? (
                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
                                            <p>위험도 데이터를 불러오는 중...</p>
                                        </div>
                                    ) : cctvRiskData ? (
                                        <div className="detections">
                                            <div className="detection-item">
                                                <span>균열 개수</span>
                                                <span className="marker-type-cctv">{cctvRiskData.crack_cnt || 0}건</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>포트홀 개수</span>
                                                <span className="marker-type-cctv">{cctvRiskData.break_cnt || 0}건</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>거북등 균열 개수</span>
                                                <span className="marker-type-cctv">{cctvRiskData.ali_crack_cnt || 0}건</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="detections">
                                            <div className="detection-item">
                                                <span>균열 개수</span>
                                                <span className="marker-type-cctv">-</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>포트홀 개수</span>
                                                <span className="marker-type-cctv">-</span>
                                            </div>
                                            <div className="detection-item">
                                                <span>거북등 균열 개수</span>
                                                <span className="marker-type-cctv">-</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="recommendations-card">
                                    <h4>💡 권장사항</h4>
                                    <ul>
                                        <li>교통 신호 개선 필요</li>
                                        <li>보행자 횡단보도 안전장치 설치 검토</li>
                                        <li>정기적인 CCTV 점검 및 유지보수</li>
                                    </ul>
                                </div>
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

    // CCTV AI 분석 핸들러
    const handleCCTVAnalysis = async () => {
        if (!detailData?.detail) {
            alert('CCTV 정보를 불러올 수 없습니다.');
            return;
        }

        try {
            setAiAnalysisLoading(true);
            setAiAnalysisResult(null);

            console.log('🚀 CCTV AI 분석 시작');
            const result = await performCCTVAnalysis(detailData.detail);

            // AI 분석 완료 후 모달 새로고침
            alert('AI 분석이 완료되었습니다!');
            
            // CCTV 위험도 데이터 다시 가져오기
            if (markerData?.cctv_idx) {
                await fetchCCTVRiskData(markerData.cctv_idx);
            }
            
            // AI 분석 결과 설정
            setAiAnalysisResult(result);

        } catch (error) {
            console.error('CCTV AI 분석 실패:', error);
            alert(`AI 분석 실패: ${error.message}`);
        } finally {
            setAiAnalysisLoading(false);
        }
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
                    <button
                        className="btn btn-warning"
                        onClick={markerType === 'cctv' ? () => handleCCTVAnalysis() : undefined}
                        disabled={markerType === 'cctv' && aiAnalysisLoading}
                    >
                        {markerType === 'cctv' && (aiAnalysisLoading ? '분석 중...' : '상세 분석')}
                        {markerType === 'construction' && '공사 일정'}
                        {markerType === 'flood' && '긴급 신고'}
                        {markerType === 'complaint' && '긴급 출동'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modals;
