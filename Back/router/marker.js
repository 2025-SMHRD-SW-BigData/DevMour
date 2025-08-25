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

// 모든 마커 정보 가져오기 라우터
router.get('/allmarkers', (req, res) => {
    console.log('✅ 모든 마커 정보 요청 수신');
    
    // SQL 쿼리: 't_markers' 테이블의 모든 데이터 선택
    const sql = 'SELECT * FROM t_markers';

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).send('데이터베이스 연결 실패');
        }

        conn.query(sql, (err, rows) => {
            
            if (!err) {
                console.log('데이터베이스에서 마커 정보 가져오기 성공!');
                // 클라이언트로 JSON 데이터 전송
                res.status(200).json(rows); 
            } else {
                console.error('❌ 쿼리 실행 실패:', err);
                res.status(500).send('마커 정보 조회 실패');
            }
        });
    });
});

// 마커 상세 정보 가져오기 라우터 - t_cctv와 t_road_control에서 직접 조회
router.get('/detail/:markerId', (req, res) => {
    console.log('✅ 마커 상세 정보 요청 수신:', req.params.markerId);
    
    const markerId = req.params.markerId;
    
    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).send('데이터베이스 연결 실패');
        }

        // ✅ 먼저 t_cctv에서 조회 시도
        const cctvSql = 'SELECT * FROM t_cctv WHERE cctv_idx = ?';
        console.log('📹 CCTV 조회 시도:', cctvSql, '파라미터:', markerId);
        
        conn.query(cctvSql, [markerId], (err, cctvRows) => {
            if (err) {
                console.error('❌ CCTV 조회 실패:', err);
                // 에러가 발생해도 계속 진행
            }
            
            if (cctvRows.length > 0) {
                // ✅ CCTV 정보 발견
                const cctvData = cctvRows[0];
                console.log('✅ CCTV 정보 조회 성공:', cctvData);
                
                const result = {
                    marker: {
                        marker_id: cctvData.cctv_idx,
                        marker_type: 'cctv',
                        cctv_idx: cctvData.cctv_idx,
                        control_idx: null,
                        lat: cctvData.lat,
                        lon: cctvData.lon
                    },
                    detail: cctvData
                };
                
                res.status(200).json(result);
                return;
            }
            
                    // ✅ CCTV에서 찾을 수 없는 경우, 404 반환
        console.log('❌ CCTV 정보를 찾을 수 없음:', markerId);
        return res.status(404).send('CCTV 정보를 찾을 수 없습니다.');
        });
    });
});

// 마커 정보 저장 라우터
router.post('/updatemarker', (req, res) => {
    console.log('✅ 마커 업데이트 요청 수신:');
    const { lat, lon, marker_type } = req.body;
    
    // 데이터베이스에 저장하는 로직을 여기에 추가
    console.log(`- 위도: ${lat}, 경도: ${lon}`);
    console.log(`- 마커 타입: ${marker_type}`);

    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).send('데이터베이스 연결 실패');
        }

        // 트랜잭션으로 마커와 상세 정보를 함께 저장
        conn.beginTransaction(async (err) => {
            if (err) {
                console.error('❌ 트랜잭션 시작 실패:', err);
                return res.status(500).send('트랜잭션 시작 실패');
            }

            try {
                // 1. 마커 기본 정보 저장
                const markerSql = 'INSERT INTO t_markers (lat, lon, marker_type) VALUES (?, ?, ?)';
                
                conn.query(markerSql, [lat, lon, marker_type], (err, markerResult) => {
                    if (err) {
                        console.error('❌ 마커 저장 실패:', err);
                        return conn.rollback(() => {
                            res.status(500).send('마커 정보 저장 실패');
                        });
                    }

                    const markerId = markerResult.insertId;
                    console.log('✅ 마커 저장 성공, ID:', markerId);

                    // 2. 마커 타입에 따라 상세 정보 생성
                    if (marker_type === 'construction' || marker_type === 'flood') {
                        const controlSql = 'INSERT INTO t_road_control (pred_idx, control_desc, control_st_tm, control_ed_tm, created_at, road_idx, lat, lon, control_addr, control_type) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)';
                        
                        // 기본값 설정
                        const predIdx = 1; // 임시값
                        const controlDesc = marker_type === 'construction' ? '도로 공사 진행중' : '도로 침수 통제중';
                        const controlStTm = new Date();
                        const controlEdTm = marker_type === 'construction' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null; // 공사는 30일 후, 침수는 미정
                        const roadIdx = 101; // 임시값
                        const controlAddr = `위도: ${lat}, 경도: ${lon}`;
                        
                        const controlParams = [predIdx, controlDesc, controlStTm, controlEdTm, roadIdx, lat, lon, controlAddr, marker_type];
                        
                        conn.query(controlSql, controlParams, (err, controlResult) => {
                            if (err) {
                                console.error('❌ 상세 정보 저장 실패:', err);
                                return conn.rollback(() => {
                                    res.status(500).send('상세 정보 저장 실패');
                                });
                            }

                            const controlId = controlResult.insertId;
                            console.log('✅ 상세 정보 저장 성공, ID:', controlId);

                            // 3. 마커에 control_idx 업데이트
                            const updateSql = 'UPDATE t_markers SET control_idx = ? WHERE marker_id = ?';
                            conn.query(updateSql, [controlId, markerId], (err) => {
                                if (err) {
                                    console.error('❌ 마커 업데이트 실패:', err);
                                    return conn.rollback(() => {
                                        res.status(500).send('마커 업데이트 실패');
                                    });
                                }

                                console.log('✅ 마커 업데이트 성공');
                                
                                // 트랜잭션 커밋
                                conn.commit((err) => {
                                    if (err) {
                                        console.error('❌ 트랜잭션 커밋 실패:', err);
                                        return conn.rollback(() => {
                                            res.status(500).send('트랜잭션 커밋 실패');
                                        });
                                    }

                                    console.log('✅ 모든 작업 완료');
                                    const response = {
                                        message: '마커 정보가 성공적으로 저장되었습니다.',
                                        marker_id: markerId,
                                        id: markerId,
                                        control_idx: controlId
                                    };
                                    
                                    res.status(200).json(response);
                                });
                            });
                        });
                    } else {
                        // CCTV나 다른 타입은 기본 마커만 저장
                        conn.commit((err) => {
                            if (err) {
                                console.error('❌ 트랜잭션 커밋 실패:', err);
                                return conn.rollback(() => {
                                    res.status(500).send('트랜잭션 커밋 실패');
                                });
                            }

                            const response = {
                                message: '마커 정보가 성공적으로 저장되었습니다.',
                                marker_id: markerId,
                                id: markerId
                            };
                            
                            res.status(200).json(response);
                        });
                    }
                });

            } catch (error) {
                console.error('❌ 작업 중 오류 발생:', error);
                conn.rollback(() => {
                    res.status(500).send('작업 중 오류가 발생했습니다.');
                });
            }
        });
    });
});

module.exports = router;