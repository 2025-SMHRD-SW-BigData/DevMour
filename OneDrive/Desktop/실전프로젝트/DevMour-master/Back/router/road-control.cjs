const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// MySQL 연결 설정 (conn.connect()를 쿼리마다 호출하는 기존 스타일 유지)
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});

// 모든 도로 통제 정보 가져오기 라우터
router.get('/all', (req, res) => {
    console.log('✅ 모든 도로 통제 정보 요청 수신');
    
    // SQL 쿼리: 't_road_control' 테이블의 모든 데이터 선택
    const sql = 'SELECT * FROM t_road_control';

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).send('데이터베이스 연결 실패');
        }

        conn.query(sql, (err, rows) => {
            
            if (!err) {
                console.log('데이터베이스에서 도로 통제 정보 가져오기 성공!');
                // 클라이언트로 JSON 데이터 전송
                res.status(200).json(rows); 
            } else {
                console.error('❌ 쿼리 실행 실패:', err);
                res.status(500).send('도로 통제 정보 조회 실패');
            }
        });
    });
});

// 도로 통제 상세 정보 조회 라우터
router.get('/detail/:controlIdx', (req, res) => {
    console.log('✅ 도로 통제 상세 정보 요청 수신:', req.params.controlIdx);
    
    const controlIdx = req.params.controlIdx;
    
    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).send('데이터베이스 연결 실패');
        }

        // t_road_control에서 control_idx로 조회
        const sql = 'SELECT * FROM t_road_control WHERE control_idx = ?';
        console.log('🚧 도로 통제 상세 정보 조회:', sql, '파라미터:', controlIdx);
        
        conn.query(sql, [controlIdx], (err, rows) => {
            if (err) {
                console.error('❌ 도로 통제 상세 정보 조회 실패:', err);
                return res.status(500).send('도로 통제 상세 정보 조회 실패');
            }
            
            if (rows.length === 0) {
                console.log('⚠️ 해당 control_idx를 가진 도로 통제 정보가 없음:', controlIdx);
                return res.status(404).send('도로 통제 정보를 찾을 수 없습니다.');
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
        });
    });
});

module.exports = router;
