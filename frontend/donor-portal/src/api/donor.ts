/**
 * Donor API Module (Contract Section E)
 */

import { apiClient } from './client';
import {
  DonorProfile,
  UpdateDonorProfile,
  Eligibility,
  DonationForDonor,
  PageRequestParams,
  PageResponse,
} from '../types';

export const donorApi = {
  async getProfile(): Promise<DonorProfile> {
    const response = await apiClient.get<DonorProfile>('/donors/me');
    return response.data;
  },

  async updateProfile(payload: UpdateDonorProfile): Promise<DonorProfile> {
    const response = await apiClient.put<DonorProfile>('/donors/me', payload);
    return response.data;
  },

  async getEligibility(): Promise<Eligibility> {
    const response = await apiClient.get<Eligibility>('/donors/me/eligibility');
    return response.data;
  },

  async getMyDonations(params?: PageRequestParams): Promise<PageResponse<DonationForDonor>> {
    const response = await apiClient.get<PageResponse<DonationForDonor>>('/donors/me/donations', {
      params,
    });
    return response.data;
  },
};
