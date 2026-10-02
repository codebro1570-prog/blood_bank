import { apiClient } from './client';
import { IssueRecord, PageResponse, PageRequest } from '../types';

export interface GetMyIssuesParams extends PageRequest {
  bloodGroup?: string;
  from?: string;
  to?: string;
}

export const issuesApi = {
  async getMyIssues(params?: GetMyIssuesParams): Promise<PageResponse<IssueRecord>> {
    const response = await apiClient.get<PageResponse<IssueRecord>>('/issues/mine', {
      params,
    });
    return response.data;
  },
};
