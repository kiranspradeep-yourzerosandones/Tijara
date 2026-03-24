// App Constants
export const APP_NAME = 'Tijara';
export const APP_VERSION = '1.0.0';

// API Constants
export const API_TIMEOUT = 30000;
export const OTP_LENGTH = 4;
export const OTP_RESEND_DELAY = 30; // seconds
export const OTP_EXPIRY = 300; // seconds (5 minutes)

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PRODUCTS_PER_ROW = 2;

// Image placeholders
export const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/150';
export const PLACEHOLDER_PRODUCT = 'https://via.placeholder.com/200x200?text=Product';
export const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/100x100?text=User';

// Order Statuses
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
  [ORDER_STATUS.PENDING]: 'Order Placed',
  [ORDER_STATUS.CONFIRMED]: 'Order Confirmed',
  [ORDER_STATUS.PACKED]: 'Packed & Ready',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.ON_THE_WAY]: 'Out for Delivery',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: '#FF9800',
  [ORDER_STATUS.CONFIRMED]: '#2196F3',
  [ORDER_STATUS.PACKED]: '#9C27B0',
  [ORDER_STATUS.SHIPPED]: '#00BCD4',
  [ORDER_STATUS.ON_THE_WAY]: '#4CAF50',
  [ORDER_STATUS.DELIVERED]: '#4CAF50',
  [ORDER_STATUS.CANCELLED]: '#F44336',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PARTIAL: 'partial',
  REFUNDED: 'refunded',
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Payment Pending',
  [PAYMENT_STATUS.PAID]: 'Paid',
  [PAYMENT_STATUS.PARTIAL]: 'Partially Paid',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  UPI: 'upi',
  CREDIT: 'credit',
  OTHER: 'other',
};

// Location Labels
export const LOCATION_LABELS = ['shop', 'warehouse', 'office', 'home', 'other'];

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
];

// import Constants from 'expo-constants';

// // API Configuration
// export const API_BASE_URL = process.env.API_BASE_URL || 'http://192.168.1.100:5000/api';

// // App Configuration
// export const APP_NAME = 'Tijara';
// export const APP_VERSION = Constants.expoConfig.version;

// // Storage Keys
// export const STORAGE_KEYS = {
//   AUTH_TOKEN: 'auth_token',
//   USER_DATA: 'user_data',
//   CART_DATA: 'cart_data',
//   FCM_TOKEN: 'fcm_token',
// };

// // Order Status
// export const ORDER_STATUS = {
//   PENDING: 'pending',
//   CONFIRMED: 'confirmed',
//   PACKED: 'packed',
//   SHIPPED: 'shipped',
//   ON_THE_WAY: 'on_the_way',
//   DELIVERED: 'delivered',
//   CANCELLED: 'cancelled',
// };

// export const ORDER_STATUS_LABELS = {
//   pending: 'Order Placed',
//   confirmed: 'Confirmed',
//   packed: 'Packed',
//   shipped: 'Shipped',
//   on_the_way: 'Out for Delivery',
//   delivered: 'Delivered',
//   cancelled: 'Cancelled',
// };

// // Payment Status
// export const PAYMENT_STATUS = {
//   PENDING: 'pending',
//   PAID: 'paid',
//   PARTIAL: 'partial',
// };

// // Notification Types
// export const NOTIFICATION_TYPES = {
//   ORDER_UPDATE: 'order_update',
//   PAYMENT_REMINDER: 'payment_reminder',
//   PAYMENT_RECEIVED: 'payment_received',
//   PROMOTIONAL: 'promotional',
//   ANNOUNCEMENT: 'announcement',
// };