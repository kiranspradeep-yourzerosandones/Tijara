// src/store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tokenManager from '../utils/tokenManager';
import * as authAPI from '../api/auth';

export const useAuthStore = create(
  persist(
    (set, get) => {
      tokenManager.setUnauthorizedCallback(() => {
        get().logout();
      });

      const extractMessage = (error) =>
        error?.data?.message ||
        error?.message ||
        'Something went wrong';

      return {
        // ─── State ───────────────────────────────────────────
        user: null,
        isAuthenticated: false,
        isLoading: true,
        isSessionRestored: false,
        error: null,

        registrationPhone: null,
        isPhoneVerified: false,

        // ─── Basic actions ───────────────────────────────────
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setRegistrationPhone: (phone) => set({ registrationPhone: phone }),
        setPhoneVerified: (verified) => set({ isPhoneVerified: verified }),

        // ─── Login with password ─────────────────────────────
        //
        // ⚠️  Do NOT set isLoading:true here.
        // The navigator watches isLoading — flipping it causes
        // LoginScreen to remount, wiping local error state.
        // The screen manages its own loading spinner via useState.
        login: async (phone, password) => {
          set({ error: null });
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
            set({ error: extractMessage(error) });
            throw error;
          }
        },

        // ─── Login with OTP ──────────────────────────────────
        loginWithOtp: async (phone, otp) => {
          set({ error: null });
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
            set({ error: extractMessage(error) });
            throw error;
          }
        },

        // ─── Complete registration ───────────────────────────
        completeRegistration: async (data) => {
          set({ error: null });
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
            set({ error: extractMessage(error) });
            throw error;
          }
        },

        // ─── Logout ──────────────────────────────────────────
        logout: async () => {
          try {
            await tokenManager.clearAll();
          } catch {
            // Non-critical — continue with state reset
          }
          set({
            user: null,
            isAuthenticated: false,
            isSessionRestored: false,
            isLoading: false,
            error: null,
            registrationPhone: null,
            isPhoneVerified: false,
          });
        },

        // ─── Restore session (called ONCE on app start) ───────
        //
        // The ONLY place where isLoading:true is correct.
        // Runs during splash before any screen is mounted.
        restoreSession: async () => {
          if (get().isSessionRestored) {
            set({ isLoading: false });
            return get().isAuthenticated;
          }

          set({ isLoading: true });

          try {
            const token = await tokenManager.getToken();

            if (!token) {
              set({
                isAuthenticated: false,
                isLoading: false,
                isSessionRestored: true,
              });
              return false;
            }

            const response = await authAPI.getProfile();
            const userData = response.data?.user;

            if (!userData) throw new Error('Invalid profile response');

            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              isSessionRestored: true,
            });
            return true;

          } catch {
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

        // ─── Refresh user data silently ──────────────────────
        refreshUser: async () => {
          try {
            const response = await authAPI.getProfile();
            if (response.success && response.data?.user) {
              set({ user: response.data.user });
              return response.data.user;
            }
            return null;
          } catch {
            return null;
          }
        },

        // ─── Update profile ──────────────────────────────────
        updateProfile: async (data) => {
          set({ error: null });
          try {
            const response = await authAPI.updateProfile(data);
            set({ user: response.data.user });
            return response;
          } catch (error) {
            set({ error: extractMessage(error) });
            throw error;
          }
        },

        // ─── Merge partial user data locally ─────────────────
        updateUser: (userData) => {
          const currentUser = get().user;
          set({ user: { ...currentUser, ...userData } });
        },
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user data and auth flag.
      // Token lives in SecureStore via tokenManager.
      // isLoading / isSessionRestored reset on every boot.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;