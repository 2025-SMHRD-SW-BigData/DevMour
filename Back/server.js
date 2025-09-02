// 서버 실행 (포트 liston만 담당)
const express       = require('express');
const cors          = require('cors');
const mysql         = require('mysql2');
const bodyParser    = require('body-parser')
const markerRouter = require('./router/marker')

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const path = require('path');

// MySQL 연결 설정 (conn.connect()를 쿼리마다 호출하는 기존 스타일 유지)
let conn = mysql.createConnection({
    host: process.env.DB_HOST || 'project-db-campus.smhrd.com',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'campus_25SW_BD_p3_2',
    password: process.env.DB_PASSWORD || 'smhrd2',
    database: process.env.DB_NAME || 'campus_25SW_BD_p3_2'
});

// CORS 설정 - 프론트엔드 개발 서버 허용
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://0.0.0.0:5173', 'http://0.0.0.0:3000', 'http://0.0.0.0:3001'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 미들웨어 설정 추가
app.use(express.json()); 
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// AI 침수 분석 라우터 연결 (가장 구체적인 경로)
app.use('/api/floodai', require('./router/floodai'));

// 보고서 생성 라우터 연결
const reportRouter = require('./router/report');
app.use('/api/report', reportRouter);

// 연도별 비교 라우터 연결
app.use('/api/yearlycomparison', require('./router/yearlycomparison'));

// 전년도 동기간 대비 라우터 연결
app.use('/api/comparison', require('./router/comparison'));

// 도로 통제 관련 라우터
app.use('/api/road-control', require('./router/road-control'));

// 공사 통제 관련 라우터 연결
app.use('/api/construction', require('./router/construction'));

// 시민 제보 관련 라우터 연결
app.use('/api/complaint', require('./router/complaint'));

// CCTV 관련 라우터
app.use('/api/cctv', require('./router/cctv'));

// 마커 관련 라우터
app.use('/api/marker', require('./router/marker'));

// 알림 관련 라우터
app.use('/api/alert', require('./router/alert'));

// 위험도 랭킹 관련 라우터
app.use('/api/risk', require('./router/risk'));

// 기상 관련 라우터
app.use('/api/weather', require('./router/weather'));

// 종합 위험도 관련 라우터
app.use('/api/total', require('./router/total'));

// 업데이트 관련 라우터 연결
app.use('/api/update', require('./router/update'));

// 인증 관련 라우터 (로그인/로그아웃)
app.use('/api/auth', require('./router/auth'));

// 사용자 등록 라우터
app.use('/api/register', require('./router/register'));

// 정적 파일 서빙 (라우터 등록 후에 배치)
app.use(express.static(path.join(__dirname, '../Front/dist')));

// 기본 라우트 추가 (선택사항)
app.get('/', (req, res) => {
    console.log('🏠 기본 라우트 접근');
  res.json({ 
    message: 'Weather API Server',
    version: '1.0.0'
  });
});

// SPA 라우팅을 위한 catch-all 라우트 (마지막에 배치)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Front/dist', 'index.html'));
});

// 서버 시작
const host = process.env.HOST || '0.0.0.0';
app.listen(PORT, host, () => {
  console.log(`Server running at http://${host}:${PORT}`);
});

