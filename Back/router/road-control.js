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
    connectionLimit: 10,
    queueLimit: 0
});

// 모든 도로 통제 정보 가져오기 라우터
router.get('/all', async (req, res) => {
    try {
        console.log('✅ 모든 도로 통제 정보 요청 수신');
        
        // SQL 쿼리: 't_road_control' 테이블의 모든 데이터 선택
        const sql = 'SELECT * FROM t_road_control';
        
        const [rows] = await db.execute(sql);
        
        console.log('데이터베이스에서 도로 통제 정보 가져오기 성공!');
        res.status(200).json(rows);
        
    } catch (error) {
        console.error('❌ 도로 통제 정보 조회 실패:', error);
        res.status(500).json({ error: '도로 통제 정보 조회 실패' });
    }
});

// 도로 통제 상세 정보 조회 라우터
router.get('/detail/:controlIdx', async (req, res) => {
    try {
        console.log('✅ 도로 통제 상세 정보 요청 수신:', req.params.controlIdx);
        
        const controlIdx = req.params.controlIdx;
        
        // t_road_control에서 control_idx로 조회
        const sql = 'SELECT * FROM t_road_control WHERE control_idx = ?';
        console.log('🚧 도로 통제 상세 정보 조회:', sql, '파라미터:', controlIdx);
        
        const [rows] = await db.execute(sql, [controlIdx]);
        
        if (rows.length === 0) {
            console.log('⚠️ 해당 control_idx를 가진 도로 통제 정보가 없음:', controlIdx);
            return res.status(404).json({ error: '도로 통제 정보를 찾을 수 없습니다.' });
        }
        
        // ✅ 도로 통제 정보 발견
        const controlData = rows[0];
        console.log('✅ 도로 통제 상세 정보 조회 성공:', controlData);
        
        const result = {
            marker: {
                marker_id: controlData.control_idx,
                marker_type: controlData.control_type || 'construction',
                cctv_idx: null,
                control_idx: controlData.control_idx,
                lat: controlData.lat,
                lon: controlData.lon
            },
            detail: controlData
        };
        
        res.status(200).json(result);
        
    } catch (error) {
        console.error('❌ 도로 통제 상세 정보 조회 실패:', error);
        res.status(500).json({ error: '도로 통제 상세 정보 조회 실패' });
    }
});

module.exports = router;
