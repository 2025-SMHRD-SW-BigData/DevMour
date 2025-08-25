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

// 모든 CCTV 정보 가져오기 라우터
router.get('/all', (req, res) => {
    console.log('✅ 모든 CCTV 정보 요청 수신');
    
    // SQL 쿼리: 't_cctv' 테이블의 모든 데이터 선택
    const sql = 'SELECT * FROM t_cctv';

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).send('데이터베이스 연결 실패');
        }

        conn.query(sql, (err, rows) => {
            
            if (!err) {
                console.log('데이터베이스에서 CCTV 정보 가져오기 성공!');
                // 클라이언트로 JSON 데이터 전송
                res.status(200).json(rows); 
            } else {
                console.error('❌ 쿼리 실행 실패:', err);
                res.status(500).send('CCTV 정보 조회 실패');
            }
        });
    });
});

module.exports = router;
