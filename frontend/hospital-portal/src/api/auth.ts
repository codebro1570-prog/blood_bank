import { apiClient } from './client';
import {
  AuthUser,
  LoginResponse,
  ChangePasswordRequest,
  RegisterHospitalRequest,
} from '../types';

export const authApi = {
  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async getMe(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>('/auth/me');
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  },

  async registerHospital(data: RegisterHospitalRequest): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>('/auth/register/hospital', data);
    return response.data;
  },
};
