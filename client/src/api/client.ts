import axios from 'axios';

// Base Axios instance — all requests go to /api/v1 (proxied to Express by Vite in dev)
const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send HttpOnly refreshToken cookie automatically
});

// Attach the in-memory access token to every request
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
