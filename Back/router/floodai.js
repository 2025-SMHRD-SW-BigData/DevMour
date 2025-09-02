const mysql = require('mysql2/promise');
const express = require('express');
const router = express.Router();

// DB 연결 정보
const dbConfig = {
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: "campus_25SW_BD_p3_2",
    password: "smhrd2",
    database: "campus_25SW_BD_p3_2"
};

// undefined 값을 null로 변환하는 헬퍼 함수
const sanitizeParams = (params) => {
    return params.map(param => param === undefined ? null : param);
};

// 서버용 라우터 - AI 모델에서 보내는 데이터를 받아서 DB에 저장

// POST /api/floodai/analyze-flood 엔드포인트
router.post('/analyze-flood', async (req, res) => {
    try {
        console.log('📥 침수 분석 요청 수신:', req.body);
        
        // 요청 데이터에서 필요한 정보 추출
        const { image_path, analysis_result, confidence, location } = req.body;
        
        // DB에 결과 저장
        const conn = await mysql.createConnection(dbConfig);
        
        await conn.execute(
            `INSERT INTO t_flood_analysis 
             (image_path, analysis_result, confidence, location, created_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            sanitizeParams([image_path, analysis_result, confidence, location])
        );
        
        await conn.end();
        
        console.log('✅ 침수 분석 결과 저장 완료');
        res.json({ 
            success: true, 
            message: '침수 분석 결과가 성공적으로 저장되었습니다.' 
        });
        
    } catch (error) {
        console.error('❌ 침수 분석 결과 저장 중 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '침수 분석 결과 저장 중 오류가 발생했습니다.',
            error: error.message 
        });
    }
});

// POST /api/save-risk 엔드포인트 (AI 모델이 실제로 사용하는 엔드포인트)
router.post('/save-risk', async (req, res) => {
    try {
        console.log('📥 위험도 저장 요청 수신:', req.body);
        
        // 요청 데이터에서 필요한 정보 추출
        const { 
            image_path, 
            analysis_result, 
            confidence, 
            location,
            risk_level,
            weather_condition,
            timestamp 
        } = req.body;
        
        // DB에 결과 저장
        const conn = await mysql.createConnection(dbConfig);
        
        await conn.execute(
            `INSERT INTO t_flood_analysis 
             (image_path, analysis_result, confidence, location, risk_level, weather_condition, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            sanitizeParams([image_path, analysis_result, confidence, location, risk_level, weather_condition, timestamp || new Date()])
        );
        
        await conn.end();
        
        console.log('✅ 위험도 분석 결과 저장 완료');
        res.json({ 
            success: true, 
            message: '위험도 분석 결과가 성공적으로 저장되었습니다.' 
        });
        
    } catch (error) {
        console.error('❌ 위험도 분석 결과 저장 중 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '위험도 분석 결과 저장 중 오류가 발생했습니다.',
            error: error.message 
        });
    }
});

// POST /api/floodai/save_result 엔드포인트 (침수 탐지 결과 저장)
router.post('/save_result', async (req, res) => {
    try {
        console.log('📥 침수 탐지 결과 저장 요청 수신:', req.body);
        
        // 요청 데이터에서 필요한 정보 추출
        const { 
            cctv_idx, 
            citizen_report_idx, 
            image_path, 
            lat, 
            lon, 
            flood_result 
        } = req.body;
        
        // DB에 결과 저장
        const conn = await mysql.createConnection(dbConfig);
        
        await conn.execute(
            `INSERT INTO t_flood_result 
             (cctv_idx, citizen_report_idx, image_path, lat, lon, flood_result) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            sanitizeParams([cctv_idx, citizen_report_idx, image_path, lat, lon, flood_result])
        );
        
        await conn.end();
        
        console.log('✅ 침수 탐지 결과 저장 완료');
        res.json({ 
            success: true, 
            message: '침수 탐지 결과가 성공적으로 저장되었습니다.' 
        });
        
    } catch (error) {
        console.error('❌ 침수 탐지 결과 저장 중 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '침수 탐지 결과 저장 중 오류가 발생했습니다.',
            error: error.message 
        });
    }
});

// POST /api/save-road-score 엔드포인트 (도로 점수 저장)
router.post('/save-road-score', async (req, res) => {
    try {
        console.log('📥 도로 점수 저장 요청 수신:', req.body);
        
        // 요청 데이터에서 필요한 정보 추출
        const { 
            road_id, 
            score, 
            weather_condition, 
            timestamp,
            location,
            risk_level
        } = req.body;
        
        // DB에 결과 저장
        const conn = await mysql.createConnection(dbConfig);
        
        await conn.execute(
            `INSERT INTO t_road_score 
             (road_id, score, weather_condition, timestamp, location, risk_level, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            sanitizeParams([road_id, score, weather_condition, timestamp, location, risk_level])
        );
        
        await conn.end();
        
        console.log('✅ 도로 점수 저장 완료');
        res.json({ 
            success: true, 
            message: '도로 점수가 성공적으로 저장되었습니다.' 
        });
        
    } catch (error) {
        console.error('❌ 도로 점수 저장 중 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '도로 점수 저장 중 오류가 발생했습니다.',
            error: error.message 
        });
    }
});

// POST /api/save-flood-detection 엔드포인트 (침수 탐지 결과 저장 - 새로운 형식)
router.post('/save-flood-detection', async (req, res) => {
    try {
        console.log('📥 침수 탐지 결과 저장 요청 수신:', req.body);
        
        // 요청 데이터에서 필요한 정보 추출
        const { 
            cctv_idx, 
            citizen_report_idx, 
            image_path, 
            lat, 
            lon, 
            flood_result 
        } = req.body;
        
        // DB에 결과 저장
        const conn = await mysql.createConnection(dbConfig);
        
        await conn.execute(
            `INSERT INTO t_flood_result 
             (cctv_idx, citizen_report_idx, image_path, lat, lon,flood_result) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            sanitizeParams([cctv_idx, citizen_report_idx, image_path, lat, lon, flood_result])
        );
        
        await conn.end();
        
        console.log('✅ 침수 탐지 결과 저장 완료');
        res.json({ 
            success: true, 
            message: '침수 탐지 결과가 성공적으로 저장되었습니다.' 
        });
        
    } catch (error) {
        console.error('❌ 침수 탐지 결과 저장 중 오류:', error);
        res.status(500).json({ 
            success: false, 
            message: '침수 탐지 결과 저장 중 오류가 발생했습니다.',
            error: error.message 
        });
    }
});

module.exports = router;
