# 🕵️ DataTwin — Autonomous Data Analyst Agent

> An AI agent that autonomously analyzes any dataset — plans multi-step analysis, writes and runs code, generates charts, and delivers a full report. No hand-holding required.

**Live Demo:** [your-app.vercel.app](https://your-app.vercel.app)

---

## 🏗️ Architecture (3-Tier)

```
┌─────────────────────────────────────────────────────┐
│  React Frontend  (Vercel / localhost:3000)          │
│  Landing · Upload · Analyze · History · Export      │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP / SSE
┌───────────────────▼─────────────────────────────────┐
│  Spring Boot Gateway  (Render / localhost:8080)     │
│  CORS · Validation · File handling · SSE Proxy      │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP / SSE proxy
┌───────────────────▼─────────────────────────────────┐
│  FastAPI ML Microservice  (Render / localhost:8001) │
│  Gemini AI · Pandas · Matplotlib · ReAct Loop      │
└─────────────────────────────────────────────────────┘
```

## ✨ Features

| Feature | Description |
|---|---|
| 🏠 Landing Page | Animated hero with typewriter effect, floating orbs, architecture diagram |
| 📁 Data Profiling | Instant column stats, types, nulls, sample rows on upload |
| 🤖 Agentic AI | ReAct loop — plans, calls tools, self-corrects errors |
| 📊 Auto Charts | Matplotlib charts generated and streamed live |
| 💬 Follow-up Chat | Ask deeper questions after the report |
| 📁 Analysis History | All sessions saved to localStorage with timestamps |
| 📤 Export | Download full report as Markdown |
| ⚡ Live Streaming | Every agent reasoning step via SSE |
| 🔄 Multi-provider | Gemini, Claude, GPT-4 switchable in the UI |

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Lucide icons |
| API Gateway | Spring Boot 3.2, Java 17, Lombok |
| ML Microservice | FastAPI, Python 3, AsyncIO |
| AI | Gemini 3.1 Flash Lite (tool use / function calling) |
| Data | Pandas, NumPy, Matplotlib, SciPy |
| Streaming | Server-Sent Events (SSE) |
| Deploy | Vercel (frontend) + Render (backend x2) |

---

## 🚀 Run Locally

### Prerequisites
- Python 3.11+ and pip
- Java 17+ and Maven
- Node.js 18+

### Step 1 — Python ML Service (port 8001)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

pip install -r requirements.txt

cp .env.example .env
# Edit .env → add GEMINI_API_KEY=AIzaSy...

uvicorn main:app --reload --port 8001
```

### Step 2 — Spring Boot Gateway (port 8080)
```bash
cd springboot
./mvnw spring-boot:run
# First run downloads dependencies (~2 min)
```

### Step 3 — React Frontend (port 3000)
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** → Landing page → Upload or try a sample → Run Analysis

### Health checks
- Gateway: http://localhost:8080/api/health  (shows Python status too)
- Python:  http://localhost:8001/health
- API docs: http://localhost:8001/docs  (FastAPI auto-docs)

---

## 🚀 Deploy

### 1 — Push to GitHub
```bash
git init && git add . && git commit -m "DataTwin Agent v2"
git remote add origin https://github.com/YOUR_NAME/datatwin-agent.git
git push -u origin main
```

### 2 — Deploy Python ML Service on Render
- New Web Service → your repo → Root dir: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env: `GEMINI_API_KEY=your_key`
- Copy URL → e.g. `https://datatwin-ml.onrender.com`

### 3 — Deploy Spring Boot Gateway on Render
- New Web Service → your repo → Root dir: `springboot`
- Build: `./mvnw clean package -DskipTests`
- Start: `java -jar target/datatwin-gateway-2.0.0.jar`
- Env: `PYTHON_SERVICE_URL=https://datatwin-ml.onrender.com`
- Copy URL → e.g. `https://datatwin-gateway.onrender.com`

### 4 — Deploy Frontend on Vercel
- New Project → your repo → Root dir: `frontend`
- Env: `VITE_API_URL=https://datatwin-gateway.onrender.com/api`
- Deploy → live link ready ✅

---

## 📁 Project Structure

```
datatwin-agent/
├── backend/                     Python ML Microservice
│   ├── main.py                  FastAPI app + all routes
│   ├── agent/
│   │   ├── orchestrator.py      ReAct agent loop
│   │   └── tools.py             6 analysis tools
│   ├── sandbox/executor.py      Safe code runner
│   └── requirements.txt
│
├── springboot/                  Java API Gateway
│   ├── pom.xml
│   └── src/main/java/com/datatwin/
│       ├── DataTwinApplication.java
│       ├── controller/
│       │   ├── AnalysisController.java   All API routes
│       │   ├── HealthController.java
│       │   └── GlobalExceptionHandler.java
│       ├── service/
│       │   ├── PythonBridgeService.java  Calls Python
│       │   └── SseProxyService.java      SSE streaming proxy
│       ├── model/
│       │   ├── ApiResponse.java
│       │   └── UploadResponse.java
│       └── config/
│           ├── CorsConfig.java
│           └── AppConfig.java
│
└── frontend/                    React App
    └── src/
        ├── pages/
        │   ├── Landing.jsx      Animated landing
        │   ├── Upload.jsx       File upload + samples
        │   └── Analyze.jsx      Main agent interface
        └── components/
            ├── AgentLog.jsx     Live steps panel
            ├── Report.jsx       Report + follow-up chat
            └── DataProfile.jsx  Dataset stats
```

---

## 📝 Resume Description

> **DataTwin — Autonomous Data Analyst Agent** · Full-stack agentic AI system with 3-tier architecture. Built a custom ReAct (Reason + Act) agent loop in Python where the agent autonomously plans multi-step data analyses, executes Pandas/Matplotlib code via tool use, self-corrects on errors, and streams live reasoning to the UI via SSE. Spring Boot API gateway handles routing, CORS, file validation, and SSE proxying. Supports Gemini, Claude, and GPT-4 as switchable AI backends. Stack: React, Spring Boot 3 (Java 17), FastAPI, Gemini AI, SSE streaming. Deployed on Vercel + Render.
