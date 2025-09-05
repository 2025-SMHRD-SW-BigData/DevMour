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

// 현재 월 기준 작년 위험도 예측 데이터 조회
router.get('/risk-prediction', async (req, res) => {
    console.log('✅ 연도별 위험도 예측 비교 데이터 조회 요청 수신');
    
    try {
        // 현재 월 기준으로 작년과 올해 데이터 조회
        const sql = `
            SELECT 
                pred_idx,
                road_idx,
                wh_idx,
                source_type,
                pred_date,
                lat,
                lon,
                phenomenal_risk_score,
                whether_risk_score,
                total_risk_score,
                risk_pred_level,
                risk_detail,
                addr,
                YEAR(pred_date) as year,
                MONTH(pred_date) as month
            FROM t_risk_prediction 
            WHERE MONTH(pred_date) = MONTH(CURDATE())
            AND YEAR(pred_date) IN (YEAR(CURDATE()) - 1, YEAR(CURDATE()))
            ORDER BY pred_date DESC
        `;

        const [results] = await db.execute(sql);

        console.log('✅ 위험도 예측 데이터 조회 성공:', results.length, '건');
        
        // 연도별로 데이터 분류
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        
        const currentYearData = results.filter(item => item.year === currentYear);
        const lastYearData = results.filter(item => item.year === lastYear);
        
        // 응답 데이터 포맷팅
        const response = {
            currentYear: {
                year: currentYear,
                month: new Date().getMonth() + 1,
                data: currentYearData.map(item => ({
                    predIdx: item.pred_idx,
                    roadIdx: item.road_idx,
                    whIdx: item.wh_idx,
                    sourceType: item.source_type,
                    predDate: item.pred_date,
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    phenomenalRiskScore: parseFloat(item.phenomenal_risk_score),
                    whetherRiskScore: parseFloat(item.whether_risk_score),
                    totalRiskScore: parseFloat(item.total_risk_score),
                    riskPredLevel: parseFloat(item.risk_pred_level),
                    riskDetail: item.risk_detail,
                    addr: item.addr
                }))
            },
            lastYear: {
                year: lastYear,
                month: new Date().getMonth() + 1,
                data: lastYearData.map(item => ({
                    predIdx: item.pred_idx,
                    roadIdx: item.road_idx,
                    whIdx: item.wh_idx,
                    sourceType: item.source_type,
                    predDate: item.pred_date,
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    phenomenalRiskScore: parseFloat(item.phenomenal_risk_score),
                    whetherRiskScore: parseFloat(item.whether_risk_score),
                    totalRiskScore: parseFloat(item.total_risk_score),
                    riskPredLevel: parseFloat(item.risk_pred_level),
                    riskDetail: item.risk_detail,
                    addr: item.addr
                }))
            }
        };

        res.json(response);
    } catch (error) {
        console.error('❌ 위험도 예측 데이터 조회 실패:', error);
        res.status(500).json({ error: '위험도 예측 데이터 조회 실패' });
    }
});

// 현재 월 기준 작년 시민 제보 데이터 조회
router.get('/citizen-report', async (req, res) => {
    console.log('✅ 연도별 시민 제보 비교 데이터 조회 요청 수신');
    
    try {
        // 현재 월 기준으로 작년과 올해 데이터 조회
        const sql = `
            SELECT 
                c_report_idx,
                c_reported_at,
                lat,
                lon,
                c_report_detail,
                c_report_file1,
                c_report_file2,
                c_report_file3,
                c_reporter_name,
                c_reporter_phone,
                c_report_status,
                admin_id,
                addr,
                YEAR(c_reported_at) as year,
                MONTH(c_reported_at) as month
            FROM t_citizen_report 
            WHERE MONTH(c_reported_at) = MONTH(CURDATE())
            AND YEAR(c_reported_at) IN (YEAR(CURDATE()) - 1, YEAR(CURDATE()))
            ORDER BY c_reported_at DESC
        `;

        const [results] = await db.execute(sql);

        console.log('✅ 시민 제보 데이터 조회 성공:', results.length, '건');
        
        // 연도별로 데이터 분류
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        
        const currentYearData = results.filter(item => item.year === currentYear);
        const lastYearData = results.filter(item => item.year === lastYear);
        
        // 응답 데이터 포맷팅
        const response = {
            currentYear: {
                year: currentYear,
                month: new Date().getMonth() + 1,
                data: currentYearData.map(item => ({
                    reportIdx: item.c_report_idx,
                    reportedAt: item.c_reported_at,
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    reportDetail: item.c_report_detail,
                    reportFile1: item.c_report_file1,
                    reportFile2: item.c_report_file2,
                    reportFile3: item.c_report_file3,
                    reporterName: item.c_reporter_name,
                    reporterPhone: item.c_reporter_phone,
                    reportStatus: item.c_report_status,
                    adminId: item.admin_id,
                    addr: item.addr
                }))
            },
            lastYear: {
                year: lastYear,
                month: new Date().getMonth() + 1,
                data: lastYearData.map(item => ({
                    reportIdx: item.c_report_idx,
                    reportedAt: item.c_reported_at,
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    reportDetail: item.c_report_detail,
                    reportFile1: item.c_report_file1,
                    reportFile2: item.c_report_file2,
                    reportFile3: item.c_report_file3,
                    reporterName: item.c_reporter_name,
                    reporterPhone: item.c_reporter_phone,
                    reportStatus: item.c_report_status,
                    adminId: item.admin_id,
                    addr: item.addr
                }))
            }
        };

        res.json(response);
    } catch (error) {
        console.error('❌ 시민 제보 데이터 조회 실패:', error);
        res.status(500).json({ error: '시민 제보 데이터 조회 실패' });
    }
});

// 현재 월 기준 작년 기상 데이터 조회
router.get('/weather', async (req, res) => {
    console.log('✅ 연도별 기상 비교 데이터 조회 요청 수신');
    
    try {
        // 현재 월 기준으로 작년과 올해 데이터 조회
        const sql = `
            SELECT 
                wh_idx,
                wh_date,
                lat,
                lon,
                precipitation,
                temp,
                wh_type,
                snowfall,
                YEAR(wh_date) as year,
                MONTH(wh_date) as month
            FROM t_weather 
            WHERE MONTH(wh_date) = MONTH(CURDATE())
            AND YEAR(wh_date) IN (YEAR(CURDATE()) - 1, YEAR(CURDATE()))
            ORDER BY wh_date DESC
        `;

        const [results] = await db.execute(sql);

        console.log('✅ 기상 데이터 조회 성공:', results.length, '건');
        
        // 연도별로 데이터 분류
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        
        const currentYearData = results.filter(item => item.year === currentYear);
        const lastYearData = results.filter(item => item.year === lastYear);
        
        // 응답 데이터 포맷팅
        const response = {
            currentYear: {
                year: currentYear,
                month: new Date().getMonth() + 1,
                data: currentYearData.map(item => ({
                    whIdx: item.wh_idx,
                    whDate: item.wh_date,
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    precipitation: parseFloat(item.precipitation),
                    temp: parseFloat(item.temp),
                    whType: item.wh_type,
                    snowfall: item.snowfall ? parseFloat(item.snowfall) : 0
                }))
            },
            lastYear: {
                year: lastYear,
                month: new Date().getMonth() + 1,
                data: lastYearData.map(item => ({
                    whIdx: item.wh_idx,
                    whDate: item.wh_date,
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    precipitation: parseFloat(item.precipitation),
                    temp: parseFloat(item.temp),
                    whType: item.wh_type,
                    snowfall: item.snowfall ? parseFloat(item.snowfall) : 0
                }))
            }
        };

        res.json(response);
    } catch (error) {
        console.error('❌ 기상 데이터 조회 실패:', error);
        res.status(500).json({ error: '기상 데이터 조회 실패' });
    }
});

// 통합 비교 데이터 조회 (모든 데이터를 한번에)
router.get('/summary', async (req, res) => {
    console.log('✅ 연도별 통합 비교 데이터 조회 요청 수신');
    
    try {
        // 위험도 예측, 시민 제보, 기상 데이터를 모두 조회
        const riskSql = `
            SELECT 
                COUNT(*) as count,
                AVG(total_risk_score) as avg_risk_score,
                YEAR(pred_date) as year
            FROM t_risk_prediction 
            WHERE MONTH(pred_date) = MONTH(CURDATE())
            AND YEAR(pred_date) IN (YEAR(CURDATE()) - 1, YEAR(CURDATE()))
            GROUP BY YEAR(pred_date)
        `;

        const reportSql = `
            SELECT 
                COUNT(*) as count,
                YEAR(c_reported_at) as year
            FROM t_citizen_report 
            WHERE MONTH(c_reported_at) = MONTH(CURDATE())
            AND YEAR(c_reported_at) IN (YEAR(CURDATE()) - 1, YEAR(CURDATE()))
            GROUP BY YEAR(c_reported_at)
        `;

        const weatherSql = `
            SELECT 
                AVG(precipitation) as avg_precipitation,
                AVG(temp) as avg_temp,
                AVG(snowfall) as avg_snowfall,
                YEAR(wh_date) as year
            FROM t_weather 
            WHERE MONTH(wh_date) = MONTH(CURDATE())
            AND YEAR(wh_date) IN (YEAR(CURDATE()) - 1, YEAR(CURDATE()))
            GROUP BY YEAR(wh_date)
        `;

        // 모든 쿼리를 병렬로 실행
        const [riskResults, reportResults, weatherResults] = await Promise.all([
            db.execute(riskSql),
            db.execute(reportSql),
            db.execute(weatherSql)
        ]);

        console.log('✅ 통합 비교 데이터 조회 성공');
        
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        
        // 데이터 정리
        const riskData = {};
        const reportData = {};
        const weatherData = {};
        
        riskResults[0].forEach(item => {
            if (item.year === currentYear) {
                riskData.currentYear = {
                    count: item.count,
                    avgRiskScore: parseFloat(item.avg_risk_score || 0)
                };
            } else if (item.year === lastYear) {
                riskData.lastYear = {
                    count: item.count,
                    avgRiskScore: parseFloat(item.avg_risk_score || 0)
                };
            }
        });
        
        reportResults[0].forEach(item => {
            if (item.year === currentYear) {
                reportData.currentYear = { count: item.count };
            } else if (item.year === lastYear) {
                reportData.lastYear = { count: item.count };
            }
        });
        
        weatherResults[0].forEach(item => {
            if (item.year === currentYear) {
                weatherData.currentYear = {
                    avgPrecipitation: parseFloat(item.avg_precipitation || 0),
                    avgTemp: parseFloat(item.avg_temp || 0),
                    avgSnowfall: parseFloat(item.avg_snowfall || 0)
                };
            } else if (item.year === lastYear) {
                weatherData.lastYear = {
                    avgPrecipitation: parseFloat(item.avg_precipitation || 0),
                    avgTemp: parseFloat(item.avg_temp || 0),
                    avgSnowfall: parseFloat(item.avg_snowfall || 0)
                };
            }
        });
        
        const response = {
            month: new Date().getMonth() + 1,
            riskPrediction: riskData,
            citizenReport: reportData,
            weather: weatherData
        };
        
        res.json(response);
    } catch (error) {
        console.error('❌ 통합 비교 데이터 조회 실패:', error);
        res.status(500).json({ error: '통합 비교 데이터 조회 실패' });
    }
});

module.exports = router;
