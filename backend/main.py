from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response, FileResponse
from typing import List, Optional
import os
import uuid
from datetime import datetime

from .models import Vacancy, VacancyCreate, Event, EventCreate, VacancyStage, EventType
from . import storage, analytics

app = FastAPI(title="Job Search Monitor")

# Enable CORS (allow everything for simplicity in local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Ensure data files exist on startup."""
    storage.ensure_data_files()

# --- API Endpoints ---

@app.get("/api/vacancies", response_model=List[dict])
def get_vacancies():
    return storage.get_all_vacancies()

@app.post("/api/vacancies", response_model=dict)
def create_vacancy(vacancy_in: VacancyCreate):
    vacancy = Vacancy(**vacancy_in.model_dump())
    created = storage.create_vacancy(vacancy)
    event = Event(
        vacancy_id=vacancy.id,
        type=EventType.STATUS_CHANGE,
        stage_from=None,
        stage_to=VacancyStage.NEW,
        comment="Vacancy created"
    )
    storage.log_event(event)
    return created

@app.patch("/api/vacancies/{vacancy_id}/stage")
def update_stage(vacancy_id: str, stage: VacancyStage, comment: Optional[str] = None):
    current = storage.get_vacancy_by_id(vacancy_id)
    if not current:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    
    old_stage_str = current['stage']
    
    # Check if the stage is actually changing
    if old_stage_str == stage.value:
        return current # No changes needed, return existing data

    try:
        old_stage = VacancyStage(old_stage_str)
    except:
        old_stage = None

    updated = storage.update_vacancy_stage(vacancy_id, stage)
    if not updated:
        raise HTTPException(status_code=404, detail="Vacancy not found")
        
    event = Event(
        vacancy_id=vacancy_id,
        type=EventType.STATUS_CHANGE,
        stage_from=old_stage,
        stage_to=stage,
        comment=comment
    )
    storage.log_event(event)
    return updated

@app.get("/api/vacancies/{vacancy_id}/events", response_model=List[dict])
def get_vacancy_events(vacancy_id: str):
    return storage.get_events_for_vacancy(vacancy_id)

@app.delete("/api/vacancies/{vacancy_id}")
def delete_vacancy(vacancy_id: str):
    success = storage.delete_vacancy(vacancy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return {"status": "deleted"}

@app.put("/api/vacancies/{vacancy_id}", response_model=dict)
def update_vacancy(vacancy_id: str, vacancy_in: VacancyCreate):
    updated = storage.update_vacancy_details(vacancy_id, vacancy_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return updated

@app.get("/api/analytics/report")
def get_report(year: Optional[int] = None, month: Optional[int] = None):
    if not year or not month:
        now = datetime.now()
        year = now.year
        month = now.month
    try:
        return analytics.generate_monthly_report(year, month)
    except Exception as e:
        print(f"ENDPOINT ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/export")
def export_report(year: Optional[int] = None, month: Optional[int] = None):
    if not year or not month:
        now = datetime.now()
        year = now.year
        month = now.month
    csv_content = analytics.generate_csv_export(year, month)
    filename = f"job_search_report_{year}_{month:02d}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/analytics/detailed-report")
def get_detailed_report(year: Optional[int] = None, month: Optional[int] = None):
    if not year or not month:
        now = datetime.now()
        year = now.year
        month = now.month
    return analytics.get_monthly_vacancies_summary(year, month)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# --- Static File Serving (Frontend) ---

# Determine the absolute path to the frontend/dist directory
# We assume the backend folder is at root/backend, so we go up one level
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")

if os.path.exists(DIST_DIR):
    # Mount assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")
    
    # Catch-all route for SPA (Single Page Application)
    # This must be the last route defined!
    @app.get("/{catchall:path}")
    async def serve_react_app(catchall: str):
        # If a file exists in the specific path (like vite.svg), serve it
        file_path = os.path.join(DIST_DIR, catchall)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Otherwise, serve index.html for React Router to handle
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
else:
    print(f"WARNING: Frontend build directory not found at {DIST_DIR}. Serving only API.")
