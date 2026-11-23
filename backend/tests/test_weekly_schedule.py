"""Access and validation tests for the doctor's multi-day weekly timetable."""
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.core.security import hash_password
from app.models import User


def auth_headers(client, email: str, password: str) -> dict[str, str]:
    response = client.post("/auth/login", data={"username": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def initial_admin(sessions):
    with sessions() as db:
        db.add(User(
            email="admin@example.com",
            password_hash=hash_password("StrongAdminPass123"),
            role="admin", is_active=True,
        ))
        db.commit()


def create_dentist(client, headers):
    response = client.post("/admin/staff", headers=headers, json={
        "email": "dentist@example.com", "password": "StrongDentistPass123",
        "first_name": "Test", "last_name": "Dentist", "staff_type": "dentist",
    })
    assert response.status_code == 201, response.text
    return response.json()["id"]


def test_weekly_schedule_visible_to_patients_but_editable_by_admin_only(client):
    app, sessions = client
    initial_admin(sessions)
    admin = auth_headers(app, "admin@example.com", "StrongAdminPass123")
    dentist_id = create_dentist(app, admin)
    days = [
        {"day_of_week": 0, "start_time": "09:00", "end_time": "13:00"},
        {"day_of_week": 2, "start_time": "14:00", "end_time": "18:00"},
        {"day_of_week": 4, "start_time": "10:00", "end_time": "16:00"},
    ]
    result = app.put("/catalog/availability/weekly", headers=admin,
                     json={"dentist_id": dentist_id, "days": days})
    assert result.status_code == 200, result.text
    assert {item["day_of_week"] for item in result.json()} == {0, 2, 4}

    response = app.post("/patients", headers=admin, json={
        "email": "patient@example.com", "password": "StrongPatientPass123",
        "first_name": "Test", "last_name": "Patient",
    })
    assert response.status_code == 201, response.text
    patient = auth_headers(app, "patient@example.com", "StrongPatientPass123")
    assert app.get("/catalog/availability", headers=patient).status_code == 200
    assert app.get("/catalog/dentists", headers=patient).status_code == 200
    assert app.put("/catalog/availability/weekly", headers=patient,
                   json={"dentist_id": dentist_id, "days": days}).status_code == 403

    dentist_login = auth_headers(app, "dentist@example.com", "StrongDentistPass123")
    assert app.get("/catalog/availability", headers=dentist_login).status_code == 200
    assert app.put("/catalog/availability/weekly", headers=dentist_login,
                   json={"dentist_id": dentist_id, "days": days}).status_code == 403

    updated_days = [{"day_of_week": 1, "start_time": "10:00", "end_time": "15:00"}]
    result = app.put("/catalog/availability/weekly", headers=admin,
                     json={"dentist_id": dentist_id, "days": updated_days})
    assert result.status_code == 200, result.text
    remaining = app.get("/catalog/availability", headers=admin).json()
    assert len(remaining) == 1
    assert remaining[0]["day_of_week"] == 1


def test_weekly_schedule_rejects_duplicate_days_and_invalid_hours(client):
    app, sessions = client
    initial_admin(sessions)
    admin = auth_headers(app, "admin@example.com", "StrongAdminPass123")
    dentist_id = create_dentist(app, admin)
    duplicate_days = [
        {"day_of_week": 1, "start_time": "09:00", "end_time": "12:00"},
        {"day_of_week": 1, "start_time": "13:00", "end_time": "18:00"},
    ]
    assert app.put("/catalog/availability/weekly", headers=admin,
                   json={"dentist_id": dentist_id, "days": duplicate_days}).status_code == 422
    invalid_day = [{"day_of_week": 2, "start_time": "16:00", "end_time": "09:00"}]
    assert app.put("/catalog/availability/weekly", headers=admin,
                   json={"dentist_id": dentist_id, "days": invalid_day}).status_code == 422
    assert app.get("/catalog/availability", headers=admin).json() == []


def test_cannot_remove_working_hours_of_future_booked_appointment(client):
    app, sessions = client
    initial_admin(sessions)
    admin = auth_headers(app, "admin@example.com", "StrongAdminPass123")
    dentist_id = create_dentist(app, admin)
    future = datetime.combine(
        datetime.now(ZoneInfo("Africa/Cairo")).date() + timedelta(days=14),
        time(10), tzinfo=ZoneInfo("Africa/Cairo"),
    )
    valid_slot = [{"day_of_week": future.weekday(), "start_time": "09:00", "end_time": "17:00"}]
    assert app.put("/catalog/availability/weekly", headers=admin,
                   json={"dentist_id": dentist_id, "days": valid_slot}).status_code == 200
    assert app.post("/catalog/services", headers=admin, json={
        "code": "TEST101", "name": "Test Exam", "price": 100, "duration_minutes": 30,
    }).status_code == 201
    assert app.post("/catalog/chairs", headers=admin, json={"name": "Test Chair"}).status_code == 201
    created_patient = app.post("/patients", headers=admin, json={
        "email": "patient@example.com", "password": "StrongPatientPass123",
        "first_name": "Test", "last_name": "Patient",
    })
    assert created_patient.status_code == 201
    patient = auth_headers(app, "patient@example.com", "StrongPatientPass123")
    booking = app.post("/appointments/me", headers=patient, json={
        "dentist_id": dentist_id, "service_id": 1, "start_time": future.isoformat(),
    })
    assert booking.status_code == 201, booking.text
    other_day = (future.weekday() + 1) % 7
    update = app.put("/catalog/availability/weekly", headers=admin,
                     json={"dentist_id": dentist_id, "days": [
                         {"day_of_week": other_day, "start_time": "09:00", "end_time": "17:00"},
                     ]})
    assert update.status_code == 409, update.text
    saved = app.get("/catalog/availability", headers=admin).json()
    assert len(saved) == 1 and saved[0]["day_of_week"] == future.weekday()
