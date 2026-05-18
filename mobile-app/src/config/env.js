// src/config/env.js
import DEV_ENV from './env.development';
import STAGING_ENV from './env.staging';
import PROD_ENV from './env.production';

const getEnv = () => {
  if (__DEV__) {
    return DEV_ENV;
  }

  // When building for production with EAS:
  // Set EXPO_PUBLIC_ENV=staging or production
  const buildEnv = process.env.EXPO_PUBLIC_ENV;

  if (buildEnv === 'staging') {
    return STAGING_ENV;
  }

  return PROD_ENV;
};

const ENV = getEnv();

// ✅ Log environment on startup (dev only)
if (ENV.DEBUG) {
  console.log('🌍 Environment:', ENV.ENVIRONMENT);
  console.log('📡 API URL:', ENV.API_URL);
}

export default ENV;