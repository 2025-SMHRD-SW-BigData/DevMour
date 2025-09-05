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

// 침수 분석 결과 조회 (위치 기반)
router.get('/location', async (req, res) => {
    const { lat, lon } = req.query;
    
    console.log('🌊 침수 분석 결과 조회 요청:', { lat, lon });
    
    if (!lat || !lon) {
        return res.status(400).json({
            success: false,
            error: '위도와 경도가 필요합니다.'
        });
    }
    
    try {
        const sql = `
            SELECT * FROM t_flood_result 
            WHERE lat = ? AND lon = ?
            ORDER BY created_at DESC
            LIMIT 10
        `;
        
        const [results] = await db.execute(sql, [parseFloat(lat), parseFloat(lon)]);
        
        console.log('✅ 침수 분석 결과 조회 성공:', results.length, '건');
        
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('❌ 침수 분석 결과 조회 실패:', error);
        res.status(500).json({ 
            success: false,
            message: '데이터 조회 중 오류가 발생했습니다.' 
        });
    }
});

// 최근 침수 분석 결과 조회
router.get('/recent', async (req, res) => {
    console.log('🌊 최근 침수 분석 결과 조회 요청');
    
    try {
        const sql = `
            SELECT 
                f.*,
                c.cctv_name
            FROM t_flood_result f
            LEFT JOIN t_cctv c ON f.cctv_idx = c.cctv_idx
            ORDER BY f.created_at DESC
            LIMIT 20
        `;
        
        const [results] = await db.execute(sql);
        
        console.log('✅ 최근 침수 분석 결과 조회 성공:', results.length, '건');
        
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('❌ 최근 침수 분석 결과 조회 실패:', error);
        res.status(500).json({ 
            success: false,
            message: '데이터 조회 중 오류가 발생했습니다.' 
        });
    }
});

// 침수 발생 통계
router.get('/stats', async (req, res) => {
    console.log('🌊 침수 발생 통계 조회 요청');
    
    try {
        const sql = `
            SELECT 
                COUNT(*) as total_analyses,
                SUM(CASE WHEN flood_result = 'Y' THEN 1 ELSE 0 END) as flood_detected,
                SUM(CASE WHEN flood_result = 'N' THEN 1 ELSE 0 END) as no_flood,
                ROUND(SUM(CASE WHEN flood_result = 'Y' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as flood_percentage
            FROM t_flood_result
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `;
        
        const [results] = await db.execute(sql);
        
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
    } catch (error) {
        console.error('❌ 침수 발생 통계 조회 실패:', error);
        res.status(500).json({ 
            success: false,
            message: '데이터 조회 중 오류가 발생했습니다.' 
        });
    }
});

module.exports = router;
