from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field

# --- Service Out minimal for plan display ---
class ServiceBrief(BaseModel):
    id: int
    code: str
    name: str
    price: Decimal

    class Config:
        from_attributes = True

# --- Plan Item ---
class TreatmentPlanItemBase(BaseModel):
    service_id: int
    tooth_number: Optional[int] = None
    status: str = Field(default="pending", description="pending | in_progress | completed | cancelled")
    planned_date: Optional[date] = None
    notes: Optional[str] = None

class TreatmentPlanItemCreate(TreatmentPlanItemBase):
    pass

class TreatmentPlanItemUpdate(BaseModel):
    status: Optional[str] = None
    planned_date: Optional[date] = None
    notes: Optional[str] = None

class TreatmentPlanItemOut(TreatmentPlanItemBase):
    id: int
    plan_id: int
    service: Optional[ServiceBrief] = None

    class Config:
        from_attributes = True

# --- Treatment Plan ---
class TreatmentPlanBase(BaseModel):
    title: str = Field(..., description="Name/headline for the treatment plan")
    status: str = Field(default="proposed", description="proposed | in_progress | completed | cancelled")
    start_date: Optional[date] = None
    notes: Optional[str] = None

class TreatmentPlanCreate(TreatmentPlanBase):
    patient_id: int
    dentist_id: int
    items: List[TreatmentPlanItemCreate] = []

class TreatmentPlanUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class TreatmentPlanOut(TreatmentPlanBase):
    id: int
    patient_id: int
    dentist_id: int
    created_at: datetime
    items: List[TreatmentPlanItemOut] = []

    class Config:
        from_attributes = True
