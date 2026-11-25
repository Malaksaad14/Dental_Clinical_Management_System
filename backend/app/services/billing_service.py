from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Invoice, InvoiceItem, Payment, Service

TWO_PLACES = Decimal("0.01")


def money(value) -> Decimal:
    return Decimal(value).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def temp_invoice_number() -> str:
    return f"TMP-{uuid4().hex[:20]}"


def final_invoice_number(invoice: Invoice) -> str:
    return f"INV-{invoice.issue_date.year}-{invoice.id:05d}"


def build_item(db: Session, item_in) -> InvoiceItem:
    """Prices come from the services table whenever a service is chosen."""
    if item_in.service_id is not None:
        service = db.get(Service, item_in.service_id)
        if not service:
            raise HTTPException(status_code=400, detail=f"Service ID {item_in.service_id} does not exist")
        description = item_in.description or service.name
        unit_price = money(service.price)
    else:
        description = item_in.description
        unit_price = money(item_in.unit_price)

    return InvoiceItem(
        service_id=item_in.service_id,
        description=description,
        tooth_number=item_in.tooth_number,
        icd10_code=item_in.icd10_code,
        quantity=item_in.quantity,
        unit_price=unit_price,
        line_total=money(unit_price * item_in.quantity),
    )


def apply_totals(invoice: Invoice, discount: Decimal, tax_rate: Decimal) -> None:
    subtotal = sum((i.line_total for i in invoice.items), Decimal("0"))
    discount = money(discount)
    if discount > subtotal:
        raise HTTPException(status_code=400, detail="Discount cannot exceed the subtotal")
    taxable = subtotal - discount
    tax = money(taxable * tax_rate / Decimal("100"))
    invoice.subtotal = money(subtotal)
    invoice.discount = discount
    invoice.tax_rate = tax_rate
    invoice.tax = tax
    invoice.total = money(taxable + tax)


def refresh_status(invoice: Invoice) -> None:
    if invoice.status == "cancelled":
        return
    paid = invoice.amount_paid
    if paid <= 0:
        invoice.status = "unpaid"
    elif paid < invoice.total:
        invoice.status = "partially_paid"
    else:
        invoice.status = "paid"


def add_payment(invoice: Invoice, amount: Decimal, method: str, reference, user_id: int) -> Payment:
    if invoice.status == "cancelled":
        raise HTTPException(status_code=409, detail="Cannot pay a cancelled invoice")
    balance = invoice.balance_due
    if balance <= 0:
        raise HTTPException(status_code=409, detail="Invoice is already fully paid")
    amount = money(amount)
    if amount > balance:
        raise HTTPException(status_code=400, detail=f"Amount exceeds the balance due ({balance})")

    payment = Payment(
        amount=amount,
        method=method,
        reference=reference or f"PAY-{uuid4().hex[:10].upper()}",
        status="completed",
        recorded_by=user_id,
    )
    invoice.payments.append(payment)
    refresh_status(invoice)
    return payment