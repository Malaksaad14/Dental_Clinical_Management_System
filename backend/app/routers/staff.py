from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import allow_roles
from app.core.schemas import StaffCreate, StaffOut, UserOut
from app.core.security import hash_password
from app.db.database import get_db
from app.models import Staff, User

router = APIRouter(prefix="/admin", tags=["Admin"])


def staff_out(staff: Staff, account: User) -> StaffOut:
    return StaffOut(id=staff.id, user_id=staff.user_id, email=account.email, first_name=staff.first_name,
                    last_name=staff.last_name, staff_type=staff.staff_type, specialization=staff.specialization,
                    license_number=staff.license_number, phone=staff.phone, is_active=account.is_active)


@router.post("/staff", response_model=StaffOut, status_code=201)
def create_staff(
    body: StaffCreate,
    admin: Annotated[User, Depends(allow_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
):
    email = str(body.email).strip().lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Email already registered")
    try:
        account = User(email=email, password_hash=hash_password(body.password), role="clinical_staff", is_active=True)
        db.add(account)
        db.flush()
        staff = Staff(user_id=account.id, **body.model_dump(exclude={"email", "password"}))
        db.add(staff)
        db.commit()
        return staff_out(staff, account)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered") from None


@router.get("/staff", response_model=list[StaffOut])
def list_staff(admin: Annotated[User, Depends(allow_roles("admin"))], db: Annotated[Session, Depends(get_db)]):
    rows = db.execute(select(Staff, User).join(User, Staff.user_id == User.id).order_by(Staff.id)).all()
    return [staff_out(s, u) for s, u in rows]


@router.get("/users", response_model=list[UserOut])
def list_all_accounts(
    admin: Annotated[User, Depends(allow_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
):
    accounts = db.scalars(select(User).order_by(User.id)).all()
    result = []
    for account in accounts:
        staff = db.scalar(select(Staff).where(Staff.user_id == account.id)) if account.role == "clinical_staff" else None
        result.append(UserOut(
            id=account.id, email=account.email, role=account.role,
            is_active=account.is_active, staff_type=staff.staff_type if staff else None,
        ))
    return result


class ActiveUpdate(BaseModel):
    is_active: bool


@router.patch("/users/{user_id}/status", response_model=UserOut)
def set_user_status(
    user_id: int,
    data: ActiveUpdate,
    admin: Annotated[User, Depends(allow_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
):
    if user_id == admin.id and not data.is_active:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own admin account")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = data.is_active
    db.commit()
    staff = db.scalar(select(Staff).where(Staff.user_id == user.id)) if user.role == "clinical_staff" else None
    return UserOut(id=user.id, email=user.email, role=user.role, is_active=user.is_active,
                   staff_type=staff.staff_type if staff else None)
