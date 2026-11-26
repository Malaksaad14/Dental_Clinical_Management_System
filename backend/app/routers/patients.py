from app.core.deps import staff_type_guard, check_staff
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import allow_roles, current_user, own_patient_id
from app.core.schemas import PatientCreate, PatientOut, PatientUpdate
from app.core.security import hash_password
from app.db.database import get_db
from app.models import Patient, User

router = APIRouter(prefix="/patients", tags=["Patients"])


def to_out(patient: Patient, email: str) -> PatientOut:
    return PatientOut(
        id=patient.id, user_id=patient.user_id, email=email,
        first_name=patient.first_name, last_name=patient.last_name,
        date_of_birth=patient.date_of_birth, gender=patient.gender,
        phone=patient.phone, address=patient.address, national_id=patient.national_id,
        emergency_contact=patient.emergency_contact,
    )


@router.post("", status_code=201, response_model=PatientOut)
def create_patient(
    body: PatientCreate,
    user: Annotated[User, Depends(staff_type_guard("receptionist"))],
    db: Annotated[Session, Depends(get_db)],
):
    # Public registration is intentionally not available.
    email = str(body.email).strip().lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Email already registered")
    if body.national_id and db.scalar(select(Patient.id).where(Patient.national_id == body.national_id)):
        raise HTTPException(status_code=409, detail="National ID already registered")
    try:
        account = User(email=email, password_hash=hash_password(body.password), role="patient", is_active=True)
        db.add(account)
        db.flush()
        patient = Patient(user_id=account.id, **body.model_dump(exclude={"email", "password"}))
        db.add(patient)
        db.commit()
        return to_out(patient, account.email)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or national ID already exists") from None


@router.get("", response_model=list[PatientOut])
def list_patients(
    user: Annotated[User, Depends(staff_type_guard("receptionist", "dentist"))],
    db: Annotated[Session, Depends(get_db)],
):
    rows = db.execute(select(Patient, User.email).join(User, Patient.user_id == User.id).order_by(Patient.id)).all()
    return [to_out(patient, email) for patient, email in rows]


@router.get("/me", response_model=PatientOut)
def my_profile(
    user: Annotated[User, Depends(allow_roles("patient"))],
    db: Annotated[Session, Depends(get_db)],
):
    # Admin has no Patient profile; administration uses /patients/{id}.
    if user.role != "patient":
        raise HTTPException(status_code=400, detail="Use patient ID for administrative access")
    patient_id = own_patient_id(db, user)
    return to_out(db.get(Patient, patient_id), user.email)


@router.patch("/me", response_model=PatientOut)
def update_my_profile(
    changes: PatientUpdate,
    user: Annotated[User, Depends(allow_roles("patient"))],
    db: Annotated[Session, Depends(get_db)],
):
    if user.role != "patient":
        raise HTTPException(status_code=400, detail="Use patient ID for administrative access")
    patient = db.get(Patient, own_patient_id(db, user))
    for field, value in changes.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    return to_out(patient, user.email)


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: int,
    user: Annotated[User, Depends(staff_type_guard("receptionist", "dentist"))],
    db: Annotated[Session, Depends(get_db)],
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    account = db.get(User, patient.user_id)
    return to_out(patient, account.email)


@router.patch("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    changes: PatientUpdate,
    user: Annotated[User, Depends(staff_type_guard("receptionist"))],
    db: Annotated[Session, Depends(get_db)],
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    for field, value in changes.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    return to_out(patient, db.get(User, patient.user_id).email)
