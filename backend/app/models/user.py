from datetime import datetime
from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, String, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'clinical_staff', 'patient')", name="ck_users_role"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    patient = relationship("Patient", back_populates="user", uselist=False)
    staff = relationship("Staff", back_populates="user", uselist=False)
