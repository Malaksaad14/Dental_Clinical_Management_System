
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.models.patient import Patient
from app.schemas.auth import (
    PatientRegister,
    PatientRegisterResponse,
)


def register_patient(
    data: PatientRegister,
    db: Session,
) -> PatientRegisterResponse:
    """Create a user account and its patient profile."""

    email = str(data.email).lower()

    # Check whether the email is already registered
    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    # Check whether the national ID is already registered
    if data.national_id:
        existing_patient = db.scalar(
            select(Patient).where(
                Patient.national_id == data.national_id
            )
        )

        if existing_patient:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="National ID is already registered",
            )

    # Hash the password before database storage
    hashed_password = hash_password(data.password)

    # Create the login account
    new_user = User(
        email=email,
        password_hash=hashed_password,
        role="patient",
        is_active=True,
    )

    try:
        db.add(new_user)

        # Flush generates the user ID without committing
        db.flush()

        # Create the patient profile linked to the user
        new_patient = Patient(
            user_id=new_user.id,
            first_name=data.first_name,
            last_name=data.last_name,
            date_of_birth=data.date_of_birth,
            gender=data.gender,
            phone=data.phone,
            address=data.address,
            national_id=data.national_id,
            emergency_contact=data.emergency_contact,
        )

        db.add(new_patient)

        # Commit both records in one transaction
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email or national ID is already registered",
        )

    db.refresh(new_user)
    db.refresh(new_patient)

    return PatientRegisterResponse(
        message="Patient registered successfully",
        user_id=new_user.id,
        patient_id=new_patient.id,
        email=new_user.email,
        role="patient",
    )
