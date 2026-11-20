from datetime import date

import psycopg
from fastapi import APIRouter
from psycopg.rows import dict_row
from pydantic import BaseModel


class AppointmentSummary(BaseModel):
    date: date
    completed: int
    cancelled: int
    scheduled: int
    no_show: int


router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/appointments", response_model=list[AppointmentSummary])
def get_appointment_summary() -> list[AppointmentSummary]:
    """Count appointments by day and status in the local demo database."""
    query = """
        SELECT start_time::date AS date,
               COUNT(*) FILTER (WHERE status = 'completed') AS completed,
               COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
               COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled,
               COUNT(*) FILTER (WHERE status = 'no_show') AS no_show
        FROM reports_demo.appointments
        GROUP BY start_time::date
        ORDER BY start_time::date
    """
    with psycopg.connect(row_factory=dict_row, connect_timeout=5) as connection:
        rows = connection.execute(query).fetchall()
    return [AppointmentSummary(**row) for row in rows]
