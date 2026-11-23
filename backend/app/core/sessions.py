import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import unauthorized
from app.core.security import REFRESH_DAYS, decode_token, fingerprint, make_token, safe_hash_equal
from app.models import AuthSession, User

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
COOKIE_NAME = "dc_refresh"
COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "false").lower() == "true"
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").rstrip("/")
# Keep the browser and backend on localhost during local development.
TRUSTED_ORIGINS = {FRONTEND_ORIGIN, "http://localhost:8000", "http://127.0.0.1:8000"}


def check_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if origin not in TRUSTED_ORIGINS:
        raise HTTPException(status_code=403, detail="Untrusted request origin")


def set_cookie(response: Response, refresh: str) -> None:
    response.set_cookie(COOKIE_NAME, refresh, httponly=True, secure=COOKIE_SECURE, samesite="lax", path="/auth", max_age=REFRESH_DAYS * 86400)


def clear_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/auth", secure=COOKIE_SECURE, httponly=True, samesite="lax")


def login_session(db: Session, user: User) -> tuple[str, str]:
    sid = secrets.token_hex(24)
    refresh = make_token(user.id, sid, "refresh")
    db.add(AuthSession(
        id=sid, user_id=user.id, refresh_token_hash=fingerprint(refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_DAYS),
    ))
    db.commit()
    return make_token(user.id, sid, "access"), refresh


def lock_refresh(db: Session, refresh: str) -> tuple[User, AuthSession]:
    try:
        user_id, sid = decode_token(refresh, "refresh")
    except ValueError:
        raise unauthorized() from None
    session = db.scalar(select(AuthSession).where(AuthSession.id == sid).with_for_update())
    now = datetime.now(timezone.utc)
    if not session or session.user_id != user_id or session.revoked_at or (session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at.tzinfo is None else session.expires_at) <= now:
        raise unauthorized()
    if not safe_hash_equal(session.refresh_token_hash, fingerprint(refresh)):
        # Reuse of an already rotated refresh token invalidates this session.
        session.revoked_at = now
        db.commit()
        raise unauthorized()
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise unauthorized()
    return user, session


def refresh_session(db: Session, refresh: str) -> tuple[str, str]:
    try:
        user, session = lock_refresh(db, refresh)
        new_refresh = make_token(user.id, session.id, "refresh")
        session.refresh_token_hash = fingerprint(new_refresh)
        session.expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_DAYS)
        db.commit()
        return make_token(user.id, session.id, "access"), new_refresh
    except Exception:
        db.rollback()
        raise


def logout_session(db: Session, refresh: str | None) -> None:
    if not refresh:
        raise unauthorized()
    try:
        user, session = lock_refresh(db, refresh)
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()
    except Exception:
        db.rollback()
        raise
