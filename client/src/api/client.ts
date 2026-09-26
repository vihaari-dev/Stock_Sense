import axios from 'axios';
import type { AuthResponse } from '../types/auth';

// The proxy in vite.config.ts routes /api to the backend
const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // important for sending/receiving HttpOnly cookies
});

// We store the access token in memory (never localStorage/sessionStorage)
let currentAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAccessToken = () => currentAccessToken;

// Request interceptor to attach access token
apiClient.interceptors.request.use(
  (config) => {
    if (currentAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and it's not the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh' &&
      originalRequest.url !== '/auth/login'
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post<AuthResponse>('/api/v1/auth/refresh', {}, {
          withCredentials: true, // needed to send the refresh cookie
        });

        setAccessToken(data.data.accessToken);

        // Update the failed request header and retry
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
