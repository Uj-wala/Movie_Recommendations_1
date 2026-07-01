import { apiClient, formatError } from './client';

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

export const requestPasswordReset = async (email) => {
  try {
    const { data } = await apiClient.post('/reset-password/request', { email });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const { data } = await apiClient.post('/reset-password/confirm', {
      token,
      new_password: newPassword,
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};
