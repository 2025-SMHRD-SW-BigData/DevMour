import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';

const RiskRankingDetail = () => {
    const nav = useNavigate();

    const riskData = [
        {
            id: 1,
            location: '장한로 구간',
            riskLevel: '고위험',
            score: 9.2,
            status: '🔴',
            description: '교통량 과다 및 신호등 고장으로 인한 위험도 증가'
        },
        {
            id: 2,
            location: '강남대로',
            riskLevel: '고위험',
            score: 8.8,
            status: '🔴',
            description: '보행자 횡단 사고 다발 구간'
        },
        {
            id: 3,
            location: '서초구 교차로',
            riskLevel: '고위험',
            score: 8.5,
            status: '🔴',
            description: '좌회전 차량과 보행자 간 충돌 위험'
        },
        {
            id: 4,
            location: '홍대입구역',
            riskLevel: '주의',
            score: 7.2,
            status: '🟠',
            description: '야간 보행자 통행량 증가'
        },
        {
            id: 5,
            location: '강변북로',
            riskLevel: '주의',
            score: 6.8,
            status: '🟠',
            description: '고속도로 진입로 혼잡'
        }
    ];

    return (
        <div className="detail-container">
            <div className="detail-header">
                <h1>🚨 도로 위험도 랭킹 상세</h1>
                <button className="back-btn" onClick={() => nav('/')}>
                    ← 대시보드로 돌아가기
                </button>
            </div>

            <div className="detail-content">
                <div className="summary-card">
                    <h2>📊 전체 현황 요약</h2>
                    <div className="summary-stats">
                        <div className="stat-item">
                            <span className="stat-number">3</span>
                            <span className="stat-label">고위험 구간</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">7</span>
                            <span className="stat-label">주의 구간</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">12</span>
                            <span className="stat-label">안전 구간</span>
                        </div>
                    </div>
                </div>

                <div className="ranking-list">
                    <h2>🏆 위험도 순위</h2>
                    {riskData.map((item, index) => (
                        <div key={item.id} className={`ranking-item ${item.riskLevel === '고위험' ? 'high-risk' : 'medium-risk'}`}>
                            <div className="rank-number">#{index + 1}</div>
                            <div className="risk-info">
                                <div className="location-name">{item.location}</div>
                                <div className="risk-details">
                                    <span className={`risk-level ${item.riskLevel === '고위험' ? 'high' : 'medium'}`}>
                                        {item.status} {item.riskLevel}
                                    </span>
                                    <span className="risk-score">위험도: {item.score}/10</span>
                                </div>
                                <div className="risk-description">{item.description}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="action-cards">
                    <div className="action-card">
                        <h3>📋 긴급 조치사항</h3>
                        <ul>
                            <li>고위험 구간 즉시 점검 및 보수</li>
                            <li>신호등 및 안전시설 점검</li>
                            <li>교통 경찰 배치 검토</li>
                        </ul>
                    </div>
                    <div className="action-card">
                        <h3>📈 개선 계획</h3>
                        <ul>
                            <li>위험 구간별 맞춤형 개선안 수립</li>
                            <li>보행자 안전시설 강화</li>
                            <li>교통 흐름 최적화</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskRankingDetail;
