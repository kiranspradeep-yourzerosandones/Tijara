// src/api/notifications.js
import apiClient, { handleApiResponse } from './client';

export const getNotifications = async (params = {}) => {
  const response = await apiClient.get('/notifications', { params });
  return handleApiResponse(response);
};

export const getUnreadCount = async () => {
  try {
    const response = await apiClient.get('/notifications/unread-count');
    return handleApiResponse(response);
  } catch (error) {
    // Return 0 if endpoint doesn't exist yet - prevents app crash
    if (error.response?.status === 404) {
      console.log('⚠️ Notification unread-count endpoint not available');
      return { data: { unreadCount: 0 } };
    }
    throw error;
  }
};

export const markAsRead = async (id) => {
  const response = await apiClient.put(`/notifications/${id}/read`);
  return handleApiResponse(response);
};

export const markAllAsRead = async () => {
  const response = await apiClient.put('/notifications/read-all');
  return handleApiResponse(response);
};