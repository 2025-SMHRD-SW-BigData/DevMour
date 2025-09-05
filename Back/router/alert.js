const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// MySQL Pool 연결 설정
const db = mysql.createPool({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2',
    waitForConnections: true,
    connectionLimit: 10
});

// 최근 알림 5개 조회
router.get('/recent', async (req, res) => {
    console.log('✅ 최근 알림 조회 요청 수신');
    
    try {
        // 최근 알림 5개 조회 (alert_level, alert_msg 포함)
        const sql = `
            SELECT 
                alert_idx,
                alert_msg,
                alert_level,
                sented_at,
                is_read,
                recepient_type,
                pred_idx,
                road_idx
            FROM t_alert 
            ORDER BY sented_at DESC 
            LIMIT 5
        `;

        const [results] = await db.execute(sql);

        console.log('✅ 최근 알림 조회 성공:', results.length, '건');
        
        // 응답 데이터 포맷팅
        const alerts = results.map(alert => ({
            id: alert.alert_idx,
            message: alert.alert_msg,
            level: alert.alert_level,
            sentAt: alert.sented_at,
            isRead: alert.is_read === 'Y',
            recipientType: alert.recepient_type,
            predIdx: alert.pred_idx,
            roadIdx: alert.road_idx
        }));

        res.json({ alerts });
    } catch (error) {
        console.error('❌ 알림 조회 실패:', error);
        res.status(500).json({ error: '알림 조회 실패' });
    }
});

// 동일년도의 동일 월 기준 알림 목록 조회
router.get('/monthly', async (req, res) => {
    console.log('✅ 월별 알림 목록 조회 요청 수신');
    
    try {
        // 현재 년도와 월 기준으로 알림 데이터 조회
        const sql = `
            SELECT 
                alert_idx,
                pred_idx,
                road_idx,
                recepient_type,
                alert_msg,
                alert_level,
                sented_at,
                is_read,
                admin_id,
                lat,
                lon,
                addr
            FROM t_alert 
            WHERE YEAR(sented_at) = YEAR(CURDATE()) 
            AND MONTH(sented_at) = MONTH(CURDATE())
            ORDER BY sented_at DESC
        `;

        const [results] = await db.execute(sql);

        console.log('✅ 월별 알림 조회 성공:', results.length, '건');
        
        // 응답 데이터 포맷팅 (새로운 필드들 포함)
        const alerts = results.map(alert => ({
            alert_idx: alert.alert_idx,
            pred_idx: alert.pred_idx,
            road_idx: alert.road_idx,
            recepient_type: alert.recepient_type,
            alert_msg: alert.alert_msg,
            alert_level: alert.alert_level,
            sented_at: alert.sented_at,
            is_read: alert.is_read,
            admin_id: alert.admin_id,
            lat: alert.lat ? parseFloat(alert.lat) : null,
            lon: alert.lon ? parseFloat(alert.lon) : null,
            addr: alert.addr || null
        }));

        res.json({ alerts });
    } catch (error) {
        console.error('❌ 월별 알림 조회 실패:', error);
        res.status(500).json({ error: '월별 알림 조회 실패' });
    }
});

// 알림의 위치 정보 조회
router.get('/location/:alertId', async (req, res) => {
    const alertId = req.params.alertId;
    console.log('✅ 알림 위치 정보 조회 요청:', alertId);
    
    try {
        // 알림 ID로 위치 정보 조회
        const sql = `
            SELECT 
                a.alert_idx,
                a.pred_idx,
                a.road_idx,
                r.lat,
                r.lon,
                r.anomaly_type,
                r.severity_level
            FROM t_alert a
            LEFT JOIN t_road r ON a.road_idx = r.road_idx
            WHERE a.alert_idx = ?
        `;

        const [results] = await db.execute(sql, [alertId]);

        if (results.length === 0) {
            return res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
        }

        const alertLocation = results[0];
        console.log('✅ 알림 위치 정보 조회 성공:', alertLocation);
        
        res.json({
            alertId: alertLocation.alert_idx,
            lat: parseFloat(alertLocation.lat),
            lon: parseFloat(alertLocation.lon),
            anomalyType: alertLocation.anomaly_type,
            severityLevel: alertLocation.severity_level
        });
    } catch (error) {
        console.error('❌ 알림 위치 정보 조회 실패:', error);
        res.status(500).json({ error: '알림 위치 정보 조회 실패' });
    }
});

module.exports = router;
