from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import io, json, uuid, os, asyncio, pickle
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="DataTwin ML Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── File-based session store (survives Render restarts) ──────────────────────
SESSIONS_DIR = "/tmp/datatwin_sessions"
os.makedirs(SESSIONS_DIR, exist_ok=True)

def save_session(session_id: str, df: pd.DataFrame):
    path = os.path.join(SESSIONS_DIR, f"{session_id}.pkl")
    with open(path, 'wb') as f:
        pickle.dump(df, f)

def load_session(session_id: str):
    path = os.path.join(SESSIONS_DIR, f"{session_id}.pkl")
    if not os.path.exists(path):
        return None
    with open(path, 'rb') as f:
        return pickle.load(f)

# ── Helpers ──────────────────────────────────────────────────────────────────

def read_uploaded_file(contents: bytes, filename: str) -> pd.DataFrame:
    ext = filename.rsplit('.', 1)[-1].lower()
    buf = io.BytesIO(contents)
    if ext == 'csv':
        for sep in [',', ';', '\t', '|']:
            try:
                df = pd.read_csv(buf, sep=sep)
                if df.shape[1] > 1:
                    return df
                buf.seek(0)
            except:
                buf.seek(0)
        return pd.read_csv(io.BytesIO(contents))
    elif ext in ['xlsx', 'xls']:
        return pd.read_excel(buf)
    elif ext == 'json':
        return pd.read_json(buf)
    else:
        raise ValueError(f"Unsupported file type: {ext}")

def df_to_preview(df: pd.DataFrame, filename: str, session_id: str) -> dict:
    df.columns = [str(c).strip() for c in df.columns]
    return {
        "session_id": session_id,
        "filename": filename,
        "shape": {"rows": int(df.shape[0]), "cols": int(df.shape[1])},
        "columns": [
            {
                "name": col,
                "dtype": str(df[col].dtype),
                "sample": [str(v) for v in df[col].dropna().head(3).tolist()]
            }
            for col in df.columns
        ],
        "head": df.head(5).fillna("").to_dict(orient='records')
    }

async def event_stream(df: pd.DataFrame, question: str, provider: str):
    from agent.orchestrator import AgentOrchestrator
    agent = AgentOrchestrator(df, question, provider)
    async for event in agent.run_stream():
        yield f"data: {json.dumps(event)}\n\n"
        await asyncio.sleep(0)
    yield 'data: {"type": "end"}\n\n'

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "running", "name": "DataTwin ML Service", "version": "2.0.0"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "python-ml"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(413, "File too large (max 50MB)")
    try:
        df = read_uploaded_file(contents, file.filename)
    except Exception as e:
        raise HTTPException(400, f"Could not read file: {e}")
    df.columns = [str(c).strip() for c in df.columns]
    session_id = str(uuid.uuid4())
    save_session(session_id, df)
    return df_to_preview(df, file.filename, session_id)

@app.get("/sample/{key}")
def load_sample(key: str):
    import numpy as np
    np.random.seed(42)

    if key == "sales":
        n = 500
        months = pd.date_range('2023-01-01', periods=12, freq='ME')
        df = pd.DataFrame({
            "date": [str(d)[:10] for d in np.random.choice(months, n)],
            "product": np.random.choice(['Laptop','Phone','Tablet','Watch','Headphones'], n),
            "region": np.random.choice(['North','South','East','West'], n),
            "sales_rep": np.random.choice([f'Rep_{i}' for i in range(1, 11)], n),
            "units_sold": np.random.randint(1, 50, n),
            "unit_price": np.random.choice([299, 499, 799, 1299, 1999], n),
            "discount_pct": np.random.choice([0, 5, 10, 15, 20], n),
            "customer_rating": np.round(np.random.uniform(2.5, 5.0, n), 1),
        })
        q3 = pd.to_datetime(df['date']).dt.month.isin([7, 8, 9])
        df.loc[q3, 'units_sold'] = (df.loc[q3, 'units_sold'] * 0.6).astype(int)
        df['revenue'] = df['units_sold'] * df['unit_price'] * (1 - df['discount_pct'] / 100)

    elif key == "students":
        n = 300
        df = pd.DataFrame({
            "student_id": range(1, n + 1),
            "study_hours_per_day": np.round(np.random.uniform(1, 8, n), 1),
            "attendance_pct": np.round(np.random.uniform(50, 100, n), 1),
            "sleep_hours": np.round(np.random.uniform(4, 9, n), 1),
            "extracurricular_hours": np.round(np.random.uniform(0, 4, n), 1),
            "math_score": np.random.randint(30, 100, n),
            "science_score": np.random.randint(30, 100, n),
            "english_score": np.random.randint(30, 100, n),
            "grade": np.random.choice(['A','B','C','D','F'], n, p=[0.2,0.3,0.3,0.15,0.05]),
        })
        df['math_score'] = (df['math_score'] + df['study_hours_per_day'] * 4).clip(0, 100).astype(int)
        df['science_score'] = (df['science_score'] + df['study_hours_per_day'] * 3).clip(0, 100).astype(int)
        df['avg_score'] = df[['math_score','science_score','english_score']].mean(axis=1).round(1)
    else:
        raise HTTPException(404, "Sample not found. Use 'sales' or 'students'.")

    session_id = str(uuid.uuid4())
    save_session(session_id, df)
    return df_to_preview(df, f"{key}_sample.csv", session_id)

@app.get("/analyze")
async def analyze(session_id: str, question: str, provider: str = "gemini"):
    df = load_session(session_id)
    if df is None:
        raise HTTPException(404, "Session not found. Please reload the dataset.")
    if provider not in ("claude", "openai", "gemini"):
        raise HTTPException(400, "provider must be 'claude', 'openai', or 'gemini'")
    return StreamingResponse(
        event_stream(df, question, provider),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

@app.delete("/session/{session_id}")
def delete_session(session_id: str):
    path = os.path.join(SESSIONS_DIR, f"{session_id}.pkl")
    if os.path.exists(path):
        os.remove(path)
    return {"deleted": session_id}
