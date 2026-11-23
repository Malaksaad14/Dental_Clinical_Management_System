from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import allow_roles, clinical_access, own_patient_id
from app.core.schemas import HistoryIn, HistoryOut, ToothIn, ToothOut
from app.db.database import get_db
from app.models import MedicalHistory, Patient, Staff, ToothRecord, User

router = APIRouter(prefix="/history", tags=["Medical & Dental History"])


def read_history(db: Session, patient_id: int) -> dict:
    if not db.get(Patient, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    history = db.scalar(select(MedicalHistory).where(MedicalHistory.patient_id == patient_id))
    teeth = db.scalars(select(ToothRecord).where(ToothRecord.patient_id == patient_id).order_by(ToothRecord.recorded_at.desc())).all()
    medical = HistoryOut.model_validate(history, from_attributes=True).model_dump(mode="json") if history else None
    return {"medical": medical, "tooth_records": [ToothOut.model_validate(t).model_dump(mode="json") for t in teeth]}


@router.get("/me")
def my_history(user: Annotated[User, Depends(allow_roles("patient"))], db: Annotated[Session, Depends(get_db)]):
    if user.role != "patient":
        raise HTTPException(status_code=400, detail="Admin uses /history/patients/{id}")
    return read_history(db, own_patient_id(db, user))


@router.get("/patients/{patient_id}")
def staff_history(patient_id: int, user: Annotated[User, Depends(clinical_access)], db: Annotated[Session, Depends(get_db)]):
    return read_history(db, patient_id)


@router.put("/patients/{patient_id}/medical", response_model=HistoryOut)
def write_medical(
    patient_id: int, body: HistoryIn,
    user: Annotated[User, Depends(clinical_access)],
    db: Annotated[Session, Depends(get_db)],
):
    if not db.get(Patient, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    record = db.scalar(select(MedicalHistory).where(MedicalHistory.patient_id == patient_id))
    if not record:
        record = MedicalHistory(patient_id=patient_id)
        db.add(record)
    for field, value in body.model_dump().items():
        setattr(record, field, value)
    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    return HistoryOut.model_validate(record, from_attributes=True)


@router.post("/patients/{patient_id}/teeth", response_model=ToothOut, status_code=201)
def write_tooth(
    patient_id: int, body: ToothIn,
    user: Annotated[User, Depends(clinical_access)],
    db: Annotated[Session, Depends(get_db)],
):
    if not db.get(Patient, patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    if user.role == "admin":
        if body.recorded_by is None:
            raise HTTPException(status_code=422, detail="Admin must select a clinical staff author")
        staff = db.get(Staff, body.recorded_by)
        if not staff or staff.staff_type == "receptionist":
            raise HTTPException(status_code=422, detail="A clinical staff author is required")
    else:
        staff = db.scalar(select(Staff).where(Staff.user_id == user.id))
    record = ToothRecord(patient_id=patient_id, recorded_by=staff.id, **body.model_dump(exclude={"recorded_by"}))
    db.add(record)
    db.commit()
    db.refresh(record)
    return ToothOut.model_validate(record)
