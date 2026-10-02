/**
 * Notifications API Module (Contract Section K)
 */

import { apiClient } from './client';
import {
  NotificationItem,
  PageRequestParams,
  PageResponse,
  UnreadCountResponse,
} from '../types';

export interface NotificationQueryParams extends PageRequestParams {
  unreadOnly?: boolean;
}

export const notificationsApi = {
  async getNotifications(params?: NotificationQueryParams): Promise<PageResponse<NotificationItem>> {
    const response = await apiClient.get<PageResponse<NotificationItem>>('/notifications', {
      params,
    });
    return response.data;
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data;
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },
};
