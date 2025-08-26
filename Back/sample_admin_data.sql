-- t_admin 테이블에 테스트용 샘플 데이터 추가
-- 이 스크립트는 MySQL에서 실행하여 테스트 계정을 생성합니다.

USE campus_25SW_BD_p3_2;

-- 기존 데이터가 있다면 삭제 (선택사항)
-- DELETE FROM t_admin;

-- 테스트용 관리자 계정 추가
INSERT INTO t_admin (admin_id, admin_pw, admin_name, admin_phone, dept_name, dept_addr, created_at) VALUES
('admin', 'admin123', '시스템 관리자', '010-1234-5678', 'IT팀', '광주광역시 광산구 상무대로 312', NOW()),
('test', 'test123', '테스트 사용자', '010-9876-5432', '운영팀', '광주광역시 광산구 상무대로 312', NOW()),
('user1', 'user123', '일반 사용자', '010-1111-2222', '관리팀', '광주광역시 광산구 상무대로 312', NOW());

-- 추가된 데이터 확인
SELECT * FROM t_admin;

-- 테이블 구조 확인
DESCRIBE t_admin;
