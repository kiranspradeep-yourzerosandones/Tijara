import apiClient, { handleApiResponse, handleApiError } from './client';

export const productsAPI = {
  // Get all products with filters
  getProducts: async (params = {}) => {
    try {
      const response = await apiClient.get('/products', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single product by ID
  getProduct: async (id) => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get product by slug
  getProductBySlug: async (slug) => {
    try {
      const response = await apiClient.get(`/products/slug/${slug}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Search products
  searchProducts: async (keyword, category = null) => {
    try {
      const params = { keyword };
      if (category) params.category = category;
      const response = await apiClient.get('/products/search', { params });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      const response = await apiClient.get('/categories');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default productsAPI;