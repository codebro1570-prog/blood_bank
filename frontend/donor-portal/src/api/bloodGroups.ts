/**
 * Blood Groups API Module (Contract Section D)
 */

import { apiClient } from './client';
import { BloodGroupCode, BloodGroupItem, CompatibleDonorsResponse } from '../types';

export const bloodGroupsApi = {
  async getBloodGroups(): Promise<BloodGroupItem[]> {
    const response = await apiClient.get<BloodGroupItem[]>('/blood-groups');
    return response.data;
  },

  async getCompatibleDonors(code: BloodGroupCode | string): Promise<CompatibleDonorsResponse> {
    const encoded = encodeURIComponent(code);
    const response = await apiClient.get<CompatibleDonorsResponse>(
      `/blood-groups/${encoded}/compatible-donors`
    );
    return response.data;
  },
};
