import apiClient, { setAccessToken } from './client';
import type { AuthResponse, MessageResponse, UserResponse } from '../types/auth';

export const login = async (login_id: string, password: string): Promise<string> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { login_id, password });
  setAccessToken(data.data.accessToken);
  return data.data.accessToken;
};

export const signup = async (payload: any): Promise<void> => {
  await apiClient.post<UserResponse>('/auth/signup', payload);
};

export const logout = async (): Promise<void> => {
  await apiClient.post<MessageResponse>('/auth/logout');
  setAccessToken(null);
};

export const forgotPassword = async (email: string): Promise<void> => {
  await apiClient.post<MessageResponse>('/auth/forgot-password', { email });
};

export const resetPassword = async (payload: any): Promise<void> => {
  await apiClient.post<MessageResponse>('/auth/reset-password', payload);
};

// Assuming there's a profile endpoint or we decode JWT. For now, since the backend doesn't have a /profile endpoint, 
// the JWT holds the user profile data. We can provide a helper to decode the JWT if needed, or add a /profile endpoint.
