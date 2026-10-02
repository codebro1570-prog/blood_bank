import { apiClient } from './client';
import { Hospital, PageResponse } from '../types';

export const hospitalsApi = {
  async getHospitals(params?: {
    status?: string;
    q?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Hospital>> {
    const res = await apiClient.get<PageResponse<Hospital>>('/hospitals', { params });
    return res.data;
  },

  async updateApproval(
    id: number,
    decision: 'APPROVED' | 'REJECTED' | 'SUSPENDED',
    reason?: string
  ): Promise<Hospital> {
    const res = await apiClient.patch<Hospital>(`/hospitals/${id}/approval`, {
      decision,
      reason: reason || '',
    });
    return res.data;
  },
};
