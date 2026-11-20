import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DentaCare EMR System"
    API_V1_STR: str = "/api/v1"
    
    # Default to SQLite if no PostgreSQL URL is set, for instant plug-and-play testing
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dentacare.db")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
