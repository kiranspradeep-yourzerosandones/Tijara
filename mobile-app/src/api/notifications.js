import apiClient, { handleApiResponse, handleApiError } from './client';

export const notificationsAPI = {
  // Get notifications
  getNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get('/notifications', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Mark as read
  markAsRead: async (id) => {
    try {
      const response = await apiClient.put(`/notifications/${id}/read`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Mark all as read
  markAllAsRead: async () => {
    try {
      const response = await apiClient.put('/notifications/read-all');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default notificationsAPI;