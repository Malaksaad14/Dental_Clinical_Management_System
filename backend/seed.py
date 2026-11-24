"""
Seed script to create initial test data in PostgreSQL:
- Admin (admin@dentacare.com / admin123)
- Dentist (dentist@dentacare.com / dentist123)
- Patient (patient@dentacare.com / patient123)
- Services & Chairs
"""
import sys
import os
from decimal import Decimal
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User
from app.models.staff import Staff
from app.models.patient import Patient
from app.models.clinic import Service, Chair
from app.models.base_entities import ICD10Code

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if admin already exists
    existing = db.query(User).filter(User.email == "admin@dentacare.com").first()
    if existing:
        print("Data already seeded in PostgreSQL!")
        db.close()
        return

    print("Seeding PostgreSQL database...")

    # 1. Admin
    admin_user = User(
        email="admin@dentacare.com",
        password_hash=hash_password("admin123"),
        role="admin",
        is_active=True
    )
    db.add(admin_user)

    # 2. Dentist User & Staff
    dentist_user = User(
        email="dentist@dentacare.com",
        password_hash=hash_password("dentist123"),
        role="clinical_staff",
        is_active=True
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

    # 3. Patient User & Patient
    patient_user = User(
        email="patient@dentacare.com",
        password_hash=hash_password("patient123"),
        role="patient",
        is_active=True
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

    # 4. Chairs
    chair1 = Chair(name="Chair 1", room="Room 101", is_active=True)
    chair2 = Chair(name="Chair 2", room="Room 102", is_active=True)
    db.add_all([chair1, chair2])

    # 5. Services
    services = [
        Service(code="D0120", name="Periodic Oral Evaluation", category="Diagnostic", price=Decimal("150.00"), duration_minutes=20),
        Service(code="D1110", name="Dental Prophylaxis / Scaling", category="Preventive", price=Decimal("300.00"), duration_minutes=30),
        Service(code="D2391", name="Composite Resin Filling (1 Surface)", category="Restorative", price=Decimal("450.00"), duration_minutes=45),
        Service(code="D2392", name="Composite Resin Filling (2 Surfaces)", category="Restorative", price=Decimal("600.00"), duration_minutes=45),
        Service(code="D3330", name="Root Canal Therapy (Molar)", category="Endodontics", price=Decimal("1800.00"), duration_minutes=60),
        Service(code="D2740", name="Porcelain / Ceramic Crown", category="Prosthodontics", price=Decimal("2500.00"), duration_minutes=60),
        Service(code="D7140", name="Simple Tooth Extraction", category="Oral Surgery", price=Decimal("400.00"), duration_minutes=30)
    ]
    db.add_all(services)

    # 6. ICD10 Codes
    icd_codes = [
        ICD10Code(code="K02.9", description="Dental caries, unspecified"),
        ICD10Code(code="K04.0", description="Pulpitis"),
        ICD10Code(code="K05.1", description="Chronic gingivitis"),
    ]
    db.add_all(icd_codes)

    db.commit()
    print("PostgreSQL seeding completed successfully!")
    print("Admin:   admin@dentacare.com   / admin123")
    print("Dentist: dentist@dentacare.com / dentist123")
    print("Patient: patient@dentacare.com / patient123")
    db.close()

if __name__ == "__main__":
    seed()
