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


// 모든 마커 정보 가져오기 라우터
router.get('/allmarkers', (req, res) => {
    console.log('✅ 모든 마커 정보 요청 수신');
    
    // SQL 쿼리: 't_markers' 테이블의 모든 데이터 선택
    const sql = 'SELECT * FROM t_markers';

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).send('데이터베이스 연결 실패');
        }

        conn.query(sql, (err, rows) => {
            
            if (!err) {
                console.log('데이터베이스에서 마커 정보 가져오기 성공!');
                // 클라이언트로 JSON 데이터 전송
                res.status(200).json(rows); 
            } else {
                console.error('❌ 쿼리 실행 실패:', err);
                res.status(500).send('마커 정보 조회 실패');
            }
        });
    });
});

// 마커 정보 저장 라우터

router.post('/updatemarker', (req, res) => {
    console.log('✅ 마커 업데이트 요청 수신:');
    const { lat, lon, marker_type } = req.body;
    
    // 데이터베이스에 저장하는 로직을 여기에 추가
    console.log(`- 위도: ${lat}, 경도: ${lon}`);
    console.log(`- 마커 타입: ${marker_type}`);

     // SQL 쿼리 작성 (테이블 이름을 't_markers'로 가정)
    const sql = 'INSERT INTO t_markers (lat, lon, marker_type) VALUES (?, ?, ?)';

     conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).send('데이터베이스 연결 실패');
        }

        conn.query(sql, [lat, lon, marker_type], (err, rows) => {
            if (!err) {
                console.log(`- 위도: ${lat}, 경도: ${lon}`);
                console.log(`- 마커 타입: ${marker_type}`);
                console.log('데이터베이스에 마커 정보 저장 성공!');
                res.status(200).send({ message: '마커 정보가 성공적으로 저장되었습니다.' });
            } else {
                console.error('❌ 쿼리 실행 실패:', err);
                res.status(500).send('마커 정보 저장 실패');
            }
            
        });
    });
});

module.exports = router;