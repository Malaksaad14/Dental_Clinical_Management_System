
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.auth_dependencies import (
    get_current_user,
    require_roles,
)
from app.core.security import create_access_token
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import (
    CurrentUserResponse,
    PatientRegister,
    PatientRegisterResponse,
    TokenResponse,
)
from app.services.auth_service import (
    authenticate_user,
    register_patient,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# Patient registration
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


# User login
@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    form_data: Annotated[
        OAuth2PasswordRequestForm,
        Depends(),
    ],
    db: Annotated[Session, Depends(get_db)],
):
    user = authenticate_user(
        db=db,
        email=form_data.username,
        password=form_data.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        user_id=user.id
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


# Current authenticated user
@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
def read_current_user(
    current_user: Annotated[
        User,
        Depends(get_current_user),
    ],
):
    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
    )


# Example of a role-protected endpoint
@router.get("/patient-area")
def patient_area(
    current_user: Annotated[
        User,
        Depends(require_roles("patient")),
    ],
):
    return {
        "message": "Welcome to the Patient Portal",
        "user_id": current_user.id,
    }
