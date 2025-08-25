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

// 도로 통제 정보 업데이트
router.put('/road-control', (req, res) => {
    console.log('✅ 도로 통제 정보 업데이트 요청 수신');
    
    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ error: '데이터베이스 연결 실패' });
        }

        const {
            control_idx,
            control_desc,
            control_st_tm,
            control_ed_tm,
            control_addr,
            control_type
        } = req.body;

        // 필수 필드 검증
        if (!control_idx) {
            return res.status(400).json({
                success: false,
                message: 'control_idx는 필수입니다.'
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

        console.log('📝 업데이트 데이터:', {
            control_idx,
            control_desc,
            startTime,
            endTime,
            control_addr,
            control_type
        });

        // 업데이트 쿼리 실행
        const updateQuery = `
            UPDATE t_road_control 
            SET 
                control_desc = ?,
                control_st_tm = ?,
                control_ed_tm = ?,
                control_addr = ?,
                control_type = ?
            WHERE control_idx = ?
        `;

        conn.query(updateQuery, [
            control_desc,
            startTime,
            endTime,
            control_addr || null,
            control_type || 'construction',
            control_idx
        ], (err, result) => {
            if (err) {
                console.error('❌ 도로 통제 정보 업데이트 실패:', err);
                return res.status(500).json({ 
                    success: false,
                    message: '도로 통제 정보 업데이트 실패',
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                console.log('⚠️ 업데이트된 데이터가 없음:', control_idx);
                return res.status(404).json({
                    success: false,
                    message: '해당 control_idx를 가진 데이터를 찾을 수 없습니다.'
                });
            }

            console.log('✅ 도로 통제 정보 업데이트 성공:', result.affectedRows, '건');

            // 업데이트된 데이터 조회
            const selectQuery = `
                SELECT * FROM t_road_control 
                WHERE control_idx = ?
            `;

            conn.query(selectQuery, [control_idx], (err, rows) => {
                if (err) {
                    console.error('❌ 업데이트된 데이터 조회 실패:', err);
                    return res.status(500).json({ 
                        success: false,
                        message: '업데이트된 데이터 조회 실패',
                        error: err.message
                    });
                }

                console.log('✅ 업데이트된 데이터 조회 성공:', rows[0]);

                res.json({
                    success: true,
                    message: '성공적으로 업데이트되었습니다.',
                    data: rows[0]
                });
            });
        });
    });
});

module.exports = router;
