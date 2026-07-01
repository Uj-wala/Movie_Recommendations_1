import { apiClient, formatError } from './client';

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
