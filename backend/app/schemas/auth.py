
from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class PatientRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)

    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)

    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=30)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    national_id: str | None = Field(default=None, max_length=30)
    emergency_contact: str | None = Field(default=None, max_length=100)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return str(value).lower()

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def clean_name(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError(
                "Password must not exceed 72 UTF-8 bytes"
            )
        return value


class PatientRegisterResponse(BaseModel):
    message: str
    user_id: int
    patient_id: int
    email: EmailStr
    role: Literal["patient"]
