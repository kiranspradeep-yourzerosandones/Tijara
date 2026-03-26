// src/api/locations.js
import apiClient, { handleApiResponse } from './client';

export const createLocation = async (data) => {
  const response = await apiClient.post('/locations', data);
  return handleApiResponse(response);
};

export const getLocations = async (includeInactive = false) => {
  const response = await apiClient.get('/locations', {
    params: { includeInactive },
  });
  return handleApiResponse(response);
};

export const getLocation = async (id) => {
  const response = await apiClient.get(`/locations/${id}`);
  return handleApiResponse(response);
};

export const updateLocation = async (id, data) => {
  const response = await apiClient.put(`/locations/${id}`, data);
  return handleApiResponse(response);
};

export const deleteLocation = async (id) => {
  const response = await apiClient.delete(`/locations/${id}`);
  return handleApiResponse(response);
};

export const setDefaultLocation = async (id) => {
  const response = await apiClient.put(`/locations/${id}/set-default`);
  return handleApiResponse(response);
};

export const getDefaultLocation = async () => {
  const response = await apiClient.get('/locations/default');
  return handleApiResponse(response);
};

export const updateCoordinates = async (id, coordinates) => {
  const response = await apiClient.put(`/locations/${id}/coordinates`, coordinates);
  return handleApiResponse(response);
};