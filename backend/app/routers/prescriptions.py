from app.core.deps import clinical_access, clinical_read, clinical_author
from app.models import User
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.prescription import Prescription, PrescriptionItem
from app.models.base_entities import Patient, Staff
from app.schemas.prescription import PrescriptionCreate, PrescriptionOut

class PrescriptionUpdate(BaseModel):
    notes: Optional[str] = None

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.post("", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(clinical_access)])
def create_prescription(rx_in: PrescriptionCreate, db: Session = Depends(get_db), user: User = Depends(clinical_access)):
    """Issue a new prescription with medications."""
    patient = db.query(Patient).filter(Patient.id == rx_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    final_dentist_id = clinical_author(db, user, rx_in.dentist_id)

    rx = Prescription(
        patient_id=rx_in.patient_id,
        dentist_id=final_dentist_id,
        appointment_id=rx_in.appointment_id,
        notes=rx_in.notes
    )
    db.add(rx)
    db.flush()

    for item_data in rx_in.items:
        rx_item = PrescriptionItem(
            prescription_id=rx.id,
            drug_name=item_data.drug_name,
            dosage=item_data.dosage,
            frequency=item_data.frequency,
            duration=item_data.duration
        )
        db.add(rx_item)

    db.commit()
    db.refresh(rx)
    return rx


@router.get("/patients/{patient_id}", response_model=List[PrescriptionOut], dependencies=[Depends(clinical_read)])
def get_patient_prescriptions(patient_id: int, db: Session = Depends(get_db)):
    """Get all prescriptions issued for a patient."""
    return db.query(Prescription).options(
        joinedload(Prescription.items)
    ).filter(Prescription.patient_id == patient_id).order_by(Prescription.issued_at.desc()).all()


@router.get("/{prescription_id}", response_model=PrescriptionOut, dependencies=[Depends(clinical_access)])
def get_prescription(prescription_id: int, db: Session = Depends(get_db)):
    rx = db.query(Prescription).options(
        joinedload(Prescription.items)
    ).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return rx


@router.patch("/{prescription_id}", response_model=PrescriptionOut, dependencies=[Depends(clinical_access)])
def update_prescription(prescription_id: int, rx_update: PrescriptionUpdate, db: Session = Depends(get_db)):
    """Update prescription notes."""
    rx = db.query(Prescription).options(joinedload(Prescription.items)).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if rx_update.notes is not None:
        rx.notes = rx_update.notes
    db.commit()
    db.refresh(rx)
    return rx


@router.delete("/{prescription_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(clinical_access)])
def delete_prescription(prescription_id: int, db: Session = Depends(get_db)):
    """Delete a prescription and its medication items."""
    rx = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    db.delete(rx)
    db.commit()
    return None
