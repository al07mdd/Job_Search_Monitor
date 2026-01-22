import pandas as pd
import os
from typing import List, Optional
from .models import Vacancy, Event, VacancyStage, VacancyCreate

DATA_DIR = "data"
VACANCIES_FILE = os.path.join(DATA_DIR, "vacancies.csv")
EVENTS_FILE = os.path.join(DATA_DIR, "events.csv")

VACANCY_HEADERS = [
    "id", "created_at", "company", "position", "location", "work_format", 
    "link", "salary_min", "salary_max", "currency", "source", 
    "contacts", "stage", "notes", "updated_at"
]

EVENT_HEADERS = [
    "id", "vacancy_id", "timestamp", "type", "stage_from", "stage_to", "comment"
]

def ensure_data_files() -> None:
    """
    Checks if the data directory and CSV files exist.
    If not, creates them with the required headers.
    """
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    
    if not os.path.exists(VACANCIES_FILE):
        df = pd.DataFrame(columns=VACANCY_HEADERS)
        df.to_csv(VACANCIES_FILE, index=False)
        
    if not os.path.exists(EVENTS_FILE):
        df = pd.DataFrame(columns=EVENT_HEADERS)
        df.to_csv(EVENTS_FILE, index=False)

def get_all_vacancies() -> List[dict]:
    """
    Reads all vacancies from the CSV file.
    
    Returns:
        List[dict]: A list of all vacancies as dictionaries.
    """
    ensure_data_files()
    try:
        df = pd.read_csv(VACANCIES_FILE)
        return df.to_dict('records')
    except Exception as e:
        print(f"Error reading vacancies: {e}")
        return []

def get_vacancy_by_id(vacancy_id: str) -> Optional[dict]:
    """
    Retrieves a single vacancy by its ID.
    
    Args:
        vacancy_id (str): The unique identifier of the vacancy.
        
    Returns:
        Optional[dict]: The vacancy data if found, otherwise None.
    """
    ensure_data_files()
    try:
        df = pd.read_csv(VACANCIES_FILE)
        vacancy = df[df['id'] == vacancy_id]
        if vacancy.empty:
            return None
        return vacancy.iloc[0].to_dict()
    except Exception:
        return None

def create_vacancy(vacancy: Vacancy) -> dict:
    """
    Saves a new vacancy to the CSV file.
    
    Args:
        vacancy (Vacancy): The vacancy object to save.
        
    Returns:
        dict: The created vacancy data.
    """
    ensure_data_files()
    df = pd.read_csv(VACANCIES_FILE)
    new_data = vacancy.model_dump()
    # Convert datetimes to strings for CSV
    new_data['created_at'] = new_data['created_at'].isoformat()
    new_data['updated_at'] = new_data['updated_at'].isoformat()
    # Enum handling
    new_data['work_format'] = new_data['work_format'].value if new_data['work_format'] else None
    new_data['stage'] = new_data['stage'].value
    
    new_row = pd.DataFrame([new_data])
    df = pd.concat([df, new_row], ignore_index=True)
    df.to_csv(VACANCIES_FILE, index=False)
    return new_data

def update_vacancy_stage(vacancy_id: str, new_stage: VacancyStage) -> Optional[dict]:
    """
    Updates the stage of an existing vacancy.
    
    Args:
        vacancy_id (str): The ID of the vacancy to update.
        new_stage (VacancyStage): The new stage to set.
        
    Returns:
        Optional[dict]: The updated vacancy data if successful, otherwise None.
    """
    ensure_data_files()
    df = pd.read_csv(VACANCIES_FILE)
    if vacancy_id not in df['id'].values:
        return None
    
    idx = df[df['id'] == vacancy_id].index[0]
    df.at[idx, 'stage'] = new_stage.value
    df.at[idx, 'updated_at'] = pd.Timestamp.now().isoformat()
    
    df.to_csv(VACANCIES_FILE, index=False)
    return df.iloc[idx].to_dict()

def log_event(event: Event) -> dict:
    """
    Logs a new event (e.g., status change) to the CSV file.
    
    Args:
        event (Event): The event object to save.
        
    Returns:
        dict: The saved event data.
    """
    ensure_data_files()
    df = pd.read_csv(EVENTS_FILE)
    new_data = event.model_dump()
    new_data['timestamp'] = new_data['timestamp'].isoformat()
    
    # Enum handling
    new_data['type'] = new_data['type'].value
    new_data['stage_from'] = new_data['stage_from'].value if new_data['stage_from'] else None
    new_data['stage_to'] = new_data['stage_to'].value if new_data['stage_to'] else None
    
    new_row = pd.DataFrame([new_data])
    df = pd.concat([df, new_row], ignore_index=True)
    df.to_csv(EVENTS_FILE, index=False)
    return new_data

def get_events_for_vacancy(vacancy_id: str) -> List[dict]:
    """
    Retrieves all history events for a specific vacancy.
    
    Args:
        vacancy_id (str): The ID of the vacancy.
        
    Returns:
        List[dict]: A list of event records.
    """
    ensure_data_files()
    try:
        df = pd.read_csv(EVENTS_FILE)
        events = df[df['vacancy_id'] == vacancy_id]
        return events.to_dict('records')
    except Exception:
        return []

def has_event_for_stage(vacancy_id: str, stage: VacancyStage) -> bool:
    """Checks if there is already a status_change event to this stage for this vacancy."""
    ensure_data_files()
    try:
        df = pd.read_csv(EVENTS_FILE)
        # Check if any row has matching vacancy_id AND stage_to == stage.value
        exists = not df[(df['vacancy_id'] == vacancy_id) & (df['stage_to'] == stage.value)].empty
        return exists
    except Exception:
        return False

def delete_vacancy(vacancy_id: str) -> bool:
    """
    Deletes a vacancy and its associated events.
    
    Args:
        vacancy_id (str): The ID of the vacancy to delete.
        
    Returns:
        bool: True if deleted, False if not found.
    """
    ensure_data_files()
    df = pd.read_csv(VACANCIES_FILE)
    if vacancy_id not in df['id'].values:
        return False
        
    # Delete vacancy
    df = df[df['id'] != vacancy_id]
    df.to_csv(VACANCIES_FILE, index=False)
    
    # Delete associated events
    events_df = pd.read_csv(EVENTS_FILE)
    events_df = events_df[events_df['vacancy_id'] != vacancy_id]
    events_df.to_csv(EVENTS_FILE, index=False)
    
    return True

def update_vacancy_details(vacancy_id: str, updates: VacancyCreate) -> Optional[dict]:
    """
    Updates the details of an existing vacancy.
    
    Args:
        vacancy_id (str): The ID of the vacancy to update.
        updates (VacancyCreate): The new data options.
        
    Returns:
        Optional[dict]: The updated vacancy data if successful, otherwise None.
    """
    ensure_data_files()
    df = pd.read_csv(VACANCIES_FILE)
    if vacancy_id not in df['id'].values:
        return None
    
    idx = df[df['id'] == vacancy_id].index[0]
    
    update_data = updates.model_dump(exclude_unset=True)
    if 'work_format' in update_data:
        update_data['work_format'] = update_data['work_format'].value if update_data['work_format'] else None
        
    for key, value in update_data.items():
        if key in df.columns:
             df.at[idx, key] = value
             
    df.at[idx, 'updated_at'] = pd.Timestamp.now().isoformat()
    df.to_csv(VACANCIES_FILE, index=False)
    
    return df.iloc[idx].to_dict()
