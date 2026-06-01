import axios from 'axios';
import { fakeMovies, getFakeMovieDetails, getFakeMovies } from '../utils/fakeMovies';

const API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8000';
const API_ERROR =
  'Backend API is unavailable. Ensure FastAPI server is running and properly configured.';
const AUTH_TOKEN_KEY = 'authToken';
const USER_EMAIL_KEY = 'authEmail';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

export const setAuthorizationHeader = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

// Clear frontend auth if backend replies with 401 (invalid or expired token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_EMAIL_KEY);
      } catch (e) {
        // ignore
      }
      delete apiClient.defaults.headers.common.Authorization;
      try {
        window.dispatchEvent(new Event('cineverse:auth_cleared'));
      } catch (e) {
        // ignore in non-browser environments
      }
    }
    return Promise.reject(error);
  }
);

export const storeAuth = (token, email) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_EMAIL_KEY, email);
  setAuthorizationHeader(token);
};

export const clearAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  setAuthorizationHeader(null);
};

export const getStoredAuth = () => ({
  token: localStorage.getItem(AUTH_TOKEN_KEY) || '',
  email: localStorage.getItem(USER_EMAIL_KEY) || '',
});

const getResponseError = (response) => {
  const data = response?.data;
  if (!data) return null;

  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) return data.detail.map((item) => item?.msg || item).join(' ');
  if (typeof data.message === 'string') return data.message;
  if (Array.isArray(data.errors)) return data.errors.map((err) => err?.msg || JSON.stringify(err)).join(' ');
  if (typeof data === 'string') return data;
  return null;
};

const formatError = (error) => {
  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out while contacting the backend. Please confirm the backend is running and try again.';
  }

  const responseError = getResponseError(error?.response);
  if (responseError) {
    return responseError;
  }

  if (error?.response?.status === 401) {
    return 'Unauthorized request. Please login again.';
  }

  if (error?.response?.status === 403) {
    return 'Forbidden request. Please check your permissions.';
  }

  if (error?.response?.statusText) {
    return error.response.statusText;
  }

  if (error?.message) {
    return error.message;
  }

  return API_ERROR;
};

export const registerUser = async (email, password) => {
  try {
    const { data } = await apiClient.post('/register', { email, password });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const loginUser = async (email, password) => {
  try {
    const { data } = await apiClient.post('/login', { email, password });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const getFavorites = async () => {
  try {
    const { data } = await apiClient.get('/favorites');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const addFavorite = async (movie) => {
  try {
    const payload = {
      imdb_id: movie.imdbID,
      title: movie.Title,
      year: movie.Year,
      poster_url: movie.Poster,
    };
    const { data } = await apiClient.post('/favorites', payload);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const removeFavorite = async (imdbID) => {
  try {
    await apiClient.delete(`/favorites/${imdbID}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const getMovieReviews = async (imdbID, page = 1, pageSize = 5) => {
  try {
    const { data } = await apiClient.get('/reviews', {
      params: { imdb_id: imdbID, page, page_size: pageSize },
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const addReview = async (imdbID, review, rating) => {
  try {
    const { data } = await apiClient.post('/reviews', {
      imdb_id: imdbID,
      review,
      rating,
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const updateReview = async (imdbID, review, rating) => {
  try {
    const { data } = await apiClient.patch(`/reviews/${imdbID}`, {
      review,
      rating,
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const deleteReview = async (imdbID) => {
  try {
    await apiClient.delete(`/reviews/${imdbID}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

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
      error: formatError(error),
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
        averageRating: data.average_rating,
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
      error: formatError(error),
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
    // Provide a unified averageRating (1-5) for UI; prefer explicit value otherwise convert IMDb 1-10 -> 1-5
    averageRating:
      movie.averageRating != null
        ? movie.averageRating
        : movie.imdbRating && movie.imdbRating !== 'N/A'
        ? Number.parseFloat(movie.imdbRating) / 2
        : null,
  }));

const normalizeMovie = (movie) => ({
  ...movie,
  imdbRating: movie.imdbRating || 'N/A',
  averageRating:
    movie.averageRating != null
      ? movie.averageRating
      : movie.imdbRating && movie.imdbRating !== 'N/A'
      ? Number.parseFloat(movie.imdbRating) / 2
      : null,
  Type: movie.Type || 'movie',
});

const paginate = (movies, page = 1, pageSize = 10) => {
  const start = (page - 1) * pageSize;
  return normalizeMovies(movies.slice(start, start + pageSize));
};
