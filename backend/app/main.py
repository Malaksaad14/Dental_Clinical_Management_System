import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.db.database import engine
from app.routers import (
    appointments,
    auth,
    catalog,
    history,
    patients,
    staff,
    dental_records,
    treatment_plans,
    prescriptions,
)

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(
    title="Dental Clinical Management System",
    description="Backend API for Dental Clinical Management System - Authentication, Appointments, Dental Records & Treatment Planning",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication & Base System Routers (Manar)
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(staff.router)
app.include_router(catalog.router)
app.include_router(appointments.router)
app.include_router(history.router)

# Dental Records & Treatment Plans Routers (Malak)
app.include_router(dental_records.router, prefix="/api/v1")
app.include_router(treatment_plans.router, prefix="/api/v1")
app.include_router(prescriptions.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Welcome to Dental Clinical Management System API", "docs": "/docs"}

@app.get("/health")
def health():
    try:
        with engine.connect() as con:
            con.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as e:
        return {"status": "ok", "db": "offline", "note": str(e)}

@app.get("/api/health")
def api_health():
    return health()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
