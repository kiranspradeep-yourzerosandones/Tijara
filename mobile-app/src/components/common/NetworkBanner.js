// src/components/common/NetworkBanner.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { COLORS, FONTS, SPACING } from '../../theme';

const NetworkBanner = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const translateY = new Animated.Value(-60);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable !== false;

      if (!connected) {
        setIsConnected(false);
        setShowReconnected(false);
        // Slide in
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (!isConnected && connected) {
        // Was disconnected, now reconnected
        setShowReconnected(true);
        setIsConnected(true);
        // Show reconnected briefly then hide
        setTimeout(() => {
          Animated.timing(translateY, {
            toValue: -60,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setShowReconnected(false));
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  if (isConnected && !showReconnected) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        showReconnected ? styles.bannerConnected : styles.bannerDisconnected,
        { transform: [{ translateY }] },
      ]}
    >
      <Ionicons
        name={showReconnected ? 'wifi' : 'wifi-outline'}
        size={16}
        color={COLORS.white}
      />
      <Text style={styles.bannerText}>
        {showReconnected ? 'Back online' : 'No internet connection'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    zIndex: 9999,
  },
  bannerDisconnected: {
    backgroundColor: COLORS.error,
  },
  bannerConnected: {
    backgroundColor: COLORS.success,
  },
  bannerText: {
    ...FONTS.bodySmall,
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default NetworkBanner;