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

// 로그인 API
router.post('/login', (req, res) => {
    console.log('✅ 로그인 요청 수신:', req.body);
    
    const { admin_id, admin_pw } = req.body;
    
    // 필수 필드 검증
    if (!admin_id || !admin_pw) {
        return res.status(400).json({
            success: false,
            message: '아이디와 비밀번호를 모두 입력해주세요.'
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
        
        // t_admin 테이블에서 사용자 검증
        const sql = 'SELECT * FROM t_admin WHERE admin_id = ? AND admin_pw = ?';
        
        conn.query(sql, [admin_id, admin_pw], (err, rows) => {
            if (err) {
                console.error('❌ 로그인 쿼리 실행 실패:', err);
                return res.status(500).json({
                    success: false,
                    message: '로그인 처리 중 오류가 발생했습니다.'
                });
            }
            
            if (rows.length === 0) {
                console.log('❌ 로그인 실패: 잘못된 아이디 또는 비밀번호');
                return res.status(401).json({
                    success: false,
                    message: '아이디 또는 비밀번호가 올바르지 않습니다.'
                });
            }
            
            // 로그인 성공
            const user = rows[0];
            console.log('✅ 로그인 성공:', user.admin_id);
            
            res.json({
                success: true,
                message: '로그인 성공',
                user: {
                    admin_id: user.admin_id,
                    admin_name: user.admin_name,
                    dept_name: user.dept_name,
                    dept_addr: user.dept_addr
                }
            });
        });
    });
});

// 로그아웃 API (선택사항)
router.post('/logout', (req, res) => {
    console.log('✅ 로그아웃 요청 수신');
    
    res.json({
        success: true,
        message: '로그아웃 성공'
    });
});

module.exports = router;
