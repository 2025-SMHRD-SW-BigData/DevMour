const express = require('express');
const app = express();
const mysql = require('mysql2');

// MySQL 연결 설정 (conn.connect()를 쿼리마다 호출하는 기존 스타일 유지)
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});


app.post('/recordLine',(req, res) => {
    console.log('통제라인 기록 요청');
    const {stLat, stLon, edLat, edLon} = req.body;
    

})

// 서버 실행 (포트 liston만 담당)
app.listen(3001, () => {
    console.log(`Node.js 서버가 http://localhost:3001 에서 실행 중입니다.`);
});