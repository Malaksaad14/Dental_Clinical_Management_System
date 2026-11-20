
from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher


# Configure bcrypt password hashing
password_hasher = PasswordHash((BcryptHasher(),))


def hash_password(password: str) -> str:
    """Hash a plain-text password before storing it."""
    return password_hasher.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """Verify a password against its stored hash."""
    return password_hasher.verify(
        plain_password,
        hashed_password,
    )
