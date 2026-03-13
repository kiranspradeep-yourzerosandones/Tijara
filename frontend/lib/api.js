const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Get auth token
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken");
  }
  return null;
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

// ==================== USER API ====================

export const userAPI = {
  // Get all users (customers)
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/customers?${query}`);
  },

  // Get single user
  getById: async (id) => {
    return apiRequest(`/admin/customers/${id}`);
  },

  // Create user
  create: async (userData) => {
    return apiRequest("/admin/customers", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  // Update user
  update: async (id, userData) => {
    return apiRequest(`/admin/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },

  // Delete user (soft delete)
  delete: async (id, reason = "") => {
    return apiRequest(`/admin/customers/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
  },

  // Toggle user status
  toggleStatus: async (id, reason = "") => {
    return apiRequest(`/admin/customers/${id}/toggle-status`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
  },

  // Reset user password
  resetPassword: async (id, newPassword, sendEmail = true) => {
    return apiRequest(`/admin/customers/${id}/reset-password`, {
      method: "PUT",
      body: JSON.stringify({ newPassword, sendEmail }),
    });
  },

  // Update credit settings
  updateCredit: async (id, creditData) => {
    return apiRequest(`/admin/customers/${id}/credit`, {
      method: "PUT",
      body: JSON.stringify(creditData),
    });
  },

  // Get user stats
  getStats: async () => {
    return apiRequest("/admin/customers/stats");
  },

  // Export users
  exportCSV: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = getToken();
    
    const response = await fetch(`${API_URL}/admin/customers/export?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    return response.blob();
  },
};

// ==================== PRODUCT API ====================

export const productAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/products?${query}`);
  },

  getById: async (id) => {
    return apiRequest(`/products/${id}`);
  },

  // jaahh uhqwud

  create: async (productData) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: productData, // FormData for file upload
    });
    return response.json();
  },

  update: async (id, productData) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: productData,
    });
    return response.json();
  },

  delete: async (id) => {
    return apiRequest(`/products/${id}`, { method: "DELETE" });
  },
};

// ==================== CATEGORY API ====================

export const categoryAPI = {
  getAll: async () => {
    return apiRequest("/categories");
  },

  create: async (categoryData) => {
    return apiRequest("/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  },

  update: async (id, categoryData) => {
    return apiRequest(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/categories/${id}`, { method: "DELETE" });
  },
};

// ==================== ORDER API ====================

export const orderAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/orders?${query}`);
  },

  getById: async (id) => {
    return apiRequest(`/admin/orders/${id}`);
  },

  updateStatus: async (id, status) => {
    return apiRequest(`/admin/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },
};

export default {
  userAPI,
  productAPI,
  categoryAPI,
  orderAPI,
};