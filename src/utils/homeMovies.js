export const HERO_MOVIE_STORAGE_KEY = 'cineverse:lastHeroMovieId';

export const normalizeFavorite = (favorite) => ({
  ...favorite,
  imdbID: favorite.imdbID || favorite.imdb_id,
  Title: favorite.Title || favorite.title,
  Year: favorite.Year || favorite.year,
  Poster: favorite.Poster || favorite.poster_url,
  Type: favorite.Type || favorite.type || 'movie',
});

export const normalizeFavoritesList = (favoriteList = []) => {
  const favoritesMap = new Map();

  favoriteList.forEach((favorite) => {
    const normalized = normalizeFavorite(favorite);
    if (normalized.imdbID) {
      favoritesMap.set(normalized.imdbID, normalized);
    }
  });

  return Array.from(favoritesMap.values());
};

export const toStoredFavorite = (movie) => ({
  imdbID: movie.imdbID,
  Title: movie.Title,
  Year: movie.Year,
  Poster: movie.Poster,
  Type: movie.Type || 'movie',
  imdbRating: movie.imdbRating,
  averageRating: movie.averageRating,
});

export const isUnauthorizedError = (message = '') => {
  const normalizedMessage = message.toLowerCase();
  return normalizedMessage.includes('unauthorized') || normalizedMessage.includes('login again');
};

export const normalizeMovieCard = (movie) => ({
  ...movie,
  imdbID: movie.imdbID || movie.imdb_id,
  Title: movie.Title || movie.title,
  Year: movie.Year || movie.year,
  Poster: movie.Poster || movie.poster || movie.poster_url,
  Type: movie.Type || movie.type || 'movie',
  Plot: movie.Plot || movie.plot,
  imdbRating: movie.imdbRating || movie.imdb_rating,
  averageRating: movie.averageRating ?? movie.average_rating ?? null,
});

export const normalizeCollections = (collections = []) =>
  collections.map((collection) => ({
    ...collection,
    movie_count: collection.movie_count ?? collection.movies?.length ?? 0,
    movies: Array.isArray(collection.movies) ? collection.movies : [],
  }));

export const getRandomHeroMovie = (movies = []) => {
  if (!movies.length) return null;

  let previousHeroId = '';
  try {
    previousHeroId = localStorage.getItem(HERO_MOVIE_STORAGE_KEY) || '';
  } catch {
    previousHeroId = '';
  }

  const candidateMovies = movies.length > 1
    ? movies.filter((movie) => movie.imdbID !== previousHeroId)
    : movies;
  const pool = candidateMovies.length ? candidateMovies : movies;
  const heroMovie = pool[Math.floor(Math.random() * pool.length)];

  try {
    if (heroMovie?.imdbID) {
      localStorage.setItem(HERO_MOVIE_STORAGE_KEY, heroMovie.imdbID);
    }
  } catch {
    // Ignore storage restrictions; random selection still works for this page load.
  }

  return heroMovie;
};
