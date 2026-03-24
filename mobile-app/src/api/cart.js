import apiClient, { handleApiResponse, handleApiError } from './client';

export const cartAPI = {
  // Get cart
  getCart: async () => {
    try {
      const response = await apiClient.get('/cart');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await apiClient.post('/cart/add', { productId, quantity });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Update cart item quantity
  updateCartItem: async (productId, quantity) => {
    try {
      const response = await apiClient.put('/cart/update', { productId, quantity });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Remove item from cart
  removeFromCart: async (productId) => {
    try {
      const response = await apiClient.delete(`/cart/remove/${productId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Clear cart
  clearCart: async () => {
    try {
      const response = await apiClient.delete('/cart/clear');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get cart summary
  getCartSummary: async () => {
    try {
      const response = await apiClient.get('/cart/summary');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Validate cart before checkout
  validateCart: async () => {
    try {
      const response = await apiClient.get('/cart/validate');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Sync prices
  syncPrices: async () => {
    try {
      const response = await apiClient.put('/cart/sync-prices');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default cartAPI;