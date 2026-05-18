// src/components/common/ErrorBoundary.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import ENV from '../../config/env';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Log error
    if (ENV.DEBUG) {
      console.error('💥 ErrorBoundary caught:', error, errorInfo);
    }

    // Later: send to Sentry/Crashlytics
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />

          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app encountered an unexpected error.
          </Text>

          {ENV.DEBUG && this.state.error && (
            <ScrollView style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info:</Text>
              <Text style={styles.debugText}>
                {this.state.error.toString()}
              </Text>
              {this.state.errorInfo && (
                <Text style={styles.debugText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleReset}
          >
            <Ionicons name="refresh" size={20} color={COLORS.black} />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.white,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  debugContainer: {
    maxHeight: 200,
    backgroundColor: COLORS.card,
    borderRadius: SPACING.cardRadiusSmall,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    width: '100%',
  },
  debugTitle: {
    ...FONTS.bodySmall,
    color: COLORS.error,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: COLORS.textSecondary,
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
});

export default ErrorBoundary;
