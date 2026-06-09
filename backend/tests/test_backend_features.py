import os
import unittest
from pathlib import Path
from datetime import timedelta

from fastapi.testclient import TestClient
from pydantic import ValidationError


BACKEND_DIR = Path(__file__).resolve().parents[1]
DB_FILE = BACKEND_DIR / "test_movie_app.db"

if DB_FILE.exists():
    DB_FILE.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{DB_FILE.as_posix()}"
os.environ["BACKEND_SECRET_KEY"] = "test-secret"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"

from app.database.session import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.movie_view import MovieView  # noqa: E402
from app.models.search_history import SearchHistory  # noqa: E402
from app.models.user import User  # noqa: E402
from app.schemas.history import SearchKeywordQuery  # noqa: E402
from app.services.auth_service import create_access_token  # noqa: E402


def reset_database():
    db = SessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    finally:
        db.close()


class BackendFeatureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)
        cls.client = TestClient(app)
        cls.client.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client.__exit__(None, None, None)
        engine.dispose()
        if DB_FILE.exists():
            DB_FILE.unlink()

    def setUp(self):
        reset_database()

    def register_and_login(self, email="user@example.com", password="password123"):
        register = self.client.post(
            "/register",
            json={"email": email, "password": password},
        )
        self.assertEqual(register.status_code, 201, register.text)

        login = self.client.post(
            "/login",
            json={"email": email, "password": password},
        )
        self.assertEqual(login.status_code, 200, login.text)
        return login.json()["access_token"]

    def auth_headers(self, token: str):
        return {"Authorization": f"Bearer {token}"}

    def search_keywords(self, token: str, keywords: list[str]):
        for keyword in keywords:
            response = self.client.get(
                "/movies/search",
                params={"title": keyword},
                headers=self.auth_headers(token),
            )
            self.assertEqual(response.status_code, 200, response.text)

    def test_search_history_tracks_latest_10_and_prevents_duplicate_consecutive_searches(self):
        token = self.register_and_login()
        keywords = [
            "Neon",
            "Horizon",
            "Midnight",
            "Solaris",
            "Chrome",
            "Dynasty",
            "Star",
            "Arcade",
            "2026",
            "2025",
            "2024",
            "2023",
        ]
        self.search_keywords(token, keywords)

        history = self.client.get("/history", headers=self.auth_headers(token))
        self.assertEqual(history.status_code, 200, history.text)

        payload = history.json()
        self.assertTrue(payload["success"])
        items = payload["data"]
        self.assertEqual(len(items), 10)
        self.assertEqual(payload["page"], 1)
        self.assertEqual(payload["limit"], 10)
        self.assertEqual(payload["total"], 12)
        self.assertEqual(payload["total_pages"], 2)
        self.assertEqual([item["keyword"] for item in items], list(reversed(keywords[-10:])))

        self.client.get("/movies/search", params={"title": "2023"}, headers=self.auth_headers(token))
        self.client.get("/movies/search", params={"title": "2023"}, headers=self.auth_headers(token))

        history_after_duplicate = self.client.get("/history", headers=self.auth_headers(token))
        self.assertEqual(history_after_duplicate.status_code, 200, history_after_duplicate.text)
        duplicate_payload = history_after_duplicate.json()
        duplicate_items = duplicate_payload["data"]
        self.assertEqual(duplicate_items[0]["keyword"], "2023")
        self.assertEqual(len(duplicate_items), 10)
        self.assertEqual(duplicate_payload["total"], 14)
        self.assertEqual(duplicate_payload["total_pages"], 2)

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == "user@example.com").first()
            self.assertIsNotNone(user)
            total_records = db.query(SearchHistory).filter(SearchHistory.user_id == user.id).count()
            self.assertEqual(total_records, 14)
        finally:
            db.close()

    def test_empty_search_history_returns_success_with_empty_data(self):
        token = self.register_and_login(email="empty-history@example.com")

        history = self.client.get("/history", headers=self.auth_headers(token))
        self.assertEqual(history.status_code, 200, history.text)

        payload = history.json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["data"], [])
        self.assertEqual(payload["page"], 1)
        self.assertEqual(payload["limit"], 10)
        self.assertEqual(payload["total"], 0)
        self.assertEqual(payload["total_pages"], 0)

    def test_history_supports_pagination_slices(self):
        token = self.register_and_login(email="paged-history@example.com")
        keywords = [
            "One",
            "Two",
            "Three",
            "Four",
            "Five",
            "Six",
            "Seven",
            "Eight",
            "Nine",
            "Ten",
            "Eleven",
            "Twelve",
        ]
        self.search_keywords(token, keywords)

        history = self.client.get(
            "/history",
            params={"page": 2, "limit": 5},
            headers=self.auth_headers(token),
        )
        self.assertEqual(history.status_code, 200, history.text)

        payload = history.json()
        self.assertEqual(payload["page"], 2)
        self.assertEqual(payload["limit"], 5)
        self.assertEqual(payload["total"], 12)
        self.assertEqual(payload["total_pages"], 3)
        self.assertEqual(
            [item["keyword"] for item in payload["data"]],
            list(reversed(keywords))[5:10],
        )

    def test_dashboard_returns_favorite_search_counts_and_recent_searches(self):
        token = self.register_and_login(email="dashboard@example.com")

        favorite_payloads = [
            {"imdb_id": "fake-cine-001", "title": "Neon Horizon", "year": "2026", "poster_url": "https://example.com/a.jpg"},
            {"imdb_id": "fake-cine-002", "title": "Midnight Solaris", "year": "2025", "poster_url": "https://example.com/b.jpg"},
        ]
        for payload in favorite_payloads:
            response = self.client.post(
                "/favorites",
                json=payload,
                headers=self.auth_headers(token),
            )
            self.assertEqual(response.status_code, 201, response.text)

        keywords = ["Neon", "Horizon", "Midnight", "Solaris", "Chrome"]
        self.search_keywords(token, keywords)

        dashboard = self.client.get("/dashboard", headers=self.auth_headers(token))
        self.assertEqual(dashboard.status_code, 200, dashboard.text)

        data = dashboard.json()
        self.assertEqual(data["total_favorites"], 2)
        self.assertEqual(data["total_searches"], 5)
        self.assertEqual(data["recent_searches"], ["Chrome", "Solaris", "Midnight"])

    def test_recommendations_use_favorites_history_and_viewed_movies(self):
        token = self.register_and_login(email="recommendations@example.com")

        favorite_payload = {
            "imdb_id": "fake-cine-002",
            "title": "Midnight Solaris",
            "year": "2025",
            "poster_url": "https://example.com/b.jpg",
        }
        response = self.client.post(
            "/favorites",
            json=favorite_payload,
            headers=self.auth_headers(token),
        )
        self.assertEqual(response.status_code, 201, response.text)

        self.search_keywords(token, ["Batman", "Superman", "Justice League"])

        viewed = self.client.get("/movies/fake-cine-001", headers=self.auth_headers(token))
        self.assertEqual(viewed.status_code, 200, viewed.text)

        recommendations = self.client.get(
            "/recommendations",
            params={"limit": 5},
            headers=self.auth_headers(token),
        )
        self.assertEqual(recommendations.status_code, 200, recommendations.text)

        payload = recommendations.json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["total"], len(payload["data"]))
        self.assertIn("favorites", payload["sources"])
        self.assertIn("search_history", payload["sources"])
        self.assertIn("previously_viewed", payload["sources"])
        self.assertIn("superhero", payload["seed_terms"])
        self.assertIn("action", payload["seed_terms"])

        recommended_ids = [item["imdb_id"] for item in payload["data"]]
        self.assertNotIn("fake-cine-001", recommended_ids)
        self.assertNotIn("fake-cine-002", recommended_ids)
        self.assertTrue(payload["data"][0]["matched_signals"])

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == "recommendations@example.com").first()
            self.assertIsNotNone(user)
            view_count = db.query(MovieView).filter(MovieView.user_id == user.id).count()
            self.assertEqual(view_count, 1)
        finally:
            db.close()

    def test_authentication_missing_invalid_expired_and_missing_user(self):
        token = self.register_and_login(email="auth@example.com")

        missing = self.client.get("/history")
        self.assertEqual(missing.status_code, 401)
        self.assertEqual(missing.json()["message"], "Unauthorized")

        invalid = self.client.get("/dashboard", headers={"Authorization": "Bearer malformed.token"})
        self.assertEqual(invalid.status_code, 401)
        self.assertEqual(invalid.json()["message"], "Unauthorized")

        expired_token = create_access_token("1", expires_delta=timedelta(seconds=-1))
        expired = self.client.get("/movies/search", params={"title": "Neon"}, headers=self.auth_headers(expired_token))
        self.assertEqual(expired.status_code, 401)
        self.assertEqual(expired.json()["message"], "Unauthorized")

        missing_user_token = create_access_token("9999")
        missing_user = self.client.get("/history", headers=self.auth_headers(missing_user_token))
        self.assertEqual(missing_user.status_code, 404)
        self.assertEqual(missing_user.json()["message"], "User not found")

    def test_keyword_validation_and_type_checks(self):
        token = self.register_and_login(email="validation@example.com")

        empty_keyword = self.client.get(
            "/movies/search",
            params={"title": "   "},
            headers=self.auth_headers(token),
        )
        self.assertEqual(empty_keyword.status_code, 400, empty_keyword.text)
        self.assertEqual(empty_keyword.json()["message"], "Invalid request")
        self.assertEqual(empty_keyword.json()["errors"]["keyword"], "Keyword is required")

        oversized_keyword = self.client.get(
            "/movies/search",
            params={"title": "x" * 256},
            headers=self.auth_headers(token),
        )
        self.assertEqual(oversized_keyword.status_code, 400, oversized_keyword.text)
        self.assertEqual(oversized_keyword.json()["errors"]["keyword"], "Keyword must be 255 characters or fewer")

        with self.assertRaises(ValidationError):
            SearchKeywordQuery(title=123)


if __name__ == "__main__":
    unittest.main()
