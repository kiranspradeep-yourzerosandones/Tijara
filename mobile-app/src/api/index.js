// src/api/index.js
// ⚠️ DO NOT import authStore here - causes circular dependency!

// Export API client and helpers
export { default as apiClient } from './client';
export { handleApiResponse, handleApiError } from './client';

// ============================================================
// AUTH API
// ============================================================
import * as auth from './auth';
export const authAPI = auth;

// ============================================================
// PRODUCTS API
// ============================================================
import * as products from './products';
export const productsAPI = products;

// ============================================================
// CART API
// ============================================================
import * as cart from './cart';
export const cartAPI = cart;

// ============================================================
// ORDERS API
// ============================================================
import * as orders from './orders';
export const ordersAPI = orders;

// ============================================================
// LOCATIONS API
// ============================================================
import * as locations from './locations';
export const locationsAPI = locations;

// ============================================================
// PAYMENTS API
// ============================================================
import * as payments from './payments';
export const paymentsAPI = payments;

// ============================================================
// NOTIFICATIONS API
// ============================================================
import * as notifications from './notifications';
export const notificationsAPI = notifications;