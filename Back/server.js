// 서버 실행 (포트 liston만 담당)
const express       = require('express');
const cors          = require('cors');
const mysql         = require('mysql2');
const bodyParser    = require('body-parser')
const markerRouter = require('./router/marker')
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

const path = require('path');

// MySQL Pool 연결 설정 (모든 연결을 pool 방식으로 통일)
const mysql2 = require('mysql2/promise');
const db = mysql2.createPool({
    host: process.env.DB_HOST || 'project-db-campus.smhrd.com',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'campus_25SW_BD_p3_2',
    password: process.env.DB_PASSWORD || 'smhrd2',
    database: process.env.DB_NAME || 'campus_25SW_BD_p3_2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// mobile_server2.js의 lastStTm 변수
let lastStTm = "1970-01-01 00:00:00"; // 초기값

// CORS 설정 - 프론트엔드 개발 서버 허용
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://0.0.0.0:5173', 'http://0.0.0.0:3000', 'http://0.0.0.0:3001', 'http://dorosee.xyz', 'http://www.dorosee.xyz','http://175.45.194.114:3001','http://dorosee.smhrd.com','https://dorosee.smhrd.com'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


// AI 서버 프록시 설정 (항상 활성화) - 미들웨어보다 먼저 등록
// 환경변수 확인을 위한 로그
console.log('🔍 현재 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 프록시 설정 활성화: true (항상 활성화)');


// 미들웨어 설정 추가 (라우트 핸들러보다 먼저 등록)
app.use(express.json()); 
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// AI 서버 직접 라우트 핸들러 (프록시 대신 직접 처리)
app.post('/api/analyze-cctv', async (req, res) => {
    try {
        console.log('🌐 들어온 요청: POST /api/analyze-cctv');
        console.log('📍 요청 헤더:', req.headers);
        console.log('📍 요청 데이터:', req.body);
        
        const response = await axios.post('http://218.149.60.128:8000/api/analyze-cctv', req.body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ AI 서버 응답 받음!');
        console.log('  📍 응답 상태:', response.status);
        console.log('  📍 응답 데이터:', response.data);
        console.log('✅ CCTV 분석 서버 응답 성공');
        res.json(response.data);
    } catch (error) {
        console.error('❌ CCTV 분석 서버 요청 실패:', error.message);
        res.status(500).json({ error: 'CCTV 분석 서버 요청 실패' });
    }
});

app.post('/api/analyze-complaint-image', async (req, res) => {
    try {
        console.log('🌐 들어온 요청: POST /api/analyze-complaint-image');
        console.log('📍 요청 헤더:', req.headers);
        console.log('📍 요청 데이터:', req.body);
        
        const response = await axios.post('http://218.149.60.128:8000/api/analyze-complaint-image', req.body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ AI 서버 응답 받음!');
        console.log('  📍 응답 상태:', response.status);
        console.log('  📍 응답 데이터:', response.data);
        console.log('✅ 시민 제보 이미지 분석 서버 응답 성공');
        res.json(response.data);
    } catch (error) {
        console.error('❌ 시민 제보 이미지 분석 서버 요청 실패:', error.message);
        res.status(500).json({ error: '시민 제보 이미지 분석 서버 요청 실패' });
    }
});

app.post('/api/analyze-flood', async (req, res) => {
    try {
        console.log('🌐 들어온 요청: POST /api/analyze-flood');
        console.log('📍 요청 헤더:', req.headers);
        console.log('📍 요청 데이터:', req.body);
        
        const response = await axios.post('http://218.149.60.128:8001/api/analyze-flood', req.body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 침수 분석 서버 응답 성공');
        res.json(response.data);
    } catch (error) {
        console.error('❌ 침수 분석 서버 요청 실패:', error.message);
        res.status(500).json({ error: '침수 분석 서버 요청 실패' });
    }
});

app.post('/api/analyze-complaint-flood', async (req, res) => {
    try {
        console.log('🌐 들어온 요청: POST /api/analyze-complaint-flood');
        console.log('📍 요청 헤더:', req.headers);
        console.log('📍 요청 데이터:', req.body);
        
        const response = await axios.post('http://218.149.60.128:8001/api/analyze-complaint-flood', req.body, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 시민 제보 침수 분석 서버 응답 성공');
        res.json(response.data);
    } catch (error) {
        console.error('❌ 시민 제보 침수 분석 서버 요청 실패:', error.message);
        res.status(500).json({ error: '시민 제보 침수 분석 서버 요청 실패' });
    }
});

// 통제 구역 추가 API (pool 방식으로 변경)
app.post('/api/road-control/add', async (req, res) => {
    try {
        console.log('🌐 통제 구역 추가 요청:', req.body);
        
        const { control_desc, control_addr, control_type, lat, lon, c_report_idx } = req.body;
        
        if (!control_desc || !control_addr || !control_type || !lat || !lon) {
            return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
        }
        
        const sql = `
            INSERT INTO t_road_control 
            (control_desc, control_addr, control_type, lat, lon, c_report_idx, control_st_tm) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await db.execute(sql, [control_desc, control_addr, control_type, lat, lon, c_report_idx]);
        
        console.log('✅ 통제 구역 추가 성공:', result.insertId);
        res.json({ 
            success: true, 
            message: '통제 구역이 성공적으로 추가되었습니다.',
            control_idx: result.insertId
        });
        
    } catch (error) {
        console.error('❌ 통제 구역 추가 처리 중 오류:', error);
        res.status(500).json({ error: '통제 구역 추가 중 오류가 발생했습니다.' });
    }
});




// 모든 요청 로깅 미들웨어
app.use((req, res, next) => {
    console.log('🌐 들어온 요청:', req.method, req.url);
    console.log('  📍 요청 헤더:', req.headers);
    next();
});


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

// 모바일 관련 라우터들 추가
app.use('/api/mobile/road-controls', require('./router/mobile-road-controls'));
app.use('/api/mobile/reports', require('./router/mobile-reports'));
app.use('/api/mobile/markers', require('./router/mobile-markers'));

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


// 등록된 라우트 확인
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log('📍 등록된 라우트:', r.route.path, '메서드:', Object.keys(r.route.methods));
  }
});


// SPA 라우팅을 위한 catch-all 라우트 (모든 API 라우트 등록 후 마지막에 배치)
app.get('*', (req, res) => {
    console.log('🌐 SPA 라우팅 - HTML 파일 반환:', req.url);
    res.sendFile(path.join(__dirname, '../Front/dist', 'index.html'));
});


const host = '0.0.0.0';
// 서버 시작
app.listen(PORT, host ,() => {
  console.log(`=================================`);
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`도로 통제 API 엔드포인트: http://0.0.0.0:${PORT}/api/mobile/road-controls`);
  console.log(`민원 제출 API 엔드포인트: http://0.0.0.0:${PORT}/api/mobile/reports`);
  console.log(`마커 API 엔드포인트: http://0.0.0.0:${PORT}/api/mobile/markers`);
  console.log(`=================================`);
  console.log('🔍 등록된 라우트 목록:');
  app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
      console.log(`  - ${r.route.path} (${Object.keys(r.route.methods).join(', ')})`);
    }
  });
});
