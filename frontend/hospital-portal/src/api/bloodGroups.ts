import { apiClient } from './client';
import { BloodGroupRef, CompatibleDonorsResponse } from '../types';

export const bloodGroupsApi = {
  async getBloodGroups(): Promise<BloodGroupRef[]> {
    const response = await apiClient.get<BloodGroupRef[]>('/blood-groups');
    return response.data;
  },

  async getCompatibleDonors(code: string): Promise<CompatibleDonorsResponse> {
    const encoded = encodeURIComponent(code);
    const response = await apiClient.get<CompatibleDonorsResponse>(
      `/blood-groups/${encoded}/compatible-donors`
    );
    return response.data;
  },
};
