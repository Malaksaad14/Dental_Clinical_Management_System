from datetime import date

import psycopg
from fastapi import APIRouter
from psycopg.rows import dict_row
from pydantic import BaseModel


class PatientRegistrationDay(BaseModel):
    date: date
    patients: int


router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/patients", response_model=list[PatientRegistrationDay])
def get_patient_registrations() -> list[PatientRegistrationDay]:
    """Count new patients by the date their account was created."""
    query = """
        SELECT u.created_at::date AS date, COUNT(*) AS patients
        FROM reports_demo.patients AS p
        JOIN reports_demo.users AS u ON u.id = p.user_id
        WHERE u.role = 'patient'
        GROUP BY u.created_at::date
        ORDER BY u.created_at::date
    """
    with psycopg.connect(row_factory=dict_row, connect_timeout=5) as connection:
        rows = connection.execute(query).fetchall()
    return [PatientRegistrationDay(**row) for row in rows]
