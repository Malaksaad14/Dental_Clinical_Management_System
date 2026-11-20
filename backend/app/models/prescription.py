from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    dentist_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    appointment_id = Column(Integer, nullable=True)
    issued_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="prescriptions")
    dentist = relationship("Staff")
    items = relationship("PrescriptionItem", back_populates="prescription", cascade="all, delete-orphan")


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False, index=True)
    drug_name = Column(String(150), nullable=False)  # e.g., "Amoxicillin 500mg", "Ibuprofen 400mg"
    dosage = Column(String(100), nullable=False)     # e.g., "1 capsule"
    frequency = Column(String(100), nullable=False)  # e.g., "Every 8 hours"
    duration = Column(String(100), nullable=False)   # e.g., "5 days"

    prescription = relationship("Prescription", back_populates="items")
