const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// 날짜 형식 변환 함수 (datetime -> date)
const formatDateForFrontend = (dateValue) => {
    console.log('📅 날짜 변환 시작:', { 값: dateValue, 타입: typeof dateValue, 생성자: dateValue?.constructor?.name });
    
    if (!dateValue) {
        console.log('📅 빈 값 반환');
        return '';
    }
    
    try {
        // Date 객체인 경우
        if (dateValue instanceof Date) {
            const result = dateValue.toISOString().split('T')[0];
            console.log('📅 Date 객체 변환:', { 원본: dateValue, 결과: result });
            return result;
        }
        
        // 문자열인 경우
        if (typeof dateValue === 'string') {
            // "2025-09-07T11:22" 형식을 "2025-09-07" 형식으로 변환
            if (dateValue.includes('T')) {
                const result = dateValue.split('T')[0];
                console.log('📅 T 포함 문자열 변환:', { 원본: dateValue, 결과: result });
                return result;
            }
            
            // 이미 "2025-09-07" 형식인 경우
            if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                console.log('📅 이미 올바른 형식:', dateValue);
                return dateValue;
            }
            
            // 다른 형식인 경우 Date 객체로 파싱
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) {
                console.warn('📅 유효하지 않은 날짜 형식:', dateValue);
                return '';
            }
            
            const result = date.toISOString().split('T')[0];
            console.log('📅 문자열 Date 변환:', { 원본: dateValue, 결과: result });
            return result;
        }
        
        // 다른 타입인 경우
        console.warn('📅 예상하지 못한 날짜 타입:', typeof dateValue, dateValue);
        return '';
        
    } catch (error) {
        console.error('📅 날짜 형식 변환 오류:', error, dateValue);
        return '';
    }
};


// MySQL Pool 연결 설정
const db = mysql.createPool({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 모든 도로 통제 정보 가져오기 라우터
router.get('/all', async (req, res) => {
    try {
        console.log('✅ 모든 도로 통제 정보 요청 수신');
        
        // SQL 쿼리: 't_road_control' 테이블의 모든 데이터 선택
        const sql = 'SELECT * FROM t_road_control';
        
        const [rows] = await db.execute(sql);
    
	// 모든 행의 날짜 필드 변환
        const formattedRows = rows.map(row => ({
            ...row,
            control_st_tm: formatDateForFrontend(row.control_st_tm),
            control_ed_tm: formatDateForFrontend(row.control_ed_tm)
        }));
            
        console.log('데이터베이스에서 도로 통제 정보 가져오기 성공!');
        console.log('📅 날짜 형식 변환 완료:', formattedRows.length, '개 항목');
        res.status(200).json(formattedRows);
        
    } catch (error) {
        console.error('❌ 도로 통제 정보 조회 실패:', error);
        res.status(500).json({ error: '도로 통제 정보 조회 실패' });
    }
});

// 도로 통제 상세 정보 조회 라우터
router.get('/detail/:controlIdx', async (req, res) => {
    try {
        console.log('✅ 도로 통제 상세 정보 요청 수신:', req.params.controlIdx);
        
        const controlIdx = req.params.controlIdx;
        
        // t_road_control에서 control_idx로 조회
        const sql = 'SELECT * FROM t_road_control WHERE control_idx = ?';
        console.log('🚧 도로 통제 상세 정보 조회:', sql, '파라미터:', controlIdx);
        
        const [rows] = await db.execute(sql, [controlIdx]);
        
        if (rows.length === 0) {
            console.log('⚠️ 해당 control_idx를 가진 도로 통제 정보가 없음:', controlIdx);
            return res.status(404).json({ error: '도로 통제 정보를 찾을 수 없습니다.' });
        }
        
        // ✅ 도로 통제 정보 발견
        const controlData = rows[0];
        console.log('✅ 도로 통제 상세 정보 조회 성공:', controlData);
        // 날짜 필드 변환
        const formattedControlData = {
            ...controlData,
            control_st_tm: formatDateForFrontend(controlData.control_st_tm),
            control_ed_tm: formatDateForFrontend(controlData.control_ed_tm)
        };
        
        console.log('📅 날짜 형식 변환 결과:', {
            원본_시작일: controlData.control_st_tm,
            변환_시작일: formattedControlData.control_st_tm,
            원본_완료일: controlData.control_ed_tm,
            변환_완료일: formattedControlData.control_ed_tm
        });
        
        const result = {
            marker: {
                marker_id: controlData.control_idx,
                marker_type: controlData.control_type || 'construction',
                cctv_idx: null,
                control_idx: controlData.control_idx,
                lat: controlData.lat,
                lon: controlData.lon
            },
            detail: formattedControlData
        };
        
        res.status(200).json(result);
        
    } catch (error) {
        console.error('❌ 도로 통제 상세 정보 조회 실패:', error);
        res.status(500).json({ error: '도로 통제 상세 정보 조회 실패' });
    }
});

module.exports = router;
