const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// MySQL 연결 (server.js랑 동일하게)
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});

// 로그인 API
router.post('/login', (req, res) => {
    const { user_id, password } = req.body;

    const query = "SELECT * FROM t_admin WHERE admin_id = ? AND admin_pw = ?";
    conn.query(query, [user_id, password], (err, results) => {
        if (err) {
            console.error("로그인 쿼리 실패:", err);
            return res.status(500).json({ message: "서버 오류" });
        }

        if (results.length > 0) {
            // 로그인 성공
            res.json({ message: "로그인 성공", user: results[0] });
        } else {
            // 로그인 실패
            res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
        }
    });
});

module.exports = router;