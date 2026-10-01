import { apiClient } from './client';
import { DonorProfile, PageResponse } from '../types';

export const donorsApi = {
  async getDonors(params?: {
    q?: string;
    bloodGroup?: string;
    city?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<DonorProfile>> {
    const res = await apiClient.get<PageResponse<DonorProfile>>('/donors', { params });
    return res.data;
  },

  async getDonorById(id: number): Promise<DonorProfile> {
    const res = await apiClient.get<DonorProfile>(`/donors/${id}`);
    return res.data;
  },

  async getEligibleDonors(params?: {
    bloodGroup?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<DonorProfile>> {
    const res = await apiClient.get<PageResponse<DonorProfile>>('/donors/eligible', { params });
    return res.data;
  },
};
