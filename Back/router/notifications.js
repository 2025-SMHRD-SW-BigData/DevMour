const express = require('express');
const router = express.Router();

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

// 모든 클라이언트에게 알림 전송하는 함수
function broadcastNotification(notificationData) {
    const message = `data: ${JSON.stringify(notificationData)}\n\n`;
    
    console.log('🔔 알림 브로드캐스트:', notificationData);
    
    // 모든 연결된 클라이언트에게 전송
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
