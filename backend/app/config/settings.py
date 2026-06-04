import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./movies.db")
    backend_secret_key: str = os.getenv("BACKEND_SECRET_KEY", "change-me-in-production")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    omdb_api_key: str | None = os.getenv("OMDB_API_KEY") or os.getenv("VITE_OMDB_API_KEY")
    omdb_api_url: str = os.getenv("OMDB_API_URL") or os.getenv("VITE_OMDB_API_URL") or "https://www.omdbapi.com"


settings = Settings()
