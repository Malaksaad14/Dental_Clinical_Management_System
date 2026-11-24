import os
from pathlib import Path
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import URL, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

DB_PASSWORD = os.getenv("DB_PASSWORD")
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    if DB_PASSWORD:
        DATABASE_URL = URL.create(
            "postgresql+psycopg",
            username=os.getenv("DB_USER", "postgres"),
            password=DB_PASSWORD,
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            database=os.getenv("DB_NAME", "dentacare_db"),
        )
    else:
        # Fallback to local SQLite so the app works seamlessly out of the box
        default_db = Path(__file__).resolve().parents[2] / "dentacare.db"
        DATABASE_URL = f"sqlite:///{default_db.as_posix()}"

is_sqlite = str(DATABASE_URL).startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
