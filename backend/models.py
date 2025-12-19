from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class WorkFormat(str, Enum):
    REMOTE = "remote"
    HYBRID = "hybrid"
    OFFICE = "office"

class VacancyStage(str, Enum):
    NEW = "new"
    APPLIED = "applied"
    RESPONSE = "response"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    CLOSED = "closed"

class EventType(str, Enum):
    STATUS_CHANGE = "status_change"
    NOTE = "note"
    INTERVIEW = "interview"
    OFFER = "offer"

class VacancyBase(BaseModel):
    company: str
    position: str
    location: Optional[str] = None
    work_format: Optional[WorkFormat] = WorkFormat.REMOTE
    link: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = None
    source: Optional[str] = None
    contacts: Optional[str] = None
    notes: Optional[str] = None

class VacancyCreate(VacancyBase):
    pass

class Vacancy(VacancyBase):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:10])
    created_at: datetime = Field(default_factory=datetime.now)
    stage: VacancyStage = VacancyStage.NEW
    updated_at: datetime = Field(default_factory=datetime.now)

class EventBase(BaseModel):
    vacancy_id: str
    type: EventType
    comment: Optional[str] = None
    stage_from: Optional[VacancyStage] = None
    stage_to: Optional[VacancyStage] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:10])
    timestamp: datetime = Field(default_factory=datetime.now)
