
import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.schemas.patient import PatientProfileUpdate


logger = logging.getLogger(__name__)


def get_patient_by_user_id(
    db: Session,
    user_id: int,
) -> Patient:
    """Get the patient profile linked to a user."""

    patient = db.scalar(
        select(Patient).where(
            Patient.user_id == user_id
        )
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found",
        )

    return patient


def update_patient_profile(
    db: Session,
    patient: Patient,
    data: PatientProfileUpdate,
) -> Patient:
    """Update allowed patient profile fields."""

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(patient, field, value)

    try:
        db.commit()
        db.refresh(patient)

    except SQLAlchemyError:
        db.rollback()
        logger.exception("Patient profile update failed")

        raise HTTPException(
            status_code=500,
            detail="Unable to update patient profile",
        )

    return patient
