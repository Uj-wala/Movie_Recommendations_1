import axios from 'axios';
import { fakeMovies, getFakeMovieDetails, getFakeMovies } from '../utils/fakeMovies';

const configuredApiUrl = import.meta.env.VITE_BACKEND_API_URL?.trim();
const API_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:8000' : '');
const API_ERROR =
  'Backend API is unavailable. Ensure FastAPI server is running and properly configured.';
const MISSING_PRODUCTION_API_URL =
  'Backend API URL is not configured. In Netlify, set VITE_BACKEND_API_URL to your deployed FastAPI HTTPS URL, then redeploy.';
const AUTH_TOKEN_KEY = 'authToken';
const USER_EMAIL_KEY = 'authEmail';
let authClearedNotified = false;

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
      } catch {
        // ignore
      }
      delete apiClient.defaults.headers.common.Authorization;
      if (!authClearedNotified) {
        authClearedNotified = true;
        try {
          window.dispatchEvent(new Event('cineverse:auth_cleared'));
        } catch {
          // ignore in non-browser environments
        }
      }
    }
    return Promise.reject(error);
  }
);

export const storeAuth = (token, email) => {
  authClearedNotified = false;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_EMAIL_KEY, email);
  setAuthorizationHeader(token);
};

export const clearAuth = () => {
  authClearedNotified = false;
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
  if (!API_URL) {
    return MISSING_PRODUCTION_API_URL;
  }

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
    if (error.message === 'Network Error') {
      return 'Network error while contacting the backend. Check that VITE_BACKEND_API_URL points to a live HTTPS FastAPI server and that backend CORS allows this frontend domain.';
    }

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

export const resetPassword = async (email, newPassword) => {
  try {
    const { data } = await apiClient.post('/reset-password', {
      email,
      new_password: newPassword,
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const getWatchlist = async () => {
  try {
    const { data } = await apiClient.get('/watchlist');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const getProfile = async () => {
  try {
    const { data } = await apiClient.get('/profile');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const updateProfile = async (email) => {
  try {
    const { data } = await apiClient.patch('/profile', { email });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const changeProfilePassword = async (currentPassword, newPassword) => {
  try {
    const { data } = await apiClient.patch('/profile/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const addToWatchlist = async (movie) => {
  try {
    const payload = {
      imdb_id: movie.imdbID,
      title: movie.Title,
      year: movie.Year,
      poster_url: movie.Poster,
    };
    const { data } = await apiClient.post('/watchlist', payload);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const removeFromWatchlist = async (imdbID) => {
  try {
    await apiClient.delete(`/watchlist/${imdbID}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

// Backward-compatible aliases for the existing UI and tests.
export const getFavorites = getWatchlist;
export const addFavorite = addToWatchlist;
export const removeFavorite = removeFromWatchlist;

export const getCollections = async () => {
  try {
    const { data } = await apiClient.get('/collections');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error), data: [] };
  }
};

export const createCollection = async (name, description = '') => {
  try {
    const { data } = await apiClient.post('/collections', { name, description });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const updateCollection = async (collectionId, payload) => {
  try {
    const { data } = await apiClient.patch(`/collections/${collectionId}`, payload);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const deleteCollection = async (collectionId) => {
  try {
    await apiClient.delete(`/collections/${collectionId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const addMovieToCollection = async (collectionId, movie) => {
  try {
    const payload = {
      imdb_id: movie.imdbID,
      title: movie.Title,
      year: movie.Year,
      poster_url: movie.Poster || 'N/A',
      type: movie.Type || 'movie',
    };
    const { data } = await apiClient.post(`/collections/${collectionId}/movies`, payload);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const removeMovieFromCollection = async (collectionId, imdbID) => {
  try {
    await apiClient.delete(`/collections/${collectionId}/movies/${imdbID}`);
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

export const getMyReview = async (imdbID) => {
  try {
    const { data } = await apiClient.get(`/reviews/${imdbID}`);
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

export const getAdminUsers = async () => {
  try {
    const { data } = await apiClient.get('/admin/users');
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    return { success: false, error: formatError(error), data: [] };
  }
};

export const updateAdminUserRole = async (userId, isAdmin) => {
  try {
    const { data } = await apiClient.patch(`/admin/users/${userId}/role`, {
      is_admin: isAdmin,
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const deleteAdminUser = async (userId) => {
  try {
    const { data } = await apiClient.delete(`/admin/users/${userId}`);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const getAdminStats = async () => {
  try {
    const { data } = await apiClient.get('/admin/stats');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error), data: null };
  }
};

export const getAdminActivityLogs = async (page = 1, limit = 20) => {
  try {
    const { data } = await apiClient.get('/admin/activity-logs', {
      params: { page, limit },
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error), data: { page, limit, total: 0, items: [] } };
  }
};

export const deleteAdminReview = async (reviewId) => {
  try {
    await apiClient.delete(`/admin/reviews/${reviewId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const getAdminReviews = async (page = 1, limit = 25) => {
  try {
    const { data } = await apiClient.get('/admin/reviews', {
      params: { page, limit },
    });
    return {
      success: true,
      data,
    };
  } catch (error) {
    return { success: false, error: formatError(error), data: { page, limit, total: 0, items: [] } };
  }
};

export const createAdminReview = async (payload) => {
  try {
    const { data } = await apiClient.post('/admin/reviews', payload);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const updateAdminReview = async (reviewId, payload) => {
  try {
    const { data } = await apiClient.patch(`/admin/reviews/${reviewId}`, payload);
    return { success: true, data };
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

    const normalizedResults = normalizeMovies(
      (data.results || []).map((movie) => ({
        imdbID: movie.imdb_id,
        Title: movie.title,
        Year: movie.year,
        Type: movie.type,
        Poster: movie.poster,
      }))
    );

    if (normalizedResults.length === 0) {
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
    }

    return {
      success: true,
      data: {
        Search: normalizedResults,
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
        communityAverageRating: data.community_average_rating,
        userRating: data.user_rating,
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

export const getTelugu2025Movies = async (page = 1, pageSize = 10, query = '') => {
  try {
    const { data } = await apiClient.get('/movies/telugu/2025', {
      params: { q: query, page, page_size: pageSize },
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
            Poster: movie.poster || 'N/A',
            imdbRating: movie.imdb_rating,
            Plot: movie.plot || 'No description available.',
            averageRating: movie.average_rating,
          }))
        ),
        totalResults: Number(data.total_results || 0),
      },
      error: '',
    };
  } catch (error) {
    return {
      success: false,
      data: { Search: [], totalResults: 0 },
      error: formatError(error),
    };
  }
};

export const getHomeMovieSections = async () => {
  const [trending, popular, telugu2025] = await Promise.all([
    getMovieCollection('marvel', 4),
    getMovieCollection('batman', 4),
    getTelugu2025Movies(1, 4),
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
      telugu2025: telugu2025.success ? telugu2025.data.Search : [],
    },
    error: '',
  };
};

/**
 * Fetch search history for the current user (requires authentication)
 * @returns {Promise} - Array of search history items with timestamps
 */
export const getSearchHistory = async (page = 1, limit = 8) => {
  try {
    const { data } = await apiClient.get('/history/', {
      params: { page, limit },
    });

    const history = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];

    return {
      success: true,
      data: history,
      page: Number(data?.page || page),
      limit: Number(data?.limit || limit),
      total: Number(data?.total || history.length),
      totalPages: Number(data?.total_pages || 0),
    };
  } catch (error) {
    return { success: false, error: formatError(error), data: [], page, limit, total: 0, totalPages: 0 };
  }
};

/**
 * Fetch personalized movie recommendations for the current user.
 * @param {number} limit - Maximum number of recommendations to return.
 * @returns {Promise} - Recommendation payload from the backend.
 */
export const getRecommendations = async (limit = 10) => {
  try {
    const { data } = await apiClient.get('/recommendations', {
      params: { limit },
    });

    const recommendedMovies = Array.isArray(data?.data)
      ? data.data.map((movie) => ({
          imdbID: movie.imdb_id,
          Title: movie.title,
          Year: movie.year,
          Type: movie.type || 'movie',
          Poster: movie.poster,
          Plot: movie.plot,
          imdbRating: movie.imdb_rating,
          averageRating: movie.average_rating,
          genre: movie.genre,
          score: movie.score,
          matchedSignals: movie.matched_signals || [],
          reason: movie.reason,
        }))
      : [];

    return {
      success: true,
      data: recommendedMovies,
      total: Number(data?.total || 0),
      seedTerms: Array.isArray(data?.seed_terms) ? data.seed_terms : [],
      sources: Array.isArray(data?.sources) ? data.sources : [],
      preferredGenres: Array.isArray(data?.preferred_genres) ? data.preferred_genres : [],
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
      data: [],
      total: 0,
      seedTerms: [],
      sources: [],
      preferredGenres: [],
    };
  }
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
    communityAverageRating: movie.communityAverageRating ?? null,
    userRating: movie.userRating ?? null,
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
  communityAverageRating: movie.communityAverageRating ?? null,
  userRating: movie.userRating ?? null,
  Type: movie.Type || 'movie',
});

const paginate = (movies, page = 1, pageSize = 10) => {
  const start = (page - 1) * pageSize;
  return normalizeMovies(movies.slice(start, start + pageSize));
};
