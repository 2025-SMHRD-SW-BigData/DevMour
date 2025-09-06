import React, { useState, useEffect, useRef } from 'react';
import './NotificationSystem.css';

const NotificationSystem = ({ onNotificationClick }) => {
    const [notifications, setNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        connectSSE();
        
        return () => {
            disconnectSSE();
        };
    }, []);

    const connectSSE = () => {
        try {
            // 기존 연결이 있다면 해제
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            console.log('🔔 SSE 연결 시도 중...');

            const eventSource = new EventSource('http://175.45.194.114:3001/api/notifications/stream');            
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('✅ SSE 연결 성공');
                setIsConnected(true);
                
                // 재연결 타이머 클리어
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = null;
                }
            };

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('🔔 SSE 메시지 수신:', data);

                    if (data.type === 'connected') {
                        console.log('🔔 SSE 연결 확인:', data.message);
                    } else if (data.type === 'ping') {
                        // 연결 유지 확인
                        console.log('🔔 SSE ping 수신');
                    } else if (data.type === 'citizen_report') {
                        // 민원 신고 알림 처리
                        handleCitizenReportNotification(data);
                    } else if (data.type === 'test') {
                        // 테스트 알림 처리
                        handleTestNotification(data);
                    }
                } catch (error) {
                    console.error('❌ SSE 메시지 파싱 오류:', error);
                }
            };

            eventSource.onerror = (error) => {
                console.error('❌ SSE 연결 오류:', error);
                setIsConnected(false);
                
                // 5초 후 재연결 시도
                if (!reconnectTimeoutRef.current) {
                    reconnectTimeoutRef.current = setTimeout(() => {
                        console.log('🔄 SSE 재연결 시도...');
                        connectSSE();
                    }, 5000);
                }
            };

        } catch (error) {
            console.error('❌ SSE 연결 실패:', error);
            setIsConnected(false);
        }
    };

    const disconnectSSE = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        setIsConnected(false);
        console.log('🔔 SSE 연결 해제');
    };

    const handleCitizenReportNotification = (data) => {
        const notification = {
            id: Date.now() + Math.random(),
            type: 'citizen_report',
            message: data.message,
            reportId: data.reportId,
            addr: data.addr,
            c_report_detail: data.c_report_detail,
            lat: data.lat,
            lon: data.lon,
            timestamp: data.timestamp,
            isRead: false
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // 최대 10개 알림 유지
        
        // 5초 후 자동으로 읽음 처리
        setTimeout(() => {
            setNotifications(prev => 
                prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
            );
        }, 5000);
    };

    const handleTestNotification = (data) => {
        const notification = {
            id: Date.now() + Math.random(),
            type: 'test',
            message: data.message,
            timestamp: data.timestamp,
            isRead: false
        };

        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    };

    const handleNotificationClick = (notification) => {
        // 알림을 읽음 처리
        setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );

        // 부모 컴포넌트에 알림 클릭 이벤트 전달
        if (onNotificationClick) {
            onNotificationClick(notification);
        }
    };

    const removeNotification = (notificationId) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="notification-system">
            {/* 연결 상태 표시 */}
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                <div className="status-dot"></div>
                <span>{isConnected ? '실시간 알림 연결됨' : '실시간 알림 연결 끊김'}</span>
            </div>

            {/* 알림 목록 */}
            <div className="notifications-container">
                {notifications.length > 0 && (
                    <div className="notifications-header">
                        <span>알림 ({unreadCount})</span>
                        <button 
                            className="clear-all-btn"
                            onClick={() => setNotifications([])}
                        >
                            모두 지우기
                        </button>
                    </div>
                )}
                
                <div className="notifications-list">
                    {notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`notification-item ${notification.isRead ? 'read' : 'unread'} ${notification.type}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="notification-content">
                                <div className="notification-message">
                                    {notification.message}
                                </div>
                                <div className="notification-time">
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                            <button
                                className="remove-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NotificationSystem;
