// src/screens/splash/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  cancelAnimation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import TijaraLogo from '../../components/common/TijaraLogo';

const LOGO_HEIGHT = 260;
const HALF_LOGO = LOGO_HEIGHT / 2;

// 🎯 FINAL LOCKED VALUES
const FINAL_SCALE = 8;
const FINAL_TRANSLATE_Y = -122;

// Timing
const MIN_DISPLAY_MS = 1800; // how long to show the splash once "ready"
const FADE_OUT_MS = 400;
// Absolute ceiling: navigate away even if `isReady` never becomes true
// (e.g. a stalled init call, a rejected promise nobody caught, etc).
// This is the thing that guarantees the app never gets stuck here.
const MAX_WAIT_MS = 6000;

const SplashScreen = ({ isReady, onFinish }) => {
  // Base animation
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const logoTranslateY = useSharedValue(40);

  // Final transform
  const finalScale = useSharedValue(1);
  const finalTranslateY = useSharedValue(0);

  const screenOpacity = useSharedValue(1);

  // Guards against onFinish firing twice (once from the timing callback,
  // once from a fallback timer) and against calling it after unmount.
  const hasFinishedRef = useRef(false);
  const isMountedRef = useRef(true);

  const finish = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    if (isMountedRef.current && onFinish) {
      onFinish();
    }
  };

  // Intro animation — runs once, independent of `isReady`.
  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500 });

    logoScale.value = withSequence(
      withTiming(1.1, { duration: 500, easing: Easing.out(Easing.exp) }),
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    logoTranslateY.value = withTiming(0, { duration: 500 });

    finalScale.value = withDelay(
      900,
      withTiming(FINAL_SCALE, { duration: 900, easing: Easing.out(Easing.cubic) })
    );

    finalTranslateY.value = withDelay(
      900,
      withTiming(FINAL_TRANSLATE_Y, { duration: 900, easing: Easing.out(Easing.cubic) })
    );

    return () => {
      isMountedRef.current = false;
      cancelAnimation(logoOpacity);
      cancelAnimation(logoScale);
      cancelAnimation(logoTranslateY);
      cancelAnimation(finalScale);
      cancelAnimation(finalTranslateY);
      cancelAnimation(screenOpacity);
    };
  }, []);

  // Normal path: wait for `isReady`, show splash a minimum amount of time,
  // then fade out and finish.
  useEffect(() => {
    if (!isReady) return undefined;

    const showTimer = setTimeout(() => {
      // Fallback in case the withTiming callback never fires
      // (interrupted animation, dropped frames, etc).
      const fadeFallback = setTimeout(finish, FADE_OUT_MS + 300);

      screenOpacity.value = withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) },
        (finished) => {
          // Call finish regardless of `finished` — an interrupted fade
          // should still navigate forward, never leave the user stuck.
          runOnJS(finish)();
        }
      );

      return () => clearTimeout(fadeFallback);
    }, MIN_DISPLAY_MS);

    return () => clearTimeout(showTimer);
  }, [isReady]);

  // Absolute ceiling: if `isReady` never becomes true, force navigation
  // anyway once MAX_WAIT_MS has passed. This is what prevents the app
  // from ever being permanently stuck on the splash screen.
  useEffect(() => {
    const hardTimeout = setTimeout(() => {
      screenOpacity.value = withTiming(0, {
        duration: FADE_OUT_MS,
        easing: Easing.in(Easing.quad),
      });
      finish();
    }, MAX_WAIT_MS);

    return () => clearTimeout(hardTimeout);
  }, []);

  // 🔥 TOP-ANCHOR SCALE FIX
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoTranslateY.value },
      { translateY: -HALF_LOGO }, // anchor scaling to top
      { scale: logoScale.value * finalScale.value },
      { translateY: HALF_LOGO },
      { translateY: finalTranslateY.value }, // final positioning
    ],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.logoClip}>
        <Animated.View style={logoStyle}>
          <TijaraLogo width={200} height={350} />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  logoClip: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SplashScreen;