"""Run the integrated Phase 1 demo on a dedicated local PostgreSQL database."""
import getpass
import os
from pathlib import Path
import secrets

import psycopg
from alembic import command
from alembic.config import Config


def main():
    os.chdir(Path(__file__).resolve().parent)
    database = "dentacare_phase1_demo"
    user = os.environ.get("PGUSER", "postgres")
    port = os.environ.get("PGPORT", "5432")
    password = os.environ.get("PGPASSWORD") or getpass.getpass(f"PostgreSQL password for {user}: ")
    with psycopg.connect(host="127.0.0.1", port=port, dbname="postgres",
                         user=user, password=password, autocommit=True, connect_timeout=5) as conn:
        if not conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", (database,)).fetchone():
            conn.execute("CREATE DATABASE dentacare_phase1_demo")

    from sqlalchemy import URL
    url = URL.create("postgresql+psycopg", username=user, password=password,
                     host="127.0.0.1", port=int(port), database=database)
    os.environ["DATABASE_URL"] = url.render_as_string(hide_password=False)
    # A new demo process starts a new sign-in session.
    os.environ.setdefault("JWT_SECRET_KEY", secrets.token_urlsafe(48))
    os.environ.update(OTEL_SDK_DISABLED="true", FASTAPI_OTEL_AUTO_CONFIGURE="false")
    command.upgrade(Config("alembic.ini"), "head")
    from seed import seed
    seed()
    seed_example()
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000)


def seed_example():
    from datetime import datetime, timedelta
    from decimal import Decimal
    from zoneinfo import ZoneInfo
    from sqlalchemy import select
    from app.db.database import SessionLocal
    from app.models import Appointment, Chair, Invoice, Patient, Service, Staff, User
    from app.schemas.billing import InvoiceItemCreate
    from app.services import billing_service as billing

    with SessionLocal.begin() as db:
        marker = "Phase 1 demonstration"
        if db.scalar(select(Invoice.id).where(Invoice.notes == marker).limit(1)):
            return
        patient = db.scalars(select(Patient).join(User).where(User.email == "patient@dentacare.com")).first()
        dentist = db.scalars(select(Staff).join(User).where(User.email == "dentist@dentacare.com")).first()
        service = db.scalar(select(Service).where(Service.code == "D2391"))
        chair = db.scalars(select(Chair).order_by(Chair.id)).first()
        if not all((patient, dentist, service, chair)):
            return
        now = datetime.now(ZoneInfo("Africa/Cairo"))
        ap = Appointment(patient_id=patient.id, dentist_id=dentist.id, chair_id=chair.id,
                         service_id=service.id, start_time=now - timedelta(minutes=50),
                         end_time=now - timedelta(minutes=5), status="completed", reason=marker)
        db.add(ap)
        db.flush()
        inv = Invoice(invoice_number=billing.temp_invoice_number(), patient_id=patient.id,
                      appointment_id=ap.id, notes=marker)
        inv.items.append(billing.build_item(db, InvoiceItemCreate(service_id=service.id)))
        billing.apply_totals(inv, Decimal("0"), Decimal("0"))
        db.add(inv)
        db.flush()
        inv.invoice_number = billing.final_invoice_number(inv)
        billing.add_payment(inv, Decimal("50.50"), "cash", None, dentist.user_id)


if __name__ == "__main__":
    main()
