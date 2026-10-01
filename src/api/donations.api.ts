import { apiClient } from './client';
import { Donation, PageResponse } from '../types';

export const donationsApi = {
  async getDonations(params?: {
    donorId?: number;
    status?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Donation>> {
    const res = await apiClient.get<PageResponse<Donation>>('/donations', { params });
    return res.data;
  },

  async getDonationById(id: number): Promise<Donation> {
    const res = await apiClient.get<Donation>(`/donations/${id}`);
    return res.data;
  },

  async createDonation(data: {
    donorId: number;
    donationDate: string;
    volumeMl: number;
    notes?: string;
  }): Promise<Donation> {
    const res = await apiClient.post<Donation>('/donations', data);
    return res.data;
  },

  async updateScreening(
    id: number,
    data: { result: 'PASSED' | 'FAILED'; failureReason?: string }
  ): Promise<Donation> {
    const res = await apiClient.patch<Donation>(`/donations/${id}/screening`, data);
    return res.data;
  },
};
