import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState } from 'react-native';

import { RootNavigator } from './src/navigation';
import { useAuthStore } from './src/store/authStore';
import { useNotificationStore } from './src/store/notificationStore';
import SplashScreen from './src/screens/splash/SplashScreen';
import { NetworkBanner, ErrorBoundary } from './src/components/common';
import networkUtils from './src/utils/networkUtils';
import notificationService from './src/services/notificationService';
import { updatePushToken } from './src/api/auth';
import ENV from './src/config/env';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const navigationRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // ✅ Granular selectors
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

  // ── App initialization ─────────────────────────────────────
  useEffect(() => {
    networkUtils.startMonitoring();

    const init = async () => {
      try {
        await restoreSession();
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsAppReady(true);
      }
    };

    init();

    return () => {
      networkUtils.stopMonitoring();
      notificationService.stopListening();
    };
  }, []);

  // ── App state change — clear badge when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        console.log('📱 App resumed from background');
        notificationService.clearBadge();

        if (isAuthenticated) {
          fetchUnreadCount().catch(() => {});
        }
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  // ── Push notifications setup (only when authenticated) ─────
  useEffect(() => {
    if (isAuthenticated) {
      setupPushNotifications();
    }
  }, [isAuthenticated]);

  const setupPushNotifications = async () => {
    if (!ENV.FEATURES.PUSH_NOTIFICATIONS) {
      console.log('🔔 Push notifications disabled');
      return;
    }

    try {
      // Set navigation ref for deep linking
      if (navigationRef.current) {
        notificationService.setNavigationRef(navigationRef.current);
      }

      // Register and get token
      const token = await notificationService.registerForPushNotifications();

      if (token) {
        try {
          await updatePushToken(token);
          console.log('✅ Push token sent to backend');
        } catch (err) {
          console.warn('⚠️ Push token update failed:', err.message);
        }
      }

      // ── Start listening ──────────────────────────────────
      notificationService.startListening(
        // Foreground notification received
        (notification) => {
          const data = notification.request.content.data;

          if (ENV.DEBUG) {
            console.log('🔔 Foreground:', notification.request.content.title);
            console.log('🔔 Data:', data);
          }

          // ✅ Refresh unread count
          fetchUnreadCount().catch(() => {});

          // Order detail screen will auto-refresh on focus — nothing extra needed
        },
        // User tapped notification (background/killed state)
        (response) => {
          if (ENV.DEBUG) {
            console.log('🔔 Tapped notification');
          }
          // handleNotificationResponse is called inside startListening already
        }
      );

      // ── Handle notification that opened the app from killed state
      const lastResponse = await notificationService.getLastNotificationResponse();
      if (lastResponse) {
        console.log('🔔 App opened from notification');
        setTimeout(() => {
          notificationService.handleNotificationResponse(lastResponse);
        }, 1000);
      }

    } catch (error) {
      console.warn('⚠️ Push notification setup failed:', error.message);
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <SplashScreen
        isReady={isAppReady}
        onFinish={handleSplashFinish}
      />
    );
  }

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
  container: {
    flex: 1,
  },
});