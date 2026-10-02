import { apiClient } from './client';
import {
  BloodRequest,
  CreateRequest,
  PageResponse,
  PageRequest,
  RequestStatus,
} from '../types';

export interface GetMyRequestsParams extends PageRequest {
  status?: RequestStatus;
  q?: string;
}

export const requestsApi = {
  async createRequest(data: CreateRequest): Promise<BloodRequest> {
    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);

    const response = await apiClient.post<BloodRequest>('/requests', data, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },

  async getMyRequests(params?: GetMyRequestsParams): Promise<PageResponse<BloodRequest>> {
    const response = await apiClient.get<PageResponse<BloodRequest>>('/requests/mine', {
      params,
    });
    return response.data;
  },

  async getRequestById(id: number): Promise<BloodRequest> {
    const response = await apiClient.get<BloodRequest>(`/requests/${id}`);
    return response.data;
  },

  async cancelRequest(id: number): Promise<BloodRequest> {
    const response = await apiClient.post<BloodRequest>(`/requests/${id}/cancel`);
    return response.data;
  },
};
