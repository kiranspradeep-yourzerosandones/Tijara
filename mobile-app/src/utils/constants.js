import Constants from 'expo-constants';

// API Configuration
export const API_BASE_URL = process.env.API_BASE_URL || 'http://192.168.1.100:5000/api';

// App Configuration
export const APP_NAME = 'Tijara';
export const APP_VERSION = Constants.expoConfig.version;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  CART_DATA: 'cart_data',
  FCM_TOKEN: 'fcm_token',
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_LABELS = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  on_the_way: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  PAYMENT_REMINDER: 'payment_reminder',
  PAYMENT_RECEIVED: 'payment_received',
  PROMOTIONAL: 'promotional',
  ANNOUNCEMENT: 'announcement',
};