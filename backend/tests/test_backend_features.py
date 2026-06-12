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
from app.models.review import Review  # noqa: E402
from app.models.search_history import SearchHistory  # noqa: E402
from app.models.watchlist import Watchlist  # noqa: E402
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

    def test_watchlist_crud_uses_authenticated_user_scope(self):
        token = self.register_and_login(email="watchlist@example.com")
        payload = {
            "imdb_id": "fake-cine-004",
            "title": "Skyline Echo",
            "year": "2026",
            "poster_url": "https://example.com/watchlist.jpg",
        }

        created = self.client.post(
            "/watchlist",
            json=payload,
            headers=self.auth_headers(token),
        )
        self.assertEqual(created.status_code, 201, created.text)
        self.assertEqual(created.json()["movie_id"], payload["imdb_id"])
        self.assertEqual(created.json()["imdb_id"], payload["imdb_id"])

        duplicate = self.client.post(
            "/watchlist",
            json=payload,
            headers=self.auth_headers(token),
        )
        self.assertEqual(duplicate.status_code, 409, duplicate.text)
        self.assertEqual(duplicate.json()["message"], "Movie already in watchlist")

        listed = self.client.get("/watchlist", headers=self.auth_headers(token))
        self.assertEqual(listed.status_code, 200, listed.text)
        self.assertEqual(len(listed.json()), 1)
        self.assertEqual(listed.json()[0]["movie_id"], payload["imdb_id"])
        self.assertTrue(listed.json()[0]["title"])

        deleted = self.client.delete(
            f"/watchlist/{payload['imdb_id']}",
            headers=self.auth_headers(token),
        )
        self.assertEqual(deleted.status_code, 204, deleted.text)

        empty = self.client.get("/watchlist", headers=self.auth_headers(token))
        self.assertEqual(empty.status_code, 200, empty.text)
        self.assertEqual(empty.json(), [])

    def test_watchlist_add_does_not_depend_on_fallback_catalog(self):
        token = self.register_and_login(email="watchlist-nonfallback@example.com")
        payload = {
            "imdb_id": "tt9999999",
            "title": "Out of Catalog",
            "year": "2026",
            "poster_url": "https://example.com/out-of-catalog.jpg",
        }

        created = self.client.post(
            "/watchlist",
            json=payload,
            headers=self.auth_headers(token),
        )
        self.assertEqual(created.status_code, 201, created.text)
        body = created.json()
        self.assertEqual(body["movie_id"], payload["imdb_id"])
        self.assertEqual(body["title"], payload["title"])
        self.assertEqual(body["year"], payload["year"])
        self.assertEqual(body["poster_url"], payload["poster_url"])

    def test_watchlist_is_scoped_to_each_user(self):
        token_a = self.register_and_login(email="watchlist-a@example.com")
        token_b = self.register_and_login(email="watchlist-b@example.com")

        movie_a = {
            "imdb_id": "fake-cine-001",
            "title": "Neon Horizon",
            "year": "2026",
            "poster_url": "https://example.com/a.jpg",
        }
        movie_b = {
            "imdb_id": "fake-cine-002",
            "title": "Midnight Solaris",
            "year": "2025",
            "poster_url": "https://example.com/b.jpg",
        }

        response_a = self.client.post("/watchlist", json=movie_a, headers=self.auth_headers(token_a))
        response_b = self.client.post("/watchlist", json=movie_b, headers=self.auth_headers(token_b))
        self.assertEqual(response_a.status_code, 201, response_a.text)
        self.assertEqual(response_b.status_code, 201, response_b.text)

        list_a = self.client.get("/watchlist", headers=self.auth_headers(token_a))
        list_b = self.client.get("/watchlist", headers=self.auth_headers(token_b))
        self.assertEqual([item["movie_id"] for item in list_a.json()], [movie_a["imdb_id"]])
        self.assertEqual([item["movie_id"] for item in list_b.json()], [movie_b["imdb_id"]])

        delete_b_on_a = self.client.delete(f"/watchlist/{movie_b['imdb_id']}", headers=self.auth_headers(token_a))
        self.assertEqual(delete_b_on_a.status_code, 404, delete_b_on_a.text)
        self.assertEqual(delete_b_on_a.json()["message"], "Watchlist movie not found")

        db = SessionLocal()
        try:
            user_a = db.query(User).filter(User.email == "watchlist-a@example.com").first()
            user_b = db.query(User).filter(User.email == "watchlist-b@example.com").first()
            self.assertIsNotNone(user_a)
            self.assertIsNotNone(user_b)
            self.assertEqual(db.query(Watchlist).filter(Watchlist.user_id == user_a.id).count(), 1)
            self.assertEqual(db.query(Watchlist).filter(Watchlist.user_id == user_b.id).count(), 1)
        finally:
            db.close()

    def test_reviews_support_crud_and_average_rating(self):
        token_a = self.register_and_login(email="review-a@example.com")
        token_b = self.register_and_login(email="review-b@example.com")
        movie_id = "fake-cine-001"

        create_a = self.client.post(
            "/reviews",
            json={"imdb_id": movie_id, "review": "Strong opening and great pacing.", "rating": 4},
            headers=self.auth_headers(token_a),
        )
        self.assertEqual(create_a.status_code, 201, create_a.text)
        self.assertEqual(create_a.json()["average_rating"], 4.0)

        duplicate_a = self.client.post(
            "/reviews",
            json={"imdb_id": movie_id, "review": "Another take.", "rating": 5},
            headers=self.auth_headers(token_a),
        )
        self.assertEqual(duplicate_a.status_code, 409, duplicate_a.text)
        self.assertEqual(duplicate_a.json()["message"], "Review already exists for this movie")

        create_b = self.client.post(
            "/reviews",
            json={"imdb_id": movie_id, "review": "Liked the visuals.", "rating": 2},
            headers=self.auth_headers(token_b),
        )
        self.assertEqual(create_b.status_code, 201, create_b.text)
        self.assertEqual(create_b.json()["average_rating"], 3.0)

        detail_a = self.client.get(f"/movies/{movie_id}", headers=self.auth_headers(token_a))
        self.assertEqual(detail_a.status_code, 200, detail_a.text)
        self.assertEqual(detail_a.json()["user_rating"], 4)
        self.assertEqual(detail_a.json()["community_average_rating"], 2.0)
        self.assertEqual(detail_a.json()["average_rating"], 2.0)

        detail_b = self.client.get(f"/movies/{movie_id}", headers=self.auth_headers(token_b))
        self.assertEqual(detail_b.status_code, 200, detail_b.text)
        self.assertEqual(detail_b.json()["user_rating"], 2)
        self.assertEqual(detail_b.json()["community_average_rating"], 4.0)
        self.assertEqual(detail_b.json()["average_rating"], 4.0)

        my_review = self.client.get(f"/reviews/{movie_id}", headers=self.auth_headers(token_a))
        self.assertEqual(my_review.status_code, 200, my_review.text)
        self.assertEqual(my_review.json()["review"], "Strong opening and great pacing.")
        self.assertEqual(my_review.json()["average_rating"], 3.0)

        listed = self.client.get("/reviews", params={"imdb_id": movie_id}, headers=self.auth_headers(token_a))
        self.assertEqual(listed.status_code, 200, listed.text)
        payload = listed.json()
        self.assertEqual(payload["total"], 2)
        self.assertEqual(payload["average_rating"], 3.0)
        self.assertEqual(len(payload["items"]), 2)

        updated = self.client.patch(
            f"/reviews/{movie_id}",
            json={"review": "Updated thoughts after a second watch.", "rating": 5},
            headers=self.auth_headers(token_a),
        )
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertEqual(updated.json()["average_rating"], 3.5)
        self.assertEqual(updated.json()["rating"], 5)

        deleted = self.client.delete(f"/reviews/{movie_id}", headers=self.auth_headers(token_b))
        self.assertEqual(deleted.status_code, 204, deleted.text)

        remaining = self.client.get("/reviews", params={"imdb_id": movie_id}, headers=self.auth_headers(token_a))
        self.assertEqual(remaining.status_code, 200, remaining.text)
        remaining_payload = remaining.json()
        self.assertEqual(remaining_payload["total"], 1)
        self.assertEqual(remaining_payload["average_rating"], 5.0)

        db = SessionLocal()
        try:
            user_a = db.query(User).filter(User.email == "review-a@example.com").first()
            user_b = db.query(User).filter(User.email == "review-b@example.com").first()
            self.assertIsNotNone(user_a)
            self.assertIsNotNone(user_b)
            self.assertEqual(db.query(Review).filter(Review.user_id == user_a.id, Review.imdb_id == movie_id).count(), 1)
            self.assertEqual(db.query(Review).filter(Review.user_id == user_b.id, Review.imdb_id == movie_id).count(), 0)
        finally:
            db.close()

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

    def test_profile_view_update_and_password_change(self):
        token = self.register_and_login(email="profile@example.com", password="Password123")
        headers = self.auth_headers(token)

        profile = self.client.get("/profile", headers=headers)
        self.assertEqual(profile.status_code, 200, profile.text)
        self.assertEqual(profile.json()["email"], "profile@example.com")

        updated = self.client.patch(
            "/profile",
            json={"email": "new-profile@example.com"},
            headers=headers,
        )
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertEqual(updated.json()["email"], "new-profile@example.com")

        duplicate_owner = self.register_and_login(email="owner@example.com", password="Password123")
        duplicate = self.client.patch(
            "/profile",
            json={"email": "owner@example.com"},
            headers=self.auth_headers(token),
        )
        self.assertEqual(duplicate.status_code, 409, duplicate.text)
        self.assertEqual(duplicate.json()["message"], "Email is already registered")

        weak_password = self.client.patch(
            "/profile/password",
            json={"current_password": "Password123", "new_password": "short"},
            headers=self.auth_headers(token),
        )
        self.assertEqual(weak_password.status_code, 400, weak_password.text)
        self.assertEqual(weak_password.json()["errors"]["new_password"], "Password must be between 8 and 128 characters")

        wrong_current = self.client.patch(
            "/profile/password",
            json={"current_password": "WrongPass123", "new_password": "Newpass123"},
            headers=self.auth_headers(token),
        )
        self.assertEqual(wrong_current.status_code, 400, wrong_current.text)
        self.assertEqual(wrong_current.json()["message"], "Current password is incorrect")

        changed = self.client.patch(
            "/profile/password",
            json={"current_password": "Password123", "new_password": "Newpass123"},
            headers=self.auth_headers(token),
        )
        self.assertEqual(changed.status_code, 200, changed.text)
        self.assertEqual(changed.json()["message"], "Password updated successfully")

        old_login = self.client.post("/login", json={"email": "new-profile@example.com", "password": "Password123"})
        self.assertEqual(old_login.status_code, 401, old_login.text)

        new_login = self.client.post("/login", json={"email": "new-profile@example.com", "password": "Newpass123"})
        self.assertEqual(new_login.status_code, 200, new_login.text)

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

    def test_register_rejects_weak_passwords(self):
        response = self.client.post(
            "/register",
            json={"email": "weak@example.com", "password": "weakpass"},
        )
        self.assertEqual(response.status_code, 400, response.text)
        self.assertEqual(response.json()["errors"]["password"], "Password must include at least one number")


if __name__ == "__main__":
    unittest.main()
