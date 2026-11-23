import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.db.database import engine
from app.routers import appointments, auth, catalog, history, patients, staff

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(title="DentaCare EMR API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(staff.router)
app.include_router(catalog.router)
app.include_router(appointments.router)
app.include_router(history.router)


@app.get("/health")
def health():
    with engine.connect() as con:
        con.execute(text("SELECT 1"))
    return {"status": "ok"}
