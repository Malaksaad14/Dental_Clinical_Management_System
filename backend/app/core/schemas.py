from datetime import date, datetime, time
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

STAFF_TYPES = Literal["dentist", "radiologist", "assistant", "receptionist"]


class AccountBase(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)

    @field_validator("password")
    @classmethod
    def valid_password(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password cannot exceed 72 UTF-8 bytes")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def no_blank_names(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name is required")
        return v.strip()


class PatientCreate(AccountBase):
    date_of_birth: date | None = None
    gender: str | None = Field(None, max_length=30)
    phone: str | None = Field(None, max_length=30)
    address: str | None = Field(None, max_length=255)
    national_id: str | None = Field(None, max_length=30)
    emergency_contact: str | None = Field(None, max_length=100)

    @field_validator("date_of_birth")
    @classmethod
    def birth_not_future(cls, v: date | None) -> date | None:
        if v and v > date.today():
            raise ValueError("Birth date cannot be in the future")
        return v


class StaffCreate(AccountBase):
    staff_type: STAFF_TYPES
    specialization: str | None = Field(None, max_length=150)
    license_number: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=30)


class PatientUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    phone: str | None = Field(None, max_length=30)
    address: str | None = Field(None, max_length=255)
    emergency_contact: str | None = Field(None, max_length=100)

    @field_validator("first_name", "last_name")
    @classmethod
    def required_names(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class PatientOut(BaseModel):
    id: int
    user_id: int
    email: EmailStr
    first_name: str
    last_name: str
    date_of_birth: date | None
    gender: str | None
    phone: str | None
    address: str | None
    national_id: str | None
    emergency_contact: str | None


class StaffOut(BaseModel):
    id: int
    user_id: int
    email: EmailStr
    first_name: str
    last_name: str
    staff_type: STAFF_TYPES
    specialization: str | None
    license_number: str | None
    phone: str | None
    is_active: bool


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: Literal["admin", "clinical_staff", "patient"]
    is_active: bool
    staff_type: STAFF_TYPES | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ServiceIn(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=150)
    category: str | None = None
    price: Decimal = Field(ge=0)
    duration_minutes: int = Field(ge=10, le=480)


class ServiceOut(ServiceIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ChairIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    room: str | None = None


class ChairOut(ChairIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool


class AvailabilityIn(BaseModel):
    dentist_id: int
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time


class AvailabilityOut(AvailabilityIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class DentistOut(BaseModel):
    id: int
    name: str


class BookingIn(BaseModel):
    dentist_id: int
    service_id: int
    start_time: datetime
    reason: str | None = Field(None, max_length=500)


class StaffBookingIn(BookingIn):
    patient_id: int


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    dentist_id: int
    dentist_name: str
    chair_id: int
    service_id: int
    service_name: str
    start_time: datetime
    end_time: datetime
    status: str
    reason: str | None


class AppointmentStatusIn(BaseModel):
    status: Literal["scheduled", "completed", "cancelled", "no_show"]


class HistoryIn(BaseModel):
    conditions: str | None = None
    allergies: str | None = None
    current_medications: str | None = None
    dental_history: str | None = None


class HistoryOut(HistoryIn):
    id: int
    patient_id: int
    updated_at: datetime


class ToothIn(BaseModel):
    recorded_by: int | None = None  # Admin may choose a clinical author
    tooth_number: int = Field(ge=1, le=48)
    surface: str | None = Field(None, max_length=50)
    condition: str = Field(min_length=1, max_length=150)
    notes: str | None = None


class ToothOut(ToothIn):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_id: int
    recorded_by: int
    recorded_at: datetime
