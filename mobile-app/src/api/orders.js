// src/api/orders.js
import apiClient, { handleApiResponse } from './client';

export const placeOrder = async (locationId, customerNotes = '') => {
  const response = await apiClient.post('/orders', { locationId, customerNotes });
  return handleApiResponse(response);
};

export const getOrders = async (params = {}) => {
  const response = await apiClient.get('/orders', { params });
  return handleApiResponse(response);
};

export const getOrder = async (id) => {
  const response = await apiClient.get(`/orders/${id}`);
  return handleApiResponse(response);
};

export const getOrderByNumber = async (orderNumber) => {
  const response = await apiClient.get(`/orders/number/${orderNumber}`);
  return handleApiResponse(response);
};

export const cancelOrder = async (id, reason = '') => {
  const response = await apiClient.put(`/orders/${id}/cancel`, { reason });
  return handleApiResponse(response);
};

export const getOrderStats = async () => {
  const response = await apiClient.get('/orders/stats');
  return handleApiResponse(response);
};

export const reorder = async (orderId) => {
  const response = await apiClient.post(`/orders/${orderId}/reorder`);
  return handleApiResponse(response);
};