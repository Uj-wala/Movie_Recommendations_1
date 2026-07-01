import { apiClient, formatError } from './client';

export const getWatchlist = async () => {
  try {
    const { data } = await apiClient.get('/watchlist');
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

export const getFavorites = getWatchlist;
export const addFavorite = addToWatchlist;
export const removeFavorite = removeFromWatchlist;
