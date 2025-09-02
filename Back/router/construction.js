const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// MySQL 연결 설정
const dbConfig = {
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
};

// 공사 통제 데이터 조회
router.get('/detail', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // control_type이 'construction'인 데이터만 조회
        const [rows] = await connection.execute(`
            SELECT 
                control_idx,
                pred_idx,
                control_desc,
                control_st_tm,
                control_ed_tm,
                created_at,
                road_idx,
                lat,
                lon,
                control_addr,
                control_type
            FROM t_road_control 
            WHERE control_type = 'construction'
            ORDER BY created_at DESC
        `);
        
        // 데이터 타입 변환
        const constructions = rows.map(row => ({
            ...row,
            lat: parseFloat(row.lat),
            lon: parseFloat(row.lon),
            control_st_tm: row.control_st_tm.toISOString(),
            control_ed_tm: row.control_ed_tm ? row.control_ed_tm.toISOString() : null,
            created_at: row.created_at.toISOString()
        }));
        
        await connection.end();
        
        res.json({
            success: true,
            constructions: constructions
        });
        
    } catch (error) {
        console.error('공사 통제 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '서버 오류가 발생했습니다.'
        });
    }
});

// 공사 통제 통계 조회
router.get('/stats', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // control_type이 'construction'인 데이터의 통계
        const [rows] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN control_ed_tm IS NULL THEN 1 ELSE 0 END) as ongoing,
                SUM(CASE WHEN control_ed_tm IS NOT NULL THEN 1 ELSE 0 END) as completed
            FROM t_road_control 
            WHERE control_type = 'construction'
        `);
        
        await connection.end();
        
        res.json({
            success: true,
            stats: rows[0]
        });
        
    } catch (error) {
        console.error('공사 통제 통계 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '서버 오류가 발생했습니다.'
        });
    }
});

// 특정 공사 통제 정보 조회
router.get('/detail/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const { id } = req.params;
        
        const [rows] = await connection.execute(`
            SELECT * FROM t_road_control 
            WHERE control_idx = ? AND control_type = 'construction'
        `, [id]);
        
        await connection.end();
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '해당 공사 통제 정보를 찾을 수 없습니다.'
            });
        }
        
        const construction = rows[0];
        construction.lat = parseFloat(construction.lat);
        construction.lon = parseFloat(construction.lon);
        construction.control_st_tm = construction.control_st_tm.toISOString();
        construction.control_ed_tm = construction.control_ed_tm ? construction.control_ed_tm.toISOString() : null;
        construction.created_at = construction.created_at.toISOString();
        
        res.json({
            success: true,
            construction: construction
        });
        
    } catch (error) {
        console.error('공사 통제 상세 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
