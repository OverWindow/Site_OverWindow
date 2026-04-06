from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import Link
from app.utils.favicon import extract_favicon_url, normalize_url


def main():
    db: Session = SessionLocal()
    try:
        links = db.query(Link).all()

        for link in links:
            normalized_url = normalize_url(link.url)
            favicon_url = extract_favicon_url(normalized_url)

            link.url = normalized_url
            link.favicon_url = favicon_url

            print(f"[UPDATED] {link.title} -> {favicon_url}")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()