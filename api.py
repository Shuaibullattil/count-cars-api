from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import uvicorn
import tempfile
import os
import cv2
from ultralytics import YOLO
from collections import defaultdict
import threading
import uuid
import time
from typing import Dict, Any

app = FastAPI()

# Load model at startup
MODEL_PATH = "best.pt"
model = YOLO(MODEL_PATH)

# Job store to support background processing, progress reporting and cancellation
jobs: Dict[str, Dict[str, Any]] = {}
jobs_lock = threading.Lock()

def process_job(job_id: str, video_path: str, orientation: str, position: int):
    try:
        print(f"\nOpening video: {video_path}")
        cap = cv2.VideoCapture(video_path)
        
        # Get video properties with error checking
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        print(f"Video properties:")
        print(f"- Total frames: {total_frames}")
        print(f"- FPS: {fps}")
        print(f"- Resolution: {width}x{height}")
        
        # Calculate total duration
        total_duration = total_frames / fps if fps > 0 else 0
        print(f"- Total duration: {total_duration:.2f} seconds")
        # Calculate line position
        if orientation == "horizontal":
            line_pos = int(height * position / 100)
        else:
            line_pos = int(width * position / 100)

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
            # Check cancellation
            with jobs_lock:
                if jobs.get(job_id, {}).get("cancelled"):
                    jobs[job_id]["status"] = "cancelled"
                    break

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
            for track_id, track_info in list(tracked_vehicles.items()):
                last_box = track_info["boxes"][-1]
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
                    tracked_vehicles[track_id]["boxes"].append(current_boxes[best_detection_idx])
                    tracked_vehicles[track_id]["last_seen"] = frame_count
                    matched_detections.add(best_detection_idx)
            for i in range(len(current_boxes)):
                if i not in matched_detections:
                    tracked_vehicles[next_id] = {
                        "boxes": [current_boxes[i]],
                        "class_id": current_classes[i],
                        "last_seen": frame_count,
                    }
                    next_id += 1
            # Counting logic
            for track_id, track_info in tracked_vehicles.items():
                if track_id in counted_vehicles:
                    continue
                boxes = track_info["boxes"]
                class_id = track_info["class_id"]
                for j in range(1, len(boxes)):
                    prev_box = boxes[j - 1]
                    curr_box = boxes[j]
                    prev_center_x = (prev_box[0] + prev_box[2]) / 2
                    prev_center_y = (prev_box[1] + prev_box[3]) / 2
                    curr_center_x = (curr_box[0] + curr_box[2]) / 2
                    curr_center_y = (curr_box[1] + curr_box[3]) / 2
                    if orientation == "horizontal":
                        if ((prev_center_y < line_pos and curr_center_y >= line_pos) or (prev_center_y >= line_pos and curr_center_y < line_pos)):
                            counted_vehicles.add(track_id)
                            class_counts[class_id] += 1
                            total_count += 1
                            break
                    else:
                        if ((prev_center_x < line_pos and curr_center_x >= line_pos) or (prev_center_x >= line_pos and curr_center_x < line_pos)):
                            counted_vehicles.add(track_id)
                            class_counts[class_id] += 1
                            total_count += 1
                            break
            # Remove old tracks
            ids_to_remove = [track_id for track_id, track_info in tracked_vehicles.items() if frame_count - track_info["last_seen"] > 30]
            for track_id in ids_to_remove:
                del tracked_vehicles[track_id]

            # Update job progress and ensure it's a float
            with jobs_lock:
                job = jobs.get(job_id)
                if job is not None and total_frames > 0:  # Only update if we have valid total_frames
                    # Update frame counts
                    job["processed_frames"] = frame_count
                    job["total_frames"] = total_frames
                    job["fps"] = fps
                    
                    # Calculate progress and durations
                    progress = (frame_count / total_frames * 100)
                    processed_duration = frame_count / fps if fps > 0 else 0
                    
                    print(f"\nProgress update:")
                    print(f"- Frame: {frame_count}/{total_frames}")
                    print(f"- Progress: {progress:.1f}%")
                    print(f"- Processed duration: {processed_duration:.2f}s")
                    print(f"- Total duration: {total_duration:.2f}s")
                    
                    # Update job state
                    job["progress"] = float(progress)
                    job["processed_duration"] = float(processed_duration)
                    job["total_duration"] = float(total_duration)
                    
                    # map class ids to names for snapshot
                    class_names = model.names
                    job["total_vehicles"] = total_count
                    job["class_counts"] = {class_names[cid]: cnt for cid, cnt in class_counts.items()}

        cap.release()
        # finalize
        with jobs_lock:
            job = jobs.get(job_id)
            if job is not None and job.get("status") != "cancelled":
                job["status"] = "done"
                job["progress"] = 100
                job["total_vehicles"] = total_count
                class_names = model.names
                job["class_counts"] = {class_names[cid]: cnt for cid, cnt in class_counts.items()}
        try:
            os.remove(video_path)
        except Exception:
            pass
    except Exception as e:
        with jobs_lock:
            if job_id in jobs:
                jobs[job_id]["status"] = "error"
                jobs[job_id]["error"] = str(e)


@app.post("/count")
async def start_count_job(
    video: UploadFile = File(...),
    orientation: str = Form(...),  # 'horizontal' or 'vertical'
    position: int = Form(...),     # 0-100
):
    # Save uploaded video to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
        tmp.write(await video.read())
        video_path = tmp.name

    job_id = str(uuid.uuid4())
    with jobs_lock:
            # Get initial video info
            print(f"\nInitializing job {job_id}")
            cap = cv2.VideoCapture(video_path)
            
            # Get video properties
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            if fps == 0:  # Fallback if FPS detection fails
                fps = 30
                print("Warning: Could not detect FPS, using default of 30")
            
            total_duration = total_frames / fps if fps > 0 else 0
            
            print(f"Initial video info:")
            print(f"- Total frames: {total_frames}")
            print(f"- FPS: {fps}")
            print(f"- Total duration: {total_duration:.2f}s")
            
            cap.release()
            
            jobs[job_id] = {
                "status": "processing",
                "progress": 0.0,
                "processed_frames": 0,
                "total_frames": total_frames,
                "total_vehicles": 0,
                "class_counts": {},
                "cancelled": False,
                "fps": fps,
                "processed_duration": 0.0,
                "total_duration": float(total_duration),
            }    # Start background thread
    thread = threading.Thread(target=process_job, args=(job_id, video_path, orientation, position), daemon=True)
    thread.start()

    return JSONResponse(content={"job_id": job_id})


@app.get("/count/status/{job_id}")
async def get_job_status(job_id: str):
    with jobs_lock:
        job = jobs.get(job_id)
        if not job:
            return JSONResponse(content={"error": "job not found"}, status_code=404)
        
        # Get fps and frame counts
        processed_frames = job.get("processed_frames", 0)
        total_frames = job.get("total_frames", 0)
        fps = job.get("fps", 30)  # default to 30fps if not set
        
        # Calculate durations
        processed_duration = float(processed_frames) / float(fps) if fps > 0 and processed_frames > 0 else 0
        total_duration = float(total_frames) / float(fps) if fps > 0 and total_frames > 0 else 0
        
        # Update job with calculated durations (ensure they're floats)
        job["processed_duration"] = float(processed_duration)
        job["total_duration"] = float(total_duration)
        
        print(f"Debug - Frames: {processed_frames}/{total_frames}, FPS: {fps}, Durations: {processed_duration}/{total_duration}")
        
        # return response with all data
        return JSONResponse(content={
            "status": job.get("status", "error"),
            "progress": float(job.get("progress", 0)),  # Ensure progress is always a float
            "processed_frames": processed_frames,
            "total_frames": total_frames,
            "total_vehicles": job.get("total_vehicles", 0),
            "class_counts": job.get("class_counts", {}),
            "error": job.get("error"),
            "processed_duration": processed_duration,
            "total_duration": total_duration,
            "fps": fps
        })


@app.post("/count/cancel/{job_id}")
async def cancel_job(job_id: str):
    with jobs_lock:
        job = jobs.get(job_id)
        if not job:
            return JSONResponse(content={"error": "job not found"}, status_code=404)
        job["cancelled"] = True
        job["status"] = "cancelling"
        # return current snapshot
        return JSONResponse(content={
            "status": job.get("status"),
            "progress": job.get("progress"),
            "processed_frames": job.get("processed_frames"),
            "total_frames": job.get("total_frames"),
            "total_vehicles": job.get("total_vehicles"),
            "class_counts": job.get("class_counts"),
        })

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
