from app.core.deps import staff_type_guard, check_staff
from datetime import date
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.auth_dependencies import allow_roles, current_user, own_patient_id
from app.db.database import get_db
from app.models import Appointment, Invoice, Patient, Payment, TreatmentPlan, User
from app.schemas.billing import BillingSummary, InvoiceCreate, InvoiceOut, PaymentCreate
from app.services import billing_service as billing

router = APIRouter(prefix="/invoices", tags=["Billing"])

staff_only = staff_type_guard("receptionist")  # admins are always allowed by allow_roles
patient_only = allow_roles("patient")


def _load(db: Session, invoice_id: int) -> Optional[Invoice]:
    return (
        db.query(Invoice)
        .options(joinedload(Invoice.items), joinedload(Invoice.payments))
        .filter(Invoice.id == invoice_id)
        .first()
    )


def _visible_invoice(db: Session, user: User, invoice_id: int) -> Invoice:
    check_staff(db, user, "receptionist", patient=True)
    invoice = _load(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if user.role == "patient" and invoice.patient_id != own_patient_id(db, user):
        raise HTTPException(status_code=404, detail="Invoice not found")  # 404, so we don't reveal it exists
    return invoice


def _lock_invoice(db: Session, invoice_id: int) -> Invoice:
    """Lock the invoice row, then re-read it so status and payments are current.

    Without the reload, a request that waited for the lock could still be
    working with payments loaded before the lock was granted.
    """
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .with_for_update()
        .populate_existing()
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.refresh(invoice, ["payments"])
    return invoice


@router.post("", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db), user: User = Depends(staff_only)):
    if not db.get(Patient, data.patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    if data.treatment_plan_id:
        plan = db.get(TreatmentPlan, data.treatment_plan_id)
        if not plan or plan.patient_id != data.patient_id:
            raise HTTPException(status_code=400, detail="Treatment plan not found for this patient")
    if data.appointment_id:
        appt = db.get(Appointment, data.appointment_id)
        if not appt or appt.patient_id != data.patient_id:
            raise HTTPException(status_code=400, detail="Appointment not found for this patient")

    invoice = Invoice(
        invoice_number=billing.temp_invoice_number(),
        patient_id=data.patient_id,
        treatment_plan_id=data.treatment_plan_id,
        appointment_id=data.appointment_id,
        due_date=data.due_date,
        notes=data.notes,
        created_by=user.id,
    )
    for item_in in data.items:
        invoice.items.append(billing.build_item(db, item_in))
    billing.apply_totals(invoice, data.discount, data.tax_rate)

    db.add(invoice)
    db.flush()
    invoice.invoice_number = billing.final_invoice_number(invoice)
    db.commit()
    return _load(db, invoice.id)


@router.get("", response_model=List[InvoiceOut])
def list_invoices(
    patient_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(staff_only),
):
    q = db.query(Invoice).options(joinedload(Invoice.items), joinedload(Invoice.payments))
    if patient_id:
        q = q.filter(Invoice.patient_id == patient_id)
    if status_filter:
        q = q.filter(Invoice.status == status_filter)
    if date_from:
        q = q.filter(Invoice.issue_date >= date_from)
    if date_to:
        q = q.filter(Invoice.issue_date <= date_to)
    return q.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/me", response_model=List[InvoiceOut])
def my_invoices(db: Session = Depends(get_db), user: User = Depends(patient_only)):
    pid = own_patient_id(db, user)
    return (
        db.query(Invoice)
        .options(joinedload(Invoice.items), joinedload(Invoice.payments))
        .filter(Invoice.patient_id == pid)
        .order_by(Invoice.created_at.desc())
        .all()
    )


@router.get("/summary", response_model=BillingSummary)
def billing_summary(db: Session = Depends(get_db), user: User = Depends(staff_only)):
    """Read-only totals for the reporting module."""
    invoiced = db.query(func.coalesce(func.sum(Invoice.total), 0)).filter(Invoice.status != "cancelled").scalar()
    collected = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Invoice, Payment.invoice_id == Invoice.id)
        .filter(Payment.status == "completed", Invoice.status != "cancelled")
        .scalar()
    )
    count = db.query(func.count(Invoice.id)).filter(Invoice.status != "cancelled").scalar()
    return BillingSummary(
        total_invoiced=invoiced,
        total_collected=collected,
        total_outstanding=Decimal(invoiced) - Decimal(collected),
        invoice_count=count,
    )


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return _visible_invoice(db, user, invoice_id)


@router.post("/{invoice_id}/payments", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def pay_invoice(
    invoice_id: int,
    data: PaymentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(allow_roles("clinical_staff", "patient")),
):
    # Same visibility rule as reading; patients can only pay their own invoices.
    _visible_invoice(db, user, invoice_id)
    # Lock and re-read so two simultaneous payments can't overpay the invoice.
    invoice = _lock_invoice(db, invoice_id)
    billing.add_payment(invoice, data.amount, data.method, data.reference, user.id)
    db.commit()
    return _load(db, invoice_id)


@router.post("/{invoice_id}/cancel", response_model=InvoiceOut)
def cancel_invoice(invoice_id: int, db: Session = Depends(get_db), user: User = Depends(staff_only)):
    invoice = _lock_invoice(db, invoice_id)
    if invoice.amount_paid > 0:
        raise HTTPException(status_code=409, detail="Invoice has payments and cannot be cancelled")
    invoice.status = "cancelled"
    db.commit()
    return _load(db, invoice_id)