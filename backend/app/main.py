from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import Base, engine
from app.routes.auth import router as auth_router
from app.routes.favorites import router as favorites_router
from app.routes.movies import router as movies_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Movie Recommendation API",
    description="FastAPI backend for movie search and favorites management",
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


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Movie Recommendation API is running"}
