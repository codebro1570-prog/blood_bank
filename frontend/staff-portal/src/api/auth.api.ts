import { apiClient, setAuthToken } from './client';
import { AuthUser, LoginResponse } from '../types';

export const authApi = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/auth/login', credentials);
    setAuthToken(res.data.accessToken, res.data.user);
    return res.data;
  },

  async getMe(): Promise<AuthUser> {
    const res = await apiClient.get<AuthUser>('/auth/me');
    return res.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  },

  logout(): void {
    setAuthToken(null, null);
  },
};
