const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
let firebaseApp = null;

const initializeFirebase = () => {
    if (!firebaseApp) {
        try {
            // Firebase 서비스 계정 키 파일 경로
            // 실제 배포 시에는 환경변수나 보안 저장소 사용 권장
            const serviceAccount = require('../serviceAccountKey.json');
            
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                // 프로젝트 ID는 serviceAccountKey.json에서 자동으로 가져옴
            });
            
            console.log('✅ Firebase Admin SDK 초기화 완료');
        } catch (error) {
            console.error('❌ Firebase Admin SDK 초기화 실패:', error.message);
            console.log('💡 serviceAccountKey.json 파일이 필요합니다.');
            console.log('   Firebase Console > 프로젝트 설정 > 서비스 계정에서 다운로드하세요.');
        }
    }
    return firebaseApp;
};

// FCM 메시지 전송 함수
const sendFCMNotification = async (token, title, body, data = {}) => {
    try {
        const app = initializeFirebase();
        if (!app) {
            throw new Error('Firebase가 초기화되지 않았습니다.');
        }

        const message = {
            notification: {
                title: title,
                body: body
            },
            data: {
                ...data,
                timestamp: new Date().toISOString()
            },
            token: token,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'devmour_notifications'
                }
            }
        };

        const response = await admin.messaging().send(message);
        console.log('✅ FCM 메시지 전송 성공:', response);
        return { success: true, messageId: response };
        
    } catch (error) {
        console.error('❌ FCM 메시지 전송 실패:', error);
        return { success: false, error: error.message };
    }
};

// 다중 토큰으로 메시지 전송
const sendFCMNotificationToMultiple = async (tokens, title, body, data = {}) => {
    try {
        const app = initializeFirebase();
        if (!app) {
            throw new Error('Firebase가 초기화되지 않았습니다.');
        }

        const message = {
            notification: {
                title: title,
                body: body
            },
            data: {
                ...data,
                timestamp: new Date().toISOString()
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'devmour_notifications'
                }
            }
        };

        const response = await admin.messaging().sendMulticast({
            ...message,
            tokens: tokens
        });

        console.log('✅ FCM 다중 메시지 전송 결과:', {
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses
        });

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses
        };
        
    } catch (error) {
        console.error('❌ FCM 다중 메시지 전송 실패:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    initializeFirebase,
    sendFCMNotification,
    sendFCMNotificationToMultiple
};
