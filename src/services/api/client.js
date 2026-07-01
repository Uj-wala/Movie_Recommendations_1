import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_BACKEND_API_URL?.trim();
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
const hasInvalidProductionApiUrl =
  isProd && configuredApiUrl && !/^https:\/\//i.test(configuredApiUrl);
const API_URL = hasInvalidProductionApiUrl
  ? ''
  : configuredApiUrl || (isDev ? 'http://localhost:8000' : '');
const API_ERROR =
  'Backend API is unavailable. Ensure FastAPI server is running and properly configured.';
const MISSING_PRODUCTION_API_URL =
  'Backend API URL is not configured. In Netlify, set VITE_BACKEND_API_URL to your deployed FastAPI HTTPS URL, then redeploy.';
const INVALID_PRODUCTION_API_URL =
  'VITE_BACKEND_API_URL must use HTTPS in production. Update the environment variable to your deployed FastAPI HTTPS URL and redeploy.';
const AUTH_TOKEN_KEY = 'authToken';
const USER_EMAIL_KEY = 'authEmail';
let authClearedNotified = false;

export const apiClient = axios.create({
  baseURL: API_URL || undefined,
  timeout: 20000,
});

apiClient.interceptors.request.use(
  (config) => {
    if (!API_URL) {
      return Promise.reject(new Error(hasInvalidProductionApiUrl ? INVALID_PRODUCTION_API_URL : MISSING_PRODUCTION_API_URL));
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const setAuthorizationHeader = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

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

export const formatError = (error) => {
  if (!API_URL) {
    return hasInvalidProductionApiUrl ? INVALID_PRODUCTION_API_URL : MISSING_PRODUCTION_API_URL;
  }

  if (error?.message === INVALID_PRODUCTION_API_URL) {
    return INVALID_PRODUCTION_API_URL;
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
