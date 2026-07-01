import { fakeMovies, getFakeMovieDetails, getFakeMovies } from '../../utils/fakeMovies';
import { apiClient, formatError } from './client';

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
