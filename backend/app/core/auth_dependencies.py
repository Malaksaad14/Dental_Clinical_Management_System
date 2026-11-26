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


def clinical_access(user: Annotated[User, Depends(current_user)], db: Annotated[Session, Depends(get_db)]) -> User:
    if user.role == "admin":
        return user
    staff = db.query(Staff).filter(Staff.user_id == user.id).first()
    if user.role != "clinical_staff" or not staff or staff.staff_type == "receptionist":
        raise HTTPException(status_code=403, detail="Clinical access required")
    return user


def own_patient_id(db: Session, user: User) -> int:
    from app.models import Patient
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient.id
