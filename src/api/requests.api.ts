import { apiClient } from './client';
import { Availability, BloodRequest, IssueResult, PageResponse } from '../types';

export const requestsApi = {
  async getQueue(params?: {
    status?: string;
    priority?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<BloodRequest>> {
    const res = await apiClient.get<PageResponse<BloodRequest>>('/requests/queue', { params });
    return res.data;
  },

  async getById(id: number): Promise<BloodRequest> {
    const res = await apiClient.get<BloodRequest>(`/requests/${id}`);
    return res.data;
  },

  async getAvailability(id: number): Promise<Availability> {
    const res = await apiClient.get<Availability>(`/requests/${id}/availability`);
    return res.data;
  },

  async approve(id: number): Promise<BloodRequest> {
    const res = await apiClient.post<BloodRequest>(`/requests/${id}/approve`);
    return res.data;
  },

  async reject(id: number, reason: string): Promise<BloodRequest> {
    const res = await apiClient.post<BloodRequest>(`/requests/${id}/reject`, { reason });
    return res.data;
  },

  async issue(id: number): Promise<IssueResult> {
    const res = await apiClient.post<IssueResult>(`/requests/${id}/issue`);
    return res.data;
  },

  async approveAndIssue(id: number): Promise<IssueResult> {
    const res = await apiClient.post<IssueResult>(`/requests/${id}/approve-and-issue`);
    return res.data;
  },
};
