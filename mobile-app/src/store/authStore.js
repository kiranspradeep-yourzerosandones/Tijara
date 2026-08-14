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
        user:              null,
        isAuthenticated:   false,
        isLoading:         true,
        isSessionRestored: false,
        error:             null,

        // ✅ Preferred category — synced with backend
        preferredCategory: null,

        registrationPhone: null,
        isPhoneVerified:   false,

        // ─── Basic actions ───────────────────────────────────
        setLoading:            (loading)  => set({ isLoading: loading }),
        setError:              (error)    => set({ error }),
        clearError:            ()         => set({ error: null }),
        setRegistrationPhone:  (phone)    => set({ registrationPhone: phone }),
        setPhoneVerified:      (verified) => set({ isPhoneVerified: verified }),

        // ✅ Set preferred category locally (optimistic update)
        // The actual backend save is done in HomeScreen via authAPI
        setPreferredCategory: (categoryName) => {
          set({ preferredCategory: categoryName || null });
          // Also keep user object in sync so refreshUser doesn't overwrite
          const currentUser = get().user;
          if (currentUser) {
            set({ user: { ...currentUser, preferredCategory: categoryName || null } });
          }
        },

        // ─── Login with password ─────────────────────────────
        login: async (phone, password) => {
          set({ error: null });
          try {
            const response = await authAPI.login(phone, password);
            const { user, token } = response.data;

            await tokenManager.setToken(token);

            set({
              user,
              isAuthenticated:   true,
              isLoading:         false,
              error:             null,
              // ✅ Load preferred category from user profile on login
              preferredCategory: user?.preferredCategory || null,
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
              isAuthenticated:   true,
              isLoading:         false,
              error:             null,
              // ✅ Load preferred category from user profile on OTP login
              preferredCategory: user?.preferredCategory || null,
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
              isAuthenticated:   true,
              isLoading:         false,
              error:             null,
              registrationPhone: null,
              isPhoneVerified:   false,
              // ✅ New users start with no preference
              preferredCategory: user?.preferredCategory || null,
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
            // Non-critical
          }
          set({
            user:              null,
            isAuthenticated:   false,
            isSessionRestored: false,
            isLoading:         false,
            error:             null,
            registrationPhone: null,
            isPhoneVerified:   false,
            // ✅ Clear preference on logout
            preferredCategory: null,
          });
        },

        // ─── Restore session (called ONCE on app start) ───────
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
                isAuthenticated:   false,
                isLoading:         false,
                isSessionRestored: true,
              });
              return false;
            }

            const response = await authAPI.getProfile();
            const userData = response.data?.user;

            if (!userData) throw new Error('Invalid profile response');

            set({
              user:              userData,
              isAuthenticated:   true,
              isLoading:         false,
              isSessionRestored: true,
              // ✅ Restore preferred category from backend profile
              // This is the key cross-device sync — always trust backend
              preferredCategory: userData?.preferredCategory || null,
            });
            return true;

          } catch {
            await tokenManager.clearAll();
            set({
              user:              null,
              isAuthenticated:   false,
              isLoading:         false,
              isSessionRestored: true,
              preferredCategory: null,
            });
            return false;
          }
        },

        // ─── Refresh user data silently ──────────────────────
        refreshUser: async () => {
          try {
            const response = await authAPI.getProfile();
            if (response.success && response.data?.user) {
              const userData = response.data.user;
              set({
                user: userData,
                // ✅ Always sync preferredCategory from backend on refresh
                preferredCategory: userData?.preferredCategory || null,
              });
              return userData;
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
            const userData = response.data.user;
            set({
              user: userData,
              // ✅ Sync in case profile update affected preferredCategory
              preferredCategory: userData?.preferredCategory || null,
            });
            return response;
          } catch (error) {
            set({ error: extractMessage(error) });
            throw error;
          }
        },

        // ─── Merge partial user data locally ─────────────────
        updateUser: (userData) => {
          const currentUser = get().user;
          const merged      = { ...currentUser, ...userData };
          set({
            user: merged,
            // ✅ Sync if preferredCategory was part of the update
            ...(userData.preferredCategory !== undefined
              ? { preferredCategory: userData.preferredCategory || null }
              : {}),
          });
        },
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // ✅ Also persist preferredCategory so it's available
      // instantly before restoreSession completes (no flash)
      partialize: (state) => ({
        user:              state.user,
        isAuthenticated:   state.isAuthenticated,
        preferredCategory: state.preferredCategory,
      }),
    }
  )
);

export default useAuthStore;