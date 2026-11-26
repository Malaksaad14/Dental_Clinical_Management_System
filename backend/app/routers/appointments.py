from app.core.deps import staff_type_guard, check_staff
from datetime import date, datetime, time, timedelta, timezone
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, select, text
from sqlalchemy.orm import Session

from app.core.deps import allow_roles, current_user, own_patient_id
from app.core.schemas import (
    AppointmentOut, AppointmentStatusIn, AvailabilityQueryOut,
    BookingIn, RescheduleIn, SlotOut, StaffBookingIn,
)
from app.db.database import get_db
from app.models import Appointment, Chair, DentistAvailability, Patient, Service, Staff, User

router = APIRouter(prefix="/appointments", tags=["Appointments"])
CAIRO = ZoneInfo("Africa/Cairo")
UTC = timezone.utc


def appointment_out(db: Session, ap: Appointment) -> AppointmentOut:
    dentist = db.get(Staff, ap.dentist_id)
    service = db.get(Service, ap.service_id)
    return AppointmentOut(
        id=ap.id, patient_id=ap.patient_id, dentist_id=ap.dentist_id,
        dentist_name=f"{dentist.first_name} {dentist.last_name}", chair_id=ap.chair_id,
        service_id=ap.service_id, service_name=service.name,
        start_time=ap.start_time, end_time=ap.end_time, status=ap.status, reason=ap.reason,
    )


def validate_slot(
    db: Session, patient_id: int, dentist_id: int, service_id: int,
    start_raw: datetime, exclude_id: int | None = None,
):
    """Shared validation for booking AND rescheduling.
    Returns (dentist, service, start_utc, end_utc, chair)."""
    if start_raw.tzinfo is None or start_raw.utcoffset() is None:
        raise HTTPException(status_code=422, detail="Appointment time must include timezone")
    start = start_raw.astimezone(UTC)
    if start <= datetime.now(UTC):
        raise HTTPException(status_code=422, detail="Appointment must be in the future")
    if start > datetime.now(UTC) + timedelta(days=180):
        raise HTTPException(status_code=422, detail="Book no more than 180 days ahead")

    if db.get_bind().dialect.name == "postgresql":
        db.execute(text("SELECT pg_advisory_xact_lock(8675309)"))

    patient = db.get(Patient, patient_id)
    dentist = db.get(Staff, dentist_id)
    service = db.get(Service, service_id)
    if not patient or not dentist or dentist.staff_type != "dentist" or not service:
        raise HTTPException(status_code=422, detail="Invalid patient, dentist or service")
    dentist_account = db.get(User, dentist.user_id)
    if not dentist_account or not dentist_account.is_active:
        raise HTTPException(status_code=422, detail="Dentist account is not active")

    end = start + timedelta(minutes=service.duration_minutes)
    local_start = start.astimezone(CAIRO)
    local_end = end.astimezone(CAIRO)
    if local_start.date() != local_end.date():
        raise HTTPException(status_code=422, detail="Appointment must fit within one working day")

    availabilities = db.scalars(select(DentistAvailability).where(
        DentistAvailability.dentist_id == dentist.id,
        DentistAvailability.day_of_week == local_start.weekday(),
    )).all()
    if not any(a.start_time <= local_start.time().replace(tzinfo=None)
               and local_end.time().replace(tzinfo=None) <= a.end_time for a in availabilities):
        raise HTTPException(status_code=409, detail="Dentist is unavailable at the selected time")

    query = select(Appointment).where(
        Appointment.status == "scheduled",
        Appointment.start_time < end,
        Appointment.end_time > start,
    )
    if exclude_id is not None:
        query = query.where(Appointment.id != exclude_id)
    busy = db.scalars(query).all()
    if any(a.dentist_id == dentist.id for a in busy):
        raise HTTPException(status_code=409, detail="Dentist already has an appointment")
    if any(a.patient_id == patient_id for a in busy):
        raise HTTPException(status_code=409, detail="Patient already has an appointment")
    busy_chairs = {a.chair_id for a in busy}
    chairs = db.scalars(select(Chair).where(Chair.is_active.is_(True)).order_by(Chair.id)).all()
    chair = next((c for c in chairs if c.id not in busy_chairs), None)
    if chair is None:
        raise HTTPException(status_code=409, detail="No chair available at this time")
    return dentist, service, start, end, chair


def schedule(db: Session, patient_id: int, data: BookingIn) -> AppointmentOut:
    dentist, service, start, end, chair = validate_slot(
        db, patient_id, data.dentist_id, data.service_id, data.start_time)
    ap = Appointment(patient_id=patient_id, dentist_id=dentist.id, chair_id=chair.id,
                     service_id=service.id, start_time=start, end_time=end,
                     status="scheduled", reason=data.reason)
    db.add(ap)
    db.commit()
    return appointment_out(db, ap)

@router.post("/me", response_model=AppointmentOut, status_code=201)
def patient_book(body: BookingIn, user: Annotated[User, Depends(allow_roles("patient"))], db: Annotated[Session, Depends(get_db)]):
    if user.role != "patient":
        raise HTTPException(status_code=400, detail="Admin/staff use POST /appointments")
    return schedule(db, own_patient_id(db, user), body)


@router.post("", response_model=AppointmentOut, status_code=201)
def staff_book(body: StaffBookingIn, user: Annotated[User, Depends(staff_type_guard("assistant"))], db: Annotated[Session, Depends(get_db)]):
    return schedule(db, body.patient_id, body)

@router.get("/me", response_model=list[AppointmentOut])
def my_appointments(
    user: Annotated[User, Depends(allow_roles("patient"))],
    db: Annotated[Session, Depends(get_db)],
    status: str | None = Query(None, pattern="^(scheduled|completed|cancelled|no_show)$"),
):
    if user.role != "patient":
        raise HTTPException(status_code=400, detail="Admin/staff use GET /appointments")
    patient_id = own_patient_id(db, user)
    q = select(Appointment).where(Appointment.patient_id == patient_id)
    if status:
        q = q.where(Appointment.status == status)
    appointments = db.scalars(q.order_by(Appointment.start_time.desc())).all()
    return [appointment_out(db, a) for a in appointments]



@router.get("", response_model=list[AppointmentOut])
def all_appointments(user: Annotated[User, Depends(staff_type_guard("dentist", "assistant"))], db: Annotated[Session, Depends(get_db)]):
    appointments = db.scalars(select(Appointment).order_by(Appointment.start_time.desc()).limit(300)).all()
    return [appointment_out(db, a) for a in appointments]

@router.get("/availability", response_model=AvailabilityQueryOut)
def available_slots(
    dentist_id: Annotated[int, Query(gt=0)],
    service_id: Annotated[int, Query(gt=0)],
    day: Annotated[date, Query(description="YYYY-MM-DD (clinic local date)")],
    user: Annotated[User, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    dentist = db.get(Staff, dentist_id)
    service = db.get(Service, service_id)
    if not dentist or dentist.staff_type != "dentist" or not service:
        raise HTTPException(status_code=422, detail="Invalid dentist or service")

    windows = db.scalars(select(DentistAvailability).where(
        DentistAvailability.dentist_id == dentist_id,
        DentistAvailability.day_of_week == day.weekday(),
    )).all()

    day_start = datetime.combine(day, time.min, tzinfo=CAIRO).astimezone(UTC)
    day_end = day_start + timedelta(days=1)
    booked = db.scalars(select(Appointment).where(
        Appointment.status == "scheduled",
        Appointment.dentist_id == dentist_id,
        Appointment.start_time < day_end,
        Appointment.end_time > day_start,
    )).all()

    def as_utc(dt: datetime) -> datetime:
        return dt.replace(tzinfo=UTC) if dt.tzinfo is None else dt.astimezone(UTC)

    duration = timedelta(minutes=service.duration_minutes)
    now = datetime.now(UTC)
    slots: list[SlotOut] = []
    for w in sorted(windows, key=lambda x: x.start_time):
        cursor = datetime.combine(day, w.start_time, tzinfo=CAIRO).astimezone(UTC)
        window_end = datetime.combine(day, w.end_time, tzinfo=CAIRO).astimezone(UTC)
        while cursor + duration <= window_end:
            slot_end = cursor + duration
            clash = any(as_utc(a.start_time) < slot_end and as_utc(a.end_time) > cursor for a in booked)
            if cursor > now and not clash:
                slots.append(SlotOut(start_time=cursor, end_time=slot_end))
            cursor += duration
    return AvailabilityQueryOut(dentist_id=dentist_id, service_id=service_id, day=day,
                                duration_minutes=service.duration_minutes, slots=slots)


@router.post("/{appointment_id}/cancel", response_model=AppointmentOut)
def cancel_mine(appointment_id: int, user: Annotated[User, Depends(current_user)], db: Annotated[Session, Depends(get_db)]):
    check_staff(db, user, "assistant", patient=True)
    ap = db.get(Appointment, appointment_id)
    if not ap:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if user.role == "patient" and ap.patient_id != own_patient_id(db, user):
        raise HTTPException(status_code=404, detail="Appointment not found")
    if ap.status != "scheduled" or (ap.start_time.replace(tzinfo=UTC) if ap.start_time.tzinfo is None else ap.start_time) <= datetime.now(UTC):
        raise HTTPException(status_code=409, detail="Only future scheduled appointments may be cancelled")
    ap.status = "cancelled"
    db.commit()
    return appointment_out(db, ap)


@router.patch("/{appointment_id}/status", response_model=AppointmentOut)
def update_status(
    appointment_id: int, body: AppointmentStatusIn,
    user: Annotated[User, Depends(staff_type_guard("dentist", "assistant"))],
    db: Annotated[Session, Depends(get_db)],
):
    ap = db.get(Appointment, appointment_id)
    if not ap:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if ap.status != "scheduled":
        raise HTTPException(status_code=409, detail="Only scheduled appointments may change status")
    if body.status == "scheduled":
        return appointment_out(db, ap)
    ap.status = body.status
    db.commit()
    return appointment_out(db, ap)


@router.patch("/{appointment_id}/reschedule", response_model=AppointmentOut)
def reschedule(
    appointment_id: int, body: RescheduleIn,
    user: Annotated[User, Depends(current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    check_staff(db, user, "assistant", patient=True)
    ap = db.get(Appointment, appointment_id)
    if not ap:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if user.role == "patient":
        if ap.patient_id != own_patient_id(db, user):
            raise HTTPException(status_code=404, detail="Appointment not found")
    elif user.role not in ("admin", "clinical_staff"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    old_start = ap.start_time.replace(tzinfo=UTC) if ap.start_time.tzinfo is None else ap.start_time
    if ap.status != "scheduled" or old_start <= datetime.now(UTC):
        raise HTTPException(status_code=409, detail="Only future scheduled appointments may be rescheduled")

    dentist, service, start, end, chair = validate_slot(
        db, ap.patient_id, body.dentist_id or ap.dentist_id, ap.service_id,
        body.start_time, exclude_id=ap.id)
    ap.dentist_id = dentist.id
    ap.chair_id = chair.id
    ap.start_time = start
    ap.end_time = end
    db.commit()
    return appointment_out(db, ap)


@router.get("/patient/{patient_id}", response_model=list[AppointmentOut])
def patient_history(
    patient_id: int,
    user: Annotated[User, Depends(staff_type_guard("dentist", "assistant"))],
    db: Annotated[Session, Depends(get_db)],
    status: str | None = Query(None, pattern="^(scheduled|completed|cancelled|no_show)$"),
):
    q = select(Appointment).where(Appointment.patient_id == patient_id)
    if status:
        q = q.where(Appointment.status == status)
    rows = db.scalars(q.order_by(Appointment.start_time.desc())).all()
    return [appointment_out(db, a) for a in rows]
