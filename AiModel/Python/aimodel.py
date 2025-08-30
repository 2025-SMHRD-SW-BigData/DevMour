import torch
import cv2
import numpy as np
import requests
from ultralytics import YOLO
from torchvision.ops import nms
import tkinter as tk
from tkinter import messagebox

# =========================
# 0) CCTV URL 및 서버 URL
# =========================
CCTV_URL = "blob:https://www.utic.go.kr/e639679b-16a7-429f-aadc-36fac694d82b"  # 실제 CCTV 스트림 URL
SERVER_URL = "http://localhost:3000/api/save-risk"  # DB 서버 API

# =========================
# 1) YOLO 앙상블 모델 설정
# =========================
MODEL_PATHS = [
    "../yolov8nbest.pt", # 모델1
    "../yolov8lbest.pt", # 모델2    
    "../yolov8sbest.pt", # 모델3
]
MODEL_CONF_THRESHOLDS = [0.005, 0.1, 0.005]
FINAL_CLASS_NAMES = ['crack', 'break', 'ali_crack'] # 균열, 포트홀, 거북등 균열
MODEL3_LOCAL_CLASS_NAMES = ['D20', 'D43', 'D50', 'D44', 'D00', 'D10', 'D40']
MODEL3_CLASS_REMAPPING = {
    MODEL3_LOCAL_CLASS_NAMES.index('D00'): FINAL_CLASS_NAMES.index('crack'),
    MODEL3_LOCAL_CLASS_NAMES.index('D10'): FINAL_CLASS_NAMES.index('crack'),
    MODEL3_LOCAL_CLASS_NAMES.index('D40'): FINAL_CLASS_NAMES.index('break'),
    MODEL3_LOCAL_CLASS_NAMES.index('D20'): FINAL_CLASS_NAMES.index('ali_crack')
}
FINAL_NMS_IOU_THRESHOLD = 0.5
risk_score = {"crack": 0.25, "break": 0.4, "ali_crack": 0.35}

# =========================
# 2) YOLO 모델 로드
# =========================
loaded_models = []
print("🔍 YOLO 모델 로드 중...")
for path in MODEL_PATHS:
    try:
        model = YOLO(path)
        loaded_models.append(model)
        print(f"✔️ 로드 완료: {path}")
    except Exception as e:
        print(f"❌ 로드 실패: {path} - {e}")

if not loaded_models:
    messagebox.showerror("오류", "모델 로드 실패")
    exit()

# =========================
# 3) CCTV 캡처 → 점수 계산 → 서버 전송
# =========================
def capture_and_send():
    try:
        # CCTV 프레임 캡처
        cap = cv2.VideoCapture(CCTV_URL)
        if not cap.isOpened():
            messagebox.showerror("오류", "CCTV 스트림에 연결할 수 없습니다.")
            return
        ret, frame = cap.read()
        cap.release()
        if not ret:
            messagebox.showerror("오류", "CCTV에서 이미지 캡처 실패")
            return

        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # YOLO 앙상블 탐지
        all_boxes, all_scores, all_class_ids = [], [], []
        for i, model in enumerate(loaded_models):
            is_model3 = (i == 2)
            results = model(img_rgb, conf=FINAL_NMS_IOU_THRESHOLD, verbose=False)[0]

            if results.boxes is not None and len(results.boxes.xyxy) > 0:
                boxes = results.boxes.xyxy.cpu().float()
                scores = results.boxes.conf.cpu().float()
                class_ids = results.boxes.cls.cpu().float()

                if is_model3:
                    remapped_ids = torch.full_like(class_ids, -1.0)
                    for local_id, final_id in MODEL3_CLASS_REMAPPING.items():
                        idxs = (class_ids == local_id).nonzero(as_tuple=True)[0]
                        remapped_ids[idxs] = final_id
                    valid_idx = (remapped_ids != -1).nonzero(as_tuple=True)[0]
                    if len(valid_idx) > 0:
                        all_boxes.append(boxes[valid_idx])
                        all_scores.append(scores[valid_idx])
                        all_class_ids.append(remapped_ids[valid_idx])
                else:
                    all_boxes.append(boxes)
                    all_scores.append(scores)
                    all_class_ids.append(class_ids)

        if not all_boxes:
            messagebox.showinfo("알림", "탐지된 객체가 없습니다.")
            return

        all_boxes_comb = torch.cat(all_boxes)
        all_scores_comb = torch.cat(all_scores)
        all_class_ids_comb = torch.cat(all_class_ids)

        # NMS 적용
        final_detections = []
        for cls_id in torch.unique(all_class_ids_comb).int():
            cls_idx = (all_class_ids_comb == cls_id).nonzero(as_tuple=True)[0]
            boxes_cls = all_boxes_comb[cls_idx]
            scores_cls = all_scores_comb[cls_idx]
            selected = nms(boxes_cls, scores_cls, iou_threshold=FINAL_NMS_IOU_THRESHOLD)
            for idx in selected:
                final_detections.append({'class_name': FINAL_CLASS_NAMES[int(cls_id.item())],
                                         'confidence': scores_cls[idx].item()})

        # 위험 점수 계산
        total_risk_score = sum([risk_score.get(det['class_name'], 1) for det in final_detections])

        # 클래스별 개수 계산
        class_counts = {name: 0 for name in FINAL_CLASS_NAMES}
        for det in final_detections:
            class_counts[det['class_name']] += 1

        # 서버 전송
        payload = {"totalRiskScore": float(total_risk_score), "classCounts": class_counts}
        resp = requests.post(SERVER_URL, json=payload, timeout=10)

        messagebox.showinfo("결과",
            f"총 위험 점수: {total_risk_score}\n"
            f"클래스별 개수: {class_counts}\n"
            f"서버 응답: {resp.status_code}")

    except Exception as e:
        messagebox.showerror("오류 발생", str(e))

# =========================
# 4) Tkinter GUI
# =========================
root = tk.Tk()
root.title("CCTV 위험도 점수 계산")
root.geometry("400x200")

label = tk.Label(root, text="CCTV 위험도 점수 계산", font=("Arial", 16))
label.pack(pady=20)

btn_capture = tk.Button(root, text="캡처 및 점수 계산", font=("Arial", 14), command=capture_and_send)
btn_capture.pack(pady=20)

root.mainloop()
