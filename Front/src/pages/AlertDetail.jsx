import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './DetailPages.css';

const AlertDetail = () => {
    const nav = useNavigate();

    const alertData = [
        {
            id: 1,
            type: '위험도 급상승',
            location: '장한로 구간',
            priority: '높음',
            status: '처리 중',
            description: '교통량 증가로 인한 위험도 급상승 (6.2 → 8.7)',
            time: '10분 전',
            assignedTo: '교통관리팀',
            action: '교통 정리 강화 및 신호등 점검'
        },
        {
            id: 2,
            type: '시스템 오류',
            location: '전체 시스템',
            priority: '높음',
            status: '처리 중',
            description: '데이터 수집 센서 연결 오류 발생',
            time: '25분 전',
            assignedTo: 'IT지원팀',
            action: '센서 연결 상태 점검 및 재부팅'
        },
        {
            id: 3,
            type: '신규 신고',
            location: '강남구 테헤란로',
            priority: '보통',
            status: '접수 완료',
            description: '도로 파손 신고 접수됨',
            time: '35분 전',
            assignedTo: '민원처리팀',
            action: '현장 점검 및 처리 계획 수립'
        },
        {
            id: 4,
            type: '기상 경보',
            location: '전체 구간',
            priority: '보통',
            status: '모니터링',
            description: '강수량 증가로 인한 도로 미끄러움 주의',
            time: '1시간 전',
            assignedTo: '기상관리팀',
            action: '도로 상태 모니터링 및 경고 발령'
        },
        {
            id: 5,
            type: '공사 완료',
            location: '서초구 교차로',
            priority: '낮음',
            status: '완료',
            description: '교차로 개선 공사 완료',
            time: '2시간 전',
            assignedTo: '공사관리팀',
            action: '완료 보고 및 안전 점검'
        }
    ];

    const getPriorityColor = (priority) => {
        switch (priority) {
            case '높음': return '#F44336';
            case '보통': return '#FF9800';
            case '낮음': return '#4CAF50';
            default: return '#9E9E9E';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case '처리 중': return '#FF9800';
            case '접수 완료': return '#2196F3';
            case '완료': return '#4CAF50';
            case '모니터링': return '#9C27B0';
            default: return '#9E9E9E';
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case '위험도 급상승': return '🚨';
            case '시스템 오류': return '⚠️';
            case '신규 신고': return '📢';
            case '기상 경보': return '🌧️';
            case '공사 완료': return '✅';
            default: return '📋';
        }
    };

    return (
        <div className="detail-container">
            <div className="detail-header">
                <h1>🔔 실시간 알림 현황 상세</h1>
                <button className="back-btn" onClick={() => nav('/')}>
                    ← 대시보드로 돌아가기
                </button>
            </div>

            <div className="detail-content">
                <div className="alert-summary">
                    <h2>📊 알림 현황 요약</h2>
                    <div className="summary-stats">
                        <div className="stat-item">
                            <span className="stat-number">5</span>
                            <span className="stat-label">전체 알림</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">2</span>
                            <span className="stat-label">처리 중</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">1</span>
                            <span className="stat-label">접수 완료</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">1</span>
                            <span className="stat-label">완료</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">1</span>
                            <span className="stat-label">모니터링</span>
                        </div>
                    </div>
                </div>

                <div className="alert-list">
                    <h2>📝 알림 상세 목록</h2>
                    {alertData.map((alert) => (
                        <div key={alert.id} className="alert-item">
                            <div className="alert-header">
                                <div className="alert-type">
                                    {getAlertIcon(alert.type)} {alert.type}
                                </div>
                                <div className="alert-priority">
                                    <span 
                                        className="priority-badge" 
                                        style={{ backgroundColor: getPriorityColor(alert.priority) }}
                                    >
                                        {alert.priority}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="alert-location">
                                📍 {alert.location}
                            </div>
                            
                            <div className="alert-description">
                                {alert.description}
                            </div>
                            
                            <div className="alert-details">
                                <div className="detail-row">
                                    <span className="detail-label">발생 시간:</span>
                                    <span className="alert-time">{alert.time}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">담당팀:</span>
                                    <span>{alert.assignedTo}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">상태:</span>
                                    <span 
                                        className="status-badge" 
                                        style={{ backgroundColor: getStatusColor(alert.status) }}
                                    >
                                        {alert.status}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="alert-action">
                                <strong>조치사항:</strong> {alert.action}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="alert-categories">
                    <h2>📊 알림 유형별 분석</h2>
                    <div className="category-grid">
                        <div className="category-card">
                            <h3>🚨 위험도 관련</h3>
                            <div className="category-count">1건</div>
                            <p>교통량 증가, 사고 위험 등</p>
                        </div>
                        <div className="category-card">
                            <h3>⚠️ 시스템 관련</h3>
                            <div className="category-count">1건</div>
                            <p>기술적 오류, 연결 문제 등</p>
                        </div>
                        <div className="category-card">
                            <h3>📢 민원 관련</h3>
                            <div className="category-count">1건</div>
                            <p>시민 신고, 요청사항 등</p>
                        </div>
                        <div className="category-card">
                            <h3>🌧️ 기상 관련</h3>
                            <div className="category-count">1건</div>
                            <p>강수, 미끄러움 등</p>
                        </div>
                    </div>
                </div>

                <div className="action-cards">
                    <div className="action-card">
                        <h3>⚡ 긴급 대응 체계</h3>
                        <ul>
                            <li>24시간 모니터링 시스템 운영</li>
                            <li>우선순위별 자동 알림 발송</li>
                            <li>담당팀 즉시 연락 체계</li>
                        </ul>
                    </div>
                    <div className="action-card">
                        <h3>💡 개선 방안</h3>
                        <ul>
                            <li>알림 정확도 향상</li>
                            <li>응답 시간 단축</li>
                            <li>자동화 시스템 도입</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertDetail;
