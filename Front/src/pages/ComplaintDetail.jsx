import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';

const ComplaintDetail = () => {
    const nav = useNavigate();

    const complaintData = [
        {
            id: 1,
            type: '도로 파손',
            location: '강남구 테헤란로',
            status: '처리 완료',
            priority: '높음',
            description: '도로에 큰 구멍이 생겨 차량 통행에 위험',
            reportedAt: '2024-01-21 09:30',
            completedAt: '2024-01-21 15:45',
            assignedTo: '도로보수팀'
        },
        {
            id: 2,
            type: '신호등 고장',
            location: '서초구 교차로',
            status: '처리 중',
            priority: '높음',
            description: '신호등이 깜빡이지 않아 교통 혼잡',
            reportedAt: '2024-01-21 11:15',
            completedAt: null,
            assignedTo: '신호등팀'
        },
        {
            id: 3,
            type: '보행자 횡단보도',
            location: '홍대입구역 앞',
            status: '접수 완료',
            priority: '보통',
            description: '횡단보도 페인트가 벗겨져 보행자 안전 위험',
            reportedAt: '2024-01-21 14:20',
            completedAt: null,
            assignedTo: '도로표시팀'
        },
        {
            id: 4,
            type: '가로등 불량',
            location: '마포구 상암동',
            status: '처리 완료',
            priority: '보통',
            description: '가로등이 켜지지 않아 야간 보행 위험',
            reportedAt: '2024-01-21 16:45',
            completedAt: '2024-01-21 20:30',
            assignedTo: '가로등팀'
        },
        {
            id: 5,
            type: '교통 표지판',
            location: '영등포구 여의도',
            status: '처리 완료',
            priority: '낮음',
            description: '교통 표지판이 기울어져 있어 시인성 저하',
            reportedAt: '2024-01-21 08:10',
            completedAt: '2024-01-21 12:00',
            assignedTo: '교통표시팀'
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case '처리 완료': return 'green';
            case '처리 중': return 'orange';
            case '접수 완료': return 'blue';
            default: return 'gray';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case '높음': return 'red';
            case '보통': return 'orange';
            case '낮음': return 'green';
            default: return 'gray';
        }
    };

    return (
        <div className="detail-container">
            <div className="detail-header">
                <h1>📋 민원 신고 접수 상세</h1>
                <button className="back-btn" onClick={() => nav('/')}>
                    ← 대시보드로 돌아가기
                </button>
            </div>

            <div className="detail-content">
                <div className="summary-card">
                    <h2>📊 오늘 접수 현황</h2>
                    <div className="summary-stats">
                        <div className="stat-item">
                            <span className="stat-number">8</span>
                            <span className="stat-label">전체 접수</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">5</span>
                            <span className="stat-label">처리 완료</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">2</span>
                            <span className="stat-label">처리 중</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">1</span>
                            <span className="stat-label">접수 완료</span>
                        </div>
                    </div>
                </div>

                <div className="complaint-list">
                    <h2>📝 민원 신고 목록</h2>
                    {complaintData.map((item) => (
                        <div key={item.id} className="complaint-item">
                            <div className="complaint-header">
                                <div className="complaint-type">{item.type}</div>
                                <div className="complaint-status">
                                    <span className={`status-badge ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                            <div className="complaint-location">
                                📍 {item.location}
                            </div>
                            <div className="complaint-description">
                                {item.description}
                            </div>
                            <div className="complaint-details">
                                <div className="detail-row">
                                    <span className="detail-label">우선순위:</span>
                                    <span className={`priority-badge ${getPriorityColor(item.priority)}`}>
                                        {item.priority}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">접수시간:</span>
                                    <span>{item.reportedAt}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">담당팀:</span>
                                    <span>{item.assignedTo}</span>
                                </div>
                                {item.completedAt && (
                                    <div className="detail-row">
                                        <span className="detail-label">완료시간:</span>
                                        <span>{item.completedAt}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="action-cards">
                    <div className="action-card">
                        <h3>📈 처리 현황 분석</h3>
                        <ul>
                            <li>평균 처리 시간: 4시간 30분</li>
                            <li>높은 우선순위 민원 우선 처리</li>
                            <li>담당팀별 전문성 향상</li>
                        </ul>
                    </div>
                    <div className="action-card">
                        <h3>💡 개선 방안</h3>
                        <ul>
                            <li>민원 접수 시스템 자동화</li>
                            <li>실시간 처리 현황 모니터링</li>
                            <li>민원인 만족도 조사 실시</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetail;
