// 서버 실행 (포트 liston만 담당)
const express       = require('express');
const cors          = require('cors');
const path          = require('path');
const mysql         = require('mysql2');
const bodyParser    = require('body-parser')
const markerRouter = require('./router/marker')
const login = require('./router/login');

const app = express();
const PORT = 3001;

// MySQL 연결 설정 (conn.connect()를 쿼리마다 호출하는 기존 스타일 유지)
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});

// 미들웨어 설정 추가
app.use(cors());         
app.use(express.json()); 
app.use(bodyParser.json());

// 날씨 라우터 연결 추가
const weatherRouter = require('./router/weather')

// 마커 업데이트 라우터 연결
app.use('/api/marker', markerRouter);

// 날씨 라우터 연결
app.use('/weather', weatherRouter);

// 보고서 생성 라우터 연결
const reportRouter = require('./router/report');
app.use('/api/report', reportRouter);

// 로그인 라우터 연결
app.use('/api', login);


// 기본 라우트 추가 (선택사항)
app.get('/', (req, res) => {
    console.log('🏠 기본 라우트 접근');
  res.json({ 
    message: 'Weather API Server',
    version: '1.0.0'
  });
});

app.listen(3001, () => {
    console.log('서버가 3001번 포트에서 실행 중입니다.');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});