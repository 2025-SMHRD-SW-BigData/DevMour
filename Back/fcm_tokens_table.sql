-- FCM 토큰 저장용 테이블 생성
CREATE TABLE IF NOT EXISTS t_fcm_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL COMMENT '사용자 ID (앱에서 생성한 고유 ID)',
    fcm_token TEXT NOT NULL COMMENT 'FCM 토큰',
    device_type VARCHAR(20) DEFAULT 'android' COMMENT '디바이스 타입 (android/ios)',
    app_version VARCHAR(20) COMMENT '앱 버전',
    is_active TINYINT(1) DEFAULT 1 COMMENT '토큰 활성화 상태 (1:활성, 0:비활성)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '토큰 등록 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '토큰 업데이트 시간',
    last_used_at TIMESTAMP NULL COMMENT '마지막 사용 시간',
    
    INDEX idx_user_id (user_id),
    INDEX idx_fcm_token (fcm_token(255)),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='FCM 토큰 관리 테이블';

-- 알림 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS t_notification_history (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL COMMENT '수신자 사용자 ID',
    fcm_token TEXT COMMENT '사용된 FCM 토큰',
    title VARCHAR(200) NOT NULL COMMENT '알림 제목',
    body TEXT NOT NULL COMMENT '알림 내용',
    data JSON COMMENT '추가 데이터 (JSON 형태)',
    notification_type VARCHAR(50) DEFAULT 'general' COMMENT '알림 타입 (general, citizen_report, emergency, etc)',
    status ENUM('pending', 'sent', 'failed', 'delivered') DEFAULT 'pending' COMMENT '알림 상태',
    error_message TEXT COMMENT '실패 시 오류 메시지',
    sent_at TIMESTAMP NULL COMMENT '전송 시간',
    delivered_at TIMESTAMP NULL COMMENT '수신 확인 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    
    INDEX idx_user_id (user_id),
    INDEX idx_notification_type (notification_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='알림 히스토리 테이블';

-- 기존 민원 테이블에 알림 관련 컬럼 추가 (필요시)
-- ALTER TABLE t_citizen_report ADD COLUMN notification_sent TINYINT(1) DEFAULT 0 COMMENT '알림 전송 여부';
-- ALTER TABLE t_citizen_report ADD COLUMN notification_sent_at TIMESTAMP NULL COMMENT '알림 전송 시간';
