from datetime import datetime, time, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.core.deps import staff_type_guard, clinical_access
from app.db.database import get_db
from app.models import User, Patient, Appointment, Staff, Service, ImagingRequest
from app.routers.appointments import CAIRO

router = APIRouter(prefix="/workspace", tags=["Staff workspace"])

@router.get("/queue")
def queue(db: Session = Depends(get_db), user: User = Depends(staff_type_guard("assistant"))):
    start = datetime.combine(datetime.now(CAIRO).date(), time.min, CAIRO)
    rows = db.query(Appointment, Patient, Staff, Service).join(Patient, Appointment.patient_id == Patient.id).join(Staff, Appointment.dentist_id == Staff.id).join(Service, Appointment.service_id == Service.id).filter(Appointment.start_time >= start, Appointment.start_time < start + timedelta(days=1)).order_by(Appointment.start_time).all()
    return [dict(id=a.id, patient=p.first_name+" "+p.last_name, dentist=d.first_name+" "+d.last_name, service=s.name, start_time=a.start_time, status=a.status) for a,p,d,s in rows]

class RequestIn(BaseModel):
    patient_id: int
    exam: str = Field(min_length=1, max_length=100)
    indication: str = Field(min_length=1, max_length=4000)

class ResultIn(BaseModel):
    result: str = Field(min_length=1, max_length=10000)

@router.post("/imaging", status_code=201)
def request_imaging(body: RequestIn, db: Session = Depends(get_db), user: User = Depends(clinical_access)):
    if not db.get(Patient, body.patient_id):
        raise HTTPException(404, "Patient not found")
    row = ImagingRequest(**body.model_dump(), requested_by=user.id)
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id}

@router.get("/imaging")
def imaging(db: Session = Depends(get_db), user: User = Depends(staff_type_guard("dentist", "radiologist"))):
    q = db.query(ImagingRequest, Patient).join(Patient, ImagingRequest.patient_id == Patient.id)
    if user.role != "admin" and db.query(Staff).filter_by(user_id=user.id, staff_type="dentist").first():
        q = q.filter(ImagingRequest.requested_by == user.id)
    return [dict(id=r.id, patient=p.first_name+" "+p.last_name, exam=r.exam, indication=r.indication, status=r.status, result=r.result) for r,p in q.order_by(ImagingRequest.id.desc()).all()]

@router.patch("/imaging/{request_id}")
def complete(request_id: int, body: ResultIn, db: Session = Depends(get_db), user: User = Depends(staff_type_guard("radiologist"))):
    row = db.query(ImagingRequest).filter_by(id=request_id).with_for_update().first()
    if not row: raise HTTPException(404, "Request not found")
    if row.status != "pending": raise HTTPException(409, "Already completed")
    row.result = body.result; row.status = "completed"; row.completed_by = user.id
    db.commit()
    return {"status": "completed"}
