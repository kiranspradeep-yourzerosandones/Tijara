import apiClient, { handleApiResponse, handleApiError } from './client';

export const ordersAPI = {
  // Place order
  placeOrder: async (locationId, customerNotes = '') => {
    try {
      const response = await apiClient.post('/orders', { locationId, customerNotes });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get all orders
  getOrders: async (params = {}) => {
    try {
      const response = await apiClient.get('/orders', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single order
  getOrder: async (id) => {
    try {
      const response = await apiClient.get(`/orders/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get order by number
  getOrderByNumber: async (orderNumber) => {
    try {
      const response = await apiClient.get(`/orders/number/${orderNumber}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Cancel order
  cancelOrder: async (id, reason = '') => {
    try {
      const response = await apiClient.put(`/orders/${id}/cancel`, { reason });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get order stats
  getOrderStats: async () => {
    try {
      const response = await apiClient.get('/orders/stats');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Reorder
  reorder: async (orderId) => {
    try {
      const response = await apiClient.post(`/orders/${orderId}/reorder`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default ordersAPI;