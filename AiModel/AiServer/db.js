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
