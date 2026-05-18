// App.js
import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { RootNavigator } from './src/navigation';
import { useAuthStore } from './src/store/authStore';
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

  // ✅ Only select what we need — no re-renders from unrelated state
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    networkUtils.startMonitoring();

    const init = async () => {
      try {
        // ✅ Called ONCE — guard inside store prevents double run
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
  }, []); // ✅ Empty deps — runs once only

  // ✅ Push notifications — only after authenticated
  useEffect(() => {
    if (isAuthenticated && ENV.FEATURES.PUSH_NOTIFICATIONS) {
      setupPushNotifications();
    }
  }, [isAuthenticated]);

  const setupPushNotifications = async () => {
    try {
      if (navigationRef.current) {
        notificationService.setNavigationRef(navigationRef.current);
      }

      const token = await notificationService.registerForPushNotifications();

      if (token) {
        await updatePushToken(token).catch((err) =>
          console.warn('Push token update failed:', err)
        );
      }

      notificationService.startListening(
        (notification) => {
          if (ENV.DEBUG) {
            console.log(
              '🔔 Foreground notification:',
              notification.request.content.title
            );
          }
        },
        (response) => {
          if (ENV.DEBUG) {
            console.log('🔔 Notification tapped');
          }
        }
      );

      const lastResponse =
        await notificationService.getLastNotificationResponse();
      if (lastResponse) {
        notificationService.handleNotificationResponse(lastResponse);
      }
    } catch (error) {
      console.warn('Push notification setup failed:', error);
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