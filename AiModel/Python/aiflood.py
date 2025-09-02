import cv2
import mysql.connector
from ultralytics import YOLO

# 1. 모델 불러오기
model = YOLO("../AiModel/floodbest.pt")  # YOLO Classification 모델

# 2. DB 연결
db = mysql.connector.connect(
    host='project-db-campus.smhrd.com',
    user='campus_25SW_BD_p3_2',
    password="smhrd2",
    database="campus_25SW_BD_p3_2"
)
cursor = db.cursor(dictionary=True)

# 3. 날씨 조건 확인 (최근 1시간 이내, 비 + 강수량 20 이상)
cursor.execute("""
    SELECT * FROM t_weather 
    WHERE wh_type='비' 
      AND precipitation >= 20
      AND wh_date >= NOW() - INTERVAL 1 HOUR
    LIMIT 1
""")
weather = cursor.fetchone()

if not weather:
    print("⏸ 최근 1시간 이내 조건 불충족 → 작업 스킵")
else:
    # 4. CCTV URL 불러오기
    cursor.execute("SELECT cctv_url FROM t_cctv")
    cctvs = cursor.fetchall()

    for row in cctvs:
        cctv_url = row["cctv_url"]
        print(f"📹 CCTV 처리 중: {cctv_url}")

        # 5. CCTV 프레임 캡처
        cap = cv2.VideoCapture(cctv_url)
        ret, frame = cap.read()
        cap.release()

        if not ret:
            print(f"❌ 프레임 캡처 실패: {cctv_url}")
            continue

        # 6. 모델 추론
        results = model(frame, verbose=False)

        # 결과 확률 가져오기
        probs = results[0].probs  # 분류 확률
        class_id = int(probs.top1)  # 가장 높은 확률의 클래스 인덱스
        class_name = results[0].names[class_id]  # 클래스 이름 (예: "flood" or "normal")
        confidence = probs.top1conf.item()  # 확률 값

        print(f"   ▶ 결과: {class_name} (확률 {confidence:.2f})")

        # 7. 결과 저장 (t_cctv_result 테이블 예시)
        cursor.execute("""
            INSERT INTO t_cctv_result (cctv_url, status, confidence, created_at) 
            VALUES (%s, %s, %s, NOW())
        """, (cctv_url, class_name, confidence))
        db.commit()

db.close()
