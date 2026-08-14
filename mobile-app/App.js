// App.js
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState } from 'react-native';

import { RootNavigator } from './src/navigation';
import { useAuthStore } from './src/store/authStore';
import { useNotificationStore } from './src/store/notificationStore';
import { NetworkBanner, ErrorBoundary } from './src/components/common';
import networkUtils from './src/utils/networkUtils';
import notificationService from './src/services/notificationService';
import { updatePushToken } from './src/api/auth';
import ENV from './src/config/env';

export default function App() {
  const navigationRef = useRef(null);
  const appStateRef   = useRef(AppState.currentState);

  const restoreSession   = useAuthStore((state) => state.restoreSession);
  const isAuthenticated  = useAuthStore((state) => state.isAuthenticated);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

  // ── App initialization ─────────────────────────────────────
  useEffect(() => {
    networkUtils.startMonitoring();

    const init = async () => {
      try {
        await restoreSession();
      } catch {
        // Session restore failure is non-fatal — app continues as guest
      }
    };

    init();

    return () => {
      networkUtils.stopMonitoring();
      notificationService.stopListening();
    };
  }, []);

  // ── Clear badge / refresh count when app comes to foreground ─
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        notificationService.clearBadge();
        if (isAuthenticated) {
          fetchUnreadCount().catch(() => {});
        }
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  // ── Push notifications setup (only when authenticated) ──────
  useEffect(() => {
    if (isAuthenticated) {
      setupPushNotifications();
    }
  }, [isAuthenticated]);

  const setupPushNotifications = async () => {
    if (!ENV.FEATURES.PUSH_NOTIFICATIONS) return;

    try {
      if (navigationRef.current) {
        notificationService.setNavigationRef(navigationRef.current);
      }

      const token = await notificationService.registerForPushNotifications();

      if (token) {
        try {
          await updatePushToken(token);
        } catch {
          // Non-critical
        }
      }

      notificationService.startListening(
        () => {
          fetchUnreadCount().catch(() => {});
        },
        () => {}
      );

      const lastResponse = await notificationService.getLastNotificationResponse();
      if (lastResponse) {
        setTimeout(() => {
          notificationService.handleNotificationResponse(lastResponse);
        }, 1000);
      }
    } catch {
      // Non-critical
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <ErrorBoundary>
          <NetworkBanner />
          <RootNavigator navigationRef={navigationRef} />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});