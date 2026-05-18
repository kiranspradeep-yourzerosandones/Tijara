// src/store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tokenManager from '../utils/tokenManager';
import * as authAPI from '../api/auth';

export const useAuthStore = create(
  persist(
    (set, get) => {
      // Register unauthorized callback ONCE
      tokenManager.setUnauthorizedCallback(() => {
        console.log('🚨 Unauthorized - Auto logout');
        get().logout();
      });

      return {
        // ─── State ───────────────────────────────────────────
        user: null,
        isAuthenticated: false,
        isLoading: true,       // ✅ Start true — loading until session restored
        isSessionRestored: false, // ✅ NEW — prevents double restore
        error: null,

        // Registration flow
        registrationPhone: null,
        isPhoneVerified: false,

        // ─── Basic actions ────────────────────────────────────
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setRegistrationPhone: (phone) => set({ registrationPhone: phone }),
        setPhoneVerified: (verified) => set({ isPhoneVerified: verified }),

        // ─── Login with password ──────────────────────────────
        login: async (phone, password) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authAPI.login(phone, password);
            const { user, token } = response.data;

            await tokenManager.setToken(token);

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return response;
          } catch (error) {
            const errorMessage =
              error.response?.data?.message || error.message;
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        // ─── Login with OTP ───────────────────────────────────
        loginWithOtp: async (phone, otp) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authAPI.verifyLoginOtp(phone, otp);
            const { user, token } = response.data;

            await tokenManager.setToken(token);

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            return response;
          } catch (error) {
            const errorMessage =
              error.response?.data?.message || error.message;
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        // ─── Complete registration ────────────────────────────
        completeRegistration: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authAPI.completeRegistration(data);
            const { user, token } = response.data;

            await tokenManager.setToken(token);

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              registrationPhone: null,
              isPhoneVerified: false,
            });

            return response;
          } catch (error) {
            const errorMessage =
              error.response?.data?.message || error.message;
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        // ─── Logout ───────────────────────────────────────────
        logout: async () => {
          try {
            await tokenManager.clearAll();
          } catch (error) {
            console.error('Error clearing token:', error);
          }
          set({
            user: null,
            isAuthenticated: false,
            isSessionRestored: false,
            error: null,
            registrationPhone: null,
            isPhoneVerified: false,
          });
        },

        // ─── Restore session (called ONCE on app start) ───────
        restoreSession: async () => {
          // ✅ Guard — never run twice
          if (get().isSessionRestored) {
            console.log('⚡ Session already restored — skipping');
            set({ isLoading: false });
            return get().isAuthenticated;
          }

          console.log('🔄 Restoring session...');
          set({ isLoading: true });

          try {
            const token = await tokenManager.getToken();

            if (!token) {
              console.log('❌ No token found — guest mode');
              set({
                isAuthenticated: false,
                isLoading: false,
                isSessionRestored: true,
              });
              return false;
            }

            // Token exists — fetch profile to validate
            const response = await authAPI.getProfile();
            const userData = response.data?.user;

            if (userData) {
              console.log('✅ Session restored for:', userData.phone);
              set({
                user: userData,
                isAuthenticated: true,
                isLoading: false,
                isSessionRestored: true,
              });
              return true;
            }

            // Invalid response
            throw new Error('Invalid profile response');
          } catch (error) {
            console.warn('⚠️ Session restore failed:', error.message);
            await tokenManager.clearAll();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isSessionRestored: true,
            });
            return false;
          }
        },

        // ─── Refresh user silently ────────────────────────────
        refreshUser: async () => {
          try {
            const response = await authAPI.getProfile();
            if (response.success && response.data?.user) {
              set({ user: response.data.user });
              return response.data.user;
            }
            return null;
          } catch (error) {
            console.error('Refresh user error:', error.message);
            return null;
          }
        },

        // ─── Update profile ───────────────────────────────────
        updateProfile: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authAPI.updateProfile(data);
            set({ user: response.data.user, isLoading: false });
            return response;
          } catch (error) {
            const errorMessage =
              error.response?.data?.message || error.message;
            set({ isLoading: false, error: errorMessage });
            throw error;
          }
        },

        // ─── Update local user data ───────────────────────────
        updateUser: (userData) => {
          const currentUser = get().user;
          set({ user: { ...currentUser, ...userData } });
        },
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // ✅ Only persist these — token lives in SecureStore
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;