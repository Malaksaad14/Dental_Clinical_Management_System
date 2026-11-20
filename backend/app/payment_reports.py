from datetime import date
from decimal import Decimal

import psycopg
from fastapi import APIRouter
from psycopg.rows import dict_row
from pydantic import BaseModel


class PaymentSummary(BaseModel):
    date: date
    payment_count: int
    total_received: Decimal


router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/payments", response_model=list[PaymentSummary])
def get_payment_summary() -> list[PaymentSummary]:
    """Return the number and total value of payments received per day."""
    query = """
        SELECT paid_at::date AS date,
               COUNT(*) AS payment_count,
               SUM(amount) AS total_received
        FROM reports_demo.payments
        GROUP BY paid_at::date
        ORDER BY paid_at::date
    """
    with psycopg.connect(row_factory=dict_row, connect_timeout=5) as connection:
        rows = connection.execute(query).fetchall()
    return [PaymentSummary(**row) for row in rows]
