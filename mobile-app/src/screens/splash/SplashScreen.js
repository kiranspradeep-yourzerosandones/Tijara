// src/screens/splash/SplashScreen.js
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import TijaraLogo from '../../components/common/TijaraLogo';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LOGO_HEIGHT = 260;
const HALF_LOGO = LOGO_HEIGHT / 2;

// 🎯 FINAL LOCKED VALUES
const FINAL_SCALE = 8;
const FINAL_TRANSLATE_Y = -122;

const SplashScreen = ({ isReady, onFinish }) => {
  // Base animation
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const logoTranslateY = useSharedValue(40);

  // Final transform
  const finalScale = useSharedValue(1);
  const finalTranslateY = useSharedValue(0);

  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    // 1️⃣ Fade in
    logoOpacity.value = withTiming(1, { duration: 500 });

    // 2️⃣ Intro bounce
    logoScale.value = withSequence(
      withTiming(1.1, {
        duration: 500,
        easing: Easing.out(Easing.exp),
      }),
      withSpring(1, {
        damping: 12,
        stiffness: 100,
      })
    );

    // 3️⃣ Reset position
    logoTranslateY.value = withTiming(0, { duration: 500 });

    // 4️⃣ FINAL TRANSFORMATION
    finalScale.value = withDelay(
      900,
      withTiming(FINAL_SCALE, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      })
    );

    finalTranslateY.value = withDelay(
      900,
      withTiming(FINAL_TRANSLATE_Y, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      })
    );

  }, []);

  useEffect(() => {
    if (isReady) {
      const timeout = setTimeout(() => {
        screenOpacity.value = withTiming(0, {
          duration: 400,
          easing: Easing.in(Easing.quad),
        }, (finished) => {
          if (finished && onFinish) {
            runOnJS(onFinish)();
          }
        });
      }, 1800);

      return () => clearTimeout(timeout);
    }
  }, [isReady]);

  // 🔥 TOP-ANCHOR SCALE FIX
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoTranslateY.value },

      // Anchor scaling to top
      { translateY: -HALF_LOGO },

      { scale: logoScale.value * finalScale.value },

      { translateY: HALF_LOGO },

      // Final positioning
      { translateY: finalTranslateY.value },
    ],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenStyle]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Clipping container */}
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