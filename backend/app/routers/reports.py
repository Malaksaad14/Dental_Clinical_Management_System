"""Clinic reporting for the administrator workspace."""

from collections import Counter
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import allow_roles
from app.db.database import get_db
from app.models import Appointment, Patient, Payment, User

router = APIRouter(prefix="/reports", tags=["Reports"], dependencies=[Depends(allow_roles("admin"))])
CAIRO = ZoneInfo("Africa/Cairo")


class Summary(BaseModel):
    new_patients: int
    received: Decimal
    appointments: dict[str, int]
    completed_by_day: dict[date, int]


@router.get("/summary", response_model=Summary)
def report_summary(start: date, end: date, db: Session = Depends(get_db)) -> Summary:
    """Count registrations, appointment outcomes and receipts across inclusive clinic dates."""
    if end < start or start == date.min or end == date.max:
        raise HTTPException(422, "Choose a valid reporting period.")
    lower = datetime.combine(start, time.min, CAIRO).astimezone(timezone.utc)
    upper = datetime.combine(end + timedelta(days=1), time.min, CAIRO).astimezone(timezone.utc)

    patients = db.scalar(select(func.count(Patient.id)).join(User, User.id == Patient.user_id)
                         .where(User.created_at >= lower, User.created_at < upper, User.role == "patient"))
    # Billing stores paid_at as a timezone-naive UTC timestamp.
    received = db.scalar(select(func.sum(Payment.amount)).where(
        Payment.paid_at >= lower.replace(tzinfo=None), Payment.paid_at < upper.replace(tzinfo=None),
        Payment.status == "completed",
    ))
    counts = dict.fromkeys(("scheduled", "completed", "cancelled", "no_show"), 0)
    daily = Counter()
    rows = db.execute(select(Appointment.start_time, Appointment.status).where(
        Appointment.start_time >= lower, Appointment.start_time < upper
    ).order_by(Appointment.start_time))
    for timestamp, status in rows:
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        day = timestamp.astimezone(CAIRO).date()
        daily[day] += int(status == "completed")
        counts[status] = counts.get(status, 0) + 1
    return Summary(new_patients=patients, received=received or Decimal("0.00"),
                   appointments=counts, completed_by_day=dict(daily))
