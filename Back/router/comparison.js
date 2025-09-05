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

// 전년도 동기간 대비 데이터 조회
router.get('/year-over-year', async (req, res) => {
    try {
        console.log('📊 전년도 동기간 대비 데이터 조회 시작');
        
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12월
        const lastYear = currentYear - 1;
        
        console.log(`📅 비교 기간: ${currentYear}년 ${currentMonth}월 vs ${lastYear}년 ${currentMonth}월`);
        
        // 먼저 테이블 존재 여부 확인
        const tableCheckQuery = `
            SELECT 
                TABLE_NAME 
            FROM 
                INFORMATION_SCHEMA.TABLES 
            WHERE 
                TABLE_SCHEMA = ? 
                AND TABLE_NAME IN ('t_risk_prediction', 't_citizen_report')
        `;
        
        const [existingTables] = await db.execute(tableCheckQuery, ['campus_25SW_BD_p3_2']);
        const tableNames = existingTables.map(row => row.TABLE_NAME);
        
        console.log('📋 존재하는 테이블:', tableNames);
        
        // 기본 응답 데이터 구조
        const comparisonData = {
            riskPrediction: {
                current: { count: 0, avgScore: '0.0' },
                lastYear: { count: 0, avgScore: '0.0' },
                countChange: 0,
                scoreChange: 0
            },
            citizenReport: {
                current: { count: 0 },
                lastYear: { count: 0 },
                countChange: 0
            },
            period: {
                current: `${currentYear}년 ${currentMonth}월`,
                lastYear: `${lastYear}년 ${currentMonth}월`
            }
        };
        
        // 위험도 예측 데이터 조회 (테이블이 존재하는 경우에만)
        if (tableNames.includes('t_risk_prediction')) {
            try {
                const riskPredictionQuery = `
                    SELECT 
                        'current' as period,
                        COUNT(*) as count,
                        COALESCE(AVG(total_risk_score), 0) as avg_score
                    FROM t_risk_prediction 
                    WHERE YEAR(pred_date) = ? AND MONTH(pred_date) = ?
                    UNION ALL
                    SELECT 
                        'last_year' as period,
                        COUNT(*) as count,
                        COALESCE(AVG(total_risk_score), 0) as avg_score
                    FROM t_risk_prediction 
                    WHERE YEAR(pred_date) = ? AND MONTH(pred_date) = ?
                `;
                
                const [riskResults] = await db.execute(riskPredictionQuery, [currentYear, currentMonth, lastYear, currentMonth]);
                
                if (riskResults.length >= 2) {
                    const currentRiskData = riskResults[0];
                    const lastYearRiskData = riskResults[1];
                    
                    comparisonData.riskPrediction.current = {
                        count: currentRiskData.count,
                        avgScore: parseFloat(currentRiskData.avg_score || 0).toFixed(1)
                    };
                    
                    comparisonData.riskPrediction.lastYear = {
                        count: lastYearRiskData.count,
                        avgScore: parseFloat(lastYearRiskData.avg_score || 0).toFixed(1)
                    };
                    
                    // 변화율 계산
                    const riskCountChange = lastYearRiskData.count > 0 
                        ? ((currentRiskData.count - lastYearRiskData.count) / lastYearRiskData.count * 100)
                        : 0;
                        
                    const riskScoreChange = lastYearRiskData.avg_score > 0 
                        ? ((currentRiskData.avg_score - lastYearRiskData.avg_score) / lastYearRiskData.avg_score * 100)
                        : 0;
                    
                    comparisonData.riskPrediction.countChange = parseFloat(riskCountChange.toFixed(1));
                    comparisonData.riskPrediction.scoreChange = parseFloat(riskScoreChange.toFixed(1));
                }
                
                console.log('✅ 위험도 예측 데이터 조회 완료');
            } catch (error) {
                console.error('⚠️ 위험도 예측 데이터 조회 실패:', error.message);
            }
        } else {
            console.log('⚠️ t_risk_prediction 테이블이 존재하지 않습니다.');
        }
        
        // 민원 신고 데이터 조회 (테이블이 존재하는 경우에만)
        if (tableNames.includes('t_citizen_report')) {
            try {
                const citizenReportQuery = `
                    SELECT 
                        'current' as period,
                        COUNT(*) as count
                    FROM t_citizen_report 
                    WHERE YEAR(c_reported_at) = ? AND MONTH(c_reported_at) = ?
                    UNION ALL
                    SELECT 
                        'last_year' as period,
                        COUNT(*) as count
                    FROM t_citizen_report 
                    WHERE YEAR(c_reported_at) = ? AND MONTH(c_reported_at) = ?
                `;
                
                const [reportResults] = await db.execute(citizenReportQuery, [currentYear, currentMonth, lastYear, currentMonth]);
                
                if (reportResults.length >= 2) {
                    const currentReportData = reportResults[0];
                    const lastYearReportData = reportResults[1];
                    
                    comparisonData.citizenReport.current = {
                        count: currentReportData.count
                    };
                    
                    comparisonData.citizenReport.lastYear = {
                        count: lastYearReportData.count
                    };
                    
                    // 변화율 계산
                    const reportCountChange = lastYearReportData.count > 0 
                        ? ((currentReportData.count - lastYearReportData.count) / lastYearReportData.count * 100)
                        : 0;
                    
                    comparisonData.citizenReport.countChange = parseFloat(reportCountChange.toFixed(1));
                }
                
                console.log('✅ 민원 신고 데이터 조회 완료');
            } catch (error) {
                console.error('⚠️ 민원 신고 데이터 조회 실패:', error.message);
            }
        } else {
            console.log('⚠️ t_citizen_report 테이블이 존재하지 않습니다.');
        }
        
        console.log('✅ 전년도 동기간 대비 데이터 조회 완료:', comparisonData);
        res.json(comparisonData);
        
    } catch (error) {
        console.error('❌ 전년도 동기간 대비 데이터 조회 오류:', error);
        res.status(500).json({ 
            error: '서버 오류가 발생했습니다.',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
