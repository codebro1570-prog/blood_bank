import { apiClient } from './client';
import { PageResponse, StockSummaryRow, Unit } from '../types';

export const inventoryApi = {
  async getSummary(): Promise<StockSummaryRow[]> {
    const res = await apiClient.get<StockSummaryRow[]>('/inventory/summary');
    return res.data;
  },

  async getUnits(params?: {
    bloodGroup?: string;
    status?: string;
    expiryFrom?: string;
    expiryTo?: string;
    q?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<Unit>> {
    const res = await apiClient.get<PageResponse<Unit>>('/inventory/units', { params });
    return res.data;
  },

  async getNearExpiry(days = 7): Promise<Unit[]> {
    const res = await apiClient.get<Unit[]>('/inventory/near-expiry', { params: { days } });
    return res.data;
  },

  async discardUnit(id: number, reason: string): Promise<Unit> {
    const res = await apiClient.post<Unit>(`/inventory/units/${id}/discard`, { reason });
    return res.data;
  },
};
