// src/api/client.js
import axios from 'axios';
import tokenManager from '../utils/tokenManager';
import ENV from '../config/env';

const BASE_URL = ENV.API_URL;

console.log('📡 API Configuration:', {
  baseURL: BASE_URL,
  isDev: __DEV__,
});

// Create axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
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
    
    if (__DEV__) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
      console.log('📦 Data:', config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`✅ Response from ${response.config.url}:`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (__DEV__) {
      console.error('❌ API Error Details:', {
        message: error.message,
        url: originalRequest?.url,
        method: originalRequest?.method,
        data: originalRequest?.data,
        response: error.response?.data,
        status: error.response?.status,
      });
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await tokenManager.clearToken();
      tokenManager.handleUnauthorized();
      return Promise.reject(error);
    }
    
    // Handle network errors
    if (!error.response) {
      const networkError = new Error(
        `Cannot connect to server at ${BASE_URL}\n\n` +
        `Troubleshooting:\n` +
        `1. ✅ Backend running? Check terminal\n` +
        `2. ✅ Same Wi-Fi? Phone & PC must be on same network\n` +
        `3. ✅ Correct IP? Current: ${BASE_URL.split('//')[1]?.split(':')[0]}\n` +
        `4. ✅ Firewall? Allow Node.js through firewall`
      );
      return Promise.reject(networkError);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

export const handleApiResponse = (response) => {
  if (response.data?.success) {
    return response.data;
  }
  throw new Error(response.data?.message || 'Something went wrong');
};

export const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};