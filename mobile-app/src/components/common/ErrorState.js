// src/components/common/ErrorState.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { ERROR_TYPES } from '../../utils/errorHandler';

const ERROR_CONFIG = {
  [ERROR_TYPES.NETWORK]: {
    icon: 'wifi-outline',
    title: 'No Connection',
    defaultMessage: 'Check your internet and try again',
    color: COLORS.warning,
  },
  [ERROR_TYPES.NOT_FOUND]: {
    icon: 'search-outline',
    title: 'Not Found',
    defaultMessage: 'The item you are looking for does not exist',
    color: COLORS.gray,
  },
  [ERROR_TYPES.SERVER]: {
    icon: 'cloud-offline-outline',
    title: 'Server Error',
    defaultMessage: 'Something went wrong on our end',
    color: COLORS.error,
  },
  [ERROR_TYPES.AUTH]: {
    icon: 'lock-closed-outline',
    title: 'Session Expired',
    defaultMessage: 'Please login again',
    color: COLORS.warning,
  },
  default: {
    icon: 'alert-circle-outline',
    title: 'Something went wrong',
    defaultMessage: 'An unexpected error occurred',
    color: COLORS.error,
  },
};

const ErrorState = ({
  error,
  onRetry,
  style,
  compact = false,
}) => {
  const errorType = error?.type || 'default';
  const config = ERROR_CONFIG[errorType] || ERROR_CONFIG.default;
  const message = error?.userMessage || config.defaultMessage;

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <Ionicons name={config.icon} size={20} color={config.color} />
        <Text style={styles.compactMessage}>{message}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.compactRetry}>
            <Text style={styles.compactRetryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Ionicons name={config.icon} size={56} color={config.color} />
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={18} color={COLORS.black} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: SPACING.buttonRadius,
    gap: SPACING.sm,
  },
  retryText: {
    ...FONTS.button,
    color: COLORS.black,
  },
  // Compact
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: SPACING.cardRadiusSmall,
    gap: SPACING.sm,
  },
  compactMessage: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    flex: 1,
  },
  compactRetry: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.xs,
  },
  compactRetryText: {
    ...FONTS.caption,
    color: COLORS.black,
    fontWeight: '600',
  },
});

export default ErrorState;