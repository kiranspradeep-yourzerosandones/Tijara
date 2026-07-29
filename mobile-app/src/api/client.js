// src/api/client.js
import axios from 'axios';
import tokenManager from '../utils/tokenManager';
import ENV from '../config/env';

const BASE_URL = ENV.API_URL;

// ── Create axios instance ─────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Routes that should NEVER trigger auto-logout on 401 ──
const SKIP_LOGOUT_ROUTES = [
  '/auth/login',
  '/auth/login/send-otp',
  '/auth/login/verify-otp',
  '/auth/register',
  '/auth/register/send-otp',
  '/auth/register/verify-otp',
  '/auth/register/complete',
  '/auth/forgot-password',
  '/auth/forgot-password/send-otp',
  '/auth/forgot-password/reset',
  '/auth/reset-password',
  '/auth/push-token',
  '/auth/notification-preferences',
];

const shouldSkipLogout = (url = '') =>
  SKIP_LOGOUT_ROUTES.some((route) => url.includes(route));

// ── Request interceptor — attach token ───────────────────
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Non-critical — continue without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — normalize + retry ─────────────
apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status          = error.response?.status;
    const responseData    = error.response?.data;
    const requestUrl      = originalRequest?.url || '';

    // ── 401 Unauthorized ───────────────────────────────────
    if (status === 401 && !originalRequest._retry) {
      if (!shouldSkipLogout(requestUrl)) {
        originalRequest._retry = true;
        await tokenManager.clearToken();
        tokenManager.handleUnauthorized();
      }
      return Promise.reject(buildRichError(error));
    }

    // ── Retry on network errors and 5xx ───────────────────
    const shouldRetry =
      !originalRequest._retryCount &&
      (!error.response || status >= 500);

    if (shouldRetry) {
      originalRequest._retryCount = 0;
    }

    if (
      originalRequest._retryCount !== undefined &&
      originalRequest._retryCount < ENV.API_RETRY_COUNT &&
      (!error.response || status >= 500)
    ) {
      originalRequest._retryCount += 1;
      const delay = ENV.API_RETRY_DELAY * originalRequest._retryCount;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    // ── No internet ────────────────────────────────────────
    if (!error.response) {
      const networkErr = new Error(
        'No internet connection. Please check your network and try again.'
      );
      networkErr.isNetworkError = true;
      networkErr.status         = 0;
      return Promise.reject(networkErr);
    }

    // ── All other errors — attach rich metadata ────────────
    return Promise.reject(buildRichError(error));
  }
);

/**
 * Attach status + data + code to the error so screens can
 * inspect them directly without re-parsing axios internals.
 */
function buildRichError(axiosError) {
  const status  = axiosError.response?.status;
  const data    = axiosError.response?.data;
  const message = data?.message || axiosError.message || 'Something went wrong';

  const rich      = new Error(message);
  rich.status     = status;
  rich.data       = data;
  rich.code       = data?.code || '';
  rich.url        = axiosError.config?.url;
  rich.isApiError = true;

  return rich;
}

export default apiClient;

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/**
 * Unwrap a successful axios response.
 * Throws a rich error when success === false even on 2xx.
 */
export const handleApiResponse = (response) => {
  const data = response.data;

  if (data?.success === false) {
    const err      = new Error(data.message || 'Request failed');
    err.status     = response.status;
    err.data       = data;
    err.code       = data?.code || '';
    err.isApiError = true;
    throw err;
  }

  return data;
};

/**
 * Extract a human-readable string from any error shape.
 * Use this when you only need a message string (toast / banner).
 */
export const handleApiError = (error) => {
  if (error.isNetworkError) {
    return 'No internet connection. Please check your network.';
  }
  if (error.isApiError && error.message) {
    return error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};

/**
 * Map any API / network error to a structured object that UI
 * screens use to set field-level or banner errors.
 *
 * Returns:
 *   { field: 'phone'|'password'|'email'|'name'|'otp'|'credentials'|'banner',
 *     message: string }
 */
export const mapAuthError = (error) => {
  const status  = error.status  || error.response?.status || 0;
  const data    = error.data    || error.response?.data   || {};
  const code    = error.code    || data.code              || '';
  const message = error.message || data.message           || '';
  const lc      = message.toLowerCase();

  // ── Network / no connection ───────────────────────────────
  if (error.isNetworkError || status === 0) {
    return {
      field:   'banner',
      message: 'No internet connection. Please check your network.',
    };
  }

  // ── Named error codes (most specific — check first) ───────

  if (code === 'NOT_FOUND') {
    return { field: 'phone', message: 'No account found with this phone number.' };
  }

  if (code === 'WRONG_PASSWORD') {
    return { field: 'password', message: 'Incorrect password. Please try again.' };
  }

  if (code === 'ACCOUNT_DEACTIVATED') {
    return {
      field:   'banner',
      message: 'Your account has been deactivated. Please contact support.',
    };
  }

  if (code === 'PHONE_ALREADY_REGISTERED') {
    return {
      field:   'phone',
      message: 'This phone number is already registered. Please log in.',
    };
  }

  if (code === 'INVALID_OTP') {
    const remaining = data.attemptsRemaining;
    return {
      field:   'otp',
      message: remaining != null
        ? `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
        : 'Invalid OTP. Please try again.',
    };
  }

  if (code === 'OTP_EXPIRED') {
    return { field: 'otp', message: 'OTP has expired. Please request a new one.' };
  }

  if (code === 'TOO_MANY_ATTEMPTS') {
    return { field: 'otp', message: 'Too many failed attempts. Please request a new OTP.' };
  }

  if (code === 'NO_OTP') {
    return { field: 'banner', message: 'OTP not requested. Please go back and request one.' };
  }

  if (code === 'OTP_COOLDOWN') {
    const wait = data.waitTime ? ` Please wait ${data.waitTime} seconds.` : '';
    return { field: 'banner', message: `OTP already sent.${wait}` };
  }

  if (code === 'OTP_DAILY_LIMIT') {
    return { field: 'banner', message: 'Daily OTP limit reached. Please try again tomorrow.' };
  }

  if (code === 'OTP_LOCKED' || code === 'ACCOUNT_LOCKED') {
    return {
      field:   'banner',
      message: message || 'Account temporarily locked. Please try again later.',
    };
  }

  // ── HTTP status fallbacks (when no named code) ────────────

  if (status === 400) {
    if (lc.includes('phone') && (lc.includes('already') || lc.includes('registered'))) {
      return { field: 'phone', message: 'This phone number is already registered. Please log in.' };
    }
    if (lc.includes('email') && (lc.includes('already') || lc.includes('registered'))) {
      return { field: 'email', message: 'This email address is already registered.' };
    }
    if (lc.includes('phone') && lc.includes('valid')) {
      return { field: 'phone', message: 'Please enter a valid 10-digit phone number.' };
    }
    if (lc.includes('password') && lc.includes('6')) {
      return { field: 'password', message: 'Password must be at least 6 characters.' };
    }
    if (lc.includes('name')) {
      return { field: 'name', message };
    }
    return { field: 'banner', message: message || 'Invalid request. Please check your details.' };
  }

  if (status === 401) {
    if (lc.includes('deactivated') || lc.includes('disabled')) {
      return {
        field:   'banner',
        message: 'Your account has been deactivated. Please contact support.',
      };
    }
    return {
      field:   'credentials',
      message: 'Phone number or password is incorrect.',
    };
  }

  if (status === 403) {
    return {
      field:   'banner',
      message: message || 'Access denied. Please contact support.',
    };
  }

  if (status === 404) {
    return { field: 'phone', message: 'No account found with this phone number.' };
  }

  if (status === 429) {
    return {
      field:   'banner',
      message: message || 'Too many requests. Please wait a moment and try again.',
    };
  }

  if (status >= 500) {
    return { field: 'banner', message: 'Server error. Please try again in a moment.' };
  }

  return {
    field:   'banner',
    message: message || 'Something went wrong. Please try again.',
  };
};