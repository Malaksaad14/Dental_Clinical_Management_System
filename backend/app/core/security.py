import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv
from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher
from jwt.exceptions import InvalidTokenError

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
if len(JWT_SECRET_KEY) < 32:
    raise RuntimeError("Set a strong JWT_SECRET_KEY (32+ characters) in backend/.env")
ALGORITHM = "HS256"
ACCESS_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))
if ACCESS_MINUTES <= 0 or REFRESH_DAYS <= 0:
    raise RuntimeError("Token expiry must be positive")

password_hasher = PasswordHash((BcryptHasher(),))


def hash_password(password: str) -> str:
    if not 8 <= len(password.encode("utf-8")) <= 72:
        raise ValueError("Password must contain 8 to 72 UTF-8 bytes")
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return password_hasher.verify(password, password_hash)


def make_token(user_id: int, session_id: str, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    duration = timedelta(minutes=ACCESS_MINUTES) if token_type == "access" else timedelta(days=REFRESH_DAYS)
    return jwt.encode(
        {"sub": str(user_id), "sid": session_id, "jti": secrets.token_urlsafe(24), "type": token_type, "iat": now, "exp": now + duration},
        JWT_SECRET_KEY,
        algorithm=ALGORITHM,
    )


def decode_token(token: str, token_type: str) -> tuple[int, str]:
    try:
        claims = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM], options={"require": ["sub", "sid", "jti", "iat", "exp"]})
        user_id, session_id = claims.get("sub"), claims.get("sid")
        if (
            claims.get("type") != token_type
            or not isinstance(user_id, str)
            or not user_id.isascii()
            or not user_id.isdecimal()
            or not isinstance(session_id, str)
            or len(session_id) != 48
            or any(c not in "0123456789abcdef" for c in session_id)
        ):
            raise ValueError("Invalid claims")
        return int(user_id), session_id
    except (InvalidTokenError, ValueError, OverflowError) as exc:
        raise ValueError("Invalid or expired token") from exc


def fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def safe_hash_equal(left: str, right: str) -> bool:
    return hmac.compare_digest(left, right)
