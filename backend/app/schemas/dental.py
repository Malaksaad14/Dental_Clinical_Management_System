from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

# --- Tooth Records ---
class ToothRecordBase(BaseModel):
    tooth_number: int = Field(..., ge=1, le=52, description="Tooth number (e.g. 1-32 or 11-48)")
    surface: Optional[str] = Field(None, description="e.g. Occlusal, Mesial, Distal, Buccal, Lingual")
    condition: str = Field(..., description="healthy, caries, filled, missing, crown, root_canal, implant")
    notes: Optional[str] = None

class ToothRecordCreate(ToothRecordBase):
    patient_id: int
    recorded_by: Optional[int] = None

class ToothRecordUpdate(BaseModel):
    surface: Optional[str] = None
    condition: Optional[str] = None
    notes: Optional[str] = None

class ToothRecordOut(ToothRecordBase):
    id: int
    patient_id: int
    recorded_by: Optional[int] = None
    recorded_at: datetime

    class Config:
        from_attributes = True

# Aggregated view of a patient's mouth chart
class DentalChartOverview(BaseModel):
    patient_id: int
    teeth: Dict[int, List[ToothRecordOut]]  # map tooth_number to list of conditions/history


# --- Clinical Notes ---
class ClinicalNoteCreate(BaseModel):
    patient_id: int
    staff_id: int
    appointment_id: Optional[int] = None
    icd10_code_id: Optional[int] = None
    note: str

class ClinicalNoteOut(BaseModel):
    id: int
    patient_id: int
    staff_id: int
    appointment_id: Optional[int] = None
    icd10_code_id: Optional[int] = None
    note: str
    created_at: datetime

    class Config:
        from_attributes = True
