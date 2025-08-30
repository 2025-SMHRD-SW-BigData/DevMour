const mysql = require('mysql2/promise');
require('dotenv').config();

// 데이터베이스 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'project-db-campus.smhrd.com',
  user: process.env.DB_USER || 'campus_25SW_BD_p3_2',
  password: process.env.DB_PASSWORD || 'smhrd2',
  database: process.env.DB_NAME || 'campus_25SW_BD_p3_2',
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// 연결 테스트
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 데이터베이스 연결 성공');
    
    // t_weather 테이블이 존재하는지 확인하고 없으면 생성
    await ensureWeatherTableExists(connection);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error.message);
    return false;
  }
}

// t_weather 테이블 존재 확인 및 생성
async function ensureWeatherTableExists(connection) {
  try {
    // 테이블 존재 여부 확인
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 't_weather'"
    );
    
    if (tables.length === 0) {
      console.log('📋 t_weather 테이블이 존재하지 않습니다. 생성 중...');
      
      // t_weather 테이블 생성
      const createTableSQL = `
        CREATE TABLE t_weather (
          wh_idx INT NOT NULL AUTO_INCREMENT COMMENT '날씨 정보 고유번호',
          wh_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '날씨 정보 날짜',
          lat DECIMAL(17, 14) NOT NULL COMMENT '위도',
          lon DECIMAL(17, 14) NOT NULL COMMENT '경도',
          temp DECIMAL(5, 2) NOT NULL COMMENT '기온',
          precipitation DECIMAL(5, 2) DEFAULT 0.0 COMMENT '강수량',
          snowfall DECIMAL(5, 2) DEFAULT 0.0 COMMENT '강설량',
          wh_type VARCHAR(50) NOT NULL COMMENT '날씨 구분',
          weather_score INT DEFAULT 1 COMMENT '날씨 점수',
          cctv_idx INT DEFAULT NULL COMMENT 'CCTV 고유번호',
          PRIMARY KEY (wh_idx),
          INDEX idx_location (lat, lon),
          INDEX idx_date (wh_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='날씨 정보 테이블'
      `;
      
      await connection.execute(createTableSQL);
      console.log('✅ t_weather 테이블 생성 완료');
    } else {
      console.log('✅ t_weather 테이블이 이미 존재합니다');
    }
    
    // t_total 테이블도 확인 및 생성
    await ensureTotalTableExists(connection);
    
  } catch (error) {
    console.error('❌ t_weather 테이블 생성/확인 오류:', error.message);
    throw error;
  }
}

// t_total 테이블 존재 확인 및 생성
async function ensureTotalTableExists(connection) {
  try {
    // 테이블 존재 여부 확인
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 't_total'"
    );
    
    if (tables.length === 0) {
      console.log('📋 t_total 테이블이 존재하지 않습니다. 생성 중...');
      
      // t_total 테이블 생성
      const createTableSQL = `
        CREATE TABLE t_total (
          total_idx INT NOT NULL AUTO_INCREMENT COMMENT '종합 점수 고유번호',
          cctv_idx INT NOT NULL COMMENT 'cctv참조번호',
          lat DECIMAL(17, 14) NOT NULL COMMENT '탐지 위도',
          lon DECIMAL(17, 14) NOT NULL COMMENT '탐지 경도',
          road_score DECIMAL(3,1) DEFAULT 0.0 COMMENT '도로 위험 점수',
          weather_score INT COMMENT '날씨점수',
          total_score DECIMAL(3,1) COMMENT '종합 점수(도로점수x(1+날씨점수/10))',
          detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '탐지시기',
          crack_cnt INT DEFAULT 0 COMMENT '탐지 균열 개수',
          break_cnt INT DEFAULT 0 COMMENT '탐지 포트홀 개수',
          ali_crack_cnt INT DEFAULT 0 COMMENT '탐지 거북등 균열 개수',
          precipitation DECIMAL(5,1) NOT NULL COMMENT '강수량',
          temp DECIMAL(5,1) NOT NULL COMMENT '기온',
          wh_type VARCHAR(50) NOT NULL COMMENT '날씨 구분',
          snowfall DECIMAL(5,1) COMMENT '강설량',
          PRIMARY KEY (total_idx),
          INDEX idx_location (lat, lon),
          INDEX idx_date (detected_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='종합 점수 테이블'
      `;
      
      await connection.execute(createTableSQL);
      console.log('✅ t_total 테이블 생성 완료');
    } else {
      console.log('✅ t_total 테이블이 이미 존재합니다');
    }
  } catch (error) {
    console.error('❌ t_total 테이블 생성/확인 오류:', error.message);
    throw error;
  }
}

// 쿼리 실행 함수
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('❌ 쿼리 실행 오류:', error.message);
    throw error;
  }
}

// 트랜잭션 실행 함수
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
  query,
  transaction
};
