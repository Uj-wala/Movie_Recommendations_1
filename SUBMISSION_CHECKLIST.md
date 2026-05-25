# Submission Checklist and Exact Outputs

## 1) What you need to submit

- GitHub repository link
- API testing screenshots (Swagger or Postman)
- Frontend + backend integration screenshots
- Short implementation summary

## 2) Where to check in the current website folder

- Frontend movie API client: src/services/api.js
- Backend app entrypoint: backend/app/main.py
- Auth routes: backend/app/routes/auth.py
- Movie routes: backend/app/routes/movies.py
- Favorites routes: backend/app/routes/favorites.py
- Database models: backend/app/models/user.py, backend/app/models/favorite.py
- Schemas/validation: backend/app/schemas/
- Backend dependencies: backend/requirements.txt
- Frontend env values: .env
- Backend env sample: backend/.env.example

## 3) Exact outputs you should expect

### Health

GET /
- Status: 200
- Body:
  {
    "status": "ok",
    "message": "Movie Recommendation API is running"
  }

### Register

POST /register
Request body:
{
  "email": "demo@example.com",
  "password": "password123"
}
- Status: 201
- Body includes: id, email

### Login

POST /login
Request body:
{
  "email": "demo@example.com",
  "password": "password123"
}
- Status: 200
- Body includes: access_token, token_type="bearer"

### Search movies

GET /movies/search?title=batman&page=1
- Status: 200
- Body includes: title, page, total_results, results[]

### Movie details

GET /movies/{imdb_id}
- Status: 200
- Body includes: imdb_id, title, year, plot, actors, ratings

### Add favorite (authorized)

POST /favorites
Headers: Authorization: Bearer <token>
Request body:
{
  "imdb_id": "tt0111161",
  "title": "The Shawshank Redemption",
  "year": "1994",
  "poster_url": "N/A"
}
- Status: 201

### List favorites (authorized)

GET /favorites
Headers: Authorization: Bearer <token>
- Status: 200
- Body: array of favorites

### Delete favorite (authorized)

DELETE /favorites/{movie_id}
Headers: Authorization: Bearer <token>
- Status: 204

## 4) How to run and verify quickly

Backend terminal:
1. cd backend
2. python -m pip install -r requirements.txt
3. python -m uvicorn app.main:app --reload --port 8000

Frontend terminal:
1. cd .. (project root)
2. npm install
3. npm run dev

Open:
- Frontend: http://localhost:5173 (or the port shown by Vite, e.g. 5174)
- Backend docs: http://localhost:8000/docs

## 5) Screenshots to take

- Swagger page loaded at /docs
- Successful /register response
- Successful /login response with token
- Successful /movies/search response
- Successful /favorites add/list/delete responses
- Frontend home page with movie cards visible
- Frontend movie details modal open
- Frontend favorites/watchlist visible

## 6) Important note about OMDb key

- If OMDb key is missing, backend currently uses fallback movie data so app still works without 500 errors.
- For real OMDb data, set a real key in .env and restart backend and frontend.
