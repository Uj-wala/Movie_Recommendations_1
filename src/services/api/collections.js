import { apiClient, formatError } from './client';

export const getCollections = async () => {
  try {
    const { data } = await apiClient.get('/collections');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error), data: [] };
  }
};

export const getDiscoverCollections = async () => {
  try {
    const { data } = await apiClient.get('/collections/discover');
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

export const followCollection = async (collectionId) => {
  try {
    const { data } = await apiClient.post(`/collections/${collectionId}/follow`);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const unfollowCollection = async (collectionId) => {
  try {
    const { data } = await apiClient.delete(`/collections/${collectionId}/follow`);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};
