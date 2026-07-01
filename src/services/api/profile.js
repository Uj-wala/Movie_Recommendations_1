import { apiClient, formatError } from './client';

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
