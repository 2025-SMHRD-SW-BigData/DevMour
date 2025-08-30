-- 샘플 데이터 삽입 스크립트
-- 테이블에 테스트용 데이터를 추가합니다.

-- CCTV 데이터
INSERT INTO t_cctv (cctv_name, lat, lon, cctv_status, cctv_url) VALUES
('강남대로 CCTV-01', 37.5665, 127.0018, 'Y', 'https://example.com/stream1.mp4'),
('강남대로 CCTV-02', 37.5666, 127.0019, 'Y', 'https://example.com/stream2.mp4'),
('강남대로 CCTV-03', 37.5667, 127.0020, 'Y', 'https://example.com/stream3.mp4');

-- 도로 통제 데이터
INSERT INTO t_road_control (pred_idx, control_desc, control_st_tm, control_ed_tm, road_idx, lat, lon, control_addr, control_type) VALUES
(1, '도로 포장 공사 진행중', '2024-01-15 09:00:00', '2024-03-20 18:00:00', 101, 37.5665, 127.0018, '강남대로 123번지', 'construction'),
(2, '도로 침수 통제중', '2024-01-20 14:30:00', NULL, 102, 37.5666, 127.0019, '강남대로 456번지', 'flood');

-- 마커 데이터
INSERT INTO t_markers (marker_id, lat, lon, marker_type, control_idx, cctv_idx) VALUES
(1, 37.5665, 127.0018, 'cctv', NULL, 1),
(2, 37.5666, 127.0019, 'construction', 1, NULL),
(3, 37.5667, 127.0020, 'flood', 2, NULL);

-- 알림 데이터
INSERT INTO t_alert (pred_idx, road_idx, recepient_type, alert_msg, alert_level, sented_at, is_read, admin_id) VALUES
(1, 101, 'admin', '장한로 구간 위험도 급상승 - 즉시 현장 확인 필요', 'high', NOW() - INTERVAL 10 MINUTE, 'N', 'admin01'),
(1, 101, 'citizen', '강남대로 공사 구간 교통 혼잡 예상 - 우회로 이용 권장', 'medium', NOW() - INTERVAL 30 MINUTE, 'N', 'admin01'),
(2, 102, 'all', '집중 호우로 인한 도로 침수 발생 - 해당 구간 진입 금지', 'high', NOW() - INTERVAL 1 HOUR, 'Y', 'admin02'),
(1, 101, 'admin', 'CCTV 장애 발생 - 기술팀 점검 요청', 'medium', NOW() - INTERVAL 2 HOUR, 'Y', 'admin01'),
(2, 102, 'citizen', '침수 구간 복구 완료 - 정상 통행 가능', 'low', NOW() - INTERVAL 3 HOUR, 'N', 'admin02');

-- 데이터 확인
SELECT 'CCTV 데이터' as table_name, COUNT(*) as count FROM t_cctv
UNION ALL
SELECT '도로 통제 데이터' as table_name, COUNT(*) as count FROM t_road_control
UNION ALL
SELECT '마커 데이터' as table_name, COUNT(*) as count FROM t_markers;
