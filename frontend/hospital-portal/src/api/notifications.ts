import { apiClient } from './client';
import {
  NotificationItem,
  PageResponse,
  PageRequest,
  UnreadCountResponse,
} from '../types';

export interface GetNotificationsParams extends PageRequest {
  unreadOnly?: boolean;
}

export const notificationsApi = {
  async getNotifications(params?: GetNotificationsParams): Promise<PageResponse<NotificationItem>> {
    const response = await apiClient.get<PageResponse<NotificationItem>>('/notifications', {
      params,
    });
    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data.count;
  },

  async markAsRead(id: number): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },
};
