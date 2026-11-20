from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class ToothRecord(Base):
    __tablename__ = "tooth_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    recorded_by = Column(Integer, ForeignKey("staff.id"), nullable=True)
    tooth_number = Column(Integer, nullable=False)  # Universal (1-32) or FDI (11-48)
    surface = Column(String(50), nullable=True)     # e.g., "Occlusal", "Mesial", "Distal", "Buccal", "Lingual" or "ALL"
    condition = Column(String(50), nullable=False)   # e.g., "healthy", "caries", "filled", "missing", "crown", "implant", "root_canal"
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="tooth_records")
    doctor = relationship("Staff")


class ClinicalNote(Base):
    __tablename__ = "clinical_notes"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, nullable=True)  # can link to appointment when available
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    icd10_code_id = Column(Integer, ForeignKey("icd10_codes.id"), nullable=True)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    staff = relationship("Staff")
    icd10 = relationship("ICD10Code")
