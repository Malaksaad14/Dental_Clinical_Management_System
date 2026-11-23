
from datetime import date

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


class PatientProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    date_of_birth: date | None
    gender: str | None
    phone: str | None
    address: str | None
    national_id: str | None
    emergency_contact: str | None


class PatientProfileUpdate(BaseModel):
    first_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    last_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=30)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)
    emergency_contact: str | None = Field(
        default=None,
        max_length=100,
    )

    @field_validator(
        "first_name",
        "last_name",
        mode="before",
    )
    @classmethod
    def validate_name(cls, value):
        if value is None:
            raise ValueError("Name cannot be null")
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("date_of_birth")
    @classmethod
    def validate_birth_date(cls, value):
        if value is not None and value > date.today():
            raise ValueError("Birth date cannot be in the future")
        return value
