import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';

const RiskScoreDetail = () => {
    const nav = useNavigate();

    const riskData = {
        overall: 6.5,
        breakdown: {
            traffic: 7.2,
            weather: 5.8,
            construction: 6.1,
            maintenance: 7.0,
            accidents: 6.4
        },
        trends: [
            { date: '01-15', score: 6.8 },
            { date: '01-16', score: 6.5 },
            { date: '01-17', score: 6.9 },
            { date: '01-18', score: 6.3 },
            { date: '01-19', score: 6.7 },
            { date: '01-20', score: 6.2 },
            { date: '01-21', score: 6.5 }
        ],
        factors: [
            { name: '교통량 증가', impact: '높음', description: '출퇴근 시간 교통량 15% 증가' },
            { name: '기상 악화', impact: '보통', description: '습도 증가로 도로 미끄러움' },
            { name: '공사 구간', impact: '보통', description: '4개 구간에서 공사 진행 중' },
            { name: '신호등 고장', impact: '높음', description: '2개 교차로에서 신호등 점검 필요' }
        ]
    };

    const getRiskLevel = (score) => {
        if (score >= 8) return { level: '매우 높음', color: '#F44336', emoji: '🔴' };
        if (score >= 6) return { level: '높음', color: '#FF9800', emoji: '🟠' };
        if (score >= 4) return { level: '보통', color: '#FFC107', emoji: '🟡' };
        return { level: '낮음', color: '#4CAF50', emoji: '🟢' };
    };

    const overallRisk = getRiskLevel(riskData.overall);

    return (
        <div className="detail-container">
            <div className="detail-header">
                <h1>📊 종합 위험도 점수 상세</h1>
                <button className="back-btn" onClick={() => nav('/dashboard')}>
                     대시보드로 돌아가기
                </button>
            </div>

            <div className="detail-content">
                <div className="main-score-card">
                    <h2>🎯 오늘 종합 위험도</h2>
                    <div className="score-display" style={{ borderColor: overallRisk.color }}>
                        <div className="main-score" style={{ color: overallRisk.color }}>
                            {riskData.overall}
                        </div>
                        <div className="score-label">
                            {overallRisk.emoji} {overallRisk.level} 수준
                        </div>
                        <div className="score-description">
                            10점 만점 기준 (낮을수록 안전)
                        </div>
                    </div>
                </div>

                <div className="breakdown-section">
                    <h2>📈 세부 위험도 분석</h2>
                    <div className="breakdown-grid">
                        {Object.entries(riskData.breakdown).map(([key, score]) => {
                            const risk = getRiskLevel(score);
                            const labels = {
                                traffic: '교통량',
                                weather: '기상',
                                construction: '공사',
                                maintenance: '유지보수',
                                accidents: '사고'
                            };
                            return (
                                <div key={key} className="breakdown-item">
                                    <div className="breakdown-label">{labels[key]}</div>
                                    <div className="breakdown-score" style={{ color: risk.color }}>
                                        {score}
                                    </div>
                                    <div className="breakdown-level">{risk.level}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="trend-section">
                    <h2>📊 최근 7일 추이</h2>
                    <div className="trend-chart">
                        {riskData.trends.map((item, index) => (
                            <div key={index} className="trend-bar">
                                <div className="trend-date">{item.date}</div>
                                <div className="trend-bar-container">
                                    <div 
                                        className="trend-bar-fill" 
                                        style={{ 
                                            height: `${(item.score / 10) * 100}%`,
                                            backgroundColor: getRiskLevel(item.score).color
                                        }}
                                    ></div>
                                </div>
                                <div className="trend-score">{item.score}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="factors-section">
                    <h2>🔍 주요 영향 요인</h2>
                    <div className="factors-list">
                        {riskData.factors.map((factor, index) => (
                            <div key={index} className="factor-item">
                                <div className="factor-header">
                                    <div className="factor-name">{factor.name}</div>
                                    <div className={`factor-impact ${factor.impact}`}>
                                        {factor.impact}
                                    </div>
                                </div>
                                <div className="factor-description">
                                    {factor.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="action-cards">
                    <div className="action-card">
                        <h3>⚠️ 주의사항</h3>
                        <ul>
                            <li>교통량 증가 시간대 교통 정리 강화</li>
                            <li>신호등 점검 및 수리 우선 진행</li>
                            <li>기상 악화 시 도로 상태 모니터링</li>
                        </ul>
                    </div>
                    <div className="action-card">
                        <h3>📈 개선 목표</h3>
                        <ul>
                            <li>주간 평균 위험도 6.0 이하 달성</li>
                            <li>교통량 관련 위험도 6.5 이하</li>
                            <li>신호등 고장률 0% 유지</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskScoreDetail;
