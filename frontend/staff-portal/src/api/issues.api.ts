import { apiClient } from './client';
import { IssueRecord, PageResponse } from '../types';

export const issuesApi = {
  async getIssues(params?: {
    hospitalId?: number;
    bloodGroup?: string;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<IssueRecord>> {
    const res = await apiClient.get<PageResponse<IssueRecord>>('/issues', { params });
    return res.data;
  },
};
