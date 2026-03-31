// src/store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tokenManager from '../utils/tokenManager';

// Import auth functions directly to avoid circular dependency
import * as authAPI from '../api/auth';

export const useAuthStore = create(
  persist(
    (set, get) => {
      // Register unauthorized callback
      tokenManager.setUnauthorizedCallback(() => {
        console.log('🚨 Unauthorized - Auto logout');
        get().logout();
      });

      return {
        // State
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Registration flow state
        registrationPhone: null,
        isPhoneVerified: false,

        // Actions
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // Set registration phone
        setRegistrationPhone: (phone) => set({ registrationPhone: phone }),
        setPhoneVerified: (verified) => set({ isPhoneVerified: verified }),

        // Login with password
        login: async (phone, password) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authAPI.login(phone, password);
            const { user, token } = response.data;

            await tokenManager.setToken(token);

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return response;
          } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        // Login with OTP
        loginWithOtp: async (phone, otp) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authAPI.verifyLoginOtp(phone, otp);
            const { user, token } = response.data;

            await tokenManager.setToken(token);

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return response;
          } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        // Complete registration
        completeRegistration: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authAPI.completeRegistration(data);
            const { user, token } = response.data;

            await tokenManager.setToken(token);

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              registrationPhone: null,
              isPhoneVerified: false,
            });

            return response;
          } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        // Logout
        logout: async () => {
          try {
            await tokenManager.clearToken();
          } catch (error) {
            console.error('Error clearing token:', error);
          }
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
            registrationPhone: null,
            isPhoneVerified: false,
          });
        },

        // Fetch profile (with credit data)
        fetchProfile: async () => {
          set({ isLoading: true });
          try {
            const response = await authAPI.getProfile();
            const userData = response.data.user;
            
            set({ 
              user: userData, 
              isLoading: false 
            });
            
            return response;
          } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        // Refresh user (silently update profile)
        refreshUser: async () => {
          try {
            const response = await authAPI.getProfile();
            if (response.success && response.data?.user) {
              set({ user: response.data.user });
              return response.data.user;
            }
            return null;
          } catch (error) {
            console.error('Refresh user error:', error);
            return null;
          }
        },

        // Update user (merge with existing data)
        updateUser: (userData) => {
          const currentUser = get().user;
          set({
            user: { ...currentUser, ...userData },
          });
        },

        // Update profile
        updateProfile: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authAPI.updateProfile(data);
            set({ user: response.data.user, isLoading: false });
            return response;
          } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        // Restore session
        restoreSession: async () => {
          try {
            const token = await tokenManager.getToken();
            if (token) {
              set({ token, isAuthenticated: true });
              await get().fetchProfile();
              return true;
            }
            return false;
          } catch (error) {
            console.error('Error restoring session:', error);
            await get().logout();
            return false;
          }
        },
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
