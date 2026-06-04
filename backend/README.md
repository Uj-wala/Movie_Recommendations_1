# FastAPI Backend

This backend powers movie search and favorites for the Movie Recommendation App.

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
- GET /movies/search?title=batman
- GET /movies/{imdb_id}
- POST /favorites (auth)
- GET /favorites (auth)
- DELETE /favorites/{movie_id} (auth)
- GET /dashboard (auth)
- GET /history?page=1&limit=10 (auth)

Dashboard response:
```json
{
  "total_favorites": 12,
  "total_searches": 35,
  "recent_searches": ["Batman", "Interstellar", "Avatar"]
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

Common error responses:
```json
{ "success": false, "message": "Invalid request" }
{ "success": false, "message": "User not found" }
{ "success": false, "message": "Unauthorized" }
```

Swagger docs are available at `/docs`.
