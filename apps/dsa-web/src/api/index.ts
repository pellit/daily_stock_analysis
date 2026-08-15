import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { attachParsedApiError } from './error';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mirror the active UI language onto every outbound request so backend endpoints
// can default `report_language` to the user's locale even when a specific body
// field is absent. The UI provider pins language to 'en', but we still read it
// from the context module rather than hardcoding so any future re-introduction
// of additional languages flows through automatically.
apiClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config;
  }
  const headers = (config.headers ??= {} as typeof config.headers);
  if (typeof headers['X-UI-Language'] !== 'string' || !headers['X-UI-Language']) {
    headers['X-UI-Language'] = 'en';
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname + window.location.search;
      if (!path.startsWith('/login')) {
        const redirect = encodeURIComponent(path);
        window.location.assign(`/login?redirect=${redirect}`);
      }
    }
    attachParsedApiError(error);
    return Promise.reject(error);
  }
);

export default apiClient;
