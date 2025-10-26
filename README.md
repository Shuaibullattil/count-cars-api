# count-cars

This repository contains a lightweight guide and documentation for the vehicle counting service used in this project.

This README focuses on the inference / API usage: how to run the counting service locally, what the API expects, and example requests you can use to integrate the service.

## Overview

The project uses a YOLOv8 model (your trained `best.pt`) for vehicle detection and a small tracking/counting pipeline that counts vehicles when they cross a user-specified counting line.

The REST API (FastAPI) endpoint accepts a video upload and two parameters:

- `orientation`: `horizontal` or `vertical` (which direction the counting line should be)
- `position`: integer 0–100 that places the line as a percentage across the frame (0 = top/left, 100 = bottom/right, 50 = centre)

Note: The API implementation is provided in `api.py` (place your `best.pt` in the same folder as the API before running).

## Detected vehicle classes

The model is trained to detect these 7 vehicle classes commonly seen on Indian roads:

- `autorickshaw`
- `bike`
- `bus`
- `car`
- `cycle`
- `heavy_vehicle`
- `truck`

## Terms

- video: The video file uploaded by the user for counting (mp4, mov, etc.). The API accepts the file via multipart/form-data.
- orientation: The counting line orientation; either `horizontal` (counts vehicles crossing a horizontal line) or `vertical` (counts vehicles crossing a vertical line).
- position: An integer 0–100 indicating where to place the counting line as a percentage of the frame.
  - For `horizontal` orientation: 0 means the top of the frame, 100 means the bottom.
  - For `vertical` orientation: 0 means the left edge of the frame, 100 means the right edge.

## Using the API (`api.py`)

The provided FastAPI app exposes a single endpoint:

- POST `/count`

Request fields (multipart/form-data):

- `video`: file — the uploaded video file
- `orientation`: string — `horizontal` or `vertical`
- `position`: integer — 0..100 (where to place the line as percentage)

Sample curl request:

```bash
curl -X POST "http://localhost:8000/count" \
	-F "video=@/path/to/your_video.mp4" \
	-F "orientation=horizontal" \
	-F "position=50"
```

Sample Python (requests) example:

```python
import requests

url = "http://localhost:8000/count"
files = {"video": open("/path/to/your_video.mp4", "rb")}
data = {"orientation": "vertical", "position": 50}

resp = requests.post(url, files=files, data=data)
print(resp.json())
```

API Response (JSON):

```json
{
  "total_vehicles": 12,
  "class_counts": {
    "car": 6,
    "bus": 2,
    "bike": 4
  },
  "orientation": "vertical",
  "position": 50
}
```

Notes:

- The API implementation uses CPU by default (`device="cpu"`). You may change the `device` argument in `api.py` to use a GPU if available (for example `device=0` or `device="cuda:0"`).
- The model file `best.pt` must be present in the same folder as `api.py` or update `MODEL_PATH` inside `traffic/api.py`.

## How to run the API locally

1. Install dependencies (from `requirements.txt`):

```powershell
pip install -r requirements.txt
```

2. Start the server (from project root or the `traffic` folder):

```powershell
uvicorn traffic.api:app --host 0.0.0.0 --port 8000
```

3. Use curl/requests (example above) to POST a video and parameters.

## Tips & Troubleshooting

- If counts are low for fast vehicles, try sending shorter videos or adjust tracking parameters (e.g., increase tolerance in `api.py` or the tracker settings).
- For production or higher throughput, deploy on a machine with GPU support and set the model `device` accordingly.
- If you only want to count one direction (e.g., left-to-right), modify the tracker logic in `traffic/inference.py` or `traffic/api.py` to only consider that crossing direction.

---
