const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

// 데이터베이스 연결 설정
const connection = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});

// CCTV 위치 근처의 손상 데이터 조회
router.post('/nearby', (req, res) => {
    const { lat, lon, radius } = req.body;
    
    console.log('🔍 CCTV 위치 정보:', { lat, lon, radius });
    
    // 좌표 기반으로 근처 데이터 조회 (간단한 거리 계산)
    const query = `
        SELECT 
            break_cnt,
            ali_crack_cnt,
            weather_score,
            road_score,
            total_score,
            lat,
            lon
        FROM t_total 
        WHERE lat IS NOT NULL 
        AND lon IS NOT NULL
        AND ABS(lat - ?) <= 0.01 
        AND ABS(lon - ?) <= 0.01
        ORDER BY 
            SQRT(POW(lat - ?, 2) + POW(lon - ?, 2)) ASC
        LIMIT 1
    `;
    
    connection.query(query, [lat, lon, lat, lon], (error, results) => {
        if (error) {
            console.error('❌ 데이터베이스 조회 오류:', error);
            return res.status(500).json({ 
                error: '데이터베이스 조회 실패',
                details: error.message 
            });
        }
        
        console.log('🔍 조회된 데이터:', results);
        
        if (results.length > 0) {
            const data = results[0];
            res.json({
                break_cnt: data.break_cnt || 0,
                ali_crack_cnt: data.ali_crack_cnt || 0,
                weather_score: data.weather_score || 0,
                road_score: data.road_score || 0,
                total_score: data.total_score || 0,
                lat: data.lat,
                lon: data.lon
            });
        } else {
            // 데이터가 없으면 기본값 반환
            console.log('⚠️ 해당 위치에 데이터가 없음, 기본값 반환');
            res.json({
                break_cnt: 0,
                ali_crack_cnt: 0,
                weather_score: 0,
                road_score: 0,
                total_score: 0,
                lat: lat,
                lon: lon
            });
        }
    });
});

// t_total 테이블의 모든 데이터 조회 (테스트용)
router.get('/all', (req, res) => {
    const query = 'SELECT * FROM t_total LIMIT 10';
    
    connection.query(query, (error, results) => {
        if (error) {
            console.error('❌ 데이터베이스 조회 오류:', error);
            return res.status(500).json({ 
                error: '데이터베이스 조회 실패',
                details: error.message 
            });
        }
        
        console.log('🔍 t_total 테이블 데이터:', results);
        res.json(results);
    });
});

module.exports = router;
