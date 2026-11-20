import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("Testing API Health...")
    res = client.get("/api/health")
    assert res.status_code == 200, res.text
    print(" Health OK:", res.json())

    # 1. Test Tooth Record
    print("\nTesting Dental Record...")
    tooth_payload = {
        "patient_id": 1,
        "recorded_by": 1,
        "tooth_number": 14,
        "surface": "Occlusal",
        "condition": "caries",
        "notes": "Deep occlusal decay on upper right first premolar"
    }
    res = client.post("/api/v1/dental/tooth-records", json=tooth_payload)
    assert res.status_code == 201, res.text
    print(" Tooth Record created:", res.json())

    # 2. Test Dental Chart Overview
    print("\nTesting Dental Chart Overview...")
    res = client.get("/api/v1/dental/patients/1/chart")
    assert res.status_code == 200, res.text
    chart_data = res.json()
    assert "14" in chart_data["teeth"]
    print(" Chart Overview retrieved successfully! Teeth mapped:", list(chart_data["teeth"].keys()))

    # 3. Test Treatment Plan Creation
    print("\nTesting Treatment Plan Creation...")
    plan_payload = {
        "patient_id": 1,
        "dentist_id": 1,
        "title": "Restorative Plan for Tooth 14 & Cleaning",
        "status": "proposed",
        "notes": "Patient reports sensitivity to cold",
        "items": [
            {
                "service_id": 2, # Scaling
                "status": "pending",
                "notes": "Full mouth scaling first visit"
            },
            {
                "service_id": 3, # Composite Filling 1 Surface
                "tooth_number": 14,
                "status": "pending",
                "notes": "Composite restoration on occlusal surface"
            }
        ]
    }
    res = client.post("/api/v1/treatment-plans", json=plan_payload)
    assert res.status_code == 201, res.text
    plan_data = res.json()
    print(f" Treatment Plan created! ID: {plan_data['id']}, Items count: {len(plan_data['items'])}")

    # 4. Test Prescription Creation
    print("\nTesting Prescription Creation...")
    rx_payload = {
        "patient_id": 1,
        "dentist_id": 1,
        "notes": "Take after meals",
        "items": [
            {
                "drug_name": "Amoxicillin 500mg",
                "dosage": "1 capsule",
                "frequency": "Every 8 hours",
                "duration": "5 days"
            },
            {
                "drug_name": "Ibuprofen 400mg",
                "dosage": "1 tablet",
                "frequency": "As needed for pain",
                "duration": "3 days"
            }
        ]
    }
    res = client.post("/api/v1/prescriptions", json=rx_payload)
    assert res.status_code == 201, res.text
    rx_data = res.json()
    print(f" Prescription created! ID: {rx_data['id']}, Drugs: {[item['drug_name'] for item in rx_data['items']]}")

    print("\n ALL BACKEND TESTS PASSED SUCCESSFULLY! ")

if __name__ == "__main__":
    test_endpoints()
