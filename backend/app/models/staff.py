
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Staff(Base):
    __tablename__ = "staff"

    __table_args__ = (
        CheckConstraint(
            "staff_type IN ('dentist', 'radiologist', 'assistant', 'receptionist')",
            name="ck_staff_type",
        ),
    )

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

    staff_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )

    specialization: Mapped[str | None] = mapped_column(
        String(150), nullable=True
    )

    license_number: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )

    phone: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )

    user: Mapped["User"] = relationship(
        "User", back_populates="staff"
    )
