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

Swagger docs are available at `/docs`.
