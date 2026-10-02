import { apiClient } from './client';
import { Hospital, UpdateHospitalProfileRequest } from '../types';

export const hospitalApi = {
  async getMyHospital(): Promise<Hospital> {
    const response = await apiClient.get<Hospital>('/hospitals/me');
    return response.data;
  },

  async updateMyHospital(data: UpdateHospitalProfileRequest): Promise<Hospital> {
    const response = await apiClient.put<Hospital>('/hospitals/me', data);
    return response.data;
  },
};
