// 서버 실행 (포트 liston만 담당)
const express       = require('express');
const cors          = require('cors');
const path          = require('path');
const mysql         = require('mysql2');

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


app.post('/recordLine',(req, res) => {
    console.log('통제라인 기록 요청');
    const {stLat, stLon, edLat, edLon} = req.body;
    

})

// 미들웨어 설정 추가
app.use(cors());         
app.use(express.json());  

// 날씨 라우터 연결 추가
const weatherRouter = require('./router/weather')

app.use('/weather', weatherRouter);


// 기본 라우트 추가 (선택사항)
app.get('/', (req, res) => {
    console.log('🏠 기본 라우트 접근');
  res.json({ 
    message: 'Weather API Server',
    version: '1.0.0'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});