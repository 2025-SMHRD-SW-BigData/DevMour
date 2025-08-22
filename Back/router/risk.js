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

// 위험도 랭킹 TOP 5 조회
router.get('/ranking', (req, res) => {
    console.log('✅ 위험도 랭킹 조회 요청 수신');
    
    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ error: '데이터베이스 연결 실패' });
        }

        // total_risk_score가 높은 순서로 3개 조회
        const sql = `
            SELECT 
                pred_idx,
                total_risk_score,
                risk_detail,
                lat,
                lon,
                addr
            FROM t_risk_prediction 
            ORDER BY total_risk_score DESC
            LIMIT 3
        `;

        conn.query(sql, (err, results) => {
            if (err) {
                console.error('❌ 위험도 랭킹 조회 실패:', err);
                return res.status(500).json({ error: '위험도 랭킹 조회 실패' });
            }

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
        });
    });
});

// 전체 위험도 점수 평균 조회
router.get('/average', (req, res) => {
    console.log('✅ 전체 위험도 점수 평균 조회 요청 수신');

    conn.connect(err => {
        if (err) {
            console.error('데이터베이스 연결 오류:', err);
            return res.status(500).json({ error: '데이터베이스 연결 실패' });
        }

        const sql = `
            SELECT AVG(total_risk_score) as average_score
            FROM t_risk_prediction
        `;

        conn.query(sql, (err, results) => {
            if (err) {
                console.error('위험도 점수 평균 조회 오류:', err);
                return res.status(500).json({ error: '위험도 점수 평균 조회 실패' });
            }

            const averageScore = results[0].average_score || 0;
            console.log('✅ 전체 위험도 점수 평균 조회 성공:', averageScore);

            res.json({ 
                averageScore: parseFloat(averageScore),
                maxScore: 20.0
            });
        });
    });
});

// 민원 신고 통계 조회
router.get('/citizen-report/stats', (req, res) => {
    console.log('✅ 민원 신고 통계 조회 요청 수신');

    conn.connect(err => {
        if (err) {
            console.error('데이터베이스 연결 오류:', err);
            return res.status(500).json({ error: '데이터베이스 연결 실패' });
        }

        const sql = `
            SELECT 
                c_report_status,
                COUNT(*) as count
            FROM t_citizen_report
            GROUP BY c_report_status
        `;

        conn.query(sql, (err, results) => {
            if (err) {
                console.error('민원 신고 통계 조회 오류:', err);
                return res.status(500).json({ error: '민원 신고 통계 조회 실패' });
            }

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
        });
    });
});

// 도로 보수공사 통계 조회
router.get('/road-construction/stats', (req, res) => {
    console.log('✅ 도로 보수공사 통계 조회 요청 수신');

    conn.connect(err => {
        if (err) {
            console.error('데이터베이스 연결 오류:', err);
            return res.status(500).json({ error: '데이터베이스 연결 실패' });
        }

        const sql = `
            SELECT 
                completed,
                COUNT(*) as count
            FROM t_road_control
            WHERE control_type = 'construction'
            GROUP BY completed
        `;

        conn.query(sql, (err, results) => {
            if (err) {
                console.error('도로 보수공사 통계 조회 오류:', err);
                return res.status(500).json({ error: '도로 보수공사 통계 조회 실패' });
            }

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
        });
    });
});

module.exports = router;
