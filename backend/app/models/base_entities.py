from sqlalchemy import Column, Integer, String
from app.db.database import Base
from app.models.user import User
from app.models.patient import Patient
from app.models.staff import Staff
from app.models.clinic import Service

class ICD10Code(Base):
    __tablename__ = "icd10_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False)
    description = Column(String(255), nullable=False)

__all__ = ["User", "Patient", "Staff", "Service", "ICD10Code"]
