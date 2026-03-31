
// src/api/auth.js
// ⚠️ DO NOT import authStore here - it causes circular dependency!
import apiClient, { handleApiResponse } from './client';

// ============================================================
// REGISTRATION
// ============================================================

export const sendRegistrationOtp = async (phone) => {
  const response = await apiClient.post('/auth/register/send-otp', { phone });
  return handleApiResponse(response);
};

export const verifyRegistrationOtp = async (phone, otp) => {
  const response = await apiClient.post('/auth/register/verify-otp', { phone, otp });
  return handleApiResponse(response);
};

export const completeRegistration = async (data) => {
  const response = await apiClient.post('/auth/register/complete', data);
  return handleApiResponse(response);
};

// ============================================================
// LOGIN
// ============================================================

export const login = async (phone, password) => {
  const response = await apiClient.post('/auth/login', { phone, password });
  return handleApiResponse(response);
};

export const sendLoginOtp = async (phone) => {
  const response = await apiClient.post('/auth/login/send-otp', { phone });
  return handleApiResponse(response);
};

export const verifyLoginOtp = async (phone, otp) => {
  const response = await apiClient.post('/auth/login/verify-otp', { phone, otp });
  return handleApiResponse(response);
};

// ============================================================
// FORGOT PASSWORD
// ============================================================

export const sendForgotPasswordOtp = async (phone) => {
  const response = await apiClient.post('/auth/forgot-password/send-otp', { phone });
  return handleApiResponse(response);
};

export const resetPassword = async (phone, otp, newPassword) => {
  const response = await apiClient.post('/auth/forgot-password/reset', {
    phone,
    otp,
    newPassword,
  });
  return handleApiResponse(response);
};

// Email-based password reset
export const requestPasswordResetEmail = async (email) => {
  const response = await apiClient.post('/auth/reset-password/request', { email });
  return handleApiResponse(response);
};

export const verifyResetToken = async (token) => {
  const response = await apiClient.get(`/auth/reset-password/verify/${token}`);
  return handleApiResponse(response);
};

export const resetPasswordWithToken = async (token, newPassword, confirmPassword) => {
  const response = await apiClient.post('/auth/reset-password/email', {
    token,
    newPassword,
    confirmPassword,
  });
  return handleApiResponse(response);
};

// ============================================================
// PROFILE
// ============================================================

export const getProfile = async () => {
  const response = await apiClient.get('/auth/me');
  return handleApiResponse(response);
};

export const updateProfile = async (data) => {
  const response = await apiClient.put('/auth/profile', data);
  return handleApiResponse(response);
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await apiClient.put('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return handleApiResponse(response);
};

// ============================================================
// FCM TOKEN
// ============================================================

export const updateFCMToken = async (fcmToken) => {
  const response = await apiClient.put('/auth/fcm-token', { fcmToken });
  return handleApiResponse(response);
};
// // src/api/auth.js
// // ⚠️ DO NOT import authStore here - it causes circular dependency!
// import apiClient, { handleApiResponse } from './client';

// // ============================================================
// // REGISTRATION
// // ============================================================

// export const sendRegistrationOtp = async (phone) => {
//   const response = await apiClient.post('/auth/register/send-otp', { phone });
//   return handleApiResponse(response);
// };

// export const verifyRegistrationOtp = async (phone, otp) => {
//   const response = await apiClient.post('/auth/register/verify-otp', { phone, otp });
//   return handleApiResponse(response);
// };

// export const completeRegistration = async (data) => {
//   const response = await apiClient.post('/auth/register/complete', data);
//   return handleApiResponse(response);
// };

// // ============================================================
// // LOGIN
// // ============================================================

// export const login = async (phone, password) => {
//   const response = await apiClient.post('/auth/login', { phone, password });
//   return handleApiResponse(response);
// };

// export const sendLoginOtp = async (phone) => {
//   const response = await apiClient.post('/auth/login/send-otp', { phone });
//   return handleApiResponse(response);
// };

// export const verifyLoginOtp = async (phone, otp) => {
//   const response = await apiClient.post('/auth/login/verify-otp', { phone, otp });
//   return handleApiResponse(response);
// };

// // ============================================================
// // FORGOT PASSWORD
// // ============================================================

// export const sendForgotPasswordOtp = async (phone) => {
//   const response = await apiClient.post('/auth/forgot-password/send-otp', { phone });
//   return handleApiResponse(response);
// };

// export const resetPassword = async (phone, otp, newPassword) => {
//   const response = await apiClient.post('/auth/forgot-password/reset', {
//     phone,
//     otp,
//     newPassword,
//   });
//   return handleApiResponse(response);
// };

// // Email-based password reset
// export const requestPasswordResetEmail = async (email) => {
//   const response = await apiClient.post('/auth/reset-password/request', { email });
//   return handleApiResponse(response);
// };

// export const verifyResetToken = async (token) => {
//   const response = await apiClient.get(`/auth/reset-password/verify/${token}`);
//   return handleApiResponse(response);
// };

// export const resetPasswordWithToken = async (token, newPassword, confirmPassword) => {
//   const response = await apiClient.post('/auth/reset-password/email', {
//     token,
//     newPassword,
//     confirmPassword,
//   });
//   return handleApiResponse(response);
// };

// // ============================================================
// // PROFILE
// // ============================================================

// export const getProfile = async () => {
//   const response = await apiClient.get('/auth/me');
//   return handleApiResponse(response);
// };

// export const updateProfile = async (data) => {
//   const response = await apiClient.put('/auth/profile', data);
//   return handleApiResponse(response);
// };

// export const changePassword = async (currentPassword, newPassword) => {
//   const response = await apiClient.put('/auth/change-password', {
//     currentPassword,
//     newPassword,
//   });
//   return handleApiResponse(response);
// };

// // ============================================================
// // FCM TOKEN
// // ============================================================

// export const updateFCMToken = async (fcmToken) => {
//   const response = await apiClient.put('/auth/fcm-token', { fcmToken });
//   return handleApiResponse(response);
// };