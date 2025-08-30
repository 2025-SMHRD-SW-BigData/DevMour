import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../utils/api';
import '../Dashboard.css';
import './DetailPages.css';

const RiskScoreDetail = () => {
    const nav = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [top10Scores, setTop10Scores] = useState([]);
    const [roadAnalysis, setRoadAnalysis] = useState({
        totalCrackCnt: 0,
        totalBreakCnt: 0,
        totalAliCrackCnt: 0
    });
    const [averageScore, setAverageScore] = useState(0);
    const [showCCTVModal, setShowCCTVModal] = useState(false);
    const [selectedCCTV, setSelectedCCTV] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // 상위 10개 종합 위험도 데이터 가져오기
            const top10Response = await apiGet('/total/top10');
            setTop10Scores(top10Response.data || []);
            
            // 전체 도로 상태 분석 데이터 가져오기
            const analysisResponse = await apiGet('/total/analysis');
            setRoadAnalysis(analysisResponse.data || {
                totalCrackCnt: 0,
                totalBreakCnt: 0,
                totalAliCrackCnt: 0
            });
            
            // 상위 10개 평균 점수 계산
            if (top10Response.data && top10Response.data.length > 0) {
                const avgScore = top10Response.data.reduce((sum, item) => sum + parseFloat(item.total_score), 0) / top10Response.data.length;
                setAverageScore(parseFloat(avgScore.toFixed(1)));
            }
            
        } catch (err) {
            console.error('데이터 로딩 오류:', err);
            setError('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getRiskLevel = (score) => {
        if (score >= 8) return { level: '매우 위험', color: '#F44336', emoji: '🔴' };
        if (score >= 6) return { level: '위험', color: '#FF9800', emoji: '🟠' };
        if (score >= 4) return { level: '경고', color: '#FFC107', emoji: '🟡' };
        return { level: '낮음', color: '#4CAF50', emoji: '🟢' };
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}-${date.getDate()}`;
    };

    const handleCCTVClick = (cctvData) => {
        setSelectedCCTV(cctvData);
        setShowCCTVModal(true);
    };

    const closeCCTVModal = () => {
        setShowCCTVModal(false);
        setSelectedCCTV(null);
    };

    if (loading) {
        return (
            <div className="detail-container">
                <div className="loading">데이터를 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-container">
                <div className="error">오류: {error}</div>
                <button onClick={fetchData}>다시 시도</button>
            </div>
        );
    }

    const averageRisk = getRiskLevel(averageScore);

    return (
        <div className="detail-container">
            <div className="detail-header">
                <h1>📊 도로 종합 위험도 점수 상세</h1>
                <button className="back-btn" onClick={() => nav('/dashboard')}>
                     대시보드로 돌아가기
                </button>
            </div>

            <div className="detail-content">
                <div className="three-column-layout">
                    {/* 왼쪽 컬럼: 상위 10개 종합 위험도 + 전체 도로 상태 분석 */}
                    <div className="left-column">
                        <div className="main-score-card">
                            <h2>🎯 상위 10개 평균 종합 위험도</h2>
                            <div className="score-display" style={{ borderColor: averageRisk.color }}>
                                <div className="main-score" style={{ color: averageRisk.color }}>
                                    {averageScore}
                                </div>
                                <div className="score-label">
                                    {averageRisk.emoji} {averageRisk.level} 수준
                                </div>
                                <div className="score-description">
                                </div>
                            </div>
                        </div>

                                                 <div className="overview-section">
                             <h2>📈 전체 도로 상태 분석</h2>
                             <div className="breakdown-grid">
                                 <div className="breakdown-item">
                                     <div className="breakdown-label">총 균열 개수</div>
                                     <div className="breakdown-score" style={{ color: '#F44336' }}>
                                         {roadAnalysis.totalCrackCnt.toLocaleString()}
                                     </div>
                                     <div className="breakdown-level">개</div>
                                 </div>
                                 <div className="breakdown-item">
                                     <div className="breakdown-label">총 포트홀 개수</div>
                                     <div className="breakdown-score" style={{ color: '#FF9800' }}>
                                         {roadAnalysis.totalBreakCnt.toLocaleString()}
                                     </div>
                                     <div className="breakdown-level">개</div>
                                 </div>
                                 <div className="breakdown-item">
                                     <div className="breakdown-label">총 거북등 균열 개수</div>
                                     <div className="breakdown-score" style={{ color: '#FFC107' }}>
                                         {roadAnalysis.totalAliCrackCnt.toLocaleString()}
                                     </div>
                                     <div className="breakdown-level">개</div>
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* 가운데 컬럼: 최근 날씨 정보 + 주의사항 + 개선목표 */}
                    <div className="center-column">
                        <div className="weather-section">
                            <h2>🌤️ 최근 날씨 정보</h2>
                            <div className="weather-grid">
                                {top10Scores.slice(0, 5).map((item, index) => (
                                    <div key={index} className="weather-item">
                                        <div className="weather-header">
                                            <span className="cctv-label">{item.cctv_name}</span>
                                            <span className="weather-type">{item.wh_type}</span>
                                        </div>
                                        <div className="weather-details">
                                            <div className="weather-info">
                                                <span>기온: {item.temp}°C</span>
                                                <span>강수량: {item.precipitation}mm</span>
                                            </div>
                                            {item.snowfall > 0 && (
                                                <div className="snowfall">강설량: {item.snowfall}mm</div>
                                            )}
                                        </div>
                                        {/* <div className="detection-time">
                                            {formatDate(item.detected_at)}
                                        </div> */}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="action-cards">
                            <div className="action-card">
                                <h3>⚠️ 주의사항</h3>
                                <ul>
                                    <li>높은 위험도 구간 우선 점검 및 보수</li>
                                    <li>날씨 악화 시 도로 상태 모니터링 강화</li>
                                    <li>균열 및 포트홀 발생 구간 정기 점검</li>
                                </ul>
                            </div>
                            <div className="action-card">
                                <h3>📈 개선 목표</h3>
                                <ul>
                                    <li>상위 10개 구간 평균 위험도 6.0 이하 달성</li>
                                    <li>전체 균열 개수 10% 감소</li>
                                    <li>포트홀 발생률 최소화</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽 컬럼: 상위 10개 CCTV 구간별 점수 리스트 */}
                    <div className="right-column">
                        <div className="ranking-list">
                            <h2>상위 10개 CCTV 구간별 점수</h2>
                            <div className="score-list">
                                {top10Scores.map((item, index) => {
                                    const risk = getRiskLevel(item.total_score);
                                    return (
                                        <div 
                                            key={item.total_idx} 
                                            className="score-item clickable"
                                            onClick={() => handleCCTVClick(item)}
                                        >
                                            <div className="rank">{index + 1}</div>
                                            <div className="cctv-info">
                                                <div className="cctv-name">{item.cctv_name}</div>
                                                <div className="location">({item.lat.toFixed(6)}, {item.lon.toFixed(6)})</div>
                                            </div>
                                            <div className="score-info">
                                                <div className="score" style={{ color: risk.color }}>
                                                    {item.total_score}
                                                </div>
                                                <div className="score-details">
                                                    <span>도로: {item.road_score}</span>
                                                    <span>날씨: {item.weather_score}</span>
                                                </div>
                                            </div>
                                            <div className="detection-time">
                                                {formatDate(item.detected_at)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CCTV 모달 */}
            {showCCTVModal && selectedCCTV && (
                <div className="modal-overlay" onClick={closeCCTVModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedCCTV.cctv_name} 상세 정보</h3>
                            <button className="modal-close" onClick={closeCCTVModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="cctv-detail-grid">
                                <div className="detail-item">
                                    <label>위치:</label>
                                    <span>({selectedCCTV.lat.toFixed(6)}, {selectedCCTV.lon.toFixed(6)})</span>
                                </div>
                                <div className="detail-item">
                                    <label>종합 위험도:</label>
                                    <span style={{ color: getRiskLevel(selectedCCTV.total_score).color }}>
                                        {selectedCCTV.total_score}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>도로 점수:</label>
                                    <span>{selectedCCTV.road_score}</span>
                                </div>
                                <div className="detail-item">
                                    <label>날씨 점수:</label>
                                    <span>{selectedCCTV.weather_score}</span>
                                </div>
                                <div className="detail-item">
                                    <label>균열 개수:</label>
                                    <span>{selectedCCTV.crack_cnt}개</span>
                                </div>
                                <div className="detail-item">
                                    <label>포트홀 개수:</label>
                                    <span>{selectedCCTV.break_cnt}개</span>
                                </div>
                                <div className="detail-item">
                                    <label>거북등 균열 개수:</label>
                                    <span>{selectedCCTV.ali_crack_cnt}개</span>
                                </div>
                                <div className="detail-item">
                                    <label>기온:</label>
                                    <span>{selectedCCTV.temp}°C</span>
                                </div>
                                <div className="detail-item">
                                    <label>강수량:</label>
                                    <span>{selectedCCTV.precipitation}mm</span>
                                </div>
                                <div className="detail-item">
                                    <label>날씨 구분:</label>
                                    <span>{selectedCCTV.wh_type}</span>
                                </div>
                                {selectedCCTV.snowfall > 0 && (
                                    <div className="detail-item">
                                        <label>강설량:</label>
                                        <span>{selectedCCTV.snowfall}mm</span>
                                    </div>
                                )}
                                <div className="detail-item">
                                    <label>탐지 시기:</label>
                                    <span>{new Date(selectedCCTV.detected_at).toLocaleString('ko-KR')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-primary" onClick={closeCCTVModal}>
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskScoreDetail;
