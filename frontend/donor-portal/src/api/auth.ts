/**
 * Authentication API Module (Contract Section B)
 */

import { apiClient, setAuthToken } from './client';
import {
  AuthUser,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterDonor,
} from '../types';

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', payload);
    if (response.data.accessToken) {
      setAuthToken(response.data.accessToken);
    }
    return response.data;
  },

  async registerDonor(payload: RegisterDonor): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>('/auth/register/donor', payload);
    return response.data;
  },

  async getMe(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/auth/change-password', payload);
  },

  logout(): void {
    setAuthToken(null);
  },
};
