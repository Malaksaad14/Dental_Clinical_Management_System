
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth_dependencies import require_roles
from app.db.database import get_db
from app.models.user import User
from app.schemas.patient import (
    PatientProfileResponse,
    PatientProfileUpdate,
)
from app.services.patient_service import (
    get_patient_by_user_id,
    update_patient_profile,
)


router = APIRouter(
    prefix="/patients",
    tags=["Patient Profiles"],
)


@router.get(
    "/me",
    response_model=PatientProfileResponse,
)
def get_my_profile(
    current_user: Annotated[
        User,
        Depends(require_roles("patient")),
    ],
    db: Annotated[Session, Depends(get_db)],
):
    patient = get_patient_by_user_id(
        db=db,
        user_id=current_user.id,
    )

    return patient


@router.patch(
    "/me",
    response_model=PatientProfileResponse,
)
def update_my_profile(
    data: PatientProfileUpdate,
    current_user: Annotated[
        User,
        Depends(require_roles("patient")),
    ],
    db: Annotated[Session, Depends(get_db)],
):
    patient = get_patient_by_user_id(
        db=db,
        user_id=current_user.id,
    )

    return update_patient_profile(
        db=db,
        patient=patient,
        data=data,
    )
