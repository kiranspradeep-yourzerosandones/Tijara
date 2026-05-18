// src/config/env.development.js
const DEV_ENV = {
  API_URL: 'http://192.168.29.69:5000/api',
  IMAGE_BASE_URL: 'http://192.168.29.69:5000',
  SOCKET_URL: 'http://192.168.29.69:5000',
  DEBUG: true,
  LOG_LEVEL: 'verbose',
  ENVIRONMENT: 'development',

  // Feature flags
  FEATURES: {
    PUSH_NOTIFICATIONS: false,
    SOCKET_ENABLED: false,
    ANALYTICS: false,
    CRASH_REPORTING: false,
  },

  // Timeouts
  API_TIMEOUT: 30000,
  UPLOAD_TIMEOUT: 60000,

  // Retry
  API_RETRY_COUNT: 2,
  API_RETRY_DELAY: 1000,
};

export default DEV_ENV;