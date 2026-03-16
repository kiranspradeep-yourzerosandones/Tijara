// mobile-app\src\api\auth.js
import apiClient from './client';

export const authAPI = {
  // Send registration OTP
  sendRegistrationOTP: (phone) => {
    return apiClient.post('/auth/register/send-otp', { phone });
  },

  // Verify registration OTP
  verifyRegistrationOTP: (phone, otp) => {
    return apiClient.post('/auth/register/verify-otp', { phone, otp });
  },

  // Complete registration
  register: (data) => {
    return apiClient.post('/auth/register/complete', data);
  },

  // Login with password
  login: (phone, password) => {
    return apiClient.post('/auth/login', { phone, password });
  },

  // Send login OTP
  sendLoginOTP: (phone) => {
    return apiClient.post('/auth/login/send-otp', { phone });
  },

  // Verify login OTP
  verifyLoginOTP: (phone, otp) => {
    return apiClient.post('/auth/login/verify-otp', { phone, otp });
  },

  // Get current user
  getMe: () => {
    return apiClient.get('/auth/me');
  },

  // Update profile
  updateProfile: (data) => {
    return apiClient.put('/auth/profile', data);
  },

  // Change password
  changePassword: (currentPassword, newPassword) => {
    return apiClient.put('/auth/change-password', { currentPassword, newPassword });
  },

  // Forgot password - send OTP
  sendForgotPasswordOTP: (phone) => {
    return apiClient.post('/auth/forgot-password/send-otp', { phone });
  },

  // Reset password with OTP
  resetPassword: (phone, otp, newPassword) => {
    return apiClient.post('/auth/forgot-password/reset', { phone, otp, newPassword });
  },

  // Update FCM token
  updateFCMToken: (fcmToken) => {
    return apiClient.put('/auth/fcm-token', { fcmToken });
  },
};