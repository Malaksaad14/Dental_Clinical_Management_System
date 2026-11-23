from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import allow_roles, current_user
from app.core.schemas import (
    AvailabilityIn, AvailabilityOut, ChairIn, ChairOut, DentistOut, ServiceIn, ServiceOut,
)
from app.db.database import get_db
from app.models import Chair, DentistAvailability, Service, Staff, User

router = APIRouter(prefix="/catalog", tags=["Clinic Setup"])


@router.get("/services", response_model=list[ServiceOut])
def list_services(user: Annotated[User, Depends(current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.scalars(select(Service).order_by(Service.name)).all()


@router.post("/services", response_model=ServiceOut, status_code=201)
def add_service(body: ServiceIn, admin: Annotated[User, Depends(allow_roles("admin"))], db: Annotated[Session, Depends(get_db)]):
    try:
        record = Service(**body.model_dump())
        db.add(record)
        db.commit()
        return record
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Service code already exists") from None


@router.get("/chairs", response_model=list[ChairOut])
def list_chairs(user: Annotated[User, Depends(current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.scalars(select(Chair).order_by(Chair.id)).all()


@router.post("/chairs", response_model=ChairOut, status_code=201)
def add_chair(body: ChairIn, admin: Annotated[User, Depends(allow_roles("admin"))], db: Annotated[Session, Depends(get_db)]):
    record = Chair(**body.model_dump(), is_active=True)
    db.add(record)
    db.commit()
    return record


@router.get("/dentists", response_model=list[DentistOut])
def dentists(user: Annotated[User, Depends(current_user)], db: Annotated[Session, Depends(get_db)]):
    records = db.execute(
        select(Staff).join(User, Staff.user_id == User.id)
        .where(Staff.staff_type == "dentist", User.is_active.is_(True))
        .order_by(Staff.first_name)
    ).scalars().all()
    return [DentistOut(id=s.id, name=f"{s.first_name} {s.last_name}") for s in records]


@router.get("/availability", response_model=list[AvailabilityOut])
def list_availability(user: Annotated[User, Depends(current_user)], db: Annotated[Session, Depends(get_db)]):
    return db.scalars(select(DentistAvailability).order_by(DentistAvailability.dentist_id, DentistAvailability.day_of_week)).all()


@router.post("/availability", response_model=AvailabilityOut, status_code=201)
def add_availability(
    body: AvailabilityIn,
    admin: Annotated[User, Depends(allow_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
):
    dentist = db.get(Staff, body.dentist_id)
    if not dentist or dentist.staff_type != "dentist" or not db.get(User, dentist.user_id).is_active:
        raise HTTPException(status_code=422, detail="Active dentist required")
    if body.end_time <= body.start_time:
        raise HTTPException(status_code=422, detail="End time must be after start time")
    record = DentistAvailability(**body.model_dump())
    db.add(record)
    db.commit()
    return record
