# Pothole Detection & Reporting System

**Developed by: Sarvagya Gupta**

A full-stack application designed to crowdsource road hazard reporting. The system uses an advanced YOLO computer vision model to automatically verify images of potholes, determine their severity, and route actionable reports (complete with GPS coordinates and visual bounding boxes) to the appropriate civic authorities.

##  Approach & Architecture

This project is built using a modern **Monorepo / Microservice Architecture**:

1. **Frontend (Next.js App Router):** A fully responsive, modern UI built with React, Tailwind CSS, and Leaflet maps for precise GPS location tagging. It includes a user dashboard to track the status of reported hazards.
2. **Backend API (Next.js & Prisma):** Serverless API routes handle user authentication, PostgreSQL database operations via Prisma ORM, and secure image uploads directly to an AWS S3 bucket.
3. **ML Microservice (Python FastAPI):** A dedicated, lightning-fast Python API that receives images, runs a YOLOv8 object detection model, and returns the pothole bounding box coordinates, confidence score, and calculated severity.
4. **Email Routing (Nodemailer):** Automated civic alerts are sent to the target authority via Gmail SMTP, embedding the analyzed image and a direct Google Maps link.

## Libraries & Technologies Used

### Web & Backend (Node.js)
* **Framework:** Next.js 15+ (App Router), React 19
* **Styling & UI:** Tailwind CSS, Lucide React, React Hot Toast
* **Database:** PostgreSQL, Prisma ORM
* **Auth & Cloud:** NextAuth.js, AWS SDK (S3)
* **Maps & EXIF:** React Leaflet, Exifr
* **Mail:** Nodemailer

### Machine Learning Service (Python)
* **API Framework:** FastAPI, Uvicorn
* **Computer Vision:** Ultralytics (YOLOv8), Pillow
* **Model Hosting:** HuggingFace Hub

---

## How to Run the Project Locally

### 1. Prerequisites
* **Node.js** (v20+)
* **Python** (3.10+)
* **PostgreSQL** database (local or cloud)
* **AWS S3** bucket (for image uploads)
* **Gmail Account** (with App Password enabled for SMTP)

### 2. Setup the Next.js Web App
Navigate to the `web/` directory and install dependencies:
```bash
cd web
npm install
```

Create a `.env` file in the `web/` folder with your credentials:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pothole_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret_key"

# AWS S3
AWS_REGION="your_aws_region"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_S3_BUCKET_NAME="your_bucket_name"

# Gmail SMTP
GMAIL_USER="your_email@gmail.com"
GMAIL_APP_PASSWORD="your_16_char_app_password"
```

Sync the database schema and start the frontend server:
```bash
npx prisma generate
npx prisma db push
npm run dev
```
*The web app will now be running on `http://localhost:3000`.*

### 3. Setup the ML Inference Service
Open a new terminal window, navigate to the ML service directory, and install the Python dependencies:
```bash
cd services/ml-inference
pip install fastapi uvicorn ultralytics pillow huggingface_hub
```

Start the FastAPI server:
```bash
python main.py
```
*The ML API will start on `http://127.0.0.1:8000`. The first time it runs, it will automatically download the YOLO weights from HuggingFace.*

---
