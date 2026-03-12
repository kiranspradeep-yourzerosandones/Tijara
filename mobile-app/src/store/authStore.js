import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../utils/constants';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  // Actions
  setUser: (user) => set({ user, isAuthenticated: true }),
  
  setToken: async (token) => {
    try {
      if (token) {
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      }
      set({ token });
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  login: async (userData, token) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      set({ 
        user: userData, 
        token, 
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const userDataStr = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      
      if (token && userDataStr) {
        const userData = JSON.parse(userDataStr);
        set({ 
          user: userData, 
          token, 
          isAuthenticated: true,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      set({ isLoading: false });
    }
  },

  updateUser: async (userData) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      set({ user: userData });
    } catch (error) {
      console.error('Error updating user:', error);
    }
  },
}));

export default useAuthStore;