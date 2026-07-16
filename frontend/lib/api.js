// frontend/lib/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || null;
};

export const getAuthHeaders = () => {
  const token = getToken();
  if (!token) {
    console.warn("⚠️ No auth token found in localStorage");
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

const handleResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Non-JSON response from server (HTTP ${response.status})`);
  }
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }
  return data;
};

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return handleResponse(response);
};

// ============================================================
// USER / CUSTOMER API
// ============================================================
export const userAPI = {
  getAll: (params = {}) =>
    apiRequest(`/admin/customers?${new URLSearchParams(params)}`),

  getById: (id) => apiRequest(`/admin/customers/${id}`),

  create: async (userData) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/admin/customers`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!(userData instanceof FormData) && {
          "Content-Type": "application/json",
        }),
      },
      body: userData instanceof FormData ? userData : JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  update: async (id, userData) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/admin/customers/${id}`, {
      method: "PUT",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!(userData instanceof FormData) && {
          "Content-Type": "application/json",
        }),
      },
      body: userData instanceof FormData ? userData : JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  delete: (id, reason = "") =>
    apiRequest(`/admin/customers/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    }),

  toggleStatus: (id, reason = "") =>
    apiRequest(`/admin/customers/${id}/toggle-status`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    }),

  resetPassword: (id, newPassword, sendEmail = true) =>
    apiRequest(`/admin/customers/${id}/reset-password`, {
      method: "PUT",
      body: JSON.stringify({ newPassword, sendEmail }),
    }),

  updateCredit: (id, creditData) =>
    apiRequest(`/admin/customers/${id}/credit`, {
      method: "PUT",
      body: JSON.stringify(creditData),
    }),

  getStats: () => apiRequest("/admin/customers/stats"),

  exportCSV: async (params = {}) => {
    const token = getToken();
    const res = await fetch(
      `${API_URL}/admin/customers/export?${new URLSearchParams(params)}`,
      { headers: { ...(token && { Authorization: `Bearer ${token}` }) } }
    );
    if (!res.ok) throw new Error("Export failed");
    return res.blob();
  },
};

// ============================================================
// PRODUCT API
// ============================================================
export const productAPI = {
  getAll: (params = {}) =>
    apiRequest(`/products?${new URLSearchParams(params)}`),

  getById: (id) => apiRequest(`/products/${id}`),

  getBySlug: (slug) => apiRequest(`/products/slug/${slug}`),

  create: async (productData) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: productData,
    });
    return handleResponse(res);
  },

  update: async (id, productData) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: productData,
    });
    return handleResponse(res);
  },

  delete: (id) => apiRequest(`/products/${id}`, { method: "DELETE" }),

  updateStock: (id, quantity, operation = "set") =>
    apiRequest(`/products/${id}/stock`, {
      method: "PUT",
      body: JSON.stringify({ quantity, operation }),
    }),

  getLowStock: () => apiRequest("/products/admin/low-stock"),

  search: (params = {}) =>
    apiRequest(`/products/search?${new URLSearchParams(params)}`),
};

// ============================================================
// CATEGORY API
// ============================================================
export const categoryAPI = {
  getAll: () => apiRequest("/categories"),

  create: (data) =>
    apiRequest("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    apiRequest(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id) => apiRequest(`/categories/${id}`, { method: "DELETE" }),
};

// ============================================================
// ORDER API
// ============================================================
export const orderAPI = {
  getAll: (params = {}) =>
    apiRequest(`/admin/orders?${new URLSearchParams(params)}`),

  getById: (id) => apiRequest(`/admin/orders/${id}`),

  getStats: () => apiRequest("/admin/orders/stats"),

  updateStatus: (id, status) =>
    apiRequest(`/admin/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  updatePaymentStatus: (id, paymentData) =>
    apiRequest(`/admin/orders/${id}/payment`, {
      method: "PUT",
      body: JSON.stringify(paymentData),
    }),

  addNote: (id, note) =>
    apiRequest(`/admin/orders/${id}/notes`, {
      method: "PUT",
      body: JSON.stringify({ note }),
    }),

  generateDeliveryOtp: (id) =>
    apiRequest(`/admin/orders/${id}/delivery-otp`, { method: "POST" }),

  verifyDeliveryOtp: (id, otp) =>
    apiRequest(`/admin/orders/${id}/verify-delivery`, {
      method: "POST",
      body: JSON.stringify({ otp }),
    }),
};

// ============================================================
// PAYMENT API
// ============================================================
export const paymentAPI = {
  getAll: (params = {}) =>
    apiRequest(`/admin/payments?${new URLSearchParams(params)}`),

  getById: (id) => apiRequest(`/admin/payments/${id}`),

  getStats: (params = {}) =>
    apiRequest(`/admin/payments/stats?${new URLSearchParams(params)}`),

  record: (paymentData) =>
    apiRequest("/admin/payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),

  update: (id, paymentData) =>
    apiRequest(`/admin/payments/${id}`, {
      method: "PUT",
      body: JSON.stringify(paymentData),
    }),

  cancel: (id, reason) =>
    apiRequest(`/admin/payments/${id}/cancel`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    }),

  getOverdueReport: (params = {}) =>
    apiRequest(`/admin/payments/overdue?${new URLSearchParams(params)}`),

  getUserPayments: (userId, params = {}) =>
    apiRequest(
      `/admin/users/${userId}/payments?${new URLSearchParams(params)}`
    ),
};

// ============================================================
// ADMIN MANAGEMENT API
// ============================================================
export const adminAPI = {
  getAll: () => apiRequest("/admin/admins"),

  getById: (id) => apiRequest(`/admin/admins/${id}`),

  create: (adminData) =>
    apiRequest("/admin/create-admin", {
      method: "POST",
      body: JSON.stringify(adminData),
    }),

  update: (id, adminData) =>
    apiRequest(`/admin/admins/${id}`, {
      method: "PUT",
      body: JSON.stringify(adminData),
    }),

  toggleStatus: (id) =>
    apiRequest(`/admin/admins/${id}/toggle-status`, { method: "PUT" }),

  delete: (id) => apiRequest(`/admin/admins/${id}`, { method: "DELETE" }),
};

// ============================================================
// IMAGE API
// ============================================================
export const imageAPI = {
  getStats: () => apiRequest("/admin/images/stats"),
  getOrphaned: () => apiRequest("/admin/images/orphaned"),
  getAll: () => apiRequest("/admin/images/all"),
  deleteSelected: (filenames) =>
    apiRequest("/admin/images/delete", {
      method: "POST",
      body: JSON.stringify({ filenames }),
    }),
  cleanupAll: () =>
    apiRequest("/admin/images/cleanup", { method: "DELETE" }),
};

export default {
  userAPI,
  productAPI,
  categoryAPI,
  orderAPI,
  paymentAPI,
  adminAPI,
  imageAPI,
  getAuthHeaders,
};