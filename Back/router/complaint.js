const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

// MySQL 연결 설정
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});

// 시민 제보 상세 데이터 조회
router.get('/detail', (req, res) => {
    console.log('🔍 시민 제보 상세 데이터 조회 요청');
    
    const query = `
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
            addr
        FROM t_citizen_report 
        ORDER BY c_reported_at DESC
    `;
    
    conn.query(query, (err, results) => {
        if (err) {
            console.error('❌ 시민 제보 데이터 조회 오류:', err);
            res.status(500).json({ 
                error: '시민 제보 데이터 조회 중 오류가 발생했습니다.',
                details: err.message 
            });
            return;
        }
        
        console.log('✅ 시민 제보 데이터 조회 성공:', results.length, '건');
        
        // 데이터 가공
        const complaints = results.map(item => ({
            ...item,
            // 날짜 형식 변환
            c_reported_at: item.c_reported_at ? new Date(item.c_reported_at).toISOString() : null,
            // 좌표를 숫자로 변환
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
        }));
        
        res.json({
            success: true,
            message: '시민 제보 데이터 조회 성공',
            complaints: complaints,
            totalCount: complaints.length
        });
    });
});

// 시민 제보 상태별 통계 조회
router.get('/stats', (req, res) => {
    console.log('📊 시민 제보 통계 조회 요청');
    
    const query = `
        SELECT 
            c_report_status,
            COUNT(*) as count
        FROM t_citizen_report 
        GROUP BY c_report_status
    `;
    
    conn.query(query, (err, results) => {
        if (err) {
            console.error('❌ 시민 제보 통계 조회 오류:', err);
            res.status(500).json({ 
                error: '시민 제보 통계 조회 중 오류가 발생했습니다.',
                details: err.message 
            });
            return;
        }
        
        console.log('✅ 시민 제보 통계 조회 성공');
        
        const stats = {
            completed: 0,    // C: 처리 완료
            inProgress: 0,   // P: 처리 중
            received: 0,     // R: 접수 완료
            total: 0
        };
        
        results.forEach(item => {
            switch (item.c_report_status) {
                case 'C':
                    stats.completed = item.count;
                    break;
                case 'P':
                    stats.inProgress = item.count;
                    break;
                case 'R':
                    stats.received = item.count;
                    break;
                default:
                    stats.received += item.count;
            }
        });
        
        stats.total = stats.completed + stats.inProgress + stats.received;
        
        res.json({
            success: true,
            message: '시민 제보 통계 조회 성공',
            stats: stats
        });
    });
});

// 특정 시민 제보 상세 정보 조회
router.get('/:id', (req, res) => {
    const reportId = req.params.id;
    console.log('🔍 시민 제보 상세 정보 조회 요청:', reportId);
    
    const query = `
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
            addr
        FROM t_citizen_report 
        WHERE c_report_idx = ?
    `;
    
    conn.query(query, [reportId], (err, results) => {
        if (err) {
            console.error('❌ 시민 제보 상세 정보 조회 오류:', err);
            res.status(500).json({ 
                error: '시민 제보 상세 정보 조회 중 오류가 발생했습니다.',
                details: err.message 
            });
            return;
        }
        
        if (results.length === 0) {
            console.log('❌ 시민 제보 정보를 찾을 수 없음:', reportId);
            res.status(404).json({ 
                error: '해당 시민 제보 정보를 찾을 수 없습니다.',
                reportId: reportId
            });
            return;
        }
        
        console.log('✅ 시민 제보 상세 정보 조회 성공');
        
        const complaint = results[0];
        // 데이터 가공
        const processedComplaint = {
            ...complaint,
            c_reported_at: complaint.c_reported_at ? new Date(complaint.c_reported_at).toISOString() : null,
            lat: parseFloat(complaint.lat),
            lon: parseFloat(complaint.lon)
        };
        
        res.json({
            success: true,
            message: '시민 제보 상세 정보 조회 성공',
            complaint: processedComplaint
        });
    });
});

module.exports = router;
