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

// 전년도 동기간 대비 데이터 조회
router.get('/year-over-year', async (req, res) => {
    try {
        conn.connect();
        
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12월
        
        // 작년 동일 월 계산
        const lastYear = currentYear - 1;
        
        console.log(`📊 전년도 동기간 대비 데이터 조회: ${currentYear}년 ${currentMonth}월 vs ${lastYear}년 ${currentMonth}월`);
        
        // 1. 도로 위험도 예측 데이터 비교
        const riskPredictionQuery = `
            SELECT 
                'risk_prediction' as data_type,
                COUNT(*) as count,
                AVG(total_risk_score) as avg_score
            FROM t_risk_prediction 
            WHERE YEAR(pred_date) = ? AND MONTH(pred_date) = ?
            UNION ALL
            SELECT 
                'risk_prediction' as data_type,
                COUNT(*) as count,
                AVG(total_risk_score) as avg_score
            FROM t_risk_prediction 
            WHERE YEAR(pred_date) = ? AND MONTH(pred_date) = ?
        `;
        
        // 2. 민원 신고 데이터 비교
        const citizenReportQuery = `
            SELECT 
                'citizen_report' as data_type,
                COUNT(*) as count
            FROM t_citizen_report 
            WHERE YEAR(c_reported_at) = ? AND MONTH(c_reported_at) = ?
            UNION ALL
            SELECT 
                'citizen_report' as data_type,
                COUNT(*) as count
            FROM t_citizen_report 
            WHERE YEAR(c_reported_at) = ? AND MONTH(c_reported_at) = ?
        `;
        
        // 위험도 예측 데이터 조회
        conn.query(riskPredictionQuery, [currentYear, currentMonth, lastYear, currentMonth], (error, riskResults) => {
            if (error) {
                console.error('위험도 예측 데이터 조회 오류:', error);
                res.status(500).json({ error: '위험도 예측 데이터 조회 실패' });
                return;
            }
            
            // 민원 신고 데이터 조회
            conn.query(citizenReportQuery, [currentYear, currentMonth, lastYear, currentMonth], (error, reportResults) => {
                if (error) {
                    console.error('민원 신고 데이터 조회 오류:', error);
                    res.status(500).json({ error: '민원 신고 데이터 조회 실패' });
                    return;
                }
                
                // 결과 데이터 정리
                const currentRiskData = riskResults[0];
                const lastYearRiskData = riskResults[1];
                const currentReportData = reportResults[0];
                const lastYearReportData = reportResults[1];
                
                // 변화율 계산
                const riskCountChange = lastYearRiskData.count > 0 
                    ? ((currentRiskData.count - lastYearRiskData.count) / lastYearRiskData.count * 100).toFixed(1)
                    : 0;
                    
                const riskScoreChange = lastYearRiskData.avg_score > 0 
                    ? ((currentRiskData.avg_score - lastYearRiskData.avg_score) / lastYearRiskData.avg_score * 100).toFixed(1)
                    : 0;
                    
                const reportCountChange = lastYearReportData.count > 0 
                    ? ((currentReportData.count - lastYearReportData.count) / lastYearReportData.count * 100).toFixed(1)
                    : 0;
                
                const comparisonData = {
                    riskPrediction: {
                        current: {
                            count: currentRiskData.count,
                            avgScore: parseFloat(currentRiskData.avg_score || 0).toFixed(1)
                        },
                        lastYear: {
                            count: lastYearRiskData.count,
                            avgScore: parseFloat(lastYearRiskData.avg_score || 0).toFixed(1)
                        },
                        countChange: parseFloat(riskCountChange),
                        scoreChange: parseFloat(riskScoreChange)
                    },
                    citizenReport: {
                        current: {
                            count: currentReportData.count
                        },
                        lastYear: {
                            count: lastYearReportData.count
                        },
                        countChange: parseFloat(reportCountChange)
                    },
                    period: {
                        current: `${currentYear}년 ${currentMonth}월`,
                        lastYear: `${lastYear}년 ${currentMonth}월`
                    }
                };
                
                console.log('✅ 전년도 동기간 대비 데이터 조회 완료:', comparisonData);
                res.json(comparisonData);
            });
        });
        
    } catch (error) {
        console.error('전년도 동기간 대비 데이터 조회 오류:', error);
        res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
