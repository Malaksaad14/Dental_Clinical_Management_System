
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, status
from jwt.exceptions import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    create_refresh_token,
)
from app.models.auth_session import AuthSession
from app.models.user import User


def unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired session",
    )


def token_hash(token: str) -> str:
    """Hash a refresh token before database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def read_refresh_identity(token: str) -> tuple[int, str]:
    """Verify refresh JWT and extract user and session IDs."""
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={
                "require": ["sub", "sid", "jti", "iat", "exp"]
            },
        )

        subject = payload.get("sub")
        session_id = payload.get("sid")

        if (
            payload.get("type") != "refresh"
            or not isinstance(subject, str)
            or not subject.isascii()
            or not subject.isdecimal()
            or not isinstance(session_id, str)
            or len(session_id) != 48
            or not isinstance(payload.get("jti"), str)
        ):
            raise unauthorized()

        return int(subject), session_id

    except InvalidTokenError:
        raise unauthorized()


def create_login_session(
    db: Session,
    user: User,
) -> tuple[str, str]:
    """Create a new server-side login session."""
    session_id = secrets.token_hex(24)
    now = datetime.now(timezone.utc)

    refresh_token = create_refresh_token(
        user.id, session_id
    )

    auth_session = AuthSession(
        id=session_id,
        user_id=user.id,
        refresh_token_hash=token_hash(refresh_token),
        expires_at=now + timedelta(
            days=REFRESH_TOKEN_EXPIRE_DAYS
        ),
    )

    try:
        db.add(auth_session)
        db.commit()
    except Exception:
        db.rollback()
        raise

    access_token = create_access_token(
        user.id, session_id
    )

    return access_token, refresh_token


def get_valid_refresh_session(
    db: Session,
    token: str,
) -> tuple[User, AuthSession]:
    """Validate the refresh token and lock its session."""
    user_id, session_id = read_refresh_identity(token)

    auth_session = db.scalar(
        select(AuthSession)
        .where(AuthSession.id == session_id)
        .with_for_update()
    )

    now = datetime.now(timezone.utc)

    if (
        auth_session is None
        or auth_session.user_id != user_id
        or auth_session.revoked_at is not None
        or auth_session.expires_at <= now
    ):
        raise unauthorized()

    if not hmac.compare_digest(
        auth_session.refresh_token_hash,
        token_hash(token),
    ):
        raise unauthorized()

    user = db.get(User, user_id)

    if user is None or not user.is_active:
        raise unauthorized()

    return user, auth_session


def rotate_refresh_token(
    db: Session,
    old_token: str,
) -> tuple[str, str]:
    """Rotate the refresh token and issue a new access token."""
    try:
        user, auth_session = get_valid_refresh_session(
            db, old_token
        )

        new_refresh = create_refresh_token(
            user.id, auth_session.id
        )

        auth_session.refresh_token_hash = token_hash(
            new_refresh
        )
        auth_session.expires_at = datetime.now(
            timezone.utc
        ) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

        db.commit()

        new_access = create_access_token(
            user.id, auth_session.id
        )

        return new_access, new_refresh

    except Exception:
        db.rollback()
        raise


def revoke_login_session(
    db: Session,
    refresh_token: str,
) -> None:
    """Revoke a session during logout."""
    try:
        _, auth_session = get_valid_refresh_session(
            db, refresh_token
        )

        auth_session.revoked_at = datetime.now(
            timezone.utc
        )

        db.commit()

    except Exception:
        db.rollback()
        raise
