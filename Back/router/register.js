const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// MySQL 연결 설정
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});

// 사용자 등록 API
router.post('/register', async (req, res) => {
    console.log('✅ 사용자 등록 요청 수신:', req.body);
    
    const { admin_id, admin_pw, admin_name, dept_name, dept_addr } = req.body;
    
    // 필수 필드 검증
    if (!admin_id || !admin_pw || !admin_name || !dept_name || !dept_addr) {
        return res.status(400).json({
            success: false,
            message: '모든 필수 정보를 입력해주세요.'
        });
    }
    
    try {
        // 데이터베이스 연결
        await new Promise((resolve, reject) => {
            conn.connect(err => {
                if (err) {
                    console.error('❌ 데이터베이스 연결 실패:', err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        
        // 중복 아이디 확인
        const [existingUsers] = await conn.promise().query(
            'SELECT admin_id FROM t_admin WHERE admin_id = ?',
            [admin_id]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 존재하는 아이디입니다.'
            });
        }
        
        // 비밀번호를 BCrypt로 해싱
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(admin_pw, saltRounds);
        
        // 새 사용자 등록
        const [result] = await conn.promise().query(
            'INSERT INTO t_admin (admin_id, admin_pw, admin_name, dept_name, dept_addr) VALUES (?, ?, ?, ?, ?)',
            [admin_id, hashedPassword, admin_name, dept_name, dept_addr]
        );
        
        console.log('✅ 사용자 등록 성공:', admin_id);
        
        res.json({
            success: true,
            message: '사용자 등록이 완료되었습니다.',
            user: {
                admin_id,
                admin_name,
                dept_name,
                dept_addr
            }
        });
        
    } catch (error) {
        console.error('❌ 사용자 등록 실패:', error);
        res.status(500).json({
            success: false,
            message: '사용자 등록 중 오류가 발생했습니다.'
        });
    }
});

// 사용자 목록 조회 API (관리자용)
router.get('/users', async (req, res) => {
    try {
        // 데이터베이스 연결
        await new Promise((resolve, reject) => {
            conn.connect(err => {
                if (err) {
                    console.error('❌ 데이터베이스 연결 실패:', err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
        
        // 사용자 목록 조회 (비밀번호 제외)
        const [users] = await conn.promise().query(
            'SELECT admin_id, admin_name, dept_name, dept_addr FROM t_admin'
        );
        
        res.json({
            success: true,
            users: users
        });
        
    } catch (error) {
        console.error('❌ 사용자 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            message: '사용자 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
