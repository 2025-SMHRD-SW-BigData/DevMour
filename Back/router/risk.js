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

// 위험도 랭킹 TOP 3 조회 (대시보드용)
router.get('/ranking', async (req, res) => {
    console.log('✅ 위험도 랭킹 조회 요청 수신');

    try {
        // 현재 년도와 월에 해당하는 데이터만 조회
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12월

        console.log(`📊 위험도 랭킹 조회: ${currentYear}년 ${currentMonth}월`);

        // total_risk_score가 높은 순서로 3개 조회 (현재 년도/월 기준)
        const sql = `
            SELECT 
                pred_idx,
                total_risk_score,
                risk_detail,
                lat,
                lon,
                addr
            FROM t_risk_prediction 
            WHERE YEAR(pred_date) = ? AND MONTH(pred_date) = ?
            ORDER BY total_risk_score DESC
            LIMIT 3
        `;

        const [results] = await db.execute(sql, [currentYear, currentMonth]);

        console.log('✅ 위험도 랭킹 조회 성공:', results.length, '건');

        // 응답 데이터 포맷팅
        const riskRankings = results.map((item, index) => ({
            rank: index + 1,
            predIdx: item.pred_idx,
            totalRiskScore: parseFloat(item.total_risk_score),
            riskDetail: item.risk_detail,
            address: item.addr,
            coordinates: {
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon)
            }
        }));

        res.json({ riskRankings });
    } catch (error) {
        console.error('❌ 위험도 랭킹 조회 실패:', error);
        res.status(500).json({ error: '위험도 랭킹 조회 실패' });
    }
});

// 위험도 랭킹 상세 조회 (현재 년도/월의 모든 데이터)
router.get('/ranking-detail', async (req, res) => {
    console.log('✅ 위험도 랭킹 상세 조회 요청 수신');

    try {
        // 현재 년도와 월에 해당하는 데이터만 조회
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12월

        console.log(`📊 위험도 랭킹 상세 조회: ${currentYear}년 ${currentMonth}월`);

        // 현재 년도/월의 모든 위험도 데이터 조회 (위험도 높은 순)
        const sql = `
            SELECT 
                pred_idx,
                total_risk_score,
                risk_detail,
                lat,
                lon,
                addr
            FROM t_risk_prediction 
            WHERE YEAR(pred_date) = ? AND MONTH(pred_date) = ?
            ORDER BY total_risk_score DESC
        `;

        const [results] = await db.execute(sql, [currentYear, currentMonth]);

        console.log('✅ 위험도 랭킹 상세 조회 성공:', results.length, '건');

        // 응답 데이터 포맷팅
        const riskRankings = results.map((item, index) => ({
            rank: index + 1,
            predIdx: item.pred_idx,
            totalRiskScore: parseFloat(item.total_risk_score),
            riskDetail: item.risk_detail,
            address: item.addr,
            coordinates: {
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon)
            }
        }));

        res.json({ riskRankings });
    } catch (error) {
        console.error('❌ 위험도 랭킹 상세 조회 실패:', error);
        res.status(500).json({ error: '위험도 랭킹 상세 조회 실패' });
    }
});

// 전체 위험도 점수 평균 조회
router.get('/average', async (req, res) => {
    console.log('✅ 도로 위험도 점수 상위 10개 평균 조회 요청 수신');

    try {
        // 현재 년도와 월에 해당하는 데이터만 조회
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12월

        console.log(`📊 전체 위험도 점수 평균 조회: ${currentYear}년 ${currentMonth}월`);

        const sql = `
            SELECT
  avg(total_score) AS '도로 평균 종합점수'
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

        const [results] = await db.execute(sql);
        console.log(results[0]['도로 평균 종합점수'] );

        const averageScore = results[0]['도로 평균 종합점수'] || 0;
        console.log('✅ 도로 위험도 상위10개 점수 평균 조회 성공:', averageScore);

        res.json({
            averageScore: parseFloat(averageScore),
            maxScore: 10.0
        });
    } catch (error) {
        console.error('도로 위험도 점수 평균 조회 오류:', error);
        res.status(500).json({ error: '도로 위험도 점수 평균 조회 실패' });
    }
});

// 민원 신고 통계 조회
router.get('/citizen-report/stats', async (req, res) => {
    console.log('✅ 민원 신고 통계 조회 요청 수신');

    try {
        // 현재 년도와 월에 해당하는 데이터만 조회
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 1-12월

        console.log(`📊 민원 신고 통계 조회: ${currentYear}년 ${currentMonth}월`);

        const sql = `
            SELECT 
                c_report_status,
                COUNT(*) as count
            FROM t_citizen_report
            WHERE YEAR(c_reported_at) = ? AND MONTH(c_reported_at) = ?
            GROUP BY c_report_status
        `;

        const [results] = await db.execute(sql, [currentYear, currentMonth]);

        let completedCount = 0;
        let pendingCount = 0;

        results.forEach(row => {
            if (row.c_report_status === 'Y') {
                completedCount = row.count;
            } else if (row.c_report_status === 'N') {
                pendingCount = row.count;
            }
        });

        console.log('✅ 민원 신고 통계 조회 성공:', { completedCount, pendingCount });

        res.json({
            completedCount,
            pendingCount,
            totalCount: completedCount + pendingCount
        });
    } catch (error) {
        console.error('민원 신고 통계 조회 오류:', error);
        res.status(500).json({ error: '민원 신고 통계 조회 실패' });
    }
});

// 도로 보수공사 통계 조회
router.get('/road-construction/stats', async (req, res) => {
    console.log('✅ 도로 보수공사 통계 조회 요청 수신');

    try {
        const sql = `
            SELECT 
                completed,
                COUNT(*) as count
            FROM t_road_control
            WHERE control_type = 'construction'
            GROUP BY completed
        `;

        const [results] = await db.execute(sql);

        let completedCount = 0;
        let inProgressCount = 0;

        results.forEach(row => {
            if (row.completed === 'Y') {
                completedCount = row.count;
            } else if (row.completed === 'N') {
                inProgressCount = row.count;
            }
        });

        console.log('✅ 도로 보수공사 통계 조회 성공:', { completedCount, inProgressCount });

        res.json({
            completedCount,
            inProgressCount,
            totalCount: completedCount + inProgressCount
        });
    } catch (error) {
        console.error('도로 보수공사 통계 조회 오류:', error);
        res.status(500).json({ error: '도로 보수공사 통계 조회 실패' });
    }
});

module.exports = router;
