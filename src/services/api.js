import axios from 'axios';
import { fakeMovies, getFakeMovieDetails, getFakeMovies } from '../utils/fakeMovies';

const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
const API_ERROR =
  'Backend API is unavailable. Ensure FastAPI server is running and properly configured.';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

/**
 * Fetch movies from backend API
 * @param {string} searchTerm - Movie title to search for
 * @param {number} page - Page number (default: 1)
 * @returns {Promise} - Response from API
 */
export const searchMovies = async (searchTerm, page = 1) => {
  try {
    if (!searchTerm.trim()) {
      return {
        success: false,
        error: 'Please enter a search term',
        data: { Search: [], totalResults: '0' },
      };
    }

    const { data } = await apiClient.get('/movies/search', {
      params: {
        title: searchTerm,
        page,
      },
    });

    return {
      success: true,
      data: {
        Search: normalizeMovies(
          (data.results || []).map((movie) => ({
            imdbID: movie.imdb_id,
            Title: movie.title,
            Year: movie.year,
            Type: movie.type,
            Poster: movie.poster,
          }))
        ),
        totalResults: Number(data.total_results || 0),
      },
    };
  } catch (error) {
    console.error('Error fetching movies:', error);
    const fakeResults = getFakeMovies(searchTerm);

    if (fakeResults.length > 0) {
      return {
        success: true,
        isFallback: true,
        error: '',
        data: {
          Search: paginate(fakeResults, page),
          totalResults: fakeResults.length,
        },
      };
    }

    return {
      success: false,
      error: API_ERROR,
      data: { Search: [], totalResults: '0' },
    };
  }
};

/**
 * Fetch detailed movie information
 * @param {string} imdbID - IMDb ID of the movie
 * @returns {Promise} - Detailed movie data
 */
export const getMovieDetails = async (imdbID) => {
  try {
    const fakeMovie = getFakeMovieDetails(imdbID);

    if (fakeMovie) {
      return {
        success: true,
        data: fakeMovie,
      };
    }

    const { data } = await apiClient.get(`/movies/${imdbID}`);

    return {
      success: true,
      data: normalizeMovie({
        imdbID: data.imdb_id,
        Title: data.title,
        Year: data.year,
        Rated: data.rated,
        Released: data.released,
        Runtime: data.runtime,
        Genre: data.genre,
        Director: data.director,
        Writer: data.writer,
        Actors: data.actors,
        Plot: data.plot,
        Language: data.language,
        Country: data.country,
        Poster: data.poster,
        imdbRating: data.imdb_rating,
        imdbVotes: data.imdb_votes,
        BoxOffice: data.box_office,
        Type: data.type,
        totalSeasons: data.total_seasons,
        Ratings: data.ratings,
      }),
    };
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return {
      success: false,
      error: API_ERROR,
    };
  }
};

export const getMovieCollection = async (searchTerm, limit = 4) => {
  const result = await searchMovies(searchTerm, 1);

  return {
    success: result.success,
    data: result.success ? result.data.Search.slice(0, limit) : [],
    error: result.error,
  };
};

export const getHomeMovieSections = async () => {
  const [trending, popular] = await Promise.all([
    getMovieCollection('marvel', 4),
    getMovieCollection('batman', 4),
  ]);

  const fallbackTrending = fakeMovies.slice(0, 4);
  const fallbackPopular = fakeMovies.slice(4, 8);
  const featured = [
    ...(trending.data.length ? trending.data : fallbackTrending),
    ...(popular.data.length ? popular.data : fallbackPopular),
  ];

  return {
    success: true,
    data: {
      featured,
      trending: trending.data.length ? trending.data : fallbackTrending,
      popular: popular.data.length ? popular.data : fallbackPopular,
    },
    error: '',
  };
};

const normalizeMovies = (movies) =>
  movies.map((movie) => ({
    ...movie,
    imdbRating: movie.imdbRating || 'N/A',
  }));

const normalizeMovie = (movie) => ({
  ...movie,
  imdbRating: movie.imdbRating || 'N/A',
  Type: movie.Type || 'movie',
});

const paginate = (movies, page = 1, pageSize = 10) => {
  const start = (page - 1) * pageSize;
  return normalizeMovies(movies.slice(start, start + pageSize));
};
