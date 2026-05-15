// Axios instance for any external API calls
import axios from 'axios';
import ENV from '@/config/env';

const api = axios.create({
  baseURL: ENV.SUPABASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    apikey: ENV.SUPABASE_ANON_KEY,
  },
});

// Request interceptor for auth token injection
api.interceptors.request.use(
  async (config) => {
    // Token is managed by Supabase client directly for most calls
    // This interceptor is for any custom endpoints
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (__DEV__) {
      console.warn('[API Error]', error.config?.url, error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
