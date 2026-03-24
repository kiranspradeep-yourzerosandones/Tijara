// src/utils/tokenManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

class TokenManager {
  constructor() {
    this.onUnauthorizedCallback = null;
  }

  async getToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async setToken(token) {
    try {
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      }
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  async clearToken() {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  }

  setUnauthorizedCallback(callback) {
    this.onUnauthorizedCallback = callback;
  }

  handleUnauthorized() {
    if (this.onUnauthorizedCallback) {
      this.onUnauthorizedCallback();
    }
  }
}

const tokenManager = new TokenManager();
export default tokenManager;