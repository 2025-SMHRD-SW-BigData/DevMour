const express = require('express');
const mysql = require('mysql2/promise');
const { sendFCMNotification } = require('../config/firebaseConfig');

const router = express.Router();

// MySQL Pool 연결 설정
const db = mysql.createPool({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10
});

// FCM 토큰 등록/업데이트 API
router.post('/register-token', async (req, res) => {
    try {
        const { userId, fcmToken, deviceType = 'android', appVersion } = req.body;
        
        if (!userId || !fcmToken) {
            return res.status(400).json({
                success: false,
                message: '사용자 ID와 FCM 토큰은 필수입니다.'
            });
        }

        // 기존 토큰 확인
        const [existingTokens] = await db.execute(
            'SELECT token_id FROM t_fcm_tokens WHERE fcm_token = ? AND is_active = 1',
            [fcmToken]
        );

        if (existingTokens.length > 0) {
            // 기존 토큰 업데이트
            await db.execute(
                'UPDATE t_fcm_tokens SET user_id = ?, device_type = ?, app_version = ?, last_used_at = NOW() WHERE fcm_token = ?',
                [userId, deviceType, appVersion, fcmToken]
            );
            
            console.log('🔄 FCM 토큰 업데이트:', { userId, fcmToken });
        } else {
            // 새 토큰 등록
            await db.execute(
                'INSERT INTO t_fcm_tokens (user_id, fcm_token, device_type, app_version, last_used_at) VALUES (?, ?, ?, ?, NOW())',
                [userId, fcmToken, deviceType, appVersion]
            );
            
            console.log('✅ FCM 토큰 등록:', { userId, fcmToken });
        }

        res.json({
            success: true,
            message: 'FCM 토큰이 성공적으로 등록되었습니다.'
        });

    } catch (error) {
        console.error('❌ FCM 토큰 등록 오류:', error);
        res.status(500).json({
            success: false,
            message: 'FCM 토큰 등록 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// FCM 토큰 삭제 API
router.delete('/remove-token', async (req, res) => {
    try {
        const { fcmToken } = req.body;
        
        if (!fcmToken) {
            return res.status(400).json({
                success: false,
                message: 'FCM 토큰은 필수입니다.'
            });
        }

        await db.execute(
            'UPDATE t_fcm_tokens SET is_active = 0 WHERE fcm_token = ?',
            [fcmToken]
        );

        console.log('🗑️ FCM 토큰 비활성화:', fcmToken);

        res.json({
            success: true,
            message: 'FCM 토큰이 성공적으로 삭제되었습니다.'
        });

    } catch (error) {
        console.error('❌ FCM 토큰 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: 'FCM 토큰 삭제 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 테스트 알림 전송 API
router.post('/send-test', async (req, res) => {
    try {
        const { fcmToken, title = '테스트 알림', body = 'FCM 테스트 메시지입니다.' } = req.body;
        
        if (!fcmToken) {
            return res.status(400).json({
                success: false,
                message: 'FCM 토큰은 필수입니다.'
            });
        }

        const result = await sendFCMNotification(fcmToken, title, body, {
            type: 'test',
            timestamp: new Date().toISOString()
        });

        if (result.success) {
            // 알림 히스토리 저장
            await db.execute(
                'INSERT INTO t_notification_history (user_id, fcm_token, title, body, data, notification_type, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                ['test_user', fcmToken, title, body, JSON.stringify({type: 'test'}), 'test', 'sent']
            );

            res.json({
                success: true,
                message: '테스트 알림이 성공적으로 전송되었습니다.',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                success: false,
                message: '테스트 알림 전송에 실패했습니다.',
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ 테스트 알림 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: '테스트 알림 전송 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

// 사용자별 알림 히스토리 조회 API
router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const [rows] = await db.execute(
            `SELECT 
                notification_id,
                title,
                body,
                data,
                notification_type,
                status,
                sent_at,
                delivered_at,
                created_at
            FROM t_notification_history 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?`,
            [userId, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('❌ 알림 히스토리 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '알림 히스토리 조회 중 오류가 발생했습니다.',
            error: error.message
        });
    }
});

module.exports = router;
