"""Create the first admin from a local terminal; never expose a public admin registration route."""

from getpass import getpass
from sqlalchemy import select

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.models import User


def main() -> None:
    with SessionLocal() as db:
        if db.scalar(select(User.id).where(User.role == "admin")):
            raise SystemExit("An admin already exists. Use an approved admin workflow for further changes.")
        email = input("Initial admin email: ").strip().lower()
        if not email or "@" not in email:
            raise SystemExit("A valid email is required")
        password = getpass("Initial admin password (8-72 UTF-8 bytes): ")
        confirm = getpass("Confirm password: ")
        if password != confirm:
            raise SystemExit("Passwords do not match")
        if db.scalar(select(User.id).where(User.email == email)):
            raise SystemExit("Email is already registered")
        user = User(email=email, password_hash=hash_password(password), role="admin", is_active=True)
        db.add(user)
        db.commit()
        print("Initial admin account created. No password was printed or saved.")


if __name__ == "__main__":
    main()
