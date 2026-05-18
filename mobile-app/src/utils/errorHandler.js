// src/utils/errorHandler.js
import { Alert } from 'react-native';
import ENV from '../config/env';

// ============================================================
// ERROR TYPES
// ============================================================
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION: 'PERMISSION',
  UNKNOWN: 'UNKNOWN',
};

// ============================================================
// PARSE ERROR FROM API/AXIOS
// ============================================================
export const parseError = (error) => {
  // Network error
  if (error?.isNetworkError || !error?.response) {
    return {
      type: ERROR_TYPES.NETWORK,
      message: 'No internet connection. Please check your network.',
      userMessage: 'No internet connection',
      canRetry: true,
      statusCode: null,
    };
  }

  const status = error.response?.status;
  const serverMessage = error.response?.data?.message;
  const errors = error.response?.data?.errors;

  // Build validation error message
  if (status === 400 && errors && Array.isArray(errors)) {
    return {
      type: ERROR_TYPES.VALIDATION,
      message: errors.map((e) => e.msg || e.message).join('\n'),
      userMessage: errors[0]?.msg || 'Please check your input',
      canRetry: false,
      statusCode: status,
    };
  }

  switch (status) {
    case 400:
      return {
        type: ERROR_TYPES.VALIDATION,
        message: serverMessage || 'Invalid request',
        userMessage: serverMessage || 'Please check your input and try again',
        canRetry: false,
        statusCode: status,
      };

    case 401:
      return {
        type: ERROR_TYPES.AUTH,
        message: serverMessage || 'Session expired',
        userMessage: 'Your session has expired. Please login again.',
        canRetry: false,
        statusCode: status,
      };

    case 403:
      return {
        type: ERROR_TYPES.PERMISSION,
        message: serverMessage || 'Access denied',
        userMessage: 'You do not have permission to do this.',
        canRetry: false,
        statusCode: status,
      };

    case 404:
      return {
        type: ERROR_TYPES.NOT_FOUND,
        message: serverMessage || 'Not found',
        userMessage: serverMessage || 'The requested item was not found.',
        canRetry: false,
        statusCode: status,
      };

    case 422:
      return {
        type: ERROR_TYPES.VALIDATION,
        message: serverMessage || 'Validation failed',
        userMessage: serverMessage || 'Please check your input and try again.',
        canRetry: false,
        statusCode: status,
      };

    case 429:
      return {
        type: ERROR_TYPES.SERVER,
        message: serverMessage || 'Too many requests',
        userMessage: 'Too many attempts. Please wait a moment and try again.',
        canRetry: true,
        statusCode: status,
      };

    case 500:
    case 502:
    case 503:
      return {
        type: ERROR_TYPES.SERVER,
        message: serverMessage || 'Server error',
        userMessage: 'Something went wrong on our end. Please try again.',
        canRetry: true,
        statusCode: status,
      };

    default:
      return {
        type: ERROR_TYPES.UNKNOWN,
        message: serverMessage || error.message || 'Unknown error',
        userMessage: 'Something went wrong. Please try again.',
        canRetry: true,
        statusCode: status,
      };
  }
};

// ============================================================
// SHOW ERROR ALERT
// ============================================================
export const showErrorAlert = (error, options = {}) => {
  const {
    title,
    onRetry,
    onDismiss,
  } = options;

  const parsedError = error?.type ? error : parseError(error);

  const alertTitle = title || getErrorTitle(parsedError.type);
  const buttons = [];

  if (parsedError.canRetry && onRetry) {
    buttons.push({
      text: 'Retry',
      onPress: onRetry,
    });
  }

  buttons.push({
    text: 'OK',
    style: parsedError.canRetry && onRetry ? 'cancel' : 'default',
    onPress: onDismiss,
  });

  Alert.alert(alertTitle, parsedError.userMessage, buttons);
};

// ============================================================
// GET ERROR TITLE BY TYPE
// ============================================================
const getErrorTitle = (type) => {
  switch (type) {
    case ERROR_TYPES.NETWORK:
      return '📶 Connection Issue';
    case ERROR_TYPES.AUTH:
      return '🔒 Session Expired';
    case ERROR_TYPES.VALIDATION:
      return '⚠️ Invalid Input';
    case ERROR_TYPES.NOT_FOUND:
      return '🔍 Not Found';
    case ERROR_TYPES.PERMISSION:
      return '🚫 Access Denied';
    case ERROR_TYPES.SERVER:
      return '🔧 Server Error';
    default:
      return '❌ Error';
  }
};

// ============================================================
// LOG ERROR (dev only)
// ============================================================
export const logError = (context, error) => {
  if (ENV.DEBUG) {
    console.error(`❌ [${context}]`, {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
      stack: error?.stack,
    });
  }
};

export default {
  parseError,
  showErrorAlert,
  logError,
  ERROR_TYPES,
};