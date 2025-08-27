const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// MySQL 연결 설정
let conn = mysql.createConnection({
    host: 'project-db-campus.smhrd.com',
    port: 3307,
    user: 'campus_25SW_BD_p3_2',
    password: 'smhrd2',
    database: 'campus_25SW_BD_p3_2'
});

// 비밀번호 해싱 함수
async function hashPasswords() {
    try {
        // 데이터베이스 연결
        await new Promise((resolve, reject) => {
            conn.connect(err => {
                if (err) {
                    console.error('❌ 데이터베이스 연결 실패:', err);
                    reject(err);
                    return;
                }
                console.log('✅ 데이터베이스 연결 성공');
                resolve();
            });
        });

        // 기존 사용자들의 비밀번호 조회
        const [rows] = await conn.promise().query('SELECT admin_id, admin_pw FROM t_admin');
        
        console.log(`📊 총 ${rows.length}명의 사용자 비밀번호를 해싱합니다...`);
        
        for (const user of rows) {
            try {
                // 기존 비밀번호가 이미 해시된 형태인지 확인 (bcrypt 해시는 $2b$로 시작)
                if (user.admin_pw && !user.admin_pw.startsWith('$2b$')) {
                    // 평문 비밀번호를 BCrypt로 해싱 (saltRounds = 10)
                    const saltRounds = 10;
                    const hashedPassword = await bcrypt.hash(user.admin_pw, saltRounds);
                    
                    // 해시된 비밀번호로 업데이트
                    await conn.promise().query(
                        'UPDATE t_admin SET admin_pw = ? WHERE admin_id = ?',
                        [hashedPassword, user.admin_id]
                    );
                    
                    console.log(`✅ ${user.admin_id} 비밀번호 해싱 완료`);
                } else {
                    console.log(`⏭️ ${user.admin_id} 비밀번호는 이미 해시되어 있습니다.`);
                }
            } catch (error) {
                console.error(`❌ ${user.admin_id} 비밀번호 해싱 실패:`, error.message);
            }
        }
        
        console.log('🎉 모든 비밀번호 해싱 작업이 완료되었습니다.');
        
    } catch (error) {
        console.error('❌ 비밀번호 해싱 중 오류 발생:', error);
    } finally {
        // 데이터베이스 연결 종료
        conn.end();
        console.log('🔌 데이터베이스 연결이 종료되었습니다.');
    }
}

// 스크립트 실행
hashPasswords();
