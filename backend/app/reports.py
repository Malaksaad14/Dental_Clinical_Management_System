from .patient_reports import router as patient_router
from .payment_reports import router as payment_router
from .appointment_reports import router as appointment_router
from datetime import date

from fastapi import APIRouter, FastAPI
from pydantic import BaseModel


class DailyReport(BaseModel):
    date: date
    patients: int
    completed: int
    cancelled: int
    scheduled: int
    payments: int


router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/daily", response_model=list[DailyReport])
def get_daily_reports() -> list[DailyReport]:
    """Return sample daily totals for the reporting dashboard."""
    return [
        DailyReport(date=date(2026, 11, 1), patients=3, completed=5,
                    cancelled=1, scheduled=2, payments=1200),
        DailyReport(date=date(2026, 11, 10), patients=4, completed=6,
                    cancelled=0, scheduled=3, payments=1500),
        DailyReport(date=date(2026, 11, 20), patients=5, completed=7,
                    cancelled=2, scheduled=1, payments=1800),
    ]


app = FastAPI(title="DentaCare Reports")
app.include_router(router)

app.include_router(appointment_router)


app.include_router(payment_router)


app.include_router(patient_router)

