from urllib.parse import quote


TELUGU_2025_MOVIES = [
    ("telugu-2025-001", "Game Changer", "10 Jan 2025", "Political, Action", "Shankar"),
    ("telugu-2025-002", "Daaku Maharaaj", "12 Jan 2025", "Action, Drama", "Bobby Kolli"),
    ("telugu-2025-003", "Sankranthiki Vasthunam", "14 Jan 2025", "Action, Comedy", "Anil Ravipudi"),
    ("telugu-2025-004", "Gandhi Tatha Chettu", "24 Jan 2025", "Drama", "Padmavathy Malladi"),
    ("telugu-2025-005", "Hathya", "24 Jan 2025", "Crime, Thriller", "Srividya Basava"),
    ("telugu-2025-006", "Pothugadda", "30 Jan 2025", "Thriller", "Raksha Veeran"),
    ("telugu-2025-007", "Coffee With A Killer", "31 Jan 2025", "Crime, Comedy", "R. P. Patnaik"),
    ("telugu-2025-008", "Thandel", "07 Feb 2025", "Romance, Action, Drama", "Chandoo Mondeti"),
    ("telugu-2025-009", "Brahma Anandam", "14 Feb 2025", "Comedy, Drama", "RVS Nikhil"),
    ("telugu-2025-010", "Laila", "14 Feb 2025", "Romance, Comedy", "Ram Narayan"),
    ("telugu-2025-011", "Nidurinchu Jahapana", "14 Feb 2025", "Drama", "Prasanna Kumar"),
    ("telugu-2025-012", "Mazaka", "26 Feb 2025", "Comedy, Drama", "Trinadha Rao Nakkina"),
    ("telugu-2025-013", "Return of the Dragon", "28 Feb 2025", "Action, Drama", "Ashwath Marimuthu"),
    ("telugu-2025-014", "W/O Anirvesh", "07 Mar 2025", "Drama", "Gangadhar Salimath"),
    ("telugu-2025-015", "Court: State vs A Nobody", "14 Mar 2025", "Legal, Drama", "Ram Jagadeesh"),
    ("telugu-2025-016", "Dilruba", "14 Mar 2025", "Romance, Drama", "Viswa Karun"),
    ("telugu-2025-017", "Raakshasa", "14 Mar 2025", "Horror, Thriller", "Kashi K"),
    ("telugu-2025-018", "Lamp", "14 Mar 2025", "Drama", "Rajashekar Raj"),
    ("telugu-2025-019", "Pelli Kani Prasad", "21 Mar 2025", "Comedy, Drama", "Abhilash Reddy"),
    ("telugu-2025-020", "Tuk Tuk", "21 Mar 2025", "Fantasy, Comedy", "Supreeth C Krishna"),
    ("telugu-2025-021", "Shanmukha", "21 Mar 2025", "Mystery, Thriller", "Shanumugam Sappani"),
    ("telugu-2025-022", "Robinhood", "28 Mar 2025", "Action, Comedy", "Venky Kudumula"),
    ("telugu-2025-023", "Mad Square", "28 Mar 2025", "Comedy", "Kalyan Shankar"),
    ("telugu-2025-024", "28 Degrees Celsius", "04 Apr 2025", "Romance, Thriller", "Anil Vishwanath"),
    ("telugu-2025-025", "LYF: Love Your Father", "04 Apr 2025", "Family, Drama", "Pavan Ketharaju"),
    ("telugu-2025-026", "Jack", "10 Apr 2025", "Action, Comedy", "Bommarillu Bhaskar"),
    ("telugu-2025-027", "Akkada Ammayi Ikkada Abbayi", "11 Apr 2025", "Romance, Comedy", "Nitin-Bharath"),
    ("telugu-2025-028", "Dear Uma", "18 Apr 2025", "Romance, Drama", "Sai Rajesh Mahadev"),
    ("telugu-2025-029", "Jagamerigina Satyam", "18 Apr 2025", "Drama", "Tirupathi Pale"),
    ("telugu-2025-030", "Madhuram", "18 Apr 2025", "Romance, Drama", "Rajesh Chikile"),
    ("telugu-2025-031", "Chaurya Paatam", "25 Apr 2025", "Crime, Comedy", "Nikhil Gollamari"),
    ("telugu-2025-032", "Sarangapani Jathakam", "25 Apr 2025", "Comedy, Drama", "Mohana Krishna Indraganti"),
    ("telugu-2025-033", "HIT: The Third Case", "01 May 2025", "Crime, Thriller", "Sailesh Kolanu"),
    ("telugu-2025-034", "Subham", "09 May 2025", "Horror, Comedy", "Praveen Kandregula"),
    ("telugu-2025-035", "Anaganaga", "15 May 2025", "Family, Drama", "Sunny Sanjay"),
    ("telugu-2025-036", "23", "16 May 2025", "Drama", "Raj Rachakonda"),
    ("telugu-2025-037", "Eleven", "16 May 2025", "Crime, Thriller", "Lokkesh Ajls"),
    ("telugu-2025-038", "Bhairavam", "30 May 2025", "Action, Drama", "Vijay Kanakamedala"),
    ("telugu-2025-039", "Ghatikachalam", "30 May 2025", "Psychological, Thriller", "Amar Kamepalli"),
    ("telugu-2025-040", "Badmashulu", "30 May 2025", "Comedy, Drama", "Shankar Cheguri"),
    ("telugu-2025-041", "Gamblers", "30 May 2025", "Crime, Thriller", "Kalyan Krishna"),
    ("telugu-2025-042", "Kannappa", "27 Jun 2025", "Mythological, Action", "Mukesh Kumar Singh"),
    ("telugu-2025-043", "Kuberaa", "20 Jun 2025", "Crime, Drama", "Sekhar Kammula"),
    ("telugu-2025-044", "8 Vasantalu", "20 Jun 2025", "Romance, Drama", "Phanindra Narsetti"),
    ("telugu-2025-045", "Uppu Kappurambu", "04 Jul 2025", "Comedy, Drama", "Ani I. V. Sasi"),
    ("telugu-2025-046", "Showtime", "04 Jul 2025", "Thriller", "M. S. Raju"),
    ("telugu-2025-047", "Solo Boy", "04 Jul 2025", "Romance, Drama", "P. Naveen Kumar"),
    ("telugu-2025-048", "Hari Hara Veera Mallu", "24 Jul 2025", "Period, Action", "Krish Jagarlamudi"),
    ("telugu-2025-049", "Ghaati", "05 Sep 2025", "Action, Drama", "Krish Jagarlamudi"),
    ("telugu-2025-050", "Mirai", "12 Sep 2025", "Fantasy, Action", "Karthik Gattamneni"),
]


TELUGU_POSTER_FILES = {
    "Game Changer": "Game Changer Telugu.jpg",
    "Daaku Maharaaj": "Daaku Maharaaj film poster.jpg",
    "Sankranthiki Vasthunam": "Sankranthiki Vasthunam.jpeg",
    "Gandhi Tatha Chettu": "Gandhi Tatha Chettu.jpg",
}

TELUGU_OVERRIDES = {
    "Game Changer": "8.6",
    "Daaku Maharaaj": "8.1",
    "Sankranthiki Vasthunam": "8.3",
    "Gandhi Tatha Chettu": "7.5",
}

TELUGU_PLOT_OVERRIDES = {
    "Game Changer": (
        "A hard-hitting political action epic about an IAS officer who takes on corruption, "
        "navigating power, protests, and explosive set pieces with intensity and style."
    ),
    "Daaku Maharaaj": (
        "A rustic action saga following a village engineer who becomes a heroic bandit, "
        "defending his people against corrupt landowners and violent injustice."
    ),
    "Sankranthiki Vasthunam": (
        "A festive action-comedy adventure where a retired cop, his family, and his ex-girlfriend "
        "team up to rescue a kidnapped CEO, blending drama with high-energy holiday humor."
    ),
    "Gandhi Tatha Chettu": (
        "A heartwarming drama about a girl inspired by Gandhian values who fights to protect "
        "her grandfather's cherished tree from greedy developers."
    ),
}


def _poster_url(title: str, genre: str) -> str:
    if title in TELUGU_POSTER_FILES:
        return f"https://en.wikipedia.org/wiki/Special:FilePath/{quote(TELUGU_POSTER_FILES[title])}?width=600"

    palette = {
        "action": ("f97316", "ffffff"),
        "comedy": ("eab308", "000000"),
        "drama": ("8b5cf6", "ffffff"),
        "romance": ("ec4899", "ffffff"),
        "thriller": ("0f172a", "ffffff"),
        "crime": ("0f172a", "ffffff"),
        "horror": ("0f172a", "ffffff"),
        "fantasy": ("14b8a6", "000000"),
    }
    key = next((k for k in palette if k in genre.lower()), "drama")
    bg, fg = palette[key]
    return f"https://placehold.co/600x900/{bg}/{fg}?text={quote(title)}&font=inter"


def _movie_rating(title: str) -> str:
    if title in TELUGU_OVERRIDES:
        return TELUGU_OVERRIDES[title]

    score = (sum(ord(c) for c in title if c.isalpha()) % 50) / 10 + 6.2
    score = min(8.9, round(score, 1))
    return f"{score:.1f}"


def _movie_plot(title: str, genre: str, director: str) -> str:
    if title in TELUGU_PLOT_OVERRIDES:
        return TELUGU_PLOT_OVERRIDES[title]

    genre_text = genre.lower()
    if "action" in genre_text:
        return (
            f"{title} detonates with high-octane action, political intrigue, and bold set pieces, "
            f"anchored by a fearless performance and direction from {director}."
        )
    if "comedy" in genre_text:
        return (
            f"{title} blends witty dialogue and uplifting moments into a comedy-filled adventure, "
            f"with a charming ensemble brought to life by {director}."
        )
    if "romance" in genre_text:
        return (
            f"{title} weaves a heartfelt romance through drama and longing, "
            f"telling a memorable love story under {director}'s warm direction."
        )
    if "thriller" in genre_text or "crime" in genre_text or "mystery" in genre_text:
        return (
            f"{title} unravels a tense crime thriller full of betrayal and dark secrets, "
            f"leading to a gripping finale from filmmaker {director}."
        )
    if "horror" in genre_text:
        return (
            f"{title} delivers suspense and chills with eerie imagery, "
            f"creating an unsettling experience guided by {director}."
        )
    return (
        f"{title} is a compelling {genre.lower()} story anchored by strong characters and vivid storytelling, "
        f"directed by {director}."
    )


def _movie_record(movie: tuple[str, str, str, str, str]) -> dict:
    imdb_id, title, released, genre, director = movie
    imdb_rating = _movie_rating(title)
    return {
        "imdb_id": imdb_id,
        "title": title,
        "year": "2025",
        "type": "movie",
        "poster": _poster_url(title, genre),
        "rated": "PG-13",
        "released": released,
        "runtime": "N/A",
        "genre": genre,
        "director": director,
        "writer": None,
        "actors": "N/A",
        "plot": _movie_plot(title, genre, director),
        "language": "Telugu",
        "country": "India",
        "imdb_rating": imdb_rating,
        "imdb_votes": "N/A",
        "box_office": "N/A",
        "total_seasons": None,
        "ratings": [{"Source": "CineVerse Local API", "Value": f"{imdb_rating}/10"}],
        "average_rating": float(imdb_rating) / 2 if imdb_rating and imdb_rating != 'N/A' else None,
    }


TELUGU_2025_MOVIE_RECORDS = [_movie_record(movie) for movie in TELUGU_2025_MOVIES]


def search_telugu_2025_movies(query: str = "", page: int = 1, page_size: int = 10) -> dict:
    normalized_query = query.strip().lower()
    if normalized_query:
        matches = [
            movie
            for movie in TELUGU_2025_MOVIE_RECORDS
            if normalized_query in movie["title"].lower()
            or normalized_query in movie["genre"].lower()
            or normalized_query in movie["director"].lower()
            or normalized_query in movie["year"]
            or normalized_query in "telugu movies 2025"
        ]
    else:
        matches = TELUGU_2025_MOVIE_RECORDS

    start = (page - 1) * page_size
    paged = matches[start : start + page_size]

    return {
        "title": query or "Telugu movies 2025",
        "page": page,
        "total_results": len(matches),
        "results": [
            {
                "imdb_id": movie["imdb_id"],
                "title": movie["title"],
                "year": movie["year"],
                "type": movie["type"],
                "poster": movie["poster"],
                "plot": movie["plot"],
                "imdb_rating": movie["imdb_rating"],
                "average_rating": movie.get("average_rating"),
            }
            for movie in paged
        ],
    }


def get_telugu_2025_movie_by_id(imdb_id: str) -> dict | None:
    return next((movie for movie in TELUGU_2025_MOVIE_RECORDS if movie["imdb_id"] == imdb_id), None)
