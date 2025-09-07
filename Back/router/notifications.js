const express = require('express');
const mysql = require('mysql2/promise');
const { sendFCMNotification, sendFCMNotificationToMultiple } = require('../config/firebaseConfig');

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

// SSE 연결을 위한 클라이언트 저장소
const clients = new Set();

// SSE 연결 엔드포인트
router.get('/stream', (req, res) => {
    console.log('🔔 새로운 SSE 클라이언트 연결');
    
    // SSE 헤더 설정
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 클라이언트를 저장소에 추가
    const clientId = Date.now() + Math.random();
    clients.add({ id: clientId, res });

    // 연결 확인 메시지 전송
    res.write(`data: ${JSON.stringify({ 
        type: 'connected', 
        message: 'SSE 연결 성공',
        clientId: clientId 
    })}\n\n`);

    // 클라이언트 연결 해제 시 정리
    req.on('close', () => {
        console.log('🔔 SSE 클라이언트 연결 해제:', clientId);
        clients.delete({ id: clientId, res });
    });

    // 연결 유지를 위한 주기적 ping
    const pingInterval = setInterval(() => {
        if (!res.destroyed) {
            res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
        } else {
            clearInterval(pingInterval);
        }
    }, 30000); // 30초마다 ping
});

// 모든 클라이언트에게 알림 전송하는 함수 (SSE + FCM)
async function broadcastNotification(notificationData) {
    const message = `data: ${JSON.stringify(notificationData)}\n\n`;
    
    console.log('🔔 알림 브로드캐스트:', notificationData);
    
    // 1. SSE로 웹 클라이언트에게 전송
    clients.forEach(client => {
        try {
            if (!client.res.destroyed) {
                client.res.write(message);
            }
        } catch (error) {
            console.error('❌ 클라이언트에게 메시지 전송 실패:', error);
            clients.delete(client);
        }
    });

    // 2. FCM으로 모바일 앱에게 푸시 알림 전송
    try {
        await sendFCMToAllUsers(notificationData);
    } catch (error) {
        console.error('❌ FCM 전송 실패:', error);
    }
}

// 모든 활성 사용자에게 FCM 알림 전송
async function sendFCMToAllUsers(notificationData) {
    try {
        // 활성화된 모든 FCM 토큰 조회
        const [tokens] = await db.execute(
            'SELECT fcm_token, user_id FROM t_fcm_tokens WHERE is_active = 1'
        );

        if (tokens.length === 0) {
            console.log('📱 전송할 FCM 토큰이 없습니다.');
            return;
        }

        const fcmTokens = tokens.map(token => token.fcm_token);
        const title = notificationData.title || 'DevMour 알림';
        const body = notificationData.message || '새로운 알림이 있습니다.';

        // FCM 데이터 준비
        const fcmData = {
            type: notificationData.type || 'general',
            timestamp: notificationData.timestamp || new Date().toISOString(),
            ...notificationData
        };

        // 다중 토큰으로 FCM 전송
        const result = await sendFCMNotificationToMultiple(fcmTokens, title, body, fcmData);

        // 알림 히스토리 저장
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const status = i < result.successCount ? 'sent' : 'failed';
            
            await db.execute(
                'INSERT INTO t_notification_history (user_id, fcm_token, title, body, data, notification_type, status, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                [
                    token.user_id,
                    token.fcm_token,
                    title,
                    body,
                    JSON.stringify(fcmData),
                    notificationData.type || 'general',
                    status
                ]
            );
        }

        console.log(`📱 FCM 전송 완료: 성공 ${result.successCount}개, 실패 ${result.failureCount}개`);

    } catch (error) {
        console.error('❌ FCM 전체 전송 오류:', error);
    }
}

// 연결된 클라이언트 수 조회
router.get('/clients/count', (req, res) => {
    res.json({
        success: true,
        clientCount: clients.size,
        clients: Array.from(clients).map(client => ({ id: client.id }))
    });
});

// 테스트용 알림 전송
router.post('/test', (req, res) => {
    const { message } = req.body;
    
    broadcastNotification({
        type: 'test',
        message: message || '테스트 알림입니다.',
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        message: '테스트 알림이 전송되었습니다.',
        clientCount: clients.size
    });
});

// 모듈 내보내기 (broadcastNotification 함수도 함께)
module.exports = { router, broadcastNotification };
