import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';

const ConstructionDetail = () => {
    const nav = useNavigate();

    const constructionData = [
        {
            id: 1,
            projectName: '강남대로 포장 공사',
            location: '강남구 강남대로',
            type: '도로 포장',
            progress: 75,
            startDate: '2024-01-15',
            endDate: '2024-01-25',
            status: '진행 중',
            description: '노면 포장층 교체 및 보수 공사',
            team: '도로포장팀',
            budget: '2억 5천만원'
        },
        {
            id: 2,
            projectName: '서초구 교차로 개선',
            location: '서초구 서초대로',
            type: '교차로 개선',
            progress: 45,
            startDate: '2024-01-10',
            endDate: '2024-02-15',
            status: '진행 중',
            description: '교차로 확장 및 신호체계 개선',
            team: '교통시설팀',
            budget: '1억 8천만원'
        },
        {
            id: 3,
            projectName: '홍대입구역 보행자 도로',
            location: '마포구 홍대입구역',
            type: '보행자 도로',
            progress: 90,
            startDate: '2024-01-05',
            endDate: '2024-01-22',
            status: '완료 예정',
            description: '보행자 전용 도로 포장 및 안전시설 설치',
            team: '보행자시설팀',
            budget: '8천만원'
        },
        {
            id: 4,
            projectName: '영등포구 배수로 정비',
            location: '영등포구 여의도',
            type: '배수시설',
            progress: 30,
            startDate: '2024-01-18',
            endDate: '2024-03-10',
            status: '진행 중',
            description: '배수로 정비 및 확장 공사',
            team: '배수시설팀',
            budget: '3억 2천만원'
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case '진행 중': return 'orange';
            case '완료 예정': return 'blue';
            case '완료': return 'green';
            case '계획': return 'gray';
            default: return 'gray';
        }
    };

    const getProgressColor = (progress) => {
        if (progress >= 80) return '#4CAF50';
        if (progress >= 50) return '#FF9800';
        return '#F44336';
    };

    return (
        <div className="detail-container">
            <div className="detail-header">
                <h1>🏗️ 도로 보수공사 상세</h1>
                <button className="back-btn" onClick={() => nav('/')}>
                    ← 대시보드로 돌아가기
                </button>
            </div>

            <div className="detail-content">
                <div className="summary-card">
                    <h2>📊 전체 공사 현황</h2>
                    <div className="summary-stats">
                        <div className="stat-item">
                            <span className="stat-number">4</span>
                            <span className="stat-label">진행 중</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">1</span>
                            <span className="stat-label">완료 예정</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">7.8억원</span>
                            <span className="stat-label">총 예산</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">62%</span>
                            <span className="stat-label">평균 진행률</span>
                        </div>
                    </div>
                </div>

                <div className="construction-list">
                    <h2>🚧 공사 프로젝트 목록</h2>
                    {constructionData.map((item) => (
                        <div key={item.id} className="construction-item">
                            <div className="construction-header">
                                <div className="project-name">{item.projectName}</div>
                                <div className="construction-status">
                                    <span className={`status-badge ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                            <div className="construction-location">
                                📍 {item.location}
                            </div>
                            <div className="construction-type">
                                🏗️ {item.type}
                            </div>
                            <div className="construction-description">
                                {item.description}
                            </div>
                            
                            <div className="progress-section">
                                <div className="progress-header">
                                    <span>진행률: {item.progress}%</span>
                                    <span>예상 완료: {item.endDate}</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ 
                                            width: `${item.progress}%`,
                                            backgroundColor: getProgressColor(item.progress)
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <div className="construction-details">
                                <div className="detail-row">
                                    <span className="detail-label">시작일:</span>
                                    <span>{item.startDate}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">담당팀:</span>
                                    <span>{item.team}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">예산:</span>
                                    <span>{item.budget}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="action-cards">
                    <div className="action-card">
                        <h3>📋 공사 관리 현황</h3>
                        <ul>
                            <li>안전사고 0건 (안전관리 우수)</li>
                            <li>일정 준수율 85%</li>
                            <li>품질 검사 통과율 100%</li>
                        </ul>
                    </div>
                    <div className="action-card">
                        <h3>💡 개선 방안</h3>
                        <ul>
                            <li>공사 일정 최적화</li>
                            <li>안전관리 강화</li>
                            <li>품질 관리 시스템 고도화</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConstructionDetail;
