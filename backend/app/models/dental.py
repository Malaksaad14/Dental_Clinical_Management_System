from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.models.history import ToothRecord

class ClinicalNote(Base):
    __tablename__ = "clinical_notes"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    icd10_code_id = Column(Integer, ForeignKey("icd10_codes.id"), nullable=True)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    staff = relationship("Staff")
    icd10 = relationship("ICD10Code")

__all__ = ["ToothRecord", "ClinicalNote"]
