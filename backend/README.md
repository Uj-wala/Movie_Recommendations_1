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
   uvicorn app.main:app --reload --port 8000
   ```

## Main Endpoints
- POST /register
- POST /login
- GET /profile (auth)
- PATCH /profile (auth)
- PATCH /profile/password (auth)
- GET /movies/search?title=batman
- GET /movies/{imdb_id}
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
- Deleting reviews
- Viewing platform statistics

Suggested admin endpoints:
- GET /admin/users
- DELETE /admin/reviews/{review_id}
- GET /admin/stats

Recommended access rules:
- Only authenticated users with the admin role can access these endpoints
- Non-admin users must receive a 403 Forbidden response
- Deleting a review should remove it from the reviews table and update any related statistics

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

Password rules:
- Minimum 8 characters
- Maximum 128 characters
- Must contain at least one letter
- Must contain at least one number

Swagger docs are available at `/docs`.
