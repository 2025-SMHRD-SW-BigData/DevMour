-- 샘플 데이터 삽입 스크립트
-- 테이블에 테스트용 데이터를 추가합니다.

-- CCTV 데이터 삽입
INSERT INTO t_cctv (cctv_name, lat, lon, cctv_status, cctv_url, created_at) VALUES
('강남역 CCTV-01', 37.4979, 127.0276, 'A', 'http://example.com/cctv1/stream', NOW()),
('강남역 CCTV-02', 37.4981, 127.0278, 'A', 'http://example.com/cctv2/stream', NOW()),
('홍대입구 CCTV-01', 37.5571, 126.9254, 'A', 'http://example.com/cctv3/stream', NOW());

-- 도로 통제 데이터 삽입 (공사)
INSERT INTO t_road_control (pred_idx, control_desc, control_st_tm, control_ed_tm, created_at, road_idx, lat, lon, control_addr, control_type) VALUES
(1, '강남대로 도로 포장 공사', '2024-01-15 09:00:00', '2024-03-20 18:00:00', NOW(), 101, 37.4979, 127.0276, '서울특별시 강남구 강남대로 123', 'construction'),
(2, '홍대입구 지하차도 공사', '2024-01-20 10:00:00', '2024-04-15 17:00:00', NOW(), 102, 37.5571, 126.9254, '서울특별시 마포구 홍대로 456', 'construction');

-- 도로 통제 데이터 삽입 (침수)
INSERT INTO t_road_control (pred_idx, control_desc, control_st_tm, control_ed_tm, created_at, road_idx, lat, lon, control_addr, control_type) VALUES
(3, '강남역 지하차도 침수', '2024-01-25 14:30:00', NULL, NOW(), 103, 37.4979, 127.0276, '서울특별시 강남구 강남대로 123', 'flood'),
(4, '홍대입구 도로 침수', '2024-01-26 16:00:00', NULL, NOW(), 104, 37.5571, 126.9254, '서울특별시 마포구 홍대로 456', 'flood');

-- 마커 데이터 삽입
INSERT INTO t_markers (marker_id, lat, lon, marker_type, control_idx, cctv_idx) VALUES
(1, 37.4979, 127.0276, 'cctv', NULL, 1),
(2, 37.4981, 127.0278, 'cctv', NULL, 2),
(3, 37.5571, 126.9254, 'cctv', NULL, 3),
(4, 37.4979, 127.0276, 'construction', 1, NULL),
(5, 37.5571, 126.9254, 'construction', 2, NULL),
(6, 37.4979, 127.0276, 'flood', 3, NULL),
(7, 37.5571, 126.9254, 'flood', 4, NULL);

-- 데이터 확인
SELECT 'CCTV 데이터' as table_name, COUNT(*) as count FROM t_cctv
UNION ALL
SELECT '도로 통제 데이터' as table_name, COUNT(*) as count FROM t_road_control
UNION ALL
SELECT '마커 데이터' as table_name, COUNT(*) as count FROM t_markers;
