import apiClient, { handleApiResponse, handleApiError } from './client';

export const locationsAPI = {
  // Create location
  createLocation: async (data) => {
    try {
      const response = await apiClient.post('/locations', data);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get all locations
  getLocations: async (includeInactive = false) => {
    try {
      const response = await apiClient.get('/locations', {
        params: { includeInactive },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single location
  getLocation: async (id) => {
    try {
      const response = await apiClient.get(`/locations/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update location
  updateLocation: async (id, data) => {
    try {
      const response = await apiClient.put(`/locations/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Delete location
  deleteLocation: async (id) => {
    try {
      const response = await apiClient.delete(`/locations/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Set default location
  setDefaultLocation: async (id) => {
    try {
      const response = await apiClient.put(`/locations/${id}/set-default`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get default location
  getDefaultLocation: async () => {
    try {
      const response = await apiClient.get('/locations/default');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update coordinates
  updateCoordinates: async (id, coordinates) => {
    try {
      const response = await apiClient.put(`/locations/${id}/coordinates`, coordinates);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default locationsAPI;