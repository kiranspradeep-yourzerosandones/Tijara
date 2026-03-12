import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import useAuthStore from './src/store/authStore';
import { colors } from './src/theme/colors';

export default function App() {
  const loadStoredAuth = useAuthStore((state) => state.loadStoredAuth);

  useEffect(() => {
    // Load stored authentication on app start
    loadStoredAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}