// src/api/products.js
import apiClient, { handleApiResponse } from './client';

export const getProducts = async (params = {}) => {
  const response = await apiClient.get('/products', { params });
  return handleApiResponse(response);
};

export const getProduct = async (id) => {
  const response = await apiClient.get(`/products/${id}`);
  return handleApiResponse(response);
};

export const getProductBySlug = async (slug) => {
  const response = await apiClient.get(`/products/slug/${slug}`);
  return handleApiResponse(response);
};

export const searchProducts = async (keyword, category = null) => {
  const params = { keyword };
  if (category) params.category = category;
  const response = await apiClient.get('/products/search', { params });
  return handleApiResponse(response);
};

export const getCategories = async () => {
  const response = await apiClient.get('/categories');
  return handleApiResponse(response);
};

export const getCategory = async (id) => {
  const response = await apiClient.get(`/categories/${id}`);
  return handleApiResponse(response);
};