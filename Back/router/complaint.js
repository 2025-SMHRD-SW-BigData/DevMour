const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

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

// 시민 제보 상세 데이터 조회
router.get('/list', async (req, res) => {
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
    
    try {
        const [results] = await db.execute(query);
        
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
    } catch (error) {
        console.error('❌ 시민 제보 데이터 조회 오류:', error);
        res.status(500).json({ 
            error: '시민 제보 데이터 조회 중 오류가 발생했습니다.',
            details: error.message 
        });
    }
});

// 시민 제보 상태별 통계 조회
router.get('/stats', async (req, res) => {
    console.log('📊 시민 제보 통계 조회 요청');
    
    try {
        const query = `
            SELECT 
                c_report_status,
                COUNT(*) as count
            FROM t_citizen_report 
            GROUP BY c_report_status
        `;
        
        const [results] = await db.execute(query);
        
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
    } catch (error) {
        console.error('❌ 시민 제보 통계 조회 오류:', error);
        res.status(500).json({ 
            error: '시민 제보 통계 조회 중 오류가 발생했습니다.',
            details: error.message 
        });
    }
});

// 특정 시민 제보 상세 정보 조회
router.get('/detail/:id', async (req, res) => {
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
    
    try {
        const [results] = await db.execute(query, [reportId]);
        
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
    } catch (error) {
        console.error('❌ 시민 제보 상세 정보 조회 오류:', error);
        res.status(500).json({ 
            error: '시민 제보 상세 정보 조회 중 오류가 발생했습니다.',
            details: error.message 
        });
    }
});

// 시민 제보 정보 업데이트
router.put('/update', async (req, res) => {
    const { c_report_idx, c_report_status, c_report_detail, addr } = req.body;
    console.log('✏️ 시민 제보 업데이트 요청:', { c_report_idx, c_report_status, c_report_detail, addr });
    
    if (!c_report_idx) {
        console.error('❌ 시민 제보 업데이트 실패: c_report_idx가 필요합니다.');
        res.status(400).json({ 
            error: '시민 제보 번호(c_report_idx)가 필요합니다.',
            details: '업데이트할 시민 제보를 식별할 수 없습니다.'
        });
        return;
    }
    
    // 업데이트할 필드들을 동적으로 구성
    const updateFields = [];
    const updateValues = [];
    
    if (c_report_status !== undefined) {
        updateFields.push('c_report_status = ?');
        updateValues.push(c_report_status);
    }
    
    if (c_report_detail !== undefined) {
        updateFields.push('c_report_detail = ?');
        updateValues.push(c_report_detail);
    }
    
    if (addr !== undefined) {
        updateFields.push('addr = ?');
        updateValues.push(addr);
    }
    
    if (updateFields.length === 0) {
        console.error('❌ 시민 제보 업데이트 실패: 업데이트할 필드가 없습니다.');
        res.status(400).json({ 
            error: '업데이트할 필드가 없습니다.',
            details: '최소 하나의 필드를 업데이트해야 합니다.'
        });
        return;
    }
    
    // c_report_idx를 WHERE 조건에 추가
    updateValues.push(c_report_idx);
    
    const query = `
        UPDATE t_citizen_report 
        SET ${updateFields.join(', ')}
        WHERE c_report_idx = ?
    `;
    
    console.log('🔧 실행할 쿼리:', query);
    console.log('📊 업데이트 값들:', updateValues);
    
    try {
        const [results] = await db.execute(query, updateValues);
        if (results.affectedRows === 0) {
            console.log('❌ 시민 제보 업데이트 실패: 해당 제보를 찾을 수 없음:', c_report_idx);
            res.status(404).json({ 
                error: '해당 시민 제보를 찾을 수 없습니다.',
                reportId: c_report_idx
            });
            return;
        }
        
        console.log('✅ 시민 제보 업데이트 성공:', { 
            reportId: c_report_idx, 
            affectedRows: results.affectedRows,
            updatedFields: updateFields.map(field => field.split(' = ')[0])
        });
        
        res.json({
            success: true,
            message: '시민 제보가 성공적으로 업데이트되었습니다.',
            reportId: c_report_idx,
            affectedRows: results.affectedRows,
            updatedFields: updateFields.map(field => field.split(' = ')[0])
        });
    } catch (error) {
        console.error('❌ 시민 제보 업데이트 오류:', error);
        res.status(500).json({ 
            error: '시민 제보 업데이트 중 오류가 발생했습니다.',
            details: error.message 
        });
    }
});

// 시민 제보 침수 분석 결과 조회
router.get('/flood-result/:reportId', async (req, res) => {
    const reportId = req.params.reportId;
    console.log('🌊 시민 제보 침수 분석 결과 조회 요청:', reportId);
    
    const query = `
        SELECT 
            citizen_result_idx,
            c_report_idx,
            c_reporter_name,
            c_reporter_phone,
            cr_type,
            lat,
            lon,
            flood_result,
            image_path,
            detected_at
        FROM t_citizen_result 
        WHERE c_report_idx = ? AND flood_result IS NOT NULL
        ORDER BY detected_at DESC
        LIMIT 1
    `;
    
    try {
        const [results] = await db.execute(query, [reportId]);
        
        if (results.length === 0) {
            console.log('❌ 시민 제보 침수 분석 결과를 찾을 수 없음:', reportId);
            res.status(404).json({ 
                error: '해당 시민 제보의 침수 분석 결과를 찾을 수 없습니다.',
                reportId: reportId,
                message: '침수 분석 전입니다.'
            });
            return;
        }
        
        console.log('✅ 시민 제보 침수 분석 결과 조회 성공');
        
        const result = results[0];
        // 데이터 가공
        const processedResult = {
            ...result,
            detected_at: result.detected_at ? new Date(result.detected_at).toISOString() : null,
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon)
        };
        
        res.json({
            success: true,
            message: '시민 제보 침수 분석 결과 조회 성공',
            result: processedResult
        });
    } catch (error) {
        console.error('❌ 시민 제보 침수 분석 결과 조회 오류:', error);
        res.status(500).json({ 
            error: '시민 제보 침수 분석 결과 조회 중 오류가 발생했습니다.',
            details: error.message 
        });
    }
});

// 시민 제보 분석 결과 조회
router.get('/citizen-result/:reportId', async (req, res) => {
    const reportId = req.params.reportId;
    console.log('🔍 시민 제보 분석 결과 조회 요청:', reportId);
    
    const query = `
        SELECT 
            citizen_result_idx,
            c_report_idx,
            c_reporter_name,
            c_reporter_phone,
            cr_type,
            lat,
            lon,
            road_score,
            weather_score,
            total_score,
            crack_cnt,
            break_cnt,
            ali_crack_cnt,
            precipitation,
            temp,
            wh_type,
            snowfall,
            image_path,
            detected_at
        FROM t_citizen_result 
        WHERE c_report_idx = ?
        ORDER BY detected_at DESC
        LIMIT 1
    `;
    
    try {
        const [results] = await db.execute(query, [reportId]);
        
        if (results.length === 0) {
            console.log('❌ 시민 제보 분석 결과를 찾을 수 없음:', reportId);
            res.status(404).json({ 
                error: '해당 시민 제보의 분석 결과를 찾을 수 없습니다.',
                reportId: reportId,
                message: '분석 전입니다.'
            });
            return;
        }
        
        console.log('✅ 시민 제보 분석 결과 조회 성공');
        
        const result = results[0];
        // 데이터 가공
        const processedResult = {
            ...result,
            detected_at: result.detected_at ? new Date(result.detected_at).toISOString() : null,
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon)
        };
        
        res.json({
            success: true,
            message: '시민 제보 분석 결과 조회 성공',
            result: processedResult
        });
    } catch (error) {
        console.error('❌ 시민 제보 분석 결과 조회 오류:', error);
        res.status(500).json({ 
            error: '시민 제보 분석 결과 조회 중 오류가 발생했습니다.',
            details: error.message 
        });
    }
});

// 시민 제보 침수 분석 결과 저장
router.post('/flood-result', async (req, res) => {
    const {
        c_report_idx,
        c_reporter_name,
        c_reporter_phone,
        cr_type,
        lat,
        lon,
        flood_result,
        image_path
    } = req.body;
    
    console.log('🌊 시민 제보 침수 분석 결과 저장 요청:', { 
        c_report_idx, 
        cr_type, 
        flood_result, 
        image_path 
    });
    
    if (!c_report_idx || !lat || !lon) {
        console.error('❌ 시민 제보 침수 결과 저장 실패: 필수 필드가 누락되었습니다.');
        res.status(400).json({ 
            error: '필수 필드가 누락되었습니다.',
            details: 'c_report_idx, lat, lon은 필수입니다.'
        });
        return;
    }
    
    const query = `
        INSERT INTO t_citizen_result (
            c_report_idx,
            c_reporter_name,
            c_reporter_phone,
            cr_type,
            lat,
            lon,
            flood_result,
            image_path,
            detected_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const values = [
        c_report_idx,
        c_reporter_name || null,
        c_reporter_phone || null,
        cr_type || '도로 침수',
        lat,
        lon,
        flood_result || 'N',
        image_path || null
    ];
    
    console.log('🔧 실행할 쿼리:', query);
    console.log('📊 저장할 값들:', values);
    
    try {
        const [results] = await db.execute(query, values);
        
        console.log('✅ 시민 제보 침수 결과 저장 성공:', { 
            citizen_result_idx: results.insertId,
            reportId: c_report_idx,
            flood_result,
            image_path
        });
        
        res.json({
            success: true,
            message: '시민 제보 침수 분석 결과가 성공적으로 저장되었습니다.',
            citizen_result_idx: results.insertId,
            reportId: c_report_idx,
            flood_result,
            image_path
        });
    } catch (error) {
        console.error('❌ 시민 제보 침수 결과 저장 오류:', error);
        res.status(500).json({ 
            error: '시민 제보 침수 결과 저장 중 오류가 발생했습니다.',
            details: error.message 
        });
    }
});

// 시민 제보 분석 결과 저장
router.post('/citizen-result', async (req, res) => {
    const {
        c_report_idx,
        c_reporter_name,
        c_reporter_phone,
        cr_type,
        lat,
        lon,
        road_score,
        weather_score,
        total_score,
        crack_cnt,
        break_cnt,
        ali_crack_cnt,
        precipitation,
        temp,
        wh_type,
        snowfall,
        image_path
    } = req.body;
    
    console.log('💾 시민 제보 분석 결과 저장 요청:', { 
        c_report_idx, 
        cr_type, 
        road_score, 
        weather_score, 
        total_score 
    });
    
    if (!c_report_idx || !lat || !lon) {
        console.error('❌ 시민 제보 결과 저장 실패: 필수 필드가 누락되었습니다.');
        res.status(400).json({ 
            error: '필수 필드가 누락되었습니다.',
            details: 'c_report_idx, lat, lon은 필수입니다.'
        });
        return;
    }
    
    const query = `
        INSERT INTO t_citizen_result (
            c_report_idx,
            c_reporter_name,
            c_reporter_phone,
            cr_type,
            lat,
            lon,
            road_score,
            weather_score,
            total_score,
            crack_cnt,
            break_cnt,
            ali_crack_cnt,
            precipitation,
            temp,
            wh_type,
            snowfall,
            image_path,
            detected_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const values = [
        c_report_idx,
        c_reporter_name || null,
        c_reporter_phone || null,
        cr_type || '도로 파손',
        lat,
        lon,
        road_score || 0.0,
        weather_score || 0,
        total_score || 0.0,
        crack_cnt || 0,
        break_cnt || 0,
        ali_crack_cnt || 0,
        precipitation || 0.0,
        temp || 0.0,
        wh_type || 'Unknown',
        snowfall || 0.0,
        image_path || null
    ];
    
    console.log('🔧 실행할 쿼리:', query);
    console.log('📊 저장할 값들:', values);
    
    try {
        const [results] = await db.execute(query, values);
        
        console.log('✅ 시민 제보 결과 저장 성공:', { 
            citizen_result_idx: results.insertId,
            reportId: c_report_idx,
            road_score,
            weather_score,
            total_score
        });
        
        res.json({
            success: true,
            message: '시민 제보 분석 결과가 성공적으로 저장되었습니다.',
            citizen_result_idx: results.insertId,
            reportId: c_report_idx,
            road_score,
            weather_score,
            total_score
        });
    } catch (error) {
        console.error('❌ 시민 제보 결과 저장 오류:', error);
        res.status(500).json({ 
            error: '시민 제보 결과 저장 중 오류가 발생했습니다.',
            details: error.message 
        });
    }
});

module.exports = router;
