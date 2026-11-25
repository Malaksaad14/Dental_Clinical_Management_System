from datetime import date, datetime
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class InvoiceItemCreate(BaseModel):
    service_id: Optional[int] = None
    description: Optional[str] = Field(None, max_length=255)
    tooth_number: Optional[int] = None
    icd10_code: Optional[str] = Field(None, max_length=10)
    quantity: int = Field(1, ge=1, le=1000)
    unit_price: Optional[Decimal] = Field(None, ge=0)  # only used when there is no service_id

    @model_validator(mode="after")
    def check_manual_item(self):
        if self.service_id is None and (not self.description or self.unit_price is None):
            raise ValueError("Items without a service_id need a description and unit_price")
        return self


class InvoiceCreate(BaseModel):
    patient_id: int
    treatment_plan_id: Optional[int] = None
    appointment_id: Optional[int] = None
    due_date: Optional[date] = None
    discount: Decimal = Field(Decimal("0"), ge=0)
    tax_rate: Decimal = Field(Decimal("0"), ge=0, le=100)
    notes: Optional[str] = None
    items: List[InvoiceItemCreate] = Field(..., min_length=1)


class PaymentCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    method: Literal["cash", "card", "online"]
    reference: Optional[str] = Field(None, max_length=100)


class InvoiceItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    service_id: Optional[int]
    description: str
    tooth_number: Optional[int]
    icd10_code: Optional[str]
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: Decimal
    method: str
    status: str
    reference: Optional[str]
    paid_at: datetime


class InvoiceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    invoice_number: str
    patient_id: int
    treatment_plan_id: Optional[int]
    appointment_id: Optional[int]
    status: str
    issue_date: date
    due_date: Optional[date]
    subtotal: Decimal
    discount: Decimal
    tax_rate: Decimal
    tax: Decimal
    total: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    notes: Optional[str]
    items: List[InvoiceItemOut]
    payments: List[PaymentOut]


class BillingSummary(BaseModel):
    total_invoiced: Decimal
    total_collected: Decimal
    total_outstanding: Decimal
    invoice_count: int