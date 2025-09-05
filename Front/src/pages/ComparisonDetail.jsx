import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';

// 원그래프 컴포넌트
const PieChart = ({ currentValue, previousValue, label, unit = '', maxValue = null }) => {
    const total = (currentValue || 0) + (previousValue || 0);
    const currentPercentage = total > 0 ? (currentValue || 0) / total : 0;
    const previousPercentage = total > 0 ? (previousValue || 0) / total : 0;
    
    // 원그래프 크기 계산
    const size = 200;
    const radius = 80;
    const strokeWidth = 40;
    
    // SVG 중심점
    const centerX = size / 2;
    const centerY = size / 2;
    
    // 원그래프 경로 계산
    const circumference = 2 * Math.PI * radius;
    
    // 수치에 따른 색상 결정 (작은 수치: 회색, 큰 수치: 빨간색)
    const isCurrentLarger = (currentValue || 0) > (previousValue || 0);
    const largerColor = "#F44336"; // 빨간색
    const smallerColor = "#9E9E9E"; // 회색
    
    // 현재값과 전년값 중 큰 값과 작은 값 구분
    const largerValue = Math.max(currentValue || 0, previousValue || 0);
    const smallerValue = Math.min(currentValue || 0, previousValue || 0);
    
    // 큰 값과 작은 값의 색상 할당
    const largerStrokeDasharray = (largerValue / total) * circumference;
    const smallerStrokeDasharray = (smallerValue / total) * circumference;

    return (
        <div className="pie-chart-container">
            <div className="chart-label">{label}</div>
            <div className="chart-content">
                <div className="pie-chart">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        {total > 0 ? (
                            <>
                                {/* 큰 값 구간 (주황색) */}
                                <circle
                                    cx={centerX}
                                    cy={centerY}
                                    r={radius}
                                    fill="none"
                                    stroke="url(#largerGradient)"
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${largerStrokeDasharray} ${circumference}`}
                                    strokeDashoffset="0"
                                    transform="rotate(-90 100 100)"
                                />
                                {/* 작은 값 구간 (노란색) */}
                                <circle
                                    cx={centerX}
                                    cy={centerY}
                                    r={radius}
                                    fill="none"
                                    stroke="url(#smallerGradient)"
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${smallerStrokeDasharray} ${circumference}`}
                                    strokeDashoffset={`-${largerStrokeDasharray}`}
                                    transform="rotate(-90 100 100)"
                                />

                                {/* 그라데이션 정의 */}
                                <defs>
                                    <linearGradient id="largerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#F44336" />
                                        <stop offset="100%" stopColor="#D32F2F" />
                                    </linearGradient>
                                    <linearGradient id="smallerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#9E9E9E" />
                                        <stop offset="100%" stopColor="#757575" />
                                    </linearGradient>
                                </defs>
                            </>
                        ) : (
                            <circle
                                cx={centerX}
                                cy={centerY}
                                r={radius}
                                fill="none"
                                stroke="#e9ecef"
                                strokeWidth={strokeWidth}
                            />
                        )}
                    </svg>

                    {/* 중앙 정보 표시 - 증감률 */}
                    <div className="chart-center">
                        <div className="change-rate" style={{
                            color: (currentValue || 0) > (previousValue || 0) ? '#F44336' : '#2196F3'
                        }}>
                            {(currentValue || 0) > (previousValue || 0) ? '+' : ''}
                            {previousValue && previousValue > 0 
                                ? (((currentValue || 0) - previousValue) / previousValue * 100).toFixed(2)
                                : '0.00'
                            }%
                        </div>
                        <div className="change-label">
                            {(currentValue || 0) > (previousValue || 0) ? '증가' : '감소'}
                        </div>
                    </div>
                </div>

                {/* 범례 */}
                <div className="chart-legend">
                    <div className="legend-item">
                        <div className="legend-color smaller"></div>
                        <div className="legend-text">
                            <div className="legend-label">작은 수치</div>
                            <div className="legend-count">{smallerValue}{unit}</div>
                            <div className="legend-percentage">{total > 0 ? (smallerValue / total * 100).toFixed(1) : 0}%</div>
                        </div>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color larger"></div>
                        <div className="legend-text">
                            <div className="legend-label">큰 수치</div>
                            <div className="legend-count">{largerValue}{unit}</div>
                            <div className="legend-percentage">{total > 0 ? (largerValue / total * 100).toFixed(1) : 0}%</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const ComparisonDetail = () => {
    const nav = useNavigate();
    const [comparisonData, setComparisonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // API에서 데이터 가져오기
    useEffect(() => {
        const fetchComparisonData = async () => {
            try {
                setLoading(true);
               // const response = await fetch('http://175.45.194.114:3001/api/yearlycomparison/summary');
               const response = await fetch('/api/yearlycomparison/summary');
                if (!response.ok) {
                    throw new Error('데이터를 가져오는데 실패했습니다.');
                }
                const data = await response.json();
                setComparisonData(data);
            } catch (err) {
                setError(err.message);
                console.error('데이터 조회 실패:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchComparisonData();
    }, []);

    const getTrendColor = (current, previous) => {
        if (!current || !previous) return '#666';
        return current < previous ? '#4CAF50' : current > previous ? '#F44336' : '#FF9800';
    };

    const getTrendIcon = (current, previous) => {
        if (!current || !previous) return '➖';
        return current < previous ? '📉' : current > previous ? '📈' : '➖';
    };

    const calculateChange = (current, previous) => {
        if (!current || !previous) return 0;
        return ((current - previous) / previous * 100).toFixed(1);
    };

    const getTrendText = (current, previous) => {
        if (!current || !previous) return '변화 없음';
        return current < previous ? '감소' : current > previous ? '증가' : '동일';
    };

    if (loading) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <h1>
                    {/* 🖼️ 로고 이미지 */}
                    <img
                    src="./도로시마크 (1).png" // public 폴더에 있는 이미지
                    alt="로고"
                    style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px'
                    }}
                    />
                    <img
                    src="./Doro-see.png" // public 폴더에 있는 이미지
                    alt="로고"
                    style={{
                    width: '80px',
                    height: '50px',
                    borderRadius: '8px'
                    }} />
                    📊 전년 대비 추이 분석</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                         대시보드로 돌아가기
                    </button>
                </div>
                <div className="loading">데이터를 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <h1>
                    {/* 🖼️ 로고 이미지 */}
                    <img
                    src="./도로시마크 (1).png" // public 폴더에 있는 이미지
                    alt="로고"
                    style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px'
                    }}
                    />
                    <img
                    src="./Doro-see.png" // public 폴더에 있는 이미지
                    alt="로고"
                    style={{
                    width: '80px',
                    height: '50px',
                    borderRadius: '8px'
                    }} />
                    📊 전년 대비 추이 분석</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                         대시보드로 돌아가기
                    </button>
                </div>
                <div className="error">오류가 발생했습니다: {error}</div>
            </div>
        );
    }

    if (!comparisonData) {
        return (
            <div className="detail-container">
                <div className="detail-header">
                    <h1>
                    {/* 🖼️ 로고 이미지 */}
                    <img
                    src="./도로시마크 (1).png" // public 폴더에 있는 이미지
                    alt="로고"
                    style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px'
                    }}
                    />
                    <img
                    src="./Doro-see.png" // public 폴더에 있는 이미지
                    alt="로고"
                    style={{
                    width: '80px',
                    height: '50px',
                    borderRadius: '8px'
                    }} />
                    📊 전년 대비 추이 분석</h1>
                    <button className="back-btn" onClick={() => nav('/dashboard')}>
                         대시보드로 돌아가기
                    </button>
                </div>
                <div className="error">데이터가 없습니다.</div>
            </div>
        );
    }

    const currentMonth = comparisonData.month;
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    return (
        <div className="detail-container">
            <div className="detail-header">
                <h1>
                    {/* 🖼️ 로고 이미지 */}
                    <img
                    src="./도로시마크 (1).png" // public 폴더에 있는 이미지
                    alt="로고"
                    style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px'
                    }}
                    />
                    <img
                    src="./Doro-see.png" // public 폴더에 있는 이미지
                    alt="로고"
                    style={{
                    width: '80px',
                    height: '50px',
                    borderRadius: '8px'
                    }} />
                    📊 전년 대비 추이 분석</h1>
                <p className="period-info">{currentMonth}월 기준 {lastYear}년 vs {currentYear}년 비교</p>
                <button className="back-btn" onClick={() => nav('/dashboard')}>
                     대시보드로 돌아가기
                </button>
            </div>

            <div className="detail-content">
                <div className="overview-section">
                    <h2>🎯 전체 현황 요약</h2>
                    <div className="overview-grid">
                        <div className="overview-card">
                            <h3>⚠️ 위험도 예측</h3>
                            <div className="overview-numbers">
                                <div className="current-number">
                                    {comparisonData.riskPrediction?.currentYear?.count || 0}건
                                </div>
                                <div className="previous-number">
                                    전년: {comparisonData.riskPrediction?.lastYear?.count || 0}건
                                </div>
                            </div>
                            <div className="change-indicator"
                                style={{
                                    color: getTrendColor(
                                        comparisonData.riskPrediction?.currentYear?.count,
                                        comparisonData.riskPrediction?.lastYear?.count
                                    )
                                }}>
                                {getTrendIcon(
                                    comparisonData.riskPrediction?.currentYear?.count,
                                    comparisonData.riskPrediction?.lastYear?.count
                                )} {calculateChange(
                                    comparisonData.riskPrediction?.currentYear?.count,
                                    comparisonData.riskPrediction?.lastYear?.count
                                )}%
                            </div>
                            <div className="avg-risk-score">
                                평균 위험도: {comparisonData.riskPrediction?.currentYear?.avgRiskScore?.toFixed(1) || 0}점
                                <br />
                                전년: {comparisonData.riskPrediction?.lastYear?.avgRiskScore?.toFixed(1) || 0}점
                            </div>
                        </div>

                        <div className="overview-card">
                            <h3>📋 시민 제보</h3>
                            <div className="overview-numbers">
                                <div className="current-number">
                                    {comparisonData.citizenReport?.currentYear?.count || 0}건
                                </div>
                                <div className="previous-number">
                                    전년: {comparisonData.citizenReport?.lastYear?.count || 0}건
                                </div>
                            </div>
                            <div className="change-indicator"
                                style={{
                                    color: getTrendColor(
                                        comparisonData.citizenReport?.currentYear?.count,
                                        comparisonData.citizenReport?.lastYear?.count
                                    )
                                }}>
                                {getTrendIcon(
                                    comparisonData.citizenReport?.currentYear?.count,
                                    comparisonData.citizenReport?.lastYear?.count
                                )} {calculateChange(
                                    comparisonData.citizenReport?.currentYear?.count,
                                    comparisonData.citizenReport?.lastYear?.count
                                )}%
                            </div>
                        </div>

                        <div className="overview-card">
                            <h3>🌧️ 강수량</h3>
                            <div className="overview-numbers">
                                <div className="current-number">
                                    {comparisonData.weather?.currentYear?.avgPrecipitation?.toFixed(1) || 0}mm
                                </div>
                                <div className="previous-number">
                                    전년: {comparisonData.weather?.lastYear?.avgPrecipitation?.toFixed(1) || 0}mm
                                </div>
                            </div>
                            <div className="change-indicator"
                                style={{
                                    color: getTrendColor(
                                        comparisonData.weather?.currentYear?.avgPrecipitation,
                                        comparisonData.weather?.lastYear?.avgPrecipitation
                                    )
                                }}>
                                {getTrendIcon(
                                    comparisonData.weather?.currentYear?.avgPrecipitation,
                                    comparisonData.weather?.lastYear?.avgPrecipitation
                                )} {calculateChange(
                                    comparisonData.weather?.currentYear?.avgPrecipitation,
                                    comparisonData.weather?.lastYear?.avgPrecipitation
                                )}%
                            </div>
                        </div>

                        <div className="overview-card">
                            <h3>🌡️ 평균 기온</h3>
                            <div className="overview-numbers">
                                <div className="current-number">
                                    {comparisonData.weather?.currentYear?.avgTemp?.toFixed(1) || 0}°C
                                </div>
                                <div className="previous-number">
                                    전년: {comparisonData.weather?.lastYear?.avgTemp?.toFixed(1) || 0}°C
                                </div>
                            </div>
                            <div className="change-indicator"
                                style={{
                                    color: getTrendColor(
                                        comparisonData.weather?.currentYear?.avgTemp,
                                        comparisonData.weather?.lastYear?.avgTemp
                                    )
                                }}>
                                {getTrendIcon(
                                    comparisonData.weather?.currentYear?.avgTemp,
                                    comparisonData.weather?.lastYear?.avgTemp
                                )} {calculateChange(
                                    comparisonData.weather?.currentYear?.avgTemp,
                                    comparisonData.weather?.lastYear?.avgTemp
                                )}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="monthly-trend-section">
                    <h2>📈 {currentMonth}월 전년 대비 상세 비교</h2>
                    <div className="comparison-grid">
                        <div className="comparison-item">
                            <h3>⚠️ 위험도 예측 현황</h3>
                            <div className="chart-section">
                                <PieChart
                                    currentValue={comparisonData.riskPrediction?.currentYear?.count || 0}
                                    previousValue={comparisonData.riskPrediction?.lastYear?.count || 0}
                                    label="건수 비교"
                                    unit="건"
                                />
                                <PieChart
                                    currentValue={comparisonData.riskPrediction?.currentYear?.avgRiskScore || 0}
                                    previousValue={comparisonData.riskPrediction?.lastYear?.avgRiskScore || 0}
                                    label="평균 위험도 비교"
                                    unit="점"
                                    maxValue={10}
                                />
                            </div>
                        </div>

                        <div className="comparison-item">
                            <h3>📋 시민 제보 현황</h3>
                            <div className="chart-section">
                                <PieChart
                                    currentValue={comparisonData.citizenReport?.currentYear?.count || 0}
                                    previousValue={comparisonData.citizenReport?.lastYear?.count || 0}
                                    label="제보 건수 비교"
                                    unit="건"
                                />
                            </div>
                        </div>

                        <div className="comparison-item">
                            <h3>🌤️ 기상 현황</h3>
                            <div className="chart-section">
                                <PieChart
                                    currentValue={comparisonData.weather?.currentYear?.avgPrecipitation || 0}
                                    previousValue={comparisonData.weather?.lastYear?.avgPrecipitation || 0}
                                    label="평균 강수량 비교"
                                    unit="mm"
                                />
                                <PieChart
                                    currentValue={comparisonData.weather?.currentYear?.avgTemp || 0}
                                    previousValue={comparisonData.weather?.lastYear?.avgTemp || 0}
                                    label="평균 기온 비교"
                                    unit="°C"
                                />
                                <PieChart
                                    currentValue={comparisonData.weather?.currentYear?.avgSnowfall || 0}
                                    previousValue={comparisonData.weather?.lastYear?.avgSnowfall || 0}
                                    label="평균 강설량 비교"
                                    unit="cm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="analysis-section">
                    <h2>🔍 분석 결과</h2>
                    <div className="analysis-grid">
                        <div className="analysis-card positive">
                            <h3>✅ 개선된 항목</h3>
                            <ul>
                                {comparisonData.riskPrediction?.currentYear?.avgRiskScore < comparisonData.riskPrediction?.lastYear?.avgRiskScore && (
                                    <li>위험도 점수 개선 - 안전시설 강화 효과</li>
                                )}
                                {comparisonData.citizenReport?.currentYear?.count < comparisonData.citizenReport?.lastYear?.count && (
                                    <li>시민 제보 건수 감소 - 문제 해결 개선</li>
                                )}
                                {comparisonData.weather?.currentYear?.avgPrecipitation < comparisonData.weather?.lastYear?.avgPrecipitation && (
                                    <li>강수량 감소 - 기상 조건 개선</li>
                                )}
                            </ul>
                        </div>
                        <div className="analysis-card attention">
                            <h3>⚠️ 주의 필요 항목</h3>
                            <ul>
                                {comparisonData.riskPrediction?.currentYear?.avgRiskScore > comparisonData.riskPrediction?.lastYear?.avgRiskScore && (
                                    <li>위험도 점수 증가 - 추가 안전 조치 필요</li>
                                )}
                                {comparisonData.citizenReport?.currentYear?.count > comparisonData.citizenReport?.lastYear?.count && (
                                    <li>시민 제보 건수 증가 - 문제 상황 악화</li>
                                )}
                                {comparisonData.weather?.currentYear?.avgPrecipitation > comparisonData.weather?.lastYear?.avgPrecipitation && (
                                    <li>강수량 증가 - 기상 조건 악화</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="action-cards">
                    <div className="action-card">
                        <h3>📈 성공 요인</h3>
                        <ul>
                            <li>실시간 모니터링 시스템 도입</li>
                            <li>예방적 유지보수 체계 구축</li>
                            <li>시민 참여형 안전 관리</li>
                        </ul>
                    </div>
                    <div className="action-card">
                        <h3>💡 개선 방안</h3>
                        <ul>
                            <li>데이터 기반 예측 분석 강화</li>
                            <li>지역별 맞춤형 안전 정책</li>
                            <li>기상 조건에 따른 대응 체계 구축</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonDetail;
