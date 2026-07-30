// src/api/banners.js
import apiClient from './client';

/**
 * Fetch active banners for the home screen (public)
 */
export const getActiveBanners = async () => {
  const response = await apiClient.get('/banners');
  return response.data; // { success, banners }
};