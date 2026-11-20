
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    first_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    last_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )

    date_of_birth: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )

    gender: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )

    phone: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )

    address: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    national_id: Mapped[str | None] = mapped_column(
        String(30), unique=True, nullable=True
    )

    emergency_contact: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )

    user: Mapped["User"] = relationship(
        "User", back_populates="patient"
    )
