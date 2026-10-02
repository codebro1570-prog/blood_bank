import { apiClient } from './client';
import { AuditLog, AuthUser, DashboardData, PageResponse } from '../types';

export const adminApi = {
  async getDashboard(): Promise<DashboardData> {
    const res = await apiClient.get<DashboardData>('/admin/dashboard');
    return res.data;
  },

  async getUsers(params?: {
    role?: string;
    active?: boolean | string;
    q?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AuthUser>> {
    const res = await apiClient.get<PageResponse<AuthUser>>('/admin/users', { params });
    return res.data;
  },

  async createStaff(data: { email: string; password: string; fullName: string }): Promise<AuthUser> {
    const res = await apiClient.post<AuthUser>('/admin/staff', data);
    return res.data;
  },

  async updateUserActive(id: number, active: boolean): Promise<AuthUser> {
    const res = await apiClient.patch<AuthUser>(`/admin/users/${id}/active`, { active });
    return res.data;
  },

  async getAuditLogs(params?: {
    actor?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AuditLog>> {
    const res = await apiClient.get<PageResponse<AuditLog>>('/admin/audit-logs', { params });
    return res.data;
  },
};
