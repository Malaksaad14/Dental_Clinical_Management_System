import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Absolute directory of the backend folder
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "dentacare.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Dental Clinical Management System"
    API_V1_STR: str = "/api/v1"
    
    # Always resolve to the backend/dentacare.db absolute path
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
