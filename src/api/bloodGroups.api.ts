import { apiClient } from './client';
import { BloodGroupCode, BloodGroupRef, CompatibleDonorsResponse } from '../types';

export const bloodGroupsApi = {
  async getBloodGroups(): Promise<BloodGroupRef[]> {
    const res = await apiClient.get<BloodGroupRef[]>('/blood-groups');
    return res.data;
  },

  async getCompatibleDonors(code: BloodGroupCode): Promise<CompatibleDonorsResponse> {
    const encoded = encodeURIComponent(code);
    const res = await apiClient.get<CompatibleDonorsResponse>(`/blood-groups/${encoded}/compatible-donors`);
    return res.data;
  },
};
