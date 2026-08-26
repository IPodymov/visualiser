import axios from 'axios';
import type { UserProfile } from '@entities/user/model/types';
import { apiClient } from '@shared/api/client';

type AuthResponse = {
  user: UserProfile;
  accessToken: string;
};

const authError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return new Error('Сервис авторизации недоступен. Проверьте подключение и повторите попытку.');
    const backendMessage =
      typeof error.response.data === 'object' &&
      error.response.data !== null &&
      'message' in error.response.data &&
      typeof error.response.data.message === 'string'
        ? error.response.data.message
        : '';
    if (error.response.status === 401) return new Error('Неверная электронная почта или пароль.');
    if (error.response.status === 409)
      return new Error('Аккаунт с этой электронной почтой уже существует.');
    if (error.response.status === 400)
      return new Error(backendMessage || 'Проверьте заполнение полей и повторите попытку.');
  }
  return new Error(fallback);
};

export const authApi = {
  async login(email: string, password: string) {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
      localStorage.setItem('eduplan-token', response.data.accessToken);
      localStorage.setItem('eduplan-user', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      throw authError(error, 'Не удалось войти в аккаунт. Повторите попытку.');
    }
  },

  async register(fullName: string, email: string, password: string) {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/register', {
        fullName,
        email,
        password,
      });
      localStorage.setItem('eduplan-token', response.data.accessToken);
      localStorage.setItem('eduplan-user', JSON.stringify(response.data.user));
      return response.data.user;
    } catch (error) {
      throw authError(error, 'Не удалось создать аккаунт. Повторите попытку.');
    }
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
