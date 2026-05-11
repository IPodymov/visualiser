import { apiClient } from './client';
import type { UserProfile } from '../../types/plan';

type AuthResponse = {
  user: UserProfile;
  accessToken: string;
};

export const authApi = {
  async login(email: string, password: string) {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
    localStorage.setItem('eduplan-token', response.data.accessToken);
    localStorage.setItem('eduplan-user', JSON.stringify(response.data.user));
    return response.data.user;
  },

  async register(fullName: string, email: string, password: string) {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', {
      fullName,
      email,
      password,
    });
    localStorage.setItem('eduplan-token', response.data.accessToken);
    localStorage.setItem('eduplan-user', JSON.stringify(response.data.user));
    return response.data.user;
  },

  async me() {
    const response = await apiClient.get<UserProfile>('/api/auth/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('eduplan-token');
    localStorage.removeItem('eduplan-user');
  },
};
