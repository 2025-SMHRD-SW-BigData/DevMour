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

// 마커 상세 정보 가져오기 라우터
router.get('/detail/:markerId', (req, res) => {
    console.log('✅ 마커 상세 정보 요청 수신:', req.params.markerId);
    
    const markerId = req.params.markerId;
    
    // 먼저 마커 기본 정보 조회
    const markerSql = 'SELECT * FROM t_markers WHERE marker_id = ?';
    
    conn.connect(err => {
        if (err) {
            console.error('❌ 데이터베이스 연결 실패:', err);
            return res.status(500).send('데이터베이스 연결 실패');
        }

        conn.query(markerSql, [markerId], (err, markerRows) => {
            if (err) {
                console.error('❌ 마커 정보 조회 실패:', err);
                return res.status(500).send('마커 정보 조회 실패');
            }

            if (markerRows.length === 0) {
                return res.status(404).send('마커를 찾을 수 없습니다.');
            }

            const marker = markerRows[0];
            const markerType = marker.marker_type;
            
            console.log('🔍 마커 정보:', {
                marker_id: marker.marker_id,
                marker_type: marker.marker_type,
                cctv_idx: marker.cctv_idx,
                control_idx: marker.control_idx,
                lat: marker.lat,
                lon: marker.lon
            });

            // 마커 타입에 따라 상세 정보 조회
            let detailSql = '';
            let detailParams = [];

            switch (markerType) {
                case 'cctv':
                    detailSql = 'SELECT * FROM t_cctv WHERE cctv_idx = ?';
                    detailParams = [marker.cctv_idx];
                    console.log('📹 CCTV 상세 정보 조회:', { sql: detailSql, params: detailParams });
                    break;
                case 'construction':
                case 'flood':
                    detailSql = 'SELECT * FROM t_road_control WHERE control_idx = ?';
                    detailParams = [marker.control_idx];
                    console.log('🚧 도로 통제 상세 정보 조회:', { sql: detailSql, params: detailParams });
                    break;
                default:
                    return res.status(400).send('지원하지 않는 마커 타입입니다.');
            }

            // control_idx나 cctv_idx가 null인 경우 처리
            if (detailParams[0] === null || detailParams[0] === undefined) {
                console.log('⚠️ 상세 정보 인덱스가 null입니다. 기본 정보만 반환합니다.');
                const result = {
                    marker: marker,
                    detail: null,
                    message: `${markerType} 타입 마커의 상세 정보가 설정되지 않았습니다.`
                };
                return res.status(200).json(result);
            }

            conn.query(detailSql, detailParams, (err, detailRows) => {
                if (err) {
                    console.error('❌ 상세 정보 조회 실패:', err);
                    return res.status(500).send('상세 정보 조회 실패');
                }

                console.log('📊 상세 정보 조회 결과:', {
                    found: detailRows.length > 0,
                    rows: detailRows
                });

                const result = {
                    marker: marker,
                    detail: detailRows.length > 0 ? detailRows[0] : null
                };

                console.log('✅ 마커 상세 정보 조회 성공');
                res.status(200).json(result);
            });
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