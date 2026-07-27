// src/config/env.production.js
const PROD_ENV = {
  API_URL: 'https://admin.tijaracorp.com/api',
  IMAGE_BASE_URL: 'https://admin.tijaracorp.com',
  SOCKET_URL: 'https://admin.tijaracorp.com',
  DEBUG: false,
  LOG_LEVEL: 'error',
  ENVIRONMENT: 'production',

  FEATURES: {
    PUSH_NOTIFICATIONS: true,
    SOCKET_ENABLED: true,
    ANALYTICS: true,
    CRASH_REPORTING: true,
  },

  API_TIMEOUT: 20000,
  UPLOAD_TIMEOUT: 60000,

  API_RETRY_COUNT: 3,
  API_RETRY_DELAY: 1500,
};

export default PROD_ENV;