// src/api/client.js
import axios from 'axios';
import tokenManager from '../utils/tokenManager';
import ENV from '../config/env';

const BASE_URL = ENV.API_URL;

if (ENV.DEBUG) {
  console.log('📡 API Configuration:', {
    baseURL: BASE_URL,
    environment: ENV.ENVIRONMENT,
    timeout: ENV.API_TIMEOUT,
  });
}

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    if (ENV.DEBUG) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('📦 Data:', config.data);
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor - Handle errors + retry
apiClient.interceptors.response.use(
  (response) => {
    if (ENV.DEBUG) {
      console.log(`✅ Response ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (ENV.DEBUG) {
      console.error('❌ API Error:', {
        message: error.message,
        url: originalRequest?.url,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // ✅ Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await tokenManager.clearToken();
      tokenManager.handleUnauthorized();
      return Promise.reject(error);
    }

    // ✅ Retry logic for network errors and 5xx
    const shouldRetry =
      !originalRequest._retryCount &&
      (!error.response || error.response.status >= 500);

    if (shouldRetry) {
      originalRequest._retryCount = 0;
    }

    if (
      originalRequest._retryCount !== undefined &&
      originalRequest._retryCount < ENV.API_RETRY_COUNT &&
      (!error.response || error.response.status >= 500)
    ) {
      originalRequest._retryCount += 1;

      const delay = ENV.API_RETRY_DELAY * originalRequest._retryCount;

      if (ENV.DEBUG) {
        console.log(
          `🔄 Retrying request (${originalRequest._retryCount}/${ENV.API_RETRY_COUNT}) after ${delay}ms`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    // ✅ Network error - friendly message
    if (!error.response) {
      const networkError = new Error(
        'No internet connection. Please check your network and try again.'
      );
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ✅ Standardized response handler
export const handleApiResponse = (response) => {
  if (response.data?.success) {
    return response.data;
  }
  throw new Error(response.data?.message || 'Something went wrong');
};

export const handleApiError = (error) => {
  if (error.isNetworkError) {
    return 'No internet connection. Please check your network.';
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};