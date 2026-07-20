// src/components/common/NetworkBanner.js
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { COLORS, FONTS, SPACING } from '../../theme';

const NetworkBanner = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const translateY = useRef(new Animated.Value(-60)).current;
  const isConnectedRef = useRef(true);
  const hideTimerRef = useRef(null);
  const initialCheckDone = useRef(false);

  const slideIn = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const slideOut = (callback) => {
    Animated.timing(translateY, {
      toValue: -60,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // ✅ Fix: treat null isInternetReachable as connected
      // null means Android hasn't determined yet — assume connected
      const connected =
        state.isConnected === true &&
        state.isInternetReachable !== false; // null or true = connected

      // ✅ Skip first event to avoid false "no internet" on startup
      if (!initialCheckDone.current) {
        initialCheckDone.current = true;
        isConnectedRef.current = connected;
        setIsConnected(connected);
        return;
      }

      const wasConnected = isConnectedRef.current;
      isConnectedRef.current = connected;

      if (!connected && wasConnected) {
        // 🔴 Just lost connection
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }
        setIsConnected(false);
        setShowReconnected(false);
        slideIn();

      } else if (connected && !wasConnected) {
        // 🟢 Just reconnected
        setShowReconnected(true);
        setIsConnected(true);

        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
        }

        hideTimerRef.current = setTimeout(() => {
          slideOut(() => setShowReconnected(false));
        }, 2000);
      }
    });

    return () => {
      unsubscribe();
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

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