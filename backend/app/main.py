from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
# Import all models to ensure they are registered with Base.metadata
import app.models

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dental Clinical Management System",
    description="Backend API for Dental Clinical Management System - Dental Records & Treatment Planning",
    version="1.0.0"
)

# CORS configuration for Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production, specify domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
from app.routers import dental_records, treatment_plans, prescriptions

app.include_router(dental_records.router, prefix=settings.API_V1_STR)
app.include_router(treatment_plans.router, prefix=settings.API_V1_STR)
app.include_router(prescriptions.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to DentaCare EMR API", "docs": "/docs"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "system": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
