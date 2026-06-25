import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database.session import Base, engine
from app.middleware.error_handlers import register_exception_handlers
from app.routes.auth import router as auth_router
from app.routes.admin import router as admin_router
from app.routes.collections import router as collections_router
from app.routes.favorites import router as favorites_router
from app.routes.history import router as history_router
from app.routes.movies import router as movies_router
from app.routes.notifications import router as notifications_router
from app.routes.recommendations import router as recommendations_router
from app.routes.dashboard import router as dashboard_router
from app.routes.reviews import router as reviews_router
from app.routes.watchlist import router as watchlist_router
from app.models import admin_activity_log, collection, collection_follow, favorite, movie_view, notification, review, review_like, search_history, user, user_preference, watchlist  # noqa: F401
from app.services.auth_service import hash_password

app = FastAPI(
    title="Movie Recommendation API",
    description="FastAPI backend for movie search, watchlist/favorites, search history, and dashboard statistics",
    version="1.0.0",
)

configured_frontend_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        *configured_frontend_origins,
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$|https://[a-z0-9-]+\.netlify\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(movies_router)
app.include_router(collections_router)
app.include_router(favorites_router)
app.include_router(watchlist_router)
app.include_router(history_router)
app.include_router(notifications_router)
app.include_router(recommendations_router)
app.include_router(dashboard_router)
app.include_router(reviews_router)

register_exception_handlers(app)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
    ensure_default_admin_user()

    # SQLite will not alter existing tables automatically, so ensure legacy tables are updated
    if engine.dialect.name == "sqlite":
        inspector = inspect(engine)
        if "users" in inspector.get_table_names():
            existing_user_columns = [col["name"] for col in inspector.get_columns("users")]
            if "is_admin" not in existing_user_columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0"))
                    conn.execute(text("UPDATE users SET is_admin = 1 WHERE lower(email) = lower('Admin@gmail.com')"))
                    conn.commit()

            with engine.connect() as conn:
                conn.execute(text("UPDATE users SET is_admin = 1 WHERE lower(email) = lower('Admin@gmail.com')"))
                conn.commit()

        if "search_history" in inspector.get_table_names():
            existing_columns = [col["name"] for col in inspector.get_columns("search_history")]
            if "searched_at" not in existing_columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE search_history ADD COLUMN searched_at DATETIME"))
                    conn.execute(text("UPDATE search_history SET searched_at = CURRENT_TIMESTAMP WHERE searched_at IS NULL"))
                    conn.commit()


def ensure_default_admin_user():
    # Keep the demo admin account available even when the database starts empty.
    with engine.begin() as conn:
        result = conn.execute(
            text("SELECT id FROM users WHERE lower(email) = lower(:email)"),
            {"email": "Admin@gmail.com"},
        ).fetchone()

        admin_password_hash = hash_password("Admin@123")

        if result is None:
            conn.execute(
                text(
                    """
                    INSERT INTO users (email, password_hash, is_admin)
                    VALUES (:email, :password_hash, 1)
                    """
                ),
                {
                    "email": "Admin@gmail.com",
                    "password_hash": admin_password_hash,
                },
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
            {
                "email": "Admin@gmail.com",
                "password_hash": admin_password_hash,
            },
        )


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Movie Recommendation API is running"}
