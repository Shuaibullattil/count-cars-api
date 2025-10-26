from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import uvicorn
import tempfile
import os
import cv2
from ultralytics import YOLO
from collections import defaultdict

app = FastAPI()

# Load model at startup
MODEL_PATH = "best.pt"
model = YOLO(MODEL_PATH)

@app.post("/count")
async def count_vehicles(
    video: UploadFile = File(...),
    orientation: str = Form(...),  # 'horizontal' or 'vertical'
    position: int = Form(...),     # 0-100
):
    # Save uploaded video to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        tmp.write(await video.read())
        video_path = tmp.name
    cap = cv2.VideoCapture(video_path)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    # Calculate line position
    if orientation == "horizontal":
        line_pos = int(height * position / 100)
    else:
        line_pos = int(width * position / 100)
    # Tracking logic
    tracked_vehicles = {}
    next_id = 0
    counted_vehicles = set()
    class_counts = defaultdict(int)
    total_count = 0
    frame_count = 0
    def calculate_iou(box1, box2):
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        intersection = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        return intersection / (area1 + area2 - intersection + 1e-6)
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break
        frame_count += 1
        results = model.predict(source=frame, conf=0.4, device="cpu")[0]
        boxes = results.boxes
        current_boxes = []
        current_classes = []
        for box in boxes:
            current_boxes.append(box.xyxy[0].cpu().numpy())
            current_classes.append(int(box.cls[0]))
        matched_detections = set()
        for track_id, track_info in tracked_vehicles.items():
            last_box = track_info['boxes'][-1]
            best_iou = 0.2
            best_detection_idx = -1
            for i, current_box in enumerate(current_boxes):
                if i in matched_detections:
                    continue
                iou = calculate_iou(last_box, current_box)
                if iou > best_iou:
                    best_iou = iou
                    best_detection_idx = i
            if best_detection_idx >= 0:
                tracked_vehicles[track_id]['boxes'].append(current_boxes[best_detection_idx])
                tracked_vehicles[track_id]['last_seen'] = frame_count
                matched_detections.add(best_detection_idx)
        for i in range(len(current_boxes)):
            if i not in matched_detections:
                tracked_vehicles[next_id] = {
                    'boxes': [current_boxes[i]],
                    'class_id': current_classes[i],
                    'last_seen': frame_count
                }
                next_id += 1
        # Counting logic
        for track_id, track_info in tracked_vehicles.items():
            if track_id in counted_vehicles:
                continue
            boxes = track_info['boxes']
            class_id = track_info['class_id']
            for j in range(1, len(boxes)):
                prev_box = boxes[j-1]
                curr_box = boxes[j]
                prev_center_x = (prev_box[0] + prev_box[2]) / 2
                prev_center_y = (prev_box[1] + prev_box[3]) / 2
                curr_center_x = (curr_box[0] + curr_box[2]) / 2
                curr_center_y = (curr_box[1] + curr_box[3]) / 2
                if orientation == "horizontal":
                    if ((prev_center_y < line_pos and curr_center_y >= line_pos) or
                        (prev_center_y >= line_pos and curr_center_y < line_pos)):
                        counted_vehicles.add(track_id)
                        class_counts[class_id] += 1
                        total_count += 1
                        break
                else:
                    if ((prev_center_x < line_pos and curr_center_x >= line_pos) or
                        (prev_center_x >= line_pos and curr_center_x < line_pos)):
                        counted_vehicles.add(track_id)
                        class_counts[class_id] += 1
                        total_count += 1
                        break
        # Remove old tracks
        ids_to_remove = [track_id for track_id, track_info in tracked_vehicles.items()
                         if frame_count - track_info['last_seen'] > 30]
        for track_id in ids_to_remove:
            del tracked_vehicles[track_id]
    cap.release()
    os.remove(video_path)
    # Prepare response
    class_names = model.names
    final_class_counts = {class_names[cid]: count for cid, count in class_counts.items()}
    response = {
        "total_vehicles": total_count,
        "class_counts": final_class_counts,
        "orientation": orientation,
        "position": position
    }
    return JSONResponse(content=response)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
