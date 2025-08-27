const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// JWT 시크릿 키 (실제 운영환경에서는 환경변수로 관리)
const JWT_SECRET = 'dorothy-see-secret-key-2025';

// MySQL 연결 설정
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});

// JWT 토큰 생성 함수
const generateToken = (user) => {
    return jwt.sign(
        {
            admin_id: user.admin_id,
            admin_name: user.admin_name,
            dept_name: user.dept_name,
            dept_addr: user.dept_addr
        },
        JWT_SECRET,
        { expiresIn: '24h' } // 24시간 유효
    );
};

// JWT 토큰 검증 미들웨어
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN 형식
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '액세스 토큰이 필요합니다.'
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ 토큰 검증 실패:', error.message);
        return res.status(401).json({
            success: false,
            message: '유효하지 않은 토큰입니다.'
        });
    }
};

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
        
        // t_admin 테이블에서 사용자 검증 (비밀번호는 해시된 값과 비교)
        const sql = 'SELECT * FROM t_admin WHERE admin_id = ?';
        
        conn.query(sql, [admin_id], async (err, rows) => {
            if (err) {
                console.error('❌ 로그인 쿼리 실행 실패:', err);
                return res.status(500).json({
                    success: false,
                    message: '로그인 처리 중 오류가 발생했습니다.'
                });
            }
            
            if (rows.length === 0) {
                console.log('❌ 로그인 실패: 존재하지 않는 아이디');
                return res.status(401).json({
                    success: false,
                    message: '아이디 또는 비밀번호가 올바르지 않습니다.'
                });
            }
            
            const user = rows[0];
            
            try {
                // 입력받은 비밀번호와 데이터베이스의 해시된 비밀번호 비교
                const isPasswordValid = await bcrypt.compare(admin_pw, user.admin_pw);
                
                if (!isPasswordValid) {
                    console.log('❌ 로그인 실패: 잘못된 비밀번호');
                    return res.status(401).json({
                        success: false,
                        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
                    });
                }
                
                // 로그인 성공 - JWT 토큰 생성
                const token = generateToken(user);
                
                console.log('✅ 로그인 성공:', user.admin_id);
                
                res.json({
                    success: true,
                    message: '로그인 성공',
                    token: token,
                    user: {
                        admin_id: user.admin_id,
                        admin_name: user.admin_name,
                        dept_name: user.dept_name,
                        dept_addr: user.dept_addr
                    }
                });
            } catch (bcryptError) {
                console.error('❌ 비밀번호 해시 비교 실패:', bcryptError);
                return res.status(500).json({
                    success: false,
                    message: '로그인 처리 중 오류가 발생했습니다.'
                });
            }
        });
    });
});

// 토큰 검증 API
router.get('/verify', verifyToken, (req, res) => {
    console.log('✅ 토큰 검증 성공:', req.user.admin_id);
    
    res.json({
        success: true,
        message: '토큰이 유효합니다.',
        user: req.user
    });
});

// 로그아웃 API
router.post('/logout', (req, res) => {
    console.log('✅ 로그아웃 요청 수신');
    
    res.json({
        success: true,
        message: '로그아웃 성공'
    });
});

module.exports = router;
