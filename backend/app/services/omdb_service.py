import os
from pathlib import Path

import httpx
from fastapi import HTTPException, status
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / '.env')
load_dotenv(BASE_DIR.parent / '.env')


FALLBACK_MOVIES = [
    {
        "imdb_id": "fake-cine-001",
        "title": "Neon Horizon",
        "year": "2026",
        "type": "movie",
        "poster": "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=600&q=80",
        "rated": "PG-13",
        "released": "14 Feb 2026",
        "runtime": "128 min",
        "genre": "Sci-Fi, Thriller",
        "director": "Ava Sterling",
        "writer": "Ava Sterling",
        "actors": "Mira Vale, Jaxon Reed, Sol Kim",
        "plot": "A rogue pilot follows a signal beyond the city shield and discovers a luminous machine rewriting human memory.",
        "language": "English",
        "country": "USA",
        "imdb_rating": "8.4",
        "imdb_votes": "82,100",
        "box_office": "$142,000,000",
        "total_seasons": None,
        "ratings": [{"Source": "CineVerse", "Value": "8.4/10"}],
    },
    {
        "imdb_id": "fake-cine-002",
        "title": "Midnight Solaris",
        "year": "2025",
        "type": "movie",
        "poster": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80",
        "rated": "PG-13",
        "released": "09 Aug 2025",
        "runtime": "116 min",
        "genre": "Adventure, Mystery",
        "director": "Rhea Novak",
        "writer": "Rhea Novak",
        "actors": "Nolan Crest, Isha Rao, Theo Vance",
        "plot": "A rescue crew reaches a silent orbital station where every sunrise reveals a different version of Earth.",
        "language": "English",
        "country": "USA",
        "imdb_rating": "7.9",
        "imdb_votes": "61,300",
        "box_office": "$97,400,000",
        "total_seasons": None,
        "ratings": [{"Source": "CineVerse", "Value": "7.9/10"}],
    },
    {
        "imdb_id": "fake-cine-003",
        "title": "Chrome Dynasty",
        "year": "2024",
        "type": "movie",
        "poster": "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=600&q=80",
        "rated": "R",
        "released": "22 Nov 2024",
        "runtime": "142 min",
        "genre": "Action, Cyberpunk",
        "director": "Kai Mercer",
        "writer": "Kai Mercer",
        "actors": "Lena Frost, Marco Yuen, Aria Vale",
        "plot": "In a vertical megacity, a courier carrying forbidden code becomes the target of every syndicate in the skyline.",
        "language": "English",
        "country": "USA",
        "imdb_rating": "8.1",
        "imdb_votes": "73,420",
        "box_office": "$121,300,000",
        "total_seasons": None,
        "ratings": [{"Source": "CineVerse", "Value": "8.1/10"}],
    },
    {
        "imdb_id": "fake-cine-004",
        "title": "The Last Star Arcade",
        "year": "2023",
        "type": "movie",
        "poster": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80",
        "rated": "PG",
        "released": "03 Jun 2023",
        "runtime": "104 min",
        "genre": "Fantasy, Comedy",
        "director": "Milo Kade",
        "writer": "Milo Kade",
        "actors": "Tara Quinn, Benji Moss, Elle Stone",
        "plot": "A forgotten arcade cabinet pulls four friends into an intergalactic tournament where losing means staying pixelated forever.",
        "language": "English",
        "country": "USA",
        "imdb_rating": "7.7",
        "imdb_votes": "49,870",
        "box_office": "$76,800,000",
        "total_seasons": None,
        "ratings": [{"Source": "CineVerse", "Value": "7.7/10"}],
    },
]


def _get_api_key() -> str | None:
    omdb_api_key = os.getenv("OMDB_API_KEY") or os.getenv("VITE_OMDB_API_KEY")
    if not omdb_api_key or omdb_api_key == "your_api_key_here":
        return None
    return omdb_api_key


def _get_api_url() -> str:
    return os.getenv("OMDB_API_URL") or os.getenv("VITE_OMDB_API_URL") or "https://www.omdbapi.com"


async def search_movies(title: str, page: int = 1) -> dict:
    api_key = _get_api_key()
    if not api_key:
        query = title.strip().lower()
        matches = [
            movie
            for movie in FALLBACK_MOVIES
            if query in movie["title"].lower() or query in movie["year"].lower()
        ]
        if not matches:
            matches = FALLBACK_MOVIES

        page_size = 10
        start = (page - 1) * page_size
        paged = matches[start : start + page_size]

        return {
            "title": title,
            "page": page,
            "total_results": len(matches),
            "results": [
                {
                    "imdb_id": movie["imdb_id"],
                    "title": movie["title"],
                    "year": movie["year"],
                    "type": movie["type"],
                    "poster": movie["poster"],
                }
                for movie in paged
            ],
        }

    params = {
        "apikey": api_key,
        "s": title,
        "page": page,
        "type": "movie",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(_get_api_url(), params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach OMDb service",
        ) from exc

    if data.get("Response") == "False":
        message = data.get("Error", "Movie not found")
        if message.lower().startswith("movie not found"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    raw_movies = data.get("Search", [])
    return {
        "title": title,
        "page": page,
        "total_results": int(data.get("totalResults", 0)),
        "results": [
            {
                "imdb_id": movie.get("imdbID", ""),
                "title": movie.get("Title", ""),
                "year": movie.get("Year", ""),
                "type": movie.get("Type", "movie"),
                "poster": movie.get("Poster", "N/A"),
            }
            for movie in raw_movies
        ],
    }


async def get_movie_by_imdb_id(imdb_id: str) -> dict:
    api_key = _get_api_key()
    if not api_key:
        fallback_movie = next((movie for movie in FALLBACK_MOVIES if movie["imdb_id"] == imdb_id), None)
        if not fallback_movie:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Movie not found in fallback data. Configure OMDb key for full catalog.",
            )
        return fallback_movie

    params = {
        "apikey": api_key,
        "i": imdb_id,
        "plot": "full",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(_get_api_url(), params=params)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to reach OMDb service",
        ) from exc

    if data.get("Response") == "False":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found")

    return {
        "imdb_id": data.get("imdbID", ""),
        "title": data.get("Title", ""),
        "year": data.get("Year", ""),
        "rated": data.get("Rated"),
        "released": data.get("Released"),
        "runtime": data.get("Runtime"),
        "genre": data.get("Genre"),
        "director": data.get("Director"),
        "writer": data.get("Writer"),
        "actors": data.get("Actors"),
        "plot": data.get("Plot"),
        "language": data.get("Language"),
        "country": data.get("Country"),
        "poster": data.get("Poster"),
        "imdb_rating": data.get("imdbRating"),
        "imdb_votes": data.get("imdbVotes"),
        "box_office": data.get("BoxOffice"),
        "type": data.get("Type"),
        "total_seasons": data.get("totalSeasons"),
        "ratings": data.get("Ratings", []),
    }
