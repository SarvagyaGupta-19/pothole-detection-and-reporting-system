from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import hf_hub_download
from ultralytics import YOLO
from PIL import Image
import io
import uvicorn
import math

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    yield

app = FastAPI(title="Pothole Reporting System API", version="1.0.0", lifespan=lifespan)
# Allow Next.js frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows any frontend (Vercel, localhost)
    allow_credentials=False, # Must be False if origins is "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model
model = None
MODEL_CONFIDENCE_THRESHOLD = 0.10

def load_model():
    global model
    if model is None:
        print("Loading YOLO model from HuggingFace...")
        weights_path = hf_hub_download(
            repo_id="keremberke/yolov8n-pothole-segmentation",
            filename="best.pt"
        )
        model = YOLO(weights_path)
        print("Model loaded successfully!")



def calculate_severity(box_area, image_area):
    """
    Determine severity based on bounding box ratio to total image area.
    """
    ratio = box_area / image_area
    if ratio > 0.15:
        return "CRITICAL"
    elif ratio > 0.08:
        return "HIGH"
    elif ratio > 0.03:
        return "MEDIUM"
    else:
        return "LOW"

@app.get("/health")
def health_check():
    """Endpoint to check if the API is running and model is loaded."""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "threshold": MODEL_CONFIDENCE_THRESHOLD
    }

@app.post("/detect")
async def detect_potholes(file: UploadFile = File(...)):
    """
    Upload an image, run pothole detection, and return JSON results.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        # Read the uploaded image in memory
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Calculate total image area
        image_area = image.width * image.height
        
        # Run YOLO inference
        results = model.predict(source=image, conf=MODEL_CONFIDENCE_THRESHOLD, device="cpu")
        
        detections = []
        for r in results:
            if r.boxes is not None:
                for box in r.boxes:
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    width = x2 - x1
                    height = y2 - y1
                    box_area = width * height
                    
                    # Validate bounding box to prevent false positives from large close-up objects.
                    if box_area > (image_area * 0.80):
                        continue
                    
                    detections.append({
                        "confidence": round(conf, 4),
                        "severity": calculate_severity(box_area, image_area),
                        "bounding_box": {
                            "x1": round(x1, 1),
                            "y1": round(y1, 1),
                            "x2": round(x2, 1),
                            "y2": round(y2, 1),
                            "width": round(width, 1),
                            "height": round(height, 1)
                        }
                    })
        
        return {
            "success": True,
            "image_size": {"width": image.width, "height": image.height},
            "pothole_count": len(detections),
            "detections": detections
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting Pothole Reporting System API...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
