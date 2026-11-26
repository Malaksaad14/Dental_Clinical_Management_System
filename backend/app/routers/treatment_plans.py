from app.core.deps import clinical_access, clinical_read, clinical_author
from app.models import User
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.models.treatment_plan import TreatmentPlan, TreatmentPlanItem
from app.models.base_entities import Patient, Service, Staff
from app.schemas.treatment_plan import (
    TreatmentPlanCreate,
    TreatmentPlanUpdate,
    TreatmentPlanOut,
    TreatmentPlanItemCreate,
    TreatmentPlanItemUpdate,
    TreatmentPlanItemOut
)

router = APIRouter(prefix="/treatment-plans", tags=["Treatment Plans"])

@router.post("", response_model=TreatmentPlanOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(clinical_access)])
def create_treatment_plan(plan_in: TreatmentPlanCreate, db: Session = Depends(get_db), user: User = Depends(clinical_access)):
    """Create a new treatment plan with optional initial procedure items."""
    patient = db.query(Patient).filter(Patient.id == plan_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    final_dentist_id = clinical_author(db, user, plan_in.dentist_id)

    new_plan = TreatmentPlan(
        patient_id=plan_in.patient_id,
        dentist_id=final_dentist_id,
        title=plan_in.title,
        status=plan_in.status,
        start_date=plan_in.start_date,
        notes=plan_in.notes
    )
    db.add(new_plan)
    db.flush()

    for item_data in plan_in.items:
        service = db.query(Service).filter(Service.id == item_data.service_id).first()
        if not service:
            raise HTTPException(status_code=400, detail=f"Service ID {item_data.service_id} does not exist")
        item = TreatmentPlanItem(
            plan_id=new_plan.id,
            service_id=item_data.service_id,
            tooth_number=item_data.tooth_number,
            status=item_data.status,
            planned_date=item_data.planned_date,
            notes=item_data.notes
        )
        db.add(item)

    db.commit()
    db.refresh(new_plan)
    return new_plan


@router.get("/patients/{patient_id}", response_model=List[TreatmentPlanOut], dependencies=[Depends(clinical_read)])
def get_patient_treatment_plans(patient_id: int, db: Session = Depends(get_db)):
    """List all treatment plans for a specific patient."""
    plans = db.query(TreatmentPlan).options(
        joinedload(TreatmentPlan.items).joinedload(TreatmentPlanItem.service)
    ).filter(TreatmentPlan.patient_id == patient_id).order_by(TreatmentPlan.created_at.desc()).all()
    return plans


@router.get("/{plan_id}", response_model=TreatmentPlanOut, dependencies=[Depends(clinical_access)])
def get_treatment_plan_by_id(plan_id: int, db: Session = Depends(get_db)):
    """Get single treatment plan details with all items."""
    plan = db.query(TreatmentPlan).options(
        joinedload(TreatmentPlan.items).joinedload(TreatmentPlanItem.service)
    ).filter(TreatmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    return plan


@router.patch("/{plan_id}", response_model=TreatmentPlanOut, dependencies=[Depends(clinical_access)])
def update_treatment_plan(plan_id: int, plan_update: TreatmentPlanUpdate, db: Session = Depends(get_db)):
    """Update title, status (proposed, in_progress, completed), or notes of a plan."""
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")

    update_data = plan_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    return plan


# --- Plan Items (Procedures) ---
@router.post("/{plan_id}/items", response_model=TreatmentPlanItemOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(clinical_access)])
def add_item_to_plan(plan_id: int, item_in: TreatmentPlanItemCreate, db: Session = Depends(get_db)):
    """Add a new procedure to an existing treatment plan."""
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")

    service = db.query(Service).filter(Service.id == item_in.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    item = TreatmentPlanItem(
        plan_id=plan_id,
        service_id=item_in.service_id,
        tooth_number=item_in.tooth_number,
        status=item_in.status,
        planned_date=item_in.planned_date,
        notes=item_in.notes
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/items/{item_id}", response_model=TreatmentPlanItemOut, dependencies=[Depends(clinical_access)])
def update_plan_item_status(item_id: int, item_update: TreatmentPlanItemUpdate, db: Session = Depends(get_db)):
    """Update procedure status (e.g. mark as completed), date, or notes."""
    item = db.query(TreatmentPlanItem).filter(TreatmentPlanItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Plan item not found")

    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    # Automatically synchronize parent treatment plan status based on procedures
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == item.plan_id).first()
    if plan and plan.items:
        all_completed = all(i.status == "completed" for i in plan.items)
        any_started = any(i.status in ("in_progress", "completed") for i in plan.items)
        if all_completed:
            plan.status = "completed"
        elif any_started:
            plan.status = "in_progress"
        else:
            plan.status = "proposed"

    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(clinical_access)])
def delete_plan_item(item_id: int, db: Session = Depends(get_db)):
    """Remove a procedure from a plan."""
    item = db.query(TreatmentPlanItem).filter(TreatmentPlanItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Plan item not found")
    db.delete(item)
    db.commit()
    return None


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(clinical_access)])
def delete_treatment_plan(plan_id: int, db: Session = Depends(get_db)):
    """Delete a treatment plan and all its procedures."""
    plan = db.query(TreatmentPlan).filter(TreatmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Treatment plan not found")
    db.delete(plan)
    db.commit()
    return None
