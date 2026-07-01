# FastAPI Backend

This backend powers movie search, watchlist management, and favorites compatibility for the Movie Recommendation App.

## Stack
- FastAPI
- SQLite + SQLAlchemy
- Pydantic
- JWT Authentication
- OMDb API integration

## Setup
1. Create and activate a virtual environment
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create `.env` from `.env.example` and set your values
4. Run the API:
   ```bash
   python -m uvicorn app.main:app --port 8000
   ```
   From the outer downloaded folder, you can also run:
   ```powershell
   .\start-backend.bat
   ```
   If your local Python allows Uvicorn reload without Windows permission errors, add `--reload --reload-dir app` while working inside `backend/`.

## Main Endpoints
- POST /register
- POST /login
- POST /reset-password/request
- POST /reset-password/confirm
- GET /profile (auth)
- PATCH /profile (auth)
- PATCH /profile/password (auth)
- GET /movies/search?title=batman
- GET /movies/{imdb_id}
- GET /movies/compare?movie1=fake-cine-001&movie2=fake-cine-002
- POST /watchlist (auth)
- GET /watchlist (auth)
- DELETE /watchlist/{movieId} (auth)
- POST /favorites (auth)
- GET /favorites (auth)
- DELETE /favorites/{movie_id} (auth)
- GET /dashboard (auth)
- GET /history?page=1&limit=10 (auth)
- GET /recommendations?limit=10 (auth)

## Admin Requirements
The backend should also support an admin role with elevated permissions for platform moderation and monitoring.

Developed APIs for:
- Viewing users
- Deleting users
- Updating user roles
- Deleting reviews
- Viewing platform statistics
- Viewing admin activity logs

Suggested admin endpoints:
- GET /admin/users
- PATCH /admin/users/{user_id}/role
- DELETE /admin/users/{user_id}
- DELETE /admin/reviews/{review_id}
- GET /admin/stats
- GET /admin/activity-logs

Recommended access rules:
- Only authenticated users with the admin role can access these endpoints
- Non-admin users must receive a 403 Forbidden response
- Deleting a review should remove it from the reviews table and update any related statistics
- Admin mutations should write an audit log entry with the actor, action, target entity, and timestamp

## Database Changes
- `watchlist` table
  - `id`
  - `user_id`
  - `movie_id`
  - `created_at`

Dashboard response:
```json
{
  "total_favorites": 12,
  "total_reviews": 8,
  "most_searched_movie": "Batman",
  "most_searched_movie_count": 35
}
```

Search history response:
```json
{
  "success": true,
  "data": [
    { "keyword": "Batman", "searched_at": "2026-06-04T10:00:00Z" }
  ],
  "page": 1,
  "limit": 10,
  "total": 1,
  "total_pages": 1
}
```

Recommendations response:
```json
{
  "success": true,
  "data": [
    {
      "imdb_id": "fake-cine-003",
      "title": "Chrome Dynasty",
      "year": "2024",
      "type": "movie",
      "poster": "https://...",
      "score": 18.4,
      "matched_signals": ["action", "superhero"],
      "reason": "Matches your action, superhero preferences."
    }
  ],
  "total": 1,
  "seed_terms": ["action", "superhero"],
  "sources": ["favorites", "search_history", "previously_viewed"],
  "preferred_genres": ["action", "superhero", "thriller"]
}
```

The recommendations endpoint returns the list under `data` in the live API, not `recommended_movies`. If you need a one-item example, it looks like this:
```json
{
  "success": true,
  "data": [
    {
      "title": "The Dark Knight",
      "genre": "Action",
      "reason": "Based on your search history"
    }
  ]
}
```

Common error responses:
```json
{ "success": false, "message": "Invalid request" }
{ "success": false, "message": "User not found" }
{ "success": false, "message": "Unauthorized" }
```

## Movie Comparison API
Route/controller:
- `GET /movies/compare?movie1=<movieId>&movie2=<movieId>`
- Implemented in `app/routes/movies.py`
- Requires both `movie1` and `movie2` query parameters
- Valid movie id formats are `tt1234567`, `fake-cine-001`, and `telugu-2025-001`

Service and database logic:
- Comparison logic lives in `app/services/movie_compare_service.py`
- Movie details are resolved through the existing local Telugu catalog and OMDb/fallback movie lookup layer
- Review statistics are read from the SQLite `reviews` table by `imdb_id`
- A malformed or missing id returns `400`
- A valid id that cannot be resolved returns `404`
- Unexpected database/server failures are handled by the shared exception middleware and return `500`

Sample request:
```http
GET /movies/compare?movie1=fake-cine-001&movie2=fake-cine-002
```

Sample success response:
```json
{
  "movie1": {
    "movie": {
      "imdb_id": "fake-cine-001",
      "title": "Neon Horizon",
      "year": "2026",
      "runtime": "128 min",
      "genre": "Sci-Fi, Thriller",
      "imdb_rating": "8.4",
      "average_rating": 4.5
    },
    "average_user_rating": 4.5,
    "total_reviews": 2
  },
  "movie2": {
    "movie": {
      "imdb_id": "fake-cine-002",
      "title": "Midnight Solaris",
      "year": "2025",
      "runtime": "116 min",
      "genre": "Adventure, Mystery",
      "imdb_rating": "7.9",
      "average_rating": 3.0
    },
    "average_user_rating": 3.0,
    "total_reviews": 1
  },
  "summary": {
    "rating": { "movie1": 4.5, "movie2": 3.0, "difference": 1.5, "winner": "movie1" },
    "release_year": { "movie1": 2026, "movie2": 2025, "difference": 1.0, "winner": "movie1" },
    "duration_minutes": { "movie1": 128, "movie2": 116, "difference": 12.0, "winner": "movie1" },
    "genres": {
      "common": [],
      "only_movie1": ["Sci-Fi", "Thriller"],
      "only_movie2": ["Adventure", "Mystery"]
    },
    "attributes": [
      { "field": "rated", "movie1": "PG-13", "movie2": "PG-13", "same": true }
    ],
    "highlights": [
      "Neon Horizon has the higher rating.",
      "Neon Horizon has the newer release year.",
      "Neon Horizon has the longer runtime."
    ]
  }
}
```

Sample error responses:
```json
{ "success": false, "message": "Invalid request", "errors": { "movie1": "Invalid movie id" } }
{ "success": false, "message": "Movie not found: fake-cine-999" }
```

Password rules:
- Minimum 8 characters
- Maximum 128 characters
- Must contain at least one letter
- Must contain at least one number

## Gmail Password Reset Email
Password reset creates a one-time link. When Gmail SMTP is configured, the backend sends that link to the email entered on the reset password page. If email delivery is not configured in local development, the API returns a manual reset link in the response so the frontend can show it.

Set these values in `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-gmail-address@gmail.com
SMTP_PASSWORD=your-16-character-google-app-password
SMTP_FROM_EMAIL=your-gmail-address@gmail.com
SMTP_USE_TLS=true
```

Important: Gmail requires a Google App Password for SMTP. A normal Gmail password will not work. After changing `.env`, restart the FastAPI backend.

Reset flow:
1. `POST /reset-password/request` with `{ "email": "user@example.com" }`
2. The user opens `/reset-password?token=...`
3. `POST /reset-password/confirm` with `{ "token": "...", "new_password": "Newpass123" }`

Swagger docs are available at `/docs`.
