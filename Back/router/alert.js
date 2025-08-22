const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// MySQL 연결 설정
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});

// 최근 알림 5개 조회
router.get('/recent', (req, res) => {
    console.log('✅ 최근 알림 조회 요청 수신');
    
    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ error: '데이터베이스 연결 실패' });
        }

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

        conn.query(sql, (err, results) => {
            if (err) {
                console.error('❌ 알림 조회 실패:', err);
                return res.status(500).json({ error: '알림 조회 실패' });
            }

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
        });
    });
});

// 알림의 위치 정보 조회
router.get('/location/:alertId', (req, res) => {
    const alertId = req.params.alertId;
    console.log('✅ 알림 위치 정보 조회 요청:', alertId);
    
    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ error: '데이터베이스 연결 실패' });
        }

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

        conn.query(sql, [alertId], (err, results) => {
            if (err) {
                console.error('❌ 알림 위치 정보 조회 실패:', err);
                return res.status(500).json({ error: '알림 위치 정보 조회 실패' });
            }

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
        });
    });
});

module.exports = router;
