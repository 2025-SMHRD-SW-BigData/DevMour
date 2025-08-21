import React from 'react';
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
    if (!isOpen) return null;

    const renderCCTVModal = () => (
        <>
            <div className="modal-header cctv">
                <h2>{markerData?.icon || '📹'} CCTV 모니터링 - {markerData?.name || 'CCTV'}</h2>
                <span className="close" onClick={onClose}>&times;</span>
            </div>
            <div className="modal-body">
                <div className="cctv-feed">
                    <div className="feed-overlay">실시간 스트리밍</div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📹</div>
                        <p>CCTV 피드 연결 중...</p>
                        <small>위치: {markerData?.lat?.toFixed(6)}, {markerData?.lng?.toFixed(6)}</small>
                    </div>
                </div>

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
            </div>
        </>
    );

    const renderConstructionModal = () => (
        <>
            <div className="modal-header construction">
                <h2>{markerData?.icon || '🚧'} 공사 현황 - {markerData?.name || '공사중'}</h2>
                <span className="close" onClick={onClose}>&times;</span>
            </div>
            <div className="modal-body">
                <div className="construction-status">
                    <h4>🏗️ 공사 진행 상황</h4>
                    <p><strong>공사 종류:</strong> 도로 포장 공사</p>
                    <p><strong>시작일:</strong> 2024년 1월 15일</p>
                    <p><strong>예상 완료일:</strong> 2024년 3월 20일</p>
                    <p><strong>현재 단계:</strong> 포장층 시공 중</p>
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
            </div>
        </>
    );

    const renderFloodModal = () => (
        <>
            <div className="modal-header flood">
                <h2>{markerData?.icon || '🌊'} 침수 현황 - {markerData?.name || '침수'}</h2>
                <span className="close" onClick={onClose}>&times;</span>
            </div>
            <div className="modal-body">
                <div className="flood-info">
                    <h4>💧 침수 정보</h4>
                    <p><strong>침수 원인:</strong> 집중 호우</p>
                    <p><strong>침수 시작:</strong> 2024년 1월 20일 14:30</p>
                    <p><strong>현재 상태:</strong> 침수 지속 중</p>
                    <p><strong>영향 구간:</strong> 150m 구간</p>
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
            </div>
        </>
    );

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
