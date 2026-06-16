from sqlalchemy import text

from app.database.session import Base, engine
from app.models import favorite, movie_view, review, search_history, user, user_preference, watchlist  # noqa: F401
from app.services.auth_service import hash_password


ADMIN_EMAIL = "Admin@gmail.com"
ADMIN_PASSWORD = "Admin@123"


def ensure_admin_user() -> None:
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        row = conn.execute(
            text("SELECT id FROM users WHERE lower(email) = lower(:email)"),
            {"email": ADMIN_EMAIL},
        ).fetchone()
        password_hash = hash_password(ADMIN_PASSWORD)

        if row is None:
            conn.execute(
                text(
                    """
                    INSERT INTO users (email, password_hash, is_admin)
                    VALUES (:email, :password_hash, 1)
                    """
                ),
                {"email": ADMIN_EMAIL, "password_hash": password_hash},
            )
            return

        conn.execute(
            text(
                """
                UPDATE users
                SET password_hash = :password_hash,
                    is_admin = 1
                WHERE lower(email) = lower(:email)
                """
            ),
            {"email": ADMIN_EMAIL, "password_hash": password_hash},
        )


if __name__ == "__main__":
    ensure_admin_user()
    print(f"Seeded admin account: {ADMIN_EMAIL}")
