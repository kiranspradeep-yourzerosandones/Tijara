// src/utils/tokenManager.js
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'tijara_auth_token';
const REFRESH_TOKEN_KEY = 'tijara_refresh_token';

let unauthorizedCallback = null;

const tokenManager = {
  // Store token securely
  setToken: async (token) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('❌ SecureStore setToken error:', error);
      throw error;
    }
  },

  // Get token
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('❌ SecureStore getToken error:', error);
      return null;
    }
  },

  // Clear token
  clearToken: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('❌ SecureStore clearToken error:', error);
    }
  },

  // Refresh token support (for later)
  setRefreshToken: async (token) => {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('❌ SecureStore setRefreshToken error:', error);
    }
  },

  getRefreshToken: async () => {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('❌ SecureStore getRefreshToken error:', error);
      return null;
    }
  },

  clearRefreshToken: async () => {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('❌ SecureStore clearRefreshToken error:', error);
    }
  },

  // Clear everything
  clearAll: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('❌ SecureStore clearAll error:', error);
    }
  },

  // Unauthorized handler
  setUnauthorizedCallback: (callback) => {
    unauthorizedCallback = callback;
  },

  handleUnauthorized: () => {
    if (unauthorizedCallback) {
      unauthorizedCallback();
    }
  },
};

export default tokenManager;