import { apiClient } from './client';
import { NotificationItem, PageResponse } from '../types';

export const notificationsApi = {
  async getNotifications(params?: {
    unreadOnly?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<NotificationItem>> {
    const res = await apiClient.get<PageResponse<NotificationItem>>('/notifications', {
      params: {
        ...params,
        unreadOnly: params?.unreadOnly ? 'true' : undefined,
      },
    });
    return res.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return res.data;
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },
};
