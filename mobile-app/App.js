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

  useEffect(() => {
    networkUtils.startMonitoring();
    const init = async () => {
      try {
        await restoreSession();
      } catch {}
    };
    init();
    return () => {
      networkUtils.stopMonitoring();
      notificationService.stopListening();
    };
  }, []);

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

  useEffect(() => {
    if (isAuthenticated) {
      setupPushNotifications();
    }
  }, [isAuthenticated]);

  const setupPushNotifications = async () => {
    if (!ENV.FEATURES.PUSH_NOTIFICATIONS) {
      console.log('🔔 Push notifications disabled in ENV config');
      return;
    }

    try {
      console.log('🔔 setupPushNotifications starting...');

      if (navigationRef.current) {
        notificationService.setNavigationRef(navigationRef.current);
      }

      console.log('🔔 Calling registerForPushNotifications...');
      const token = await notificationService.registerForPushNotifications();
      console.log('🔔 Token result:', token ?? 'NULL - no token returned');

      if (token) {
        try {
          console.log('🔔 Sending token to backend...');
          await updatePushToken(token);
          console.log('🔔 Token sent to backend successfully');
        } catch (e) {
          console.warn('🔔 Failed to send token to backend:', e?.message);
        }
      } else {
        console.warn('🔔 registerForPushNotifications returned null/undefined');
      }

      notificationService.startListening(
        () => { fetchUnreadCount().catch(() => {}); },
        () => {}
      );

      const lastResponse = await notificationService.getLastNotificationResponse();
      if (lastResponse) {
        setTimeout(() => {
          notificationService.handleNotificationResponse(lastResponse);
        }, 1000);
      }
    } catch (e) {
      console.error('🔔 setupPushNotifications CAUGHT ERROR:', e?.message, e);
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