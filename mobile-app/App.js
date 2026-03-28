// App.js
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { RootNavigator } from './src/navigation';
import { useAuthStore } from './src/store/authStore';
import SplashScreen from './src/screens/splash/SplashScreen';

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);   // auth ready
  const [showSplash, setShowSplash] = useState(true);    // splash control

  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    const init = async () => {
      try {
        await restoreSession();
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsAppReady(true); // ✅ auth done
      }
    };
    init();
  }, []);

  // 🔥 called when splash animation ends
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // 🟡 SHOW SPLASH FIRST
  if (showSplash) {
    return (
      <SplashScreen
        isReady={isAppReady}   // waits for auth
        onFinish={handleSplashFinish}
      />
    );
  }

  // 🟢 THEN LOAD APP
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});