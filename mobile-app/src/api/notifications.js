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
    // Return 0 if endpoint doesn't exist yet
    if (error.response?.status === 404) {
      return { data: { count: 0 } };
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

export const deleteNotification = async (id) => {
  const response = await apiClient.delete(`/notifications/${id}`);
  return handleApiResponse(response);
};