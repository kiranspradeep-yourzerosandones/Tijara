// frontend/lib/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Get auth token
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// Get auth headers
export const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    ...options,
    headers,
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
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/customers?${query}`);
  },

  getById: async (id) => {
    return apiRequest(`/admin/customers/${id}`);
  },

  create: async (userData) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/admin/customers`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!(userData instanceof FormData) && { "Content-Type": "application/json" }),
      },
      body: userData instanceof FormData ? userData : JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  },

  update: async (id, userData) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/admin/customers/${id}`, {
      method: "PUT",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!(userData instanceof FormData) && { "Content-Type": "application/json" }),
      },
      body: userData instanceof FormData ? userData : JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  },

  delete: async (id, reason = "") => {
    return apiRequest(`/admin/customers/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
  },

  toggleStatus: async (id, reason = "") => {
    return apiRequest(`/admin/customers/${id}/toggle-status`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
  },

  resetPassword: async (id, newPassword, sendEmail = true) => {
    return apiRequest(`/admin/customers/${id}/reset-password`, {
      method: "PUT",
      body: JSON.stringify({ newPassword, sendEmail }),
    });
  },

  updateCredit: async (id, creditData) => {
    return apiRequest(`/admin/customers/${id}/credit`, {
      method: "PUT",
      body: JSON.stringify(creditData),
    });
  },

  getStats: async () => {
    return apiRequest("/admin/customers/stats");
  },

  exportCSV: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = getToken();

    const response = await fetch(`${API_URL}/admin/customers/export?${query}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
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

  getBySlug: async (slug) => {
    return apiRequest(`/products/slug/${slug}`);
  },

  create: async (productData) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: productData, // FormData for file upload
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create product");
    return data;
  },

  update: async (id, productData) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: productData, // FormData for file upload
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update product");
    return data;
  },

  delete: async (id) => {
    return apiRequest(`/products/${id}`, { method: "DELETE" });
  },

  updateStock: async (id, quantity, operation = "set") => {
    return apiRequest(`/products/${id}/stock`, {
      method: "PUT",
      body: JSON.stringify({ quantity, operation }),
    });
  },

  getLowStock: async () => {
    return apiRequest("/products/admin/low-stock");
  },

  search: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/products/search?${query}`);
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

  getStats: async () => {
    return apiRequest("/admin/orders/stats");
  },

  updateStatus: async (id, status) => {
    return apiRequest(`/admin/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  },

  updatePaymentStatus: async (id, paymentData) => {
    return apiRequest(`/admin/orders/${id}/payment`, {
      method: "PUT",
      body: JSON.stringify(paymentData),
    });
  },

  addNote: async (id, note) => {
    return apiRequest(`/admin/orders/${id}/notes`, {
      method: "PUT",
      body: JSON.stringify({ note }),
    });
  },

  generateDeliveryOtp: async (id) => {
    return apiRequest(`/admin/orders/${id}/delivery-otp`, {
      method: "POST",
    });
  },

  verifyDeliveryOtp: async (id, otp) => {
    return apiRequest(`/admin/orders/${id}/verify-delivery`, {
      method: "POST",
      body: JSON.stringify({ otp }),
    });
  },
};

// ==================== PAYMENT API ====================

export const paymentAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/payments?${query}`);
  },

  getById: async (id) => {
    return apiRequest(`/admin/payments/${id}`);
  },

  getStats: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/payments/stats?${query}`);
  },

  record: async (paymentData) => {
    return apiRequest("/admin/payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  },

  update: async (id, paymentData) => {
    return apiRequest(`/admin/payments/${id}`, {
      method: "PUT",
      body: JSON.stringify(paymentData),
    });
  },

  cancel: async (id, reason) => {
    return apiRequest(`/admin/payments/${id}/cancel`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
  },

  getOverdueReport: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/payments/overdue?${query}`);
  },

  getUserPayments: async (userId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users/${userId}/payments?${query}`);
  },
};

// ==================== ADMIN API ====================

export const adminAPI = {
  getAll: async () => {
    return apiRequest("/admin/admins");
  },

  getById: async (id) => {
    return apiRequest(`/admin/admins/${id}`);
  },

  create: async (adminData) => {
    return apiRequest("/admin/create-admin", {
      method: "POST",
      body: JSON.stringify(adminData),
    });
  },

  update: async (id, adminData) => {
    return apiRequest(`/admin/admins/${id}`, {
      method: "PUT",
      body: JSON.stringify(adminData),
    });
  },

  toggleStatus: async (id) => {
    return apiRequest(`/admin/admins/${id}/toggle-status`, {
      method: "PUT",
    });
  },

  delete: async (id) => {
    return apiRequest(`/admin/admins/${id}`, { method: "DELETE" });
  },
};

export default {
  userAPI,
  productAPI,
  categoryAPI,
  orderAPI,
  paymentAPI,
  adminAPI,
  getAuthHeaders,
};