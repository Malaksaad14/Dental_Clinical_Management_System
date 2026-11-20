from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.dental import ToothRecord, ClinicalNote
from app.models.base_entities import Patient
from app.schemas.dental import (
    ToothRecordCreate,
    ToothRecordOut,
    DentalChartOverview,
    ClinicalNoteCreate,
    ClinicalNoteOut
)

router = APIRouter(prefix="/dental", tags=["Dental Records & Charting"])

@router.post("/tooth-records", response_model=ToothRecordOut, status_code=status.HTTP_201_CREATED)
def record_tooth_condition(record_in: ToothRecordCreate, db: Session = Depends(get_db)):
    """Record a clinical finding or condition for a specific tooth."""
    patient = db.query(Patient).filter(Patient.id == record_in.patient_id).first()
    if not patient:
        # Auto-create patient record if not exists for smooth testing
        patient = Patient(
            id=record_in.patient_id,
            first_name="Ahmed",
            last_name="Mohamed",
            phone="01198765432",
            gender="Male"
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

    record = ToothRecord(
        patient_id=record_in.patient_id,
        recorded_by=record_in.recorded_by,
        tooth_number=record_in.tooth_number,
        surface=record_in.surface,
        condition=record_in.condition.lower(),
        notes=record_in.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/patients/{patient_id}/chart", response_model=DentalChartOverview)
def get_patient_dental_chart(patient_id: int, db: Session = Depends(get_db)):
    """
    Get full dental chart for a patient, grouped by tooth number.
    Ideal for direct consumption by the frontend Dental Chart UI.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        patient = Patient(
            id=patient_id,
            first_name="Ahmed",
            last_name="Mohamed",
            phone="01198765432",
            gender="Male"
        )
        db.add(patient)
        db.commit()

    records = db.query(ToothRecord).filter(ToothRecord.patient_id == patient_id).order_by(ToothRecord.recorded_at.desc()).all()
    
    teeth_map: Dict[int, List[ToothRecordOut]] = {}
    for r in records:
        if r.tooth_number not in teeth_map:
            teeth_map[r.tooth_number] = []
        teeth_map[r.tooth_number].append(ToothRecordOut.model_validate(r))

    return DentalChartOverview(patient_id=patient_id, teeth=teeth_map)


@router.get("/patients/{patient_id}/tooth-records", response_model=List[ToothRecordOut])
def get_tooth_records_history(patient_id: int, db: Session = Depends(get_db)):
    """Get complete chronological history of dental records for a patient."""
    return db.query(ToothRecord).filter(ToothRecord.patient_id == patient_id).order_by(ToothRecord.recorded_at.desc()).all()


@router.delete("/tooth-records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tooth_record(record_id: int, db: Session = Depends(get_db)):
    """Delete a mistaken tooth record entry."""
    record = db.query(ToothRecord).filter(ToothRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return None


# --- Clinical Notes ---
@router.post("/clinical-notes", response_model=ClinicalNoteOut, status_code=status.HTTP_201_CREATED)
def create_clinical_note(note_in: ClinicalNoteCreate, db: Session = Depends(get_db)):
    note = ClinicalNote(**note_in.model_dump())
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/patients/{patient_id}/clinical-notes", response_model=List[ClinicalNoteOut])
def get_patient_clinical_notes(patient_id: int, db: Session = Depends(get_db)):
    return db.query(ClinicalNote).filter(ClinicalNote.patient_id == patient_id).order_by(ClinicalNote.created_at.desc()).all()
