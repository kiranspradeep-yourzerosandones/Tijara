// src/config/env.production.js
const PROD_ENV = {
  API_URL: 'https://api.tijara.com/api',
  IMAGE_BASE_URL: 'https://api.tijara.com',
  SOCKET_URL: 'https://api.tijara.com',
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