// src/api/payments.js
import apiClient, { handleApiResponse } from './client';

export const getPayments = async (params = {}) => {
  const response = await apiClient.get('/payments', { params });
  return handleApiResponse(response);
};

export const getPayment = async (id) => {
  const response = await apiClient.get(`/payments/${id}`);
  return handleApiResponse(response);
};

export const getCreditSummary = async () => {
  const response = await apiClient.get('/payments/credit-summary');
  return handleApiResponse(response);
};

export const getOrderPayments = async (orderId) => {
  const response = await apiClient.get(`/payments/order/${orderId}`);
  return handleApiResponse(response);
};

export const getOutstandingPayments = async () => {
  const response = await apiClient.get('/payments/outstanding');
  return handleApiResponse(response);
};