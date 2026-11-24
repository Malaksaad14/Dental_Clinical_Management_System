from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class TreatmentPlan(Base):
    __tablename__ = "treatment_plans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    dentist_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    title = Column(String(150), nullable=False)  # e.g., "Full Mouth Rehabilitation", "Root Canal Therapy - Tooth 14"
    status = Column(String(50), default="proposed")  # proposed | in_progress | completed | cancelled
    start_date = Column(Date, default=date.today)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    dentist = relationship("Staff")
    items = relationship("TreatmentPlanItem", back_populates="treatment_plan", cascade="all, delete-orphan")


class TreatmentPlanItem(Base):
    __tablename__ = "treatment_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("treatment_plans.id"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    appointment_id = Column(Integer, nullable=True)
    tooth_number = Column(Integer, nullable=True)  # Specific tooth this procedure targets, if applicable
    status = Column(String(50), default="pending")  # pending | in_progress | completed | cancelled
    planned_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    treatment_plan = relationship("TreatmentPlan", back_populates="items")
    service = relationship("Service")
