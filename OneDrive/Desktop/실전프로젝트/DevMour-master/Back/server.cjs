// @ts-check
// CommonJS 모듈
const express       = require('express');
const cors          = require('cors');
const path          = require('path');
const mysql         = require('mysql2');
const bodyParser    = require('body-parser')
const markerRouter = require('./router/marker.cjs')

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
app.use(express.urlencoded({ extended: true }));

// 인증 관련 라우터 (로그인/로그아웃)
app.use('/api/auth', require('./router/auth.cjs'));

// 사용자 등록 라우터
app.use('/api/register', require('./router/register.cjs'));

// 마커 관련 라우터
app.use('/api/marker', require('./router/marker.cjs'));

// CCTV 관련 라우터
app.use('/api/cctv', require('./router/cctv.cjs'));

// 도로 통제 관련 라우터
app.use('/api/road-control', require('./router/road-control.cjs'));

// 알림 관련 라우터
app.use('/api/alert', require('./router/alert.cjs'));

// 위험도 랭킹 관련 라우터
app.use('/api/risk', require('./router/risk.cjs'));

// 기상 관련 라우터
app.use('/api/weather', require('./router/weather.cjs'));

// t_total 테이블 관련 라우터
app.use('/api/total', require('./router/total.cjs'));

// 보고서 생성 라우터 연결
const reportRouter = require('./router/report.cjs');
app.use('/api/report', reportRouter);

// 전년도 동기간 대비 라우터 연결
app.use('/api/comparison', require('./router/comparison.cjs'));

// 연도별 비교 라우터 연결
app.use('/api/yearlycomparison', require('./router/yearlycomparison.cjs'));

// 시민 제보 관련 라우터 연결
app.use('/api/complaint', require('./router/complaint.cjs'));

// 공사 통제 관련 라우터 연결
app.use('/api/construction', require('./router/construction.cjs'));

// 업데이트 관련 라우터 연결
app.use('/api/update', require('./router/update.cjs'));


// 기본 라우트 추가 (선택사항)
app.get('/', (req, res) => {
    console.log('�� 기본 라우트 접근');
  res.json({ 
    message: 'Weather API Server',
    version: '1.0.0'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});