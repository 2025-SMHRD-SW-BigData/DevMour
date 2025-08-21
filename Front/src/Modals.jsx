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

const Modals = ({ isOpen, onClose, markerType, markerData }) => {
    const [detailData, setDetailData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState(false);

    // 마커 상세 정보 가져오기
    useEffect(() => {
        console.log('🔍 Modals useEffect 실행:', { isOpen, markerData });
        if (isOpen && markerData?.marker_id) {
            console.log('✅ 마커 상세 정보 요청:', markerData.marker_id);
            fetchMarkerDetail(markerData.marker_id);
        } else {
            console.log('❌ 마커 상세 정보 요청 조건 불충족:', { 
                isOpen, 
                hasMarkerData: !!markerData, 
                markerId: markerData?.marker_id 
            });
        }
    }, [isOpen, markerData]);

    const fetchMarkerDetail = async (markerId) => {
        console.log('🚀 fetchMarkerDetail 시작:', markerId);
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/marker/detail/${markerId}`);
            console.log('📡 API 응답:', response.status, response.ok);
            if (response.ok) {
                const data = await response.json();
                console.log('📊 받은 데이터:', data);
                setDetailData(data);
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
                            <div className="cctv-feed">
                                <div className="feed-overlay">실시간 스트리밍</div>
                                {cctvData?.cctv_url ? (
                                    <div className="video-player-container">
                                        {videoLoading && (
                                            <div className="video-loading">
                                                <div className="spinner"></div>
                                                <span>스트리밍 연결 중...</span>
                                            </div>
                                        )}
                                        {videoError && (
                                            <div className="video-loading">
                                                <div style={{ fontSize: '48px', marginBottom: '10px' }}>❌</div>
                                                <span>스트리밍 연결 실패</span>
                                                <p style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                                                    URL을 확인하거나 새 창에서 열어보세요
                                                </p>
                                            </div>
                                        )}
                                        <video 
                                            id="cctv-video-player"
                                            controls
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                maxHeight: '400px',
                                                backgroundColor: '#000',
                                                borderRadius: '8px',
                                                display: videoLoading || videoError ? 'none' : 'block'
                                            }}
                                            onLoadStart={handleVideoLoadStart}
                                            onCanPlay={handleVideoCanPlay}
                                            onError={handleVideoError}
                                        >
                                            <source src={cctvData.cctv_url} type="video/mp4" />
                                            <source src={cctvData.cctv_url} type="video/webm" />
                                            <source src={cctvData.cctv_url} type="video/ogg" />
                                            <source src={cctvData.cctv_url} type="application/x-mpegURL" />
                                            <source src={cctvData.cctv_url} type="video/MP2T" />
                                            브라우저가 비디오 태그를 지원하지 않습니다.
                                        </video>
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
                    <span className="close" onClick={onClose}>&times;</span>
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
                            <div className="construction-status">
                                <h4>🏗️ 공사 진행 상황</h4>
                                <p><strong>공사 종류:</strong> {controlData?.control_desc || '도로 포장 공사'}</p>
                                <p><strong>시작일:</strong> {controlData?.control_st_tm ? new Date(controlData.control_st_tm).toLocaleDateString('ko-KR') : '2024년 1월 15일'}</p>
                                <p><strong>예상 완료일:</strong> {controlData?.control_ed_tm ? new Date(controlData.control_ed_tm).toLocaleDateString('ko-KR') : '2024년 3월 20일'}</p>
                                <p><strong>현재 단계:</strong> 포장층 시공 중</p>
                                {controlData?.control_addr && (
                                    <p><strong>통제 주소:</strong> {controlData.control_addr}</p>
                                )}
                                <p><strong>위치:</strong> {controlLat?.toFixed(6) || 'N/A'}, {controlLon?.toFixed(6) || 'N/A'}</p>
                            </div>

                            <div className="construction-progress">
                                <h4>📈 공사 진행률</h4>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: '65%' }}></div>
                                </div>
                                <p>65% 완료 (예상 35일 남음)</p>
                            </div>

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
                    <span className="close" onClick={onClose}>&times;</span>
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
                            <div className="flood-info">
                                <h4>💧 침수 정보</h4>
                                <p><strong>침수 원인:</strong> 집중 호우</p>
                                <p><strong>침수 시작:</strong> {controlData?.control_st_tm ? new Date(controlData.control_st_tm).toLocaleString('ko-KR') : '2024년 1월 20일 14:30'}</p>
                                <p><strong>현재 상태:</strong> 침수 지속 중</p>
                                <p><strong>영향 구간:</strong> 150m 구간</p>
                                {controlData?.control_addr && (
                                    <p><strong>침수 주소:</strong> {controlData.control_addr}</p>
                                )}
                                {controlData?.control_desc && (
                                    <p><strong>상세 설명:</strong> {controlData.control_desc}</p>
                                )}
                                <p><strong>위치:</strong> {controlLat?.toFixed(6) || 'N/A'}, {controlLon?.toFixed(6) || 'N/A'}</p>
                            </div>

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
                </div>
            </>
        );
    };

    const renderModalContent = () => {
        switch (markerType) {
            case 'cctv':
                return renderCCTVModal();
            case 'construction':
                return renderConstructionModal();
            case 'flood':
                return renderFloodModal();
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
                    <button className="btn btn-warning">
                        {markerType === 'cctv' && '상세 분석'}
                        {markerType === 'construction' && '공사 일정'}
                        {markerType === 'flood' && '긴급 신고'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modals;
