import axios from 'axios';
import { fakeMovies, getFakeMovieDetails, getFakeMovies } from '../utils/fakeMovies';

const API_KEY = import.meta.env.VITE_OMDB_API_KEY;
const API_URL = import.meta.env.VITE_OMDB_API_URL || 'https://www.omdbapi.com';
const API_KEY_ERROR =
  'OMDb API key is missing. Add a real VITE_OMDB_API_KEY in .env, then restart the dev server.';

const omdb = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

const hasValidApiKey = () =>
  Boolean(API_KEY && API_KEY.trim() && API_KEY !== 'your_api_key_here');

if (!hasValidApiKey()) {
  console.warn(API_KEY_ERROR);
}

/**
 * Fetch movies from OMDb API
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

    if (!hasValidApiKey()) {
      const fakeResults = getFakeMovies(searchTerm);
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

    const { data } = await omdb.get('', {
      params: {
        apikey: API_KEY,
        s: searchTerm,
        page,
        type: 'movie',
      },
    });

    if (data.Response === 'False') {
      return {
        success: false,
        error: data.Error || 'No movies found',
        data: { Search: [], totalResults: '0' },
      };
    }

    return {
      success: true,
      data: {
        Search: normalizeMovies(data.Search || []),
        totalResults: parseInt(data.totalResults || 0, 10),
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
      error: 'Unable to reach OMDb. Check your internet connection and API key, then try again.',
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

    if (!hasValidApiKey()) {
      return {
        success: false,
        error: API_KEY_ERROR,
      };
    }

    const { data } = await omdb.get('', {
      params: {
        apikey: API_KEY,
        i: imdbID,
        plot: 'full',
      },
    });

    if (data.Response === 'False') {
      return {
        success: false,
        error: 'Movie details not found',
      };
    }

    return {
      success: true,
      data: normalizeMovie(data),
    };
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return {
      success: false,
      error: 'Failed to fetch movie details. Please try again.',
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
