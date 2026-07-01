import { apiClient, formatError } from './client';

export const getNotifications = async () => {
  try {
    const { data } = await apiClient.get('/notifications');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error), data: { items: [], unread_count: 0, total: 0 } };
  }
};

export const markNotificationsRead = async (notificationIds = null) => {
  try {
    const payload = notificationIds ? { notification_ids: notificationIds } : {};
    const { data } = await apiClient.patch('/notifications/read', payload);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: formatError(error), data: { items: [], unread_count: 0, total: 0 } };
  }
};
