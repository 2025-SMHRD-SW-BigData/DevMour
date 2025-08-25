const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// MySQL 연결 설정
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'devmour'
};

// 도로 통제 정보 업데이트
router.put('/road-control', async (req, res) => {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const {
            road_idx,
            control_desc,
            control_st_tm,
            control_ed_tm,
            control_addr,
            control_type
        } = req.body;

        // 필수 필드 검증
        if (!road_idx) {
            return res.status(400).json({
                success: false,
                message: 'road_idx는 필수입니다.'
            });
        }

        if (!control_desc) {
            return res.status(400).json({
                success: false,
                message: '공사 종류는 필수입니다.'
            });
        }

        if (!control_st_tm) {
            return res.status(400).json({
                success: false,
                message: '시작일은 필수입니다.'
            });
        }

        // 날짜 형식 변환
        const startTime = control_st_tm ? new Date(control_st_tm).toISOString().slice(0, 19).replace('T', ' ') : null;
        const endTime = control_ed_tm ? new Date(control_ed_tm).toISOString().slice(0, 19).replace('T', ' ') : null;

        // 업데이트 쿼리 실행
        const updateQuery = `
            UPDATE t_road_control 
            SET 
                control_desc = ?,
                control_st_tm = ?,
                control_ed_tm = ?,
                control_addr = ?,
                control_type = ?
            WHERE road_idx = ?
        `;

        const [result] = await connection.execute(updateQuery, [
            control_desc,
            startTime,
            endTime,
            control_addr || null,
            control_type || 'construction',
            road_idx
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: '해당 road_idx를 가진 데이터를 찾을 수 없습니다.'
            });
        }

        // 업데이트된 데이터 조회
        const selectQuery = `
            SELECT * FROM t_road_control 
            WHERE road_idx = ?
        `;

        const [rows] = await connection.execute(selectQuery, [road_idx]);

        res.json({
            success: true,
            message: '성공적으로 업데이트되었습니다.',
            data: rows[0]
        });

    } catch (error) {
        console.error('도로 통제 정보 업데이트 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.',
            error: error.message
        });
    } finally {
        await connection.end();
    }
});

module.exports = router;
