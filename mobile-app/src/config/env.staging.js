// src/config/env.staging.js
const STAGING_ENV = {
  API_URL: 'https://staging-api.tijara.com/api',
  IMAGE_BASE_URL: 'https://staging-api.tijara.com',
  SOCKET_URL: 'https://staging-api.tijara.com',
  DEBUG: true,
  LOG_LEVEL: 'warn',
  ENVIRONMENT: 'staging',

  FEATURES: {
    PUSH_NOTIFICATIONS: true,
    SOCKET_ENABLED: false,
    ANALYTICS: false,
    CRASH_REPORTING: true,
  },

  API_TIMEOUT: 30000,
  UPLOAD_TIMEOUT: 60000,

  API_RETRY_COUNT: 3,
  API_RETRY_DELAY: 1000,
};

export default STAGING_ENV;