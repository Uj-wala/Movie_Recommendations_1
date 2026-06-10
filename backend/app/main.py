from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database.session import Base, engine
from app.middleware.error_handlers import register_exception_handlers
from app.routes.auth import router as auth_router
from app.routes.favorites import router as favorites_router
from app.routes.history import router as history_router
from app.routes.movies import router as movies_router
from app.routes.recommendations import router as recommendations_router
from app.routes.dashboard import router as dashboard_router
from app.routes.reviews import router as reviews_router
from app.routes.watchlist import router as watchlist_router
from app.models import favorite, movie_view, review, search_history, user, user_preference, watchlist  # noqa: F401

app = FastAPI(
    title="Movie Recommendation API",
    description="FastAPI backend for movie search, watchlist/favorites, search history, and dashboard statistics",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(movies_router)
app.include_router(favorites_router)
app.include_router(watchlist_router)
app.include_router(history_router)
app.include_router(recommendations_router)
app.include_router(dashboard_router)
app.include_router(reviews_router)

register_exception_handlers(app)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)

    # SQLite will not alter existing tables automatically, so ensure legacy tables are updated
    if engine.dialect.name == "sqlite":
        inspector = inspect(engine)
        if "search_history" in inspector.get_table_names():
            existing_columns = [col["name"] for col in inspector.get_columns("search_history")]
            if "searched_at" not in existing_columns:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE search_history ADD COLUMN searched_at DATETIME"))
                    conn.execute(text("UPDATE search_history SET searched_at = CURRENT_TIMESTAMP WHERE searched_at IS NULL"))
                    conn.commit()


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Movie Recommendation API is running"}
