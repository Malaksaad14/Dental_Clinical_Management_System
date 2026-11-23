from datetime import datetime, time
from decimal import Decimal
from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, Time, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


class Service(Base):
    __tablename__ = "services"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)


class Chair(Base):
    __tablename__ = "chairs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    room: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"), nullable=False)


class DentistAvailability(Base):
    __tablename__ = "dentist_availabilities"
    __table_args__ = (CheckConstraint("day_of_week BETWEEN 0 AND 6", name="ck_avail_day"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dentist_id: Mapped[int] = mapped_column(ForeignKey("staff.id"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        CheckConstraint("status IN ('scheduled','completed','cancelled','no_show')", name="ck_appointment_status"),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True, nullable=False)
    dentist_id: Mapped[int] = mapped_column(ForeignKey("staff.id"), index=True, nullable=False)
    chair_id: Mapped[int] = mapped_column(ForeignKey("chairs.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="scheduled", server_default=text("'scheduled'"))
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
