import os
import hashlib
from app.db import SessionLocal
from app.models import User
from app.security import hash_password
from dotenv import load_dotenv

load_dotenv()

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me-now")


def normalize_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def seed_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print("Admin already exists.")
            return

        admin = User(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            is_admin=True,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print("Admin created successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()