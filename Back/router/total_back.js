const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// MySQL 연결 설정
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});
// CCTV 위치 근처의 손상 데이터 조회
router.post('/nearby', (req, res) => {
    const { lat, lon, radius } = req.body;
    
    console.log('🔍 CCTV 위치 정보:', { lat, lon, radius });
    
    // 좌표 기반으로 근처 데이터 조회 (간단한 거리 계산)
    const query = `
        SELECT 
            break_cnt,
            ali_crack_cnt,
            weather_score,
            road_score,
            total_score,
            lat,
            lon
        FROM t_total 
        WHERE lat IS NOT NULL 
        AND lon IS NOT NULL
        AND ABS(lat - ?) <= 0.01 
        AND ABS(lon - ?) <= 0.01
        ORDER BY 
            SQRT(POW(lat - ?, 2) + POW(lon - ?, 2)) ASC
        LIMIT 1
    `;
    
    conn.query(query, [lat, lon, lat, lon], (error, results) => {
        if (error) {
            console.error('❌ 데이터베이스 조회 오류:', error);
            return res.status(500).json({ 
                success: false,
                error: '데이터베이스 조회 실패',
                details: error.message 
            });
        }
        
        console.log('🔍 조회된 데이터:', results);
        
        if (results.length > 0) {
            const data = results[0];
            res.json({
                success: true,
                data: {
                    break_cnt: data.break_cnt || 0,
                    ali_crack_cnt: data.ali_crack_cnt || 0,
                    weather_score: data.weather_score || 0,
                    road_score: data.road_score || 0,
                    total_score: data.total_score || 0,
                    lat: data.lat,
                    lon: data.lon
                }
            });
        } else {
            // 데이터가 없으면 기본값 반환
            console.log('⚠️ 해당 위치에 데이터가 없음, 기본값 반환');
            res.json({
                success: true,
                data: {
                    break_cnt: 0,
                    ali_crack_cnt: 0,
                    weather_score: 0,
                    road_score: 0,
                    total_score: 0,
                    lat: lat,
                    lon: lon
                }
            });
        }
    });
});

// 상위 10개 종합 위험도 조회
router.get('/top10', (req, res) => {
    console.log('✅ 상위 10개 종합 위험도 조회 요청 수신');

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ 
                success: false,
                message: '데이터베이스 연결 실패' 
            });
        }

        // 상위 10개 종합 위험도 조회 (가장 최근 데이터 기준, CCTV 이름 포함)
        const sql = `
            SELECT
                T.total_idx,
                T.cctv_idx,
                c.cctv_name,
                T.lat,
                T.lon,
                T.road_score,
                T.weather_score,
                T.total_score,
                T.detected_at,
                T.crack_cnt,
                T.break_cnt,
                T.ali_crack_cnt,
                T.precipitation,
                T.temp,
                T.wh_type,
                T.snowfall
            FROM
                (
                    SELECT
                        *,
                        ROW_NUMBER() OVER(PARTITION BY cctv_idx ORDER BY detected_at DESC) AS rn
                    FROM
                        t_total
                ) AS T
            LEFT JOIN t_cctv c ON T.cctv_idx = c.cctv_idx
            WHERE
                T.rn = 1
            ORDER BY
                T.total_score DESC
            LIMIT 10
        `;

        conn.query(sql, (err, results) => {
            if (err) {
                console.error('❌ 상위 10개 종합 위험도 조회 실패:', err);
                return res.status(500).json({ 
                    success: false,
                    message: '데이터 조회 중 오류가 발생했습니다.' 
                });
            }

            console.log('✅ 상위 10개 종합 위험도 조회 성공:', results.length, '건');

            // 응답 데이터 포맷팅
            const formattedResults = results.map(item => ({
                total_idx: item.total_idx,
                cctv_idx: item.cctv_idx,
                cctv_name: item.cctv_name || `CCTV ${item.cctv_idx}`,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                road_score: parseFloat(item.road_score),
                weather_score: parseInt(item.weather_score),
                total_score: parseFloat(item.total_score),
                detected_at: item.detected_at,
                crack_cnt: parseInt(item.crack_cnt),
                break_cnt: parseInt(item.break_cnt),
                ali_crack_cnt: parseInt(item.ali_crack_cnt),
                precipitation: parseFloat(item.precipitation),
                temp: parseFloat(item.temp),
                wh_type: item.wh_type,
                snowfall: item.snowfall ? parseFloat(item.snowfall) : 0
            }));

            res.json({
                success: true,
                data: formattedResults
            });
        });
    });
});

// 전체 도로 상태 분석 (총합 개수)
router.get('/analysis', (req, res) => {
    console.log('✅ 전체 도로 상태 분석 요청 수신');

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ 
                success: false,
                message: '데이터베이스 연결 실패' 
            });
        }

        // 전체 도로 상태 분석 (가장 최근 데이터 기준으로 총합 계산)
        const sql = `
            SELECT
                SUM(crack_cnt) as totalCrackCnt,
                SUM(break_cnt) as totalBreakCnt,
                SUM(ali_crack_cnt) as totalAliCrackCnt
            FROM
                (
                    SELECT
                        crack_cnt,
                        break_cnt,
                        ali_crack_cnt
                    FROM
                        (
                            SELECT
                                *,
                                ROW_NUMBER() OVER(PARTITION BY cctv_idx ORDER BY detected_at DESC) AS rn
                            FROM
                                t_total
                        ) AS T
                    WHERE
                        T.rn = 1
                ) AS T2
        `;

        conn.query(sql, (err, results) => {
            if (err) {
                console.error('❌ 전체 도로 상태 분석 실패:', err);
                return res.status(500).json({ 
                    success: false,
                    message: '데이터 분석 중 오류가 발생했습니다.' 
                });
            }

            console.log('✅ 전체 도로 상태 분석 성공');

            const analysisData = {
                totalCrackCnt: parseInt(results[0].totalCrackCnt) || 0,
                totalBreakCnt: parseInt(results[0].totalBreakCnt) || 0,
                totalAliCrackCnt: parseInt(results[0].totalAliCrackCnt) || 0
            };

            res.json({
                success: true,
                data: analysisData
            });
        });
    });
});

// 상위 10개 평균 종합 점수 조회
router.get('/top10-avg', (req, res) => {
    console.log('✅ 상위 10개 평균 종합 점수 조회 요청 수신');

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ 
                success: false,
                message: '데이터베이스 연결 실패' 
            });
        }

        // 상위 10개 평균 종합 점수 조회
        const sql = `
            SELECT
                AVG(total_score) AS '도로 평균 종합점수'
            FROM
                (
                    SELECT
                        total_score
                    FROM
                        (
                            SELECT
                                *,
                                ROW_NUMBER() OVER(PARTITION BY cctv_idx ORDER BY detected_at DESC) AS rn
                            FROM
                                t_total
                        ) AS T
                    WHERE
                        T.rn = 1
                        AND T.total_score > 0
                    ORDER BY
                        T.total_score DESC
                    LIMIT 10
                ) AS T2
        `;

        conn.query(sql, (err, results) => {
            if (err) {
                console.error('❌ 상위 10개 평균 종합 점수 조회 실패:', err);
                return res.status(500).json({ 
                    success: false,
                    message: '데이터 조회 중 오류가 발생했습니다.' 
                });
            }

            console.log('✅ 상위 10개 평균 종합 점수 조회 성공');

            const avgScore = parseFloat(results[0]['도로 평균 종합점수']) || 0;

            res.json({
                success: true,
                data: {
                    averageScore: parseFloat(avgScore.toFixed(1))
                }
            });
        });
    });
});

// 특정 CCTV 구간의 상세 정보 조회
router.get('/cctv/:cctvIdx', (req, res) => {
    const cctvIdx = req.params.cctvIdx;
    console.log(`✅ CCTV ${cctvIdx} 구간 상세 정보 조회 요청 수신`);

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ 
                success: false,
                message: '데이터베이스 연결 실패' 
            });
        }

        // 특정 CCTV 구간의 가장 최근 데이터 조회 (CCTV 이름 포함)
        const sql = `
            SELECT
                T.total_idx,
                T.cctv_idx,
                c.cctv_name,
                T.lat,
                T.lon,
                T.road_score,
                T.weather_score,
                T.total_score,
                T.detected_at,
                T.crack_cnt,
                T.break_cnt,
                T.ali_crack_cnt,
                T.precipitation,
                T.temp,
                T.wh_type,
                T.snowfall
            FROM
                (
                    SELECT
                        *,
                        ROW_NUMBER() OVER(PARTITION BY cctv_idx ORDER BY detected_at DESC) AS rn
                    FROM
                        t_total
                    WHERE
                        cctv_idx = ?
                ) AS T
            LEFT JOIN t_cctv c ON T.cctv_idx = c.cctv_idx
            WHERE
                T.rn = 1
        `;

        conn.query(sql, [cctvIdx], (err, results) => {
            if (err) {
                console.error('❌ CCTV 구간 상세 정보 조회 실패:', err);
                return res.status(500).json({ 
                    success: false,
                    message: '데이터 조회 중 오류가 발생했습니다.' 
                });
            }

            if (results.length === 0) {
                return res.status(404).json({ 
                    success: false,
                    message: '해당 CCTV 구간의 데이터를 찾을 수 없습니다.' 
                });
            }

            console.log(`✅ CCTV ${cctvIdx} 구간 상세 정보 조회 성공`);

            const cctvData = results[0];
            const formattedData = {
                total_idx: cctvData.total_idx,
                cctv_idx: cctvData.cctv_idx,
                cctv_name: cctvData.cctv_name || `CCTV ${cctvData.cctv_idx}`,
                lat: parseFloat(cctvData.lat),
                lon: parseFloat(cctvData.lon),
                road_score: parseFloat(cctvData.road_score),
                weather_score: parseInt(cctvData.weather_score),
                total_score: parseFloat(cctvData.total_score),
                detected_at: cctvData.detected_at,
                crack_cnt: parseInt(cctvData.crack_cnt),
                break_cnt: parseInt(cctvData.break_cnt),
                ali_crack_cnt: parseInt(cctvData.ali_crack_cnt),
                precipitation: parseFloat(cctvData.precipitation),
                temp: parseFloat(cctvData.temp),
                wh_type: cctvData.wh_type,
                snowfall: cctvData.snowfall ? parseFloat(cctvData.snowfall) : 0
            };

            res.json({
                success: true,
                data: formattedData
            });
        });
    });
});

// 날짜 범위별 데이터 조회
router.get('/date-range', (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(`✅ 날짜 범위별 데이터 조회 요청 수신: ${startDate} ~ ${endDate}`);

    if (!startDate || !endDate) {
        return res.status(400).json({
            success: false,
            message: '시작 날짜와 종료 날짜를 모두 입력해주세요.'
        });
    }

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ 
                success: false,
                message: '데이터베이스 연결 실패' 
            });
        }

        // 날짜 범위별 데이터 조회 (가장 최근 데이터 기준, CCTV 이름 포함)
        const sql = `
            SELECT
                T.total_idx,
                T.cctv_idx,
                c.cctv_name,
                T.lat,
                T.lon,
                T.road_score,
                T.weather_score,
                T.total_score,
                T.detected_at,
                T.crack_cnt,
                T.break_cnt,
                T.ali_crack_cnt,
                T.precipitation,
                T.temp,
                T.wh_type,
                T.snowfall
            FROM
                (
                    SELECT
                        *,
                        ROW_NUMBER() OVER(PARTITION BY cctv_idx ORDER BY detected_at DESC) AS rn
                    FROM
                        t_total
                    WHERE
                        DATE(detected_at) BETWEEN ? AND ?
                ) AS T
            LEFT JOIN t_cctv c ON T.cctv_idx = c.cctv_idx
            WHERE
                T.rn = 1
            ORDER BY
                T.total_score DESC
        `;

        conn.query(sql, [startDate, endDate], (err, results) => {
            if (err) {
                console.error('❌ 날짜 범위별 데이터 조회 실패:', err);
                return res.status(500).json({ 
                    success: false,
                    message: '데이터 조회 중 오류가 발생했습니다.' 
                });
            }

            console.log(`✅ 날짜 범위별 데이터 조회 성공: ${results.length}건`);

            // 응답 데이터 포맷팅
            const formattedResults = results.map(item => ({
                total_idx: item.total_idx,
                cctv_idx: item.cctv_idx,
                cctv_name: item.cctv_name || `CCTV ${item.cctv_idx}`,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                road_score: parseFloat(item.road_score),
                weather_score: parseInt(item.weather_score),
                total_score: parseFloat(item.total_score),
                detected_at: item.detected_at,
                crack_cnt: parseInt(item.crack_cnt),
                break_cnt: parseInt(item.break_cnt),
                ali_crack_cnt: parseInt(item.ali_crack_cnt),
                precipitation: parseFloat(item.precipitation),
                temp: parseFloat(item.temp),
                wh_type: item.wh_type,
                snowfall: item.snowfall ? parseFloat(item.snowfall) : 0
            }));

            res.json({
                success: true,
                data: formattedResults,
                count: results.length
            });
        });
    });
});

module.exports = router;
