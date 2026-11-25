from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.db.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(30), unique=True, nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    treatment_plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    status = Column(String(30), default="unpaid", nullable=False)  # unpaid | partially_paid | paid | cancelled
    issue_date = Column(Date, default=date.today, nullable=False)
    due_date = Column(Date, nullable=True)
    subtotal = Column(Numeric(10, 2), default=0, nullable=False)
    discount = Column(Numeric(10, 2), default=0, nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0, nullable=False)  # percent, e.g. 14.00
    tax = Column(Numeric(10, 2), default=0, nullable=False)
    total = Column(Numeric(10, 2), default=0, nullable=False)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

    @property
    def amount_paid(self) -> Decimal:
        return sum((p.amount for p in self.payments if p.status == "completed"), Decimal("0"))

    @property
    def balance_due(self) -> Decimal:
        return self.total - self.amount_paid


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True)
    description = Column(String(255), nullable=False)
    tooth_number = Column(Integer, nullable=True)
    icd10_code = Column(String(10), nullable=True)  # bonus: ICD-10
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    line_total = Column(Numeric(10, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="items")
    service = relationship("Service")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    method = Column(String(30), nullable=False)  # cash | card | online
    status = Column(String(30), default="completed", nullable=False)
    reference = Column(String(100), nullable=True)
    paid_at = Column(DateTime, default=datetime.utcnow)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    invoice = relationship("Invoice", back_populates="payments")