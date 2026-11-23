from datetime import datetime, timezone
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import allow_roles, current_user
from app.core.schemas import (
    AvailabilityIn, AvailabilityOut, ChairIn, ChairOut, DentistOut, ServiceIn, ServiceOut,
    WeeklyAvailabilityIn,
)
from app.db.database import get_db
from app.models import Appointment, Chair, DentistAvailability, Service, Staff, User

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


@router.put("/availability/weekly", response_model=list[AvailabilityOut])
def replace_weekly_availability(
    body: WeeklyAvailabilityIn,
    admin: Annotated[User, Depends(allow_roles("admin"))],
    db: Annotated[Session, Depends(get_db)],
):
    """Save multiple weekdays and separate clock hours for one dentist."""
    dentist = db.get(Staff, body.dentist_id)
    account = db.get(User, dentist.user_id) if dentist else None
    if not dentist or dentist.staff_type != "dentist" or not account or not account.is_active:
        raise HTTPException(status_code=422, detail="An active dentist is required")

    # Share the existing booking transaction lock to avoid a booking/schedule race.
    if db.get_bind().dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(8675309)"))

    # Do not allow an updated weekly timetable to invalidate future bookings.
    new_slots = {slot.day_of_week: slot for slot in body.days}
    now = datetime.now(timezone.utc)
    booked = db.scalars(select(Appointment).where(
        Appointment.dentist_id == body.dentist_id,
        Appointment.status == "scheduled",
        Appointment.start_time >= now,
    )).all()
    cairo = ZoneInfo("Africa/Cairo")
    for booking in booked:
        utc_start = booking.start_time.replace(tzinfo=timezone.utc) if booking.start_time.tzinfo is None else booking.start_time
        utc_end = booking.end_time.replace(tzinfo=timezone.utc) if booking.end_time.tzinfo is None else booking.end_time
        local_start = utc_start.astimezone(cairo)
        local_end = utc_end.astimezone(cairo)
        slot = new_slots.get(local_start.weekday())
        if (
            slot is None
            or local_start.date() != local_end.date()
            or local_start.time().replace(tzinfo=None) < slot.start_time
            or local_end.time().replace(tzinfo=None) > slot.end_time
        ):
            raise HTTPException(
                status_code=409,
                detail=f"Cannot change the timetable: future appointment #{booking.id} falls outside the new hours",
            )

    # Only this dentist's schedule changes; other dentists remain untouched.
    try:
        old_rows = db.scalars(select(DentistAvailability).where(
            DentistAvailability.dentist_id == body.dentist_id,
        )).all()
        for old_row in old_rows:
            db.delete(old_row)
        db.flush()

        created = []
        for slot in sorted(body.days, key=lambda item: item.day_of_week):
            row = DentistAvailability(
                dentist_id=body.dentist_id,
                day_of_week=slot.day_of_week,
                start_time=slot.start_time,
                end_time=slot.end_time,
            )
            db.add(row)
            created.append(row)
        db.commit()
        return created
    except Exception:
        db.rollback()
        raise
