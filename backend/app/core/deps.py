from datetime import datetime, timezone
from typing import Annotated, Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.database import get_db
from app.models import AuthSession, Staff, User

bearer_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def unauthorized() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session", headers={"WWW-Authenticate": "Bearer"})


def current_user(token: Annotated[str, Depends(bearer_scheme)], db: Annotated[Session, Depends(get_db)]) -> User:
    try:
        user_id, sid = decode_token(token, "access")
    except ValueError:
        raise unauthorized() from None
    user = db.get(User, user_id)
    session = db.get(AuthSession, sid)
    if (
        not user or not user.is_active or not session
        or session.user_id != user_id or session.revoked_at is not None
        or (session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at.tzinfo is None else session.expires_at) <= datetime.now(timezone.utc)
    ):
        raise unauthorized()
    return user


def allow_roles(*roles: str) -> Callable:
    def guard(user: Annotated[User, Depends(current_user)]) -> User:
        if user.role not in roles and user.role != "admin":
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return guard


def staff_type_guard(*types, patient=False):
    def guard(user: Annotated[User, Depends(current_user)], db: Annotated[Session, Depends(get_db)]):
        check_staff(db, user, *types, patient=patient)
        return user
    return guard


def check_staff(db, user, *types, patient=False):
    if user.role == "admin" or (patient and user.role == "patient"):
        return
    staff = db.query(Staff).filter_by(user_id=user.id).first()
    if user.role != "clinical_staff" or not staff or staff.staff_type not in types:
        raise HTTPException(403, "Insufficient staff permissions")


def clinical_access(user: Annotated[User, Depends(current_user)], db: Annotated[Session, Depends(get_db)]):
    check_staff(db, user, "dentist")
    return user


def clinical_read(patient_id: int, user: Annotated[User, Depends(current_user)], db: Annotated[Session, Depends(get_db)]):
    check_staff(db, user, "dentist", patient=True)
    if user.role == "patient" and own_patient_id(db, user) != patient_id:
        raise HTTPException(404, "Patient not found")
    return user


def clinical_author(db, user, requested=None):
    staff = db.query(Staff).filter_by(user_id=user.id, staff_type="dentist").first()
    if not staff and user.role == "admin" and requested:
        staff = db.query(Staff).filter_by(id=requested, staff_type="dentist").first()
    if not staff:
        raise HTTPException(422, "A valid dentist author is required")
    return staff.id


def own_patient_id(db: Session, user: User) -> int:
    from app.models import Patient
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient.id
