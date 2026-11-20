
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth import (
    PatientRegister,
    PatientRegisterResponse,
)
from app.services.auth_service import register_patient


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=PatientRegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: PatientRegister,
    db: Annotated[Session, Depends(get_db)],
):
    return register_patient(data, db)
