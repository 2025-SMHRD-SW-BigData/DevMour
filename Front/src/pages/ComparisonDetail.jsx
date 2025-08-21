import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';

const ComparisonDetail = () => {
    const nav = useNavigate();

    const comparisonData = {
        complaints: {
            current: 156,
            previous: 240,
            change: -35,
            trend: '감소'
        },
        riskScore: {
            current: 6.5,
            previous: 8.2,
            change: -20.7,
            trend: '개선'
        },
        accidents: {
            current: 23,
            previous: 31,
            change: -25.8,
            trend: '감소'
        },
        maintenance: {
            current: 89,
            previous: 67,
            change: 32.8,
            trend: '증가'
        }
    };

    const monthlyData = [
        { month: '1월', complaints: 145, riskScore: 7.8, accidents: 28 },
        { month: '2월', complaints: 132, riskScore: 7.2, accidents: 25 },
        { month: '3월', complaints: 158, riskScore: 8.1, accidents: 32 },
        { month: '4월', complaints: 167, riskScore: 7.9, accidents: 29 },
        { month: '5월', complaints: 189, riskScore: 8.5, accidents: 35 },
        { month: '6월', complaints: 178, riskScore: 8.3, accidents: 33 },
        { month: '7월', complaints: 156, riskScore: 6.5, accidents: 23 }
    ];

    const getTrendColor = (trend) => {
        return trend === '감소' || trend === '개선' ? '#4CAF50' : '#F44336';
    };

    const getTrendIcon = (trend) => {
        return trend === '감소' || trend === '개선' ? '📉' : '📈';
    };

    return (
        <div className="detail-container">
            <div className="detail-header">
                <h1>📊 전년도 동기간 대비 상세</h1>
                <button className="back-btn" onClick={() => nav('/')}>
                    ← 대시보드로 돌아가기
                </button>
            </div>

            <div className="detail-content">
                <div className="overview-section">
                    <h2>🎯 전체 현황 요약</h2>
                    <div className="overview-grid">
                        <div className="overview-card">
                            <h3>📋 민원 건수</h3>
                            <div className="overview-numbers">
                                <div className="current-number">{comparisonData.complaints.current}건</div>
                                <div className="previous-number">전년: {comparisonData.complaints.previous}건</div>
                            </div>
                            <div className="change-indicator" style={{ color: getTrendColor(comparisonData.complaints.trend) }}>
                                {getTrendIcon(comparisonData.complaints.trend)} {comparisonData.complaints.change}%
                            </div>
                        </div>

                        <div className="overview-card">
                            <h3>⚠️ 위험도 점수</h3>
                            <div className="overview-numbers">
                                <div className="current-number">{comparisonData.riskScore.current}점</div>
                                <div className="previous-number">전년: {comparisonData.riskScore.previous}점</div>
                            </div>
                            <div className="change-indicator" style={{ color: getTrendColor(comparisonData.riskScore.trend) }}>
                                {getTrendIcon(comparisonData.riskScore.trend)} {comparisonData.riskScore.change}%
                            </div>
                        </div>

                        <div className="overview-card">
                            <h3>🚨 교통사고</h3>
                            <div className="overview-numbers">
                                <div className="current-number">{comparisonData.accidents.current}건</div>
                                <div className="previous-number">전년: {comparisonData.accidents.previous}건</div>
                            </div>
                            <div className="change-indicator" style={{ color: getTrendColor(comparisonData.accidents.trend) }}>
                                {getTrendIcon(comparisonData.accidents.trend)} {comparisonData.accidents.change}%
                            </div>
                        </div>

                        <div className="overview-card">
                            <h3>🔧 유지보수</h3>
                            <div className="overview-numbers">
                                <div className="current-number">{comparisonData.maintenance.current}건</div>
                                <div className="previous-number">전년: {comparisonData.maintenance.previous}건</div>
                            </div>
                            <div className="change-indicator" style={{ color: getTrendColor(comparisonData.maintenance.trend) }}>
                                {getTrendIcon(comparisonData.maintenance.trend)} {comparisonData.maintenance.change}%
                            </div>
                        </div>
                    </div>
                </div>

                <div className="monthly-trend-section">
                    <h2>📈 월별 추이 분석</h2>
                    <div className="monthly-chart">
                        {monthlyData.map((item, index) => (
                            <div key={index} className="monthly-item">
                                <div className="month-label">{item.month}</div>
                                <div className="monthly-metrics">
                                    <div className="metric">
                                        <span className="metric-label">민원</span>
                                        <span className="metric-value">{item.complaints}건</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">위험도</span>
                                        <span className="metric-value">{item.riskScore}점</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-label">사고</span>
                                        <span className="metric-value">{item.accidents}건</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="analysis-section">
                    <h2>🔍 상세 분석 결과</h2>
                    <div className="analysis-grid">
                        <div className="analysis-card positive">
                            <h3>✅ 개선된 항목</h3>
                            <ul>
                                <li>민원 건수 35% 감소 - 시스템 개선 효과</li>
                                <li>위험도 점수 20.7% 개선 - 안전시설 강화</li>
                                <li>교통사고 25.8% 감소 - 교통안전 정책 성과</li>
                            </ul>
                        </div>
                        <div className="analysis-card attention">
                            <h3>⚠️ 주의 필요 항목</h3>
                            <ul>
                                <li>유지보수 건수 32.8% 증가 - 노후화 대응</li>
                                <li>여전히 높은 위험도 구간 존재</li>
                                <li>계절별 변동성 증가</li>
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
                            <li>노후 시설물 교체 계획 수립</li>
                            <li>데이터 기반 예측 분석 강화</li>
                            <li>지역별 맞춤형 안전 정책</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonDetail;
