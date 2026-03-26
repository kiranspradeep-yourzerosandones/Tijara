// src/api/cart.js
import apiClient, { handleApiResponse } from './client';

export const getCart = async () => {
  const response = await apiClient.get('/cart');
  return handleApiResponse(response);
};

export const addToCart = async (productId, quantity = 1) => {
  const response = await apiClient.post('/cart/add', { productId, quantity });
  return handleApiResponse(response);
};

export const updateCartItem = async (productId, quantity) => {
  const response = await apiClient.put('/cart/update', { productId, quantity });
  return handleApiResponse(response);
};

export const removeFromCart = async (productId) => {
  const response = await apiClient.delete(`/cart/remove/${productId}`);
  return handleApiResponse(response);
};

export const clearCart = async () => {
  const response = await apiClient.delete('/cart/clear');
  return handleApiResponse(response);
};

export const getCartSummary = async () => {
  const response = await apiClient.get('/cart/summary');
  return handleApiResponse(response);
};

export const validateCart = async () => {
  const response = await apiClient.get('/cart/validate');
  return handleApiResponse(response);
};

export const syncPrices = async () => {
  const response = await apiClient.put('/cart/sync-prices');
  return handleApiResponse(response);
};