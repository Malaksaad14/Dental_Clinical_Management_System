from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class PrescriptionItemBase(BaseModel):
    drug_name: str = Field(..., description="e.g. Amoxicillin 500mg")
    dosage: str = Field(..., description="e.g. 1 capsule")
    frequency: str = Field(..., description="e.g. 3 times a day after meals")
    duration: str = Field(..., description="e.g. 7 days")

class PrescriptionItemCreate(PrescriptionItemBase):
    pass

class PrescriptionItemOut(PrescriptionItemBase):
    id: int
    prescription_id: int

    class Config:
        from_attributes = True

class PrescriptionCreate(BaseModel):
    patient_id: int
    dentist_id: int
    appointment_id: Optional[int] = None
    notes: Optional[str] = None
    items: List[PrescriptionItemCreate]

class PrescriptionOut(BaseModel):
    id: int
    patient_id: int
    dentist_id: int
    appointment_id: Optional[int] = None
    issued_at: datetime
    notes: Optional[str] = None
    items: List[PrescriptionItemOut] = []

    class Config:
        from_attributes = True
