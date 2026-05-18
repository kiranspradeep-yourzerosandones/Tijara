// src/navigation/RootNavigator.js
import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { Loading } from '../components/common';
import { useAuthStore } from '../store';
import { COLORS } from '../theme';
import analyticsService from '../services/analyticsService';

const RootNavigator = ({ navigationRef }) => {
  // ✅ Read state only — NO restoreSession here
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const routeNameRef = useRef(null);

  const onNavigationReady = () => {
    if (navigationRef?.current) {
      routeNameRef.current =
        navigationRef.current.getCurrentRoute()?.name;
    }
  };

  const onStateChange = async () => {
    if (!navigationRef?.current) return;

    const previousRouteName = routeNameRef.current;
    const currentRouteName =
      navigationRef.current.getCurrentRoute()?.name;

    if (previousRouteName !== currentRouteName) {
      analyticsService.trackScreen(currentRouteName);
    }

    routeNameRef.current = currentRouteName;
  };

  // ✅ Show loading while session is being restored
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading fullScreen />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onNavigationReady}
      onStateChange={onStateChange}
    >
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