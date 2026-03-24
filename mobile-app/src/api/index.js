// src/api/index.js
// ⚠️ DO NOT import authStore here!

// Export API client
export { default as apiClient } from './client';
export { handleApiResponse, handleApiError } from './client';

// Export all auth functions as named exports AND as authAPI object
import * as auth from './auth';
export const authAPI = auth;
export * from './auth';

// Export other API modules
import * as cart from './cart';
export const cartAPI = cart;
export * from './cart';

import * as products from './products';
export const productsAPI = products;
export * from './products';

import * as orders from './orders';
export const ordersAPI = orders;
export * from './orders';

import * as locations from './locations';
export const locationsAPI = locations;
export * from './locations';

import * as payments from './payments';
export const paymentsAPI = payments;
export * from './payments';

import * as notifications from './notifications';
export const notificationsAPI = notifications;
export * from './notifications';