require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');

const db = require('./db');
const AIClient = require('./ai_client');

const app = express();

// 미들웨어 설정
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://dorosee.xyz',
    'http://dorosee.xyz',
    'https://www.dorosee.xyz',
    'http://www.dorosee.xyz',
    'http://175.45.194.114:3001',
    'http://dorosee.smhrd.com',
    'https://dorosee.smhrd.com',
    'http://www.dorosee.smhrd.com',
    'https://www.dorosee.smhrd.com',
    /^https?:\/\/.*\.dorosee\.xyz$/, // 서브도메인도 허용
    /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/, // 로컬호스트 모든 포트
    /^https?:\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?$/ // 모든 IP 주소 허용
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(morgan('combined'));

// 파일 업로드 설정
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// AI 클라이언트 초기화
const aiClient = new AIClient();

// =========================
// 1) 상태 확인 엔드포인트
// =========================

app.get('/health', async (req, res) => {
  try {
    const dbStatus = await db.testConnection();
    const aiStatus = await aiClient.testConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      ai_server: aiStatus
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// =========================
// 2) AI 모델 관련 엔드포인트
// =========================

// AI 서버 상태 확인
app.get('/api/ai/status', async (req, res) => {
  try {
    const status = await aiClient.testConnection();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 모델 정보 조회
app.get('/api/ai/models', async (req, res) => {
  try {
    const models = await aiClient.getModelsInfo();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 클래스 정보 조회
app.get('/api/ai/classes', async (req, res) => {
  try {
    const classes = await aiClient.getClassesInfo();
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 이미지 분석 요청
app.post('/api/ai/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }
    
    const analysis = await aiClient.analyzeImage(
      req.file.buffer, 
      req.file.originalname
    );
    
    // 분석 결과를 데이터베이스에 저장
    await saveAnalysisResult(analysis);
    
    res.json(analysis);
  } catch (error) {
    console.error('이미지 분석 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// CCTV 분석 요청
app.post('/api/ai/analyze-cctv', async (req, res) => {
  try {
    const analysis = await aiClient.analyzeCCTV();
    
    // 분석 결과를 데이터베이스에 저장
    await saveAnalysisResult(analysis);
    
    res.json(analysis);
  } catch (error) {
    console.error('CCTV 분석 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// 3) 데이터베이스 관련 엔드포인트
// =========================

// 위험도 점수 저장
app.post('/api/save-risk', async (req, res) => {
  try {
    const { totalRiskScore, classCounts, detectionCount } = req.body;
    
    if (totalRiskScore === undefined) {
      return res.status(400).json({ error: 'totalRiskScore is required' });
    }
    
    const sql = `
      UPDATE t_risk_prediction 
      SET total_risk_score = ?, 
          class_counts = ?, 
          detection_count = ?,
          updated_at = NOW()
      WHERE pred_idx = 1
    `;
    
    const params = [
      totalRiskScore, 
      JSON.stringify(classCounts || {}), 
      detectionCount || 0
    ];
    
    const result = await db.query(sql, params);
    
    res.json({ 
      success: true, 
      totalRiskScore,
      classCounts,
      detectionCount
    });
  } catch (error) {
    console.error('DB Update Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// 최근 점수 조회
app.get('/api/scores', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const sql = `
      SELECT id, total_risk_score, class_counts, detection_count, created_at, updated_at 
      FROM t_risk_prediction 
      ORDER BY id DESC 
      LIMIT ?
    `;
    
    const rows = await db.query(sql, [limit]);
    
    // JSON 문자열을 객체로 변환
    const processedRows = rows.map(row => ({
      ...row,
      class_counts: row.class_counts ? JSON.parse(row.class_counts) : {}
    }));
    
    res.json(processedRows);
  } catch (error) {
    console.error('DB Select Error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// 분석 결과 저장 함수
async function saveAnalysisResult(analysis) {
  try {
    const { risk_analysis, timestamp } = analysis;
    const { total_risk_score, class_counts, detection_count } = risk_analysis;
    
    const sql = `
      INSERT INTO t_risk_prediction 
      (total_risk_score, class_counts, detection_count, created_at) 
      VALUES (?, ?, ?, ?)
    `;
    
    const params = [
      total_risk_score,
      JSON.stringify(class_counts),
      detection_count,
      new Date(timestamp * 1000)
    ];
    
    await db.query(sql, params);
    console.log('분석 결과 저장 완료');
  } catch (error) {
    console.error('분석 결과 저장 실패:', error);
  }
}

// =========================
// 4) 도로 점수 저장 관련 엔드포인트
// =========================

// 도로 점수 저장 (t_road_score 테이블)
app.post('/api/save-road-score', async (req, res) => {
  try {
    const { 
      cctv_idx, 
      lat, 
      lon, 
      road_score, 
      crack_cnt, 
      break_cnt, 
      ali_crack_cnt 
    } = req.body;
    
    // 필수 필드 검증
    if (!cctv_idx || lat === undefined || lon === undefined) {
      return res.status(400).json({ 
        error: 'cctv_idx, lat, lon은 필수입니다.' 
      });
    }
    
    const sql = `
      INSERT INTO t_road_score 
      (cctv_idx, lat, lon, road_score, crack_cnt, break_cnt, ali_crack_cnt) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      cctv_idx,
      lat,
      lon,
      road_score || 0.0,
      crack_cnt || 0,
      break_cnt || 0,
      ali_crack_cnt || 0
    ];
    
    const result = await db.query(sql, params);
    
    res.json({ 
      success: true, 
      message: '도로 점수가 성공적으로 저장되었습니다.',
      road_score_idx: result.insertId,
      data: {
        cctv_idx,
        lat,
        lon,
        road_score: road_score || 0.0,
        crack_cnt: crack_cnt || 0,
        break_cnt: break_cnt || 0,
        ali_crack_cnt: ali_crack_cnt || 0
      }
    });
    
    console.log(`✅ 도로 점수 저장 완료: CCTV ${cctv_idx}, 위험도 ${road_score || 0.0}`);
    
  } catch (error) {
    console.error('도로 점수 저장 오류:', error);
    res.status(500).json({ 
      error: '도로 점수 저장 실패', 
      details: error.message 
    });
  }
});

// 도로 점수 조회 (최근 데이터)
app.get('/api/road-scores', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const cctv_idx = req.query.cctv_idx;
    
    let sql = `
      SELECT 
        road_score_idx,
        cctv_idx,
        lat,
        lon,
        road_score,
        detected_at,
        crack_cnt,
        break_cnt,
        ali_crack_cnt
      FROM t_road_score
    `;
    
    const params = [];
    
    if (cctv_idx) {
      sql += ` WHERE cctv_idx = ?`;
      params.push(cctv_idx);
    }
    
    sql += ` ORDER BY detected_at DESC LIMIT ?`;
    params.push(limit);
    
    const rows = await db.query(sql, params);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
    
  } catch (error) {
    console.error('도로 점수 조회 오류:', error);
    res.status(500).json({ 
      error: '도로 점수 조회 실패', 
      details: error.message 
    });
  }
});

// 특정 CCTV의 도로 점수 통계
app.get('/api/road-scores/stats/:cctv_idx', async (req, res) => {
  try {
    const { cctv_idx } = req.params;
    
    const sql = `
      SELECT 
        COUNT(*) as total_records,
        AVG(road_score) as avg_road_score,
        MAX(road_score) as max_road_score,
        MIN(road_score) as min_road_score,
        SUM(crack_cnt) as total_crack_cnt,
        SUM(break_cnt) as total_break_cnt,
        SUM(ali_crack_cnt) as total_ali_crack_cnt,
        MAX(detected_at) as last_detection
      FROM t_road_score 
      WHERE cctv_idx = ?
    `;
    
    const stats = await db.query(sql, [cctv_idx]);
    
    res.json({
      success: true,
      cctv_idx: parseInt(cctv_idx),
      stats: {
        total_records: stats.total_records,
        avg_road_score: parseFloat(stats.avg_road_score || 0).toFixed(1),
        max_road_score: parseFloat(stats.max_road_score || 0).toFixed(1),
        min_road_score: parseFloat(stats.min_road_score || 0).toFixed(1),
        total_crack_cnt: stats.total_crack_cnt || 0,
        total_break_cnt: stats.total_break_cnt || 0,
        total_ali_crack_cnt: stats.total_ali_crack_cnt || 0,
        last_detection: stats.last_detection
      }
    });
    
  } catch (error) {
    console.error('도로 점수 통계 조회 오류:', error);
    res.status(500).json({ 
      error: '도로 점수 통계 조회 실패', 
      details: error.message 
    });
  }
});

// =========================
// 5) CCTV 관리 관련 엔드포인트
// =========================

// t_cctv 테이블의 모든 CCTV 데이터 조회
app.get('/api/cctv-list', async (req, res) => {
  try {
    const sql = `
      SELECT 
        cctv_idx,
        cctv_name,
        lat,
        lon,
        cctv_status,
        cctv_url,
        created_at
      FROM t_cctv 
      WHERE cctv_status = 'A'  -- 활성 상태인 CCTV만
      ORDER BY cctv_idx ASC
    `;
    
    const rows = await db.query(sql);
    
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
    
    console.log(`✅ CCTV 목록 조회 완료: ${rows.length}개`);
    
  } catch (error) {
    console.error('CCTV 목록 조회 오류:', error);
    res.status(500).json({ 
      error: 'CCTV 목록 조회 실패', 
      details: error.message 
    });
  }
});

// 특정 CCTV 정보 조회
app.get('/api/cctv/:cctv_idx', async (req, res) => {
  try {
    const { cctv_idx } = req.params;
    
    const sql = `
      SELECT 
        cctv_idx,
        cctv_name,
        lat,
        lon,
        cctv_status,
        cctv_url,
        created_at
      FROM t_cctv 
      WHERE cctv_idx = ?
    `;
    
    const cctv = await db.query(sql, [cctv_idx]);
    
    if (!cctv) {
      return res.status(404).json({ 
        error: 'CCTV를 찾을 수 없습니다.' 
      });
    }
    
    res.json({
      success: true,
      data: cctv
    });
    
  } catch (error) {
    console.error('CCTV 정보 조회 오류:', error);
    res.status(500).json({ 
      error: 'CCTV 정보 조회 실패', 
      details: error.message 
    });
  }
});

// =========================
// 7) 날씨 정보 관련 엔드포인트
// =========================

// 날씨 정보 저장
app.post('/api/weather/save_weather', async (req, res) => {
  try {
    const { lat, lon, temperature, rain, snow, weather, weather_score, cctv_idx } = req.body;
    
    console.log('🌤️ 날씨 정보 저장 요청:', req.body);
    
    // 필수 데이터 검증
    if (!lat || !lon || temperature === undefined || rain === undefined || snow === undefined || !weather) {
      return res.status(400).json({
        success: false,
        error: '필수 날씨 정보가 누락되었습니다.'
      });
    }
    
    // 날씨 점수 기본값 설정
    const final_weather_score = weather_score || 0;
    
    
    // 날씨 정보 저장
    const insertSQL = `
      INSERT INTO t_weather (
        wh_date, lat, lon, temp, precipitation, snowfall, wh_type, weather_score, cctv_idx
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const insertParams = [
      new Date(),
      parseFloat(lat),
      parseFloat(lon),
      parseFloat(temperature),
      parseFloat(rain) || 0,
      parseFloat(snow) || 0,
      weather,
      final_weather_score,
      cctv_idx || null
    ];
    
    const insertResult = await db.query(insertSQL, insertParams);
    
    console.log('✅ 날씨 정보 저장 성공:', {
      weather_idx: insertResult.insertId,
      lat, lon, temperature, rain, snow, weather, weather_score: final_weather_score, cctv_idx
    });
    
    res.json({
      success: true,
      message: '날씨 정보가 성공적으로 저장되었습니다.',
      weather_idx: insertResult.insertId
    });
    
  } catch (error) {
    console.error('❌ 날씨 정보 저장 오류:', error);
    res.status(500).json({
      success: false,
      error: '날씨 정보 저장에 실패했습니다.',
      details: error.message
    });
  }
});

// 날씨 정보 조회 (위치 기반)
app.get('/api/weather/location', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: '위도와 경도가 필요합니다.'
      });
    }
    
    const sql = `
      SELECT * FROM t_weather 
      WHERE lat = ? AND lon = ?
      ORDER BY wh_date DESC
      LIMIT 10
    `;
    
    const weatherData = await db.query(sql, [parseFloat(lat), parseFloat(lon)]);
    
    res.json({
      success: true,
      data: weatherData
    });
    
  } catch (error) {
    console.error('날씨 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '날씨 정보 조회에 실패했습니다.'
    });
  }
});

// 종합 점수 저장
app.post('/api/total/save_total', async (req, res) => {
  try {
    const { 
      cctv_idx, lat, lon, road_score, weather_score, total_score,
      crack_cnt, break_cnt, ali_crack_cnt, precipitation, temp, wh_type, snowfall
    } = req.body;
    
    console.log('🎯 종합 점수 저장 요청:', req.body);
    
    // 필수 데이터 검증
    if (!cctv_idx || !lat || !lon || road_score === undefined || weather_score === undefined || total_score === undefined) {
      return res.status(400).json({
        success: false,
        error: '필수 종합 점수 정보가 누락되었습니다.'
      });
    }
    
    // 종합 점수 저장
    const insertSQL = `
      INSERT INTO t_total (
        cctv_idx, lat, lon, road_score, weather_score, total_score,
        crack_cnt, break_cnt, ali_crack_cnt, precipitation, temp, wh_type, snowfall
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const insertParams = [
      parseInt(cctv_idx),
      parseFloat(lat),
      parseFloat(lon),
      parseFloat(road_score),
      parseInt(weather_score),
      parseFloat(total_score),
      parseInt(crack_cnt) || 0,
      parseInt(break_cnt) || 0,
      parseInt(ali_crack_cnt) || 0,
      parseFloat(precipitation) || 0,
      parseFloat(temp) || 0,
      wh_type || 'Unknown',
      parseFloat(snowfall) || 0
    ];
    
    const insertResult = await db.query(insertSQL, insertParams);
    
    console.log('✅ 종합 점수 저장 성공:', {
      total_idx: insertResult.insertId,
      cctv_idx, lat, lon, road_score, weather_score, total_score
    });
    
    res.json({
      success: true,
      message: '종합 점수가 성공적으로 저장되었습니다.',
      total_idx: insertResult.insertId
    });
    
  } catch (error) {
    console.error('❌ 종합 점수 저장 오류:', error);
    res.status(500).json({
      success: false,
      error: '종합 점수 저장에 실패했습니다.',
      details: error.message
    });
  }
});

// 종합 점수 조회 (위치 기반)
app.get('/api/total/location', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: '위도와 경도가 필요합니다.'
      });
    }
    
    const sql = `
      SELECT * FROM t_total 
      WHERE lat = ? AND lon = ?
      ORDER BY detected_at DESC
      LIMIT 10
    `;
    
    const totalData = await db.query(sql, [parseFloat(lat), parseFloat(lon)]);
    
    res.json({
      success: true,
      data: totalData
    });
    
  } catch (error) {
    console.error('종합 점수 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '종합 점수 조회에 실패했습니다.'
    });
  }
});

// =========================
// 6) 에러 핸들링
// =========================

// 404 에러
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// 전역 에러 핸들러
app.use((error, req, res, next) => {
  console.error('서버 오류:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// =========================
// 5) 서버 시작
// =========================

const PORT = 3000;

async function startServer() {
  try {
    // 데이터베이스 연결 테스트
    await db.testConnection();
    
    // AI 서버 연결 테스트
    const aiStatus = await aiClient.testConnection();
    if (aiStatus.connected) {
      console.log('✅ AI 서버 연결 성공');
    } else {
      console.log('⚠️ AI 서버 연결 실패:', aiStatus.error);
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 AI 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`📊 데이터베이스: 연결됨`);
      console.log(`🤖 AI 모델: ${aiStatus.connected ? '연결됨' : '연결 안됨'}`);
    });
    
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer();
