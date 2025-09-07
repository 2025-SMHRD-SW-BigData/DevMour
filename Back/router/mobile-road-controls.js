const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// MySQL Pool 연결 설정
const db = mysql.createPool({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2',
    waitForConnections: true,
    connectionLimit: 10
});

// 도로 통제 목록 조회 - t_road_control 테이블에서 데이터 조회
router.get('/', async (req, res) => {
    try {
        // t_road_control 테이블에서 모든 도로 통제 데이터 조회
        const [rows] = await db.execute(`
            SELECT 
                control_idx,
                pred_idx,
                control_desc,
                control_st_tm,
                control_ed_tm,
                created_at,
                road_idx,
                lat,
                lon,
                control_addr,
                control_type,
                completed
            FROM t_road_control
            ORDER BY control_idx
        `);
        
        // 응답 데이터 형식에 맞게 변환
        const roadControls = rows.map(row => ({
            control_idx: row.control_idx,
            pred_idx: row.pred_idx,
            control_desc: row.control_desc,
            control_st_tm: row.control_st_tm,
            control_ed_tm: row.control_ed_tm,
            created_at: row.created_at,
            road_idx: row.road_idx,
            lat: parseFloat(row.lat),
            lon: parseFloat(row.lon),
            control_addr: row.control_addr,
            control_type: row.control_type,
            completed: row.completed
        }));
        
        res.json({
            success: true,
            message: '도로 통제 데이터 조회 성공',
            data: roadControls
        });
        
    } catch (error) {
        console.error('도로 통제 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '도로 통제 데이터 조회에 실패했습니다',
            error: error.message
        });
    }
});

// 홍수 데이터 조회 - t_road_control 테이블에서 control_type이 "flood"인 데이터만 조회
router.get('/flood', async (req, res) => {
    try {
        // t_road_control 테이블에서 control_type이 "flood"이고 lat, lon이 null이 아닌 데이터만 조회
        const [rows] = await db.execute(`
            SELECT 
                control_idx,
                pred_idx,
                control_desc,
                control_st_tm,
                control_ed_tm,
                created_at,
                road_idx,
                lat,
                lon,
                control_addr,
                control_type,
                completed
            FROM t_road_control
            WHERE control_type = 'flood' 
            AND lat IS NOT NULL 
            AND lon IS NOT NULL
            ORDER BY control_idx
        `);
        
        // 응답 데이터 형식에 맞게 변환
        const floodData = rows.map(row => ({
            control_idx: row.control_idx,
            pred_idx: row.pred_idx,
            control_desc: row.control_desc,
            control_st_tm: row.control_st_tm,
            control_ed_tm: row.control_ed_tm,
            created_at: row.created_at,
            road_idx: row.road_idx,
            lat: parseFloat(row.lat),
            lon: parseFloat(row.lon),
            control_addr: row.control_addr,
            control_type: row.control_type,
            completed: row.completed
        }));
        
        res.json({
            success: true,
            message: '홍수 데이터 조회 성공',
            data: floodData
        });
        
    } catch (error) {
        console.error('홍수 데이터 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '홍수 데이터 조회에 실패했습니다',
            error: error.message
        });
    }
});

// 최신 도로 통제 데이터 조회 (폴링용) - 중복 방지 
router.get('/latest', async (req, res) => {
    try {

        // URL 인코딩된 시간을 디코딩하고 MySQL 형식으로 변환
        // 맨 처음 요청시에는 현재 한국 시간 기준으로 5분전 새로운 데이터만 조회
        let lastRequestTime = req.query.lastRequestTime || (() => {
            const now = new Date();
            const koreanTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+9
            const fiveMinutesAgo = new Date(koreanTime.getTime() - (5 * 60 * 1000)); // 5분 전
            return fiveMinutesAgo.toISOString().replace('T', ' ').split('.')[0];
        })();
        
        // URL 디코딩 처리
        if (req.query.lastRequestTime ) {
            lastRequestTime = decodeURIComponent(lastRequestTime);
            console.log('🔍 디코딩된 시간:', lastRequestTime);
            
            // ISO 형식을 MySQL 형식으로 변환하고 한국 시간으로 변환
            if (lastRequestTime.includes('T')) {
                // UTC 시간을 한국 시간으로 변환 (UTC+9)
                const utcDate = new Date(lastRequestTime);
                const koreanDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
                // 한국 시간을 MySQL 형식으로 변환 (YYYY-MM-DD HH:MM:SS)
                const year = koreanDate.getUTCFullYear();
                const month = String(koreanDate.getUTCMonth() + 1).padStart(2, '0');
                const day = String(koreanDate.getUTCDate()).padStart(2, '0');
                const hours = String(koreanDate.getUTCHours()).padStart(2, '0');
                const minutes = String(koreanDate.getUTCMinutes()).padStart(2, '0');
                const seconds = String(koreanDate.getUTCSeconds()).padStart(2, '0');
                
                lastRequestTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                console.log('🔄 변환된 MySQL 시간 (한국시간):', lastRequestTime);
            }
        } else {
		console.log('첫 요청 - : ', lastRequestTime);
        }
        
        // 마지막 요청 시간 이후에 생성된 새로운 데이터만 조회
        console.log('🔍 쿼리 실행 - lastRequestTime:', lastRequestTime);
        
        // 마지막 요청 시간 이후에 생성된 새로운 데이터만 조회
        const [rows] = await db.execute(`
            SELECT 
                control_idx,
                pred_idx,
                control_desc,
                control_st_tm,
                control_ed_tm,
                created_at,
                road_idx,
                lat,
                lon,
                control_addr,
                control_type,
                completed
            FROM t_road_control
            WHERE created_at > ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [lastRequestTime]);

        console.log('📊 조회된 데이터 개수:', rows.length);
        
        if (rows.length === 0) {
            return res.json({
                data: null,
                lastRequestTime: lastRequestTime // 데이터가 없을 때는 lastRequestTime 갱신하지 않음
            });
        }
        
        const latestControl = rows[0];
        // control_st_tm을 안드로이드 친화적 형식으로 변환
        const controlStTime = new Date(latestControl.control_st_tm);
        const controlStYear = controlStTime.getFullYear();
        const controlStMonth = String(controlStTime.getMonth() + 1).padStart(2, '0');
        const controlStDay = String(controlStTime.getDate()).padStart(2, '0');
        const controlStHours = String(controlStTime.getHours()).padStart(2, '0');
        const controlStMinutes = String(controlStTime.getMinutes()).padStart(2, '0');
        const controlStSeconds = String(controlStTime.getSeconds()).padStart(2, '0');
        const formattedControlStTime = `${controlStYear}-${controlStMonth}-${controlStDay}T${controlStHours}:${controlStMinutes}:${controlStSeconds}`;
        
        // 응답 데이터 형식에 맞게 변환
        const controlData = {
            id: latestControl.control_idx,
            control_desc: latestControl.control_desc,
            control_st_tm: formattedControlStTime,
            control_addr: latestControl.control_addr,
            created_at: latestControl.created_at
        };
        
        // 안드로이드에서 파싱하기 쉬운 형식으로 변환 (한국 시간 기준)

        const dbTime = new Date(latestControl.created_at);
        const koreanTime = new Date(dbTime.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
        
        // 한국 시간을 ISO 형식으로 변환
        const year = koreanTime.getUTCFullYear();
        const month = String(koreanTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(koreanTime.getUTCDate()).padStart(2, '0');
        const hours = String(koreanTime.getUTCHours()).padStart(2, '0');
        const minutes = String(koreanTime.getUTCMinutes()).padStart(2, '0');
        const seconds = String(koreanTime.getUTCSeconds()).padStart(2, '0');
        
        const formattedCreatedAt = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000`;
        
        res.json({
            newData: true,
            data: controlData,
            lastRequestTime: formattedCreatedAt // 조회된 데이터가 있을 때만 갱신
        });
        
    } catch (error) {
        console.error('최신 도로 통제 데이터 조회 오류:', error);
        res.status(500).json({
            newData: false,
            data: null,
            error: error.message
        });
    }
});

module.exports = router;
