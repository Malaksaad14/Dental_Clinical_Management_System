from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import current_user
from app.core.schemas import TokenOut, UserOut
from app.core.security import verify_password
from app.core.sessions import (
    COOKIE_NAME, check_origin, clear_cookie, login_session, logout_session,
    refresh_session, set_cookie,
)
from app.db.database import get_db
from app.models import Staff, User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenOut)
def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    db: Annotated[Session, Depends(get_db)],
):
    user = db.scalar(select(User).where(User.email == form.username.strip().lower()))
    if not user or not user.is_active or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access, refresh = login_session(db, user)
    set_cookie(response, refresh)
    return TokenOut(access_token=access)


@router.post("/refresh", response_model=TokenOut)
def refresh(request: Request, response: Response, db: Annotated[Session, Depends(get_db)]):
    check_origin(request)
    old_refresh = request.cookies.get(COOKIE_NAME)
    if not old_refresh:
        raise HTTPException(status_code=401, detail="No active refresh session")
    access, new_refresh = refresh_session(db, old_refresh)
    set_cookie(response, new_refresh)
    return TokenOut(access_token=access)


@router.post("/logout")
def logout(request: Request, response: Response, db: Annotated[Session, Depends(get_db)]):
    check_origin(request)
    try:
        logout_session(db, request.cookies.get(COOKIE_NAME))
    finally:
        clear_cookie(response)
    return {"message": "Session revoked"}


@router.get("/me", response_model=UserOut)
def me(user: Annotated[User, Depends(current_user)], db: Annotated[Session, Depends(get_db)]):
    first_name = None
    last_name = None
    staff_type = None

    if user.role == "clinical_staff":
        staff = db.scalar(select(Staff).where(Staff.user_id == user.id))
        if staff:
            first_name = staff.first_name
            last_name = staff.last_name
            staff_type = staff.staff_type
    elif user.role == "patient":
        from app.models.patient import Patient
        patient = db.scalar(select(Patient).where(Patient.user_id == user.id))
        if patient:
            first_name = patient.first_name
            last_name = patient.last_name
    elif user.role == "admin":
        staff = db.scalar(select(Staff).where(Staff.user_id == user.id))
        if staff:
            first_name = staff.first_name
            last_name = staff.last_name
            staff_type = staff.staff_type

    return UserOut(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        staff_type=staff_type,
        first_name=first_name,
        last_name=last_name,
    )
