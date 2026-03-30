// D:\yzo_ongoing\Tijara\mobile-app\src\navigation\RootNavigator.js
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { Loading } from '../components/common';
import { useAuthStore } from '../store';
import { COLORS } from '../theme';

const RootNavigator = () => {
  const { isAuthenticated, restoreSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await restoreSession();
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading fullScreen message="Loading..." />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
});

export default RootNavigator;