from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from app.db.database import Base

class ImagingRequest(Base):
    __tablename__ = "imaging_requests"
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    exam = Column(String(100), nullable=False)
    indication = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, server_default="pending")
    result = Column(Text)
    completed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
