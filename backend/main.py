from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from .models import Vacancy, VacancyCreate, Event, EventCreate, VacancyStage, EventType
from . import storage, analytics
import uuid
from datetime import datetime

app = FastAPI(title="Job Search Monitor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """
    Initializes the application by ensuring data files exist.
    """
    storage.ensure_data_files()

@app.get("/api/vacancies", response_model=List[dict])
def get_vacancies():
    """
    Retrieves a list of all vacancies.
    """
    return storage.get_all_vacancies()

@app.post("/api/vacancies", response_model=dict)
def create_vacancy(vacancy_in: VacancyCreate):
    """
    Creates a new vacancy and logs the creation event.

    Args:
        vacancy_in (VacancyCreate): The vacancy data to create.

    Returns:
        dict: The created vacancy record.
    """
    # Create the vacancy object
    vacancy = Vacancy(**vacancy_in.model_dump())
    created = storage.create_vacancy(vacancy)
    
    # Log the creation event
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
    """
    Updates the stage of a vacancy and logs the transition.

    Args:
        vacancy_id (str): The ID of the vacancy.
        stage (VacancyStage): The new stage to apply.
        comment (Optional[str]): An optional comment explaining the change.

    Returns:
        dict: The updated vacancy record.
    """
    # Get current vacancy to know previous stage
    current = storage.get_vacancy_by_id(vacancy_id)
    if not current:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    
    old_stage_str = current['stage']
    try:
        old_stage = VacancyStage(old_stage_str)
    except:
        old_stage = None # Should not happen if data is consistent

    # Update vacancy
    updated = storage.update_vacancy_stage(vacancy_id, stage)
    if not updated:
        raise HTTPException(status_code=404, detail="Vacancy not found")
        
    # Log event
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
    """
    Gets the history of events for a specific vacancy.
    """
    return storage.get_events_for_vacancy(vacancy_id)

@app.delete("/api/vacancies/{vacancy_id}")
def delete_vacancy(vacancy_id: str):
    """
    Deletes a vacancy.
    """
    success = storage.delete_vacancy(vacancy_id)
    if not success:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return {"status": "deleted"}

@app.put("/api/vacancies/{vacancy_id}", response_model=dict)
def update_vacancy(vacancy_id: str, vacancy_in: VacancyCreate):
    """
    Updates the details of a vacancy.
    """
    updated = storage.update_vacancy_details(vacancy_id, vacancy_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return updated

@app.get("/api/analytics/report")
def get_report(year: Optional[int] = None, month: Optional[int] = None):
    """
    Generates an analytics report for a specific period.
    Defaults to the current month if not specified.
    """
    if not year or not month:
        now = datetime.now()
        year = now.year
        month = now.month
    
    try:
        report = analytics.generate_monthly_report(year, month)
        return report
    except Exception as e:
        print(f"ENDPOINT ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import Response

@app.get("/api/analytics/export")
def export_report(year: Optional[int] = None, month: Optional[int] = None):
    """
    Exports the report as a CSV file.
    """
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
    """
    Returns a detailed summary of all vacancies active in a specific month for PDF generation.
    """
    if not year or not month:
        now = datetime.now()
        year = now.year
        month = now.month
    
    return analytics.get_monthly_vacancies_summary(year, month)

@app.get("/health")
def health_check():
    """
    Simple health check endpoint.
    """
    return {"status": "ok"}
