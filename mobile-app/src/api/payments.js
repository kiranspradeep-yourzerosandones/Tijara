import apiClient, { handleApiResponse, handleApiError } from './client';

export const paymentsAPI = {
  // Get payment history
  getPayments: async (params = {}) => {
    try {
      const response = await apiClient.get('/payments', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single payment
  getPayment: async (id) => {
    try {
      const response = await apiClient.get(`/payments/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get credit summary
  getCreditSummary: async () => {
    try {
      const response = await apiClient.get('/payments/credit-summary');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get order payments
  getOrderPayments: async (orderId) => {
    try {
      const response = await apiClient.get(`/payments/order/${orderId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get outstanding payments
  getOutstandingPayments: async () => {
    try {
      const response = await apiClient.get('/payments/outstanding');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default paymentsAPI;