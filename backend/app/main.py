
import logging
from app.routers.auth import router as auth_router
from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from app.routers.patients import router as patients_router
from app.db.database import engine


logger = logging.getLogger(__name__)

app = FastAPI(
    title="DentaCare EMR API",
    description="Dental Clinic Management System",
    version="1.0.0",
)
app.include_router(patients_router)
app.include_router(auth_router)
@app.get("/")
def root():
    return {
        "message": "Welcome to DentaCare EMR API"
    }


@app.get("/health")
def health_check():
    return {
        "status": "success",
        "message": "Backend is running"
    }


# Development-only database connection test
@app.get("/db-health", include_in_schema=True)
def database_health_check():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.scalar_one()

        return {
            "status": "success",
            "message": "Database connected successfully"
        }

    except SQLAlchemyError:
        logger.exception("Database connection failed")
        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable"
        )
