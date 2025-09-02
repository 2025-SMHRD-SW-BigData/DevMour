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

// 침수 분석 결과 조회 (위치 기반)
router.get('/location', (req, res) => {
    const { lat, lon } = req.query;
    
    console.log('🌊 침수 분석 결과 조회 요청:', { lat, lon });
    
    if (!lat || !lon) {
        return res.status(400).json({
            success: false,
            error: '위도와 경도가 필요합니다.'
        });
    }
    
    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ 
                success: false,
                message: '데이터베이스 연결 실패' 
            });
        }
        
        const sql = `
            SELECT * FROM t_flood_result 
            WHERE lat = ? AND lon = ?
            ORDER BY created_at DESC
            LIMIT 10
        `;
        
        conn.query(sql, [parseFloat(lat), parseFloat(lon)], (err, results) => {
            if (err) {
                console.error('❌ 침수 분석 결과 조회 실패:', err);
                return res.status(500).json({ 
                    success: false,
                    message: '데이터 조회 중 오류가 발생했습니다.' 
                });
            }
            
            console.log('✅ 침수 분석 결과 조회 성공:', results.length, '건');
            
            res.json({
                success: true,
                data: results
            });
        });
    });
});

// 최근 침수 분석 결과 조회
router.get('/recent', (req, res) => {
    console.log('🌊 최근 침수 분석 결과 조회 요청');
    
    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ 
                success: false,
                message: '데이터베이스 연결 실패' 
            });
        }
        
        const sql = `
            SELECT 
                f.*,
                c.cctv_name
            FROM t_flood_result f
            LEFT JOIN t_cctv c ON f.cctv_idx = c.cctv_idx
            ORDER BY f.created_at DESC
            LIMIT 20
        `;
        
        conn.query(sql, (err, results) => {
            if (err) {
                console.error('❌ 최근 침수 분석 결과 조회 실패:', err);
                return res.status(500).json({ 
                    success: false,
                    message: '데이터 조회 중 오류가 발생했습니다.' 
                });
            }
            
            console.log('✅ 최근 침수 분석 결과 조회 성공:', results.length, '건');
            
            res.json({
                success: true,
                data: results
            });
        });
    });
});

// 침수 발생 통계
router.get('/stats', (req, res) => {
    console.log('🌊 침수 발생 통계 조회 요청');
    
    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ 
                success: false,
                message: '데이터베이스 연결 실패' 
            });
        }
        
        const sql = `
            SELECT 
                COUNT(*) as total_analyses,
                SUM(CASE WHEN flood_result = 'Y' THEN 1 ELSE 0 END) as flood_detected,
                SUM(CASE WHEN flood_result = 'N' THEN 1 ELSE 0 END) as no_flood,
                ROUND(SUM(CASE WHEN flood_result = 'Y' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as flood_percentage
            FROM t_flood_result
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `;
        
        conn.query(sql, (err, results) => {
            if (err) {
                console.error('❌ 침수 발생 통계 조회 실패:', err);
                return res.status(500).json({ 
                    success: false,
                    message: '데이터 조회 중 오류가 발생했습니다.' 
                });
            }
            
            console.log('✅ 침수 발생 통계 조회 성공');
            
            const stats = results[0];
            res.json({
                success: true,
                data: {
                    total_analyses: parseInt(stats.total_analyses) || 0,
                    flood_detected: parseInt(stats.flood_detected) || 0,
                    no_flood: parseInt(stats.no_flood) || 0,
                    flood_percentage: parseFloat(stats.flood_percentage) || 0
                }
            });
        });
    });
});

module.exports = router;
