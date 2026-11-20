"""
Seed script to create initial test data (Doctor, Patient, Services, ICD10 codes)
Run with: python seed.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.models.base_entities import User, Staff, Patient, Service, ICD10Code

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if data already exists
    if db.query(Patient).first():
        print("Data already seeded!")
        db.close()
        return

    print("Seeding initial data...")

    # 1. User & Staff (Dentist)
    dentist_user = User(
        email="dentist@dentacare.com",
        password_hash="hashed_secret",
        role="clinical_staff"
    )
    db.add(dentist_user)
    db.flush()

    dentist = Staff(
        user_id=dentist_user.id,
        first_name="Dr. Tarek",
        last_name="Hassan",
        staff_type="dentist",
        specialization="Endodontics & Restorative",
        license_number="DNT-2024",
        phone="01012345678"
    )
    db.add(dentist)

    # 2. User & Patient
    patient_user = User(
        email="patient@dentacare.com",
        password_hash="hashed_secret",
        role="patient"
    )
    db.add(patient_user)
    db.flush()

    patient = Patient(
        user_id=patient_user.id,
        first_name="Ahmed",
        last_name="Mohamed",
        phone="01198765432",
        national_id="29901011234567",
        gender="Male",
        address="Cairo, Egypt",
        emergency_contact="01234567890"
    )
    db.add(patient)

    # 3. Dental Services
    services = [
        Service(code="D0120", name="Periodic Oral Evaluation", category="Diagnostic", price=150.00, duration_minutes=20),
        Service(code="D1110", name="Dental Prophylaxis / Scaling", category="Preventive", price=300.00, duration_minutes=30),
        Service(code="D2391", name="Composite Resin Filling (1 Surface)", category="Restorative", price=450.00, duration_minutes=45),
        Service(code="D2392", name="Composite Resin Filling (2 Surfaces)", category="Restorative", price=600.00, duration_minutes=45),
        Service(code="D3330", name="Root Canal Therapy (Molar)", category="Endodontics", price=1800.00, duration_minutes=60),
        Service(code="D2740", name="Porcelain / Ceramic Crown", category="Prosthodontics", price=2500.00, duration_minutes=60),
        Service(code="D7140", name="Simple Tooth Extraction", category="Oral Surgery", price=400.00, duration_minutes=30)
    ]
    db.add_all(services)

    # 4. ICD10 Codes
    icd_codes = [
        ICD10Code(code="K02.9", description="Dental caries, unspecified"),
        ICD10Code(code="K04.0", description="Pulpitis"),
        ICD10Code(code="K05.1", description="Chronic gingivitis"),
        ICD10Code(code="K08.1", description="Complete loss of teeth due to trauma/extraction")
    ]
    db.add_all(icd_codes)

    db.commit()
    print(f"Seeding completed successfully!")
    print(f"Sample Patient ID: {patient.id} ({patient.first_name} {patient.last_name})")
    print(f"Sample Dentist ID: {dentist.id} ({dentist.first_name} {dentist.last_name})")
    db.close()

if __name__ == "__main__":
    seed()
