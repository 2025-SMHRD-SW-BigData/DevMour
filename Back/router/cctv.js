const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

// MySQL 연결 설정 (conn.connect()를 쿼리마다 호출하는 기존 스타일 유지)
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});

// CCTV 목록 조회
router.get('/all', (req, res) => {
    console.log('✅ CCTV 목록 조회 요청 수신');

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ error: '데이터베이스 연결 실패' });
        }

        const sql = 'SELECT * FROM t_cctv ORDER BY created_at DESC';
        
        conn.query(sql, (err, rows) => {
            if (err) {
                console.error('❌ CCTV 목록 조회 실패:', err);
                return res.status(500).json({ error: 'CCTV 목록 조회 실패' });
            }

            console.log('✅ CCTV 목록 조회 성공:', rows.length, '개');
            res.json(rows);
        });
    });
});

// CCTV 상세 정보 조회
router.get('/detail/:cctvId', (req, res) => {
    console.log('✅ CCTV 상세 정보 요청 수신:', req.params.cctvId);

    const cctvId = req.params.cctvId;

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ error: '데이터베이스 연결 실패' });
        }

        const sql = 'SELECT * FROM t_cctv WHERE cctv_idx = ?';
        
        conn.query(sql, [cctvId], (err, rows) => {
            if (err) {
                console.error('❌ CCTV 상세 정보 조회 실패:', err);
                return res.status(500).json({ error: 'CCTV 상세 정보 조회 실패' });
            }

            if (rows.length === 0) {
                return res.status(404).json({ error: 'CCTV를 찾을 수 없습니다.' });
            }

            console.log('✅ CCTV 상세 정보 조회 성공:', rows[0]);
            
            const result = {
                marker: {
                    marker_id: rows[0].cctv_idx,
                    marker_type: 'cctv',
                    cctv_idx: rows[0].cctv_idx,
                    control_idx: null,
                    lat: rows[0].lat,
                    lon: rows[0].lon
                },
                detail: rows[0]
            };

            res.json(result);
        });
    });
});

// CCTV 이름 중복 확인
router.get('/check-duplicate/:cctvName', (req, res) => {
    console.log('✅ CCTV 이름 중복 확인 요청 수신:', req.params.cctvName);

    const cctvName = decodeURIComponent(req.params.cctvName);

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ error: '데이터베이스 연결 실패' });
        }

        const sql = 'SELECT COUNT(*) as count FROM t_cctv WHERE cctv_name = ?';
        
        conn.query(sql, [cctvName], (err, rows) => {
            if (err) {
                console.error('❌ CCTV 중복 확인 실패:', err);
                return res.status(500).json({ error: 'CCTV 중복 확인 실패' });
            }

            const isDuplicate = rows[0].count > 0;
            console.log('✅ CCTV 중복 확인 완료:', { cctvName, isDuplicate });

            res.json({
                success: true,
                isDuplicate,
                cctvName,
                message: isDuplicate ? '이미 등록된 CCTV입니다.' : '사용 가능한 CCTV 이름입니다.'
            });
        });
    });
});

// CCTV 추가
router.post('/add', (req, res) => {
    console.log('✅ CCTV 추가 요청 수신');

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).json({ error: '데이터베이스 연결 실패' });
        }

        const {
            cctv_name,
            lat,
            lon,
            cctv_url,
            cctv_status
        } = req.body;

        // 필수 필드 검증
        if (!cctv_name || !lat || !lon || !cctv_url) {
            return res.status(400).json({
                success: false,
                message: '필수 필드가 누락되었습니다. (cctv_name, lat, lon, cctv_url)'
            });
        }

        // 좌표 유효성 검증
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        
        if (isNaN(latNum) || isNaN(lonNum)) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않은 좌표입니다.'
            });
        }

        if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
            return res.status(400).json({
                success: false,
                message: '좌표 범위가 올바르지 않습니다. (위도: -90~90, 경도: -180~180)'
            });
        }

        console.log('📝 추가할 CCTV 데이터:', {
            cctv_name,
            lat: latNum,
            lon: lonNum,
            cctv_url,
            cctv_status: cctv_status || 'A'
        });

        // CCTV 추가 쿼리 실행
        const insertQuery = `
            INSERT INTO t_cctv (cctv_name, lat, lon, cctv_status, cctv_url)
            VALUES (?, ?, ?, ?, ?)
        `;

        conn.query(insertQuery, [
            cctv_name,
            latNum,
            lonNum,
            cctv_status || 'A',
            cctv_url
        ], (err, result) => {
            if (err) {
                console.error('❌ CCTV 추가 실패:', err);
                return res.status(500).json({
                    success: false,
                    message: 'CCTV 추가 실패',
                    error: err.message
                });
            }

            console.log('✅ CCTV 추가 성공:', result.insertId);
            
            res.status(201).json({
                success: true,
                message: 'CCTV가 성공적으로 추가되었습니다.',
                cctv_idx: result.insertId,
                data: {
                    cctv_name,
                    lat: latNum,
                    lon: lonNum,
                    cctv_status: cctv_status || 'A',
                    cctv_url
                }
            });
        });
    });
});

module.exports = router;
