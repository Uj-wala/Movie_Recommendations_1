import { apiClient, formatError } from './client';

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

export const likeReview = async (reviewId) => {
  try {
    const { data } = await apiClient.post(`/reviews/${reviewId}/like`);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const unlikeReview = async (reviewId) => {
  try {
    const { data } = await apiClient.delete(`/reviews/${reviewId}/like`);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};
