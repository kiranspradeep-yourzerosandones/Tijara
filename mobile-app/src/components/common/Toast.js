// src/components/common/Toast.js
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';

const { width } = Dimensions.get('window');

const TOAST_TYPES = {
  success: {
    icon:       'checkmark-circle',
    color:      COLORS.success,
    background: '#E8F5E9',
  },
  error: {
    icon:       'close-circle',
    color:      COLORS.error,
    background: '#FFEBEE',
  },
  warning: {
    icon:       'warning',
    color:      COLORS.warning,
    background: '#FFF3E0',
  },
  info: {
    icon:       'information-circle',
    color:      COLORS.info,
    background: '#E3F2FD',
  },
  cart: {
    icon:       'cart',
    color:      COLORS.primary,
    background: '#FFF9E6',
  },
};

const Toast = ({ message, type = 'success', visible, duration = 2500 }) => {
  const translateY  = useRef(new Animated.Value(-100)).current;
  const opacity     = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef(null);

  const config = TOAST_TYPES[type] || TOAST_TYPES.success;

  useEffect(() => {
    // Clear any running timer first
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (visible) {
      // Reset position before animating in (handles re-showing same toast)
      translateY.setValue(-100);
      opacity.setValue(0);

      // Slide in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue:         0,
          useNativeDriver: true,
          tension:         80,
          friction:        10,
        }),
        Animated.timing(opacity, {
          toValue:         1,
          duration:        200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      hideTimerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue:         -100,
            duration:        300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue:         0,
            duration:        300,
            useNativeDriver: true,
          }),
        ]).start();
        hideTimerRef.current = null;
      }, duration);

    } else {
      // Immediately hide when visible becomes false
      Animated.parallel([
        Animated.timing(translateY, {
          toValue:         -100,
          duration:        300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue:         0,
          duration:        300,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Cleanup timer on unmount or next effect
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [visible, message, duration]);  // ✅ message in deps so same-text toasts re-trigger

  // ✅ Always render — animation handles visibility
  // Don't conditionally return null based on internal Animated state
  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.background,
          transform:       [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Text
        style={[styles.message, { color: config.color }]}
        numberOfLines={2}
      >
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position:          'absolute',
    top:               SPACING.safeTopPadding + 8,
    left:              20,
    right:             20,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderRadius:      12,
    gap:               10,
    zIndex:            9999,
    elevation:         10,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.15,
    shadowRadius:      8,
  },
  message: {
    ...FONTS.bodySmall,
    fontWeight: '600',
    flex:       1,
  },
});

export default Toast;

// // src/components/common/Toast.js
// import React, { useEffect, useRef } from 'react';
// import {
//   Animated,
//   Text,
//   StyleSheet,
//   View,
//   Dimensions,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { COLORS, FONTS, SPACING } from '../../theme';

// const { width } = Dimensions.get('window');

// const TOAST_TYPES = {
//   success: {
//     icon: 'checkmark-circle',
//     color: COLORS.success,
//     background: '#E8F5E9',
//   },
//   error: {
//     icon: 'close-circle',
//     color: COLORS.error,
//     background: '#FFEBEE',
//   },
//   warning: {
//     icon: 'warning',
//     color: COLORS.warning,
//     background: '#FFF3E0',
//   },
//   info: {
//     icon: 'information-circle',
//     color: COLORS.info,
//     background: '#E3F2FD',
//   },
//   cart: {
//     icon: 'cart',
//     color: COLORS.primary,
//     background: '#FFF9E6',
//   },
// };

// const Toast = ({ message, type = 'success', visible, duration = 2500 }) => {
//   const translateY = useRef(new Animated.Value(-100)).current;
//   const opacity = useRef(new Animated.Value(0)).current;

//   const config = TOAST_TYPES[type] || TOAST_TYPES.success;

//   useEffect(() => {
//     if (visible) {
//       // Slide in
//       Animated.parallel([
//         Animated.spring(translateY, {
//           toValue: 0,
//           useNativeDriver: true,
//           tension: 80,
//           friction: 10,
//         }),
//         Animated.timing(opacity, {
//           toValue: 1,
//           duration: 200,
//           useNativeDriver: true,
//         }),
//       ]).start();

//       // Auto hide
//       const timer = setTimeout(() => {
//         Animated.parallel([
//           Animated.timing(translateY, {
//             toValue: -100,
//             duration: 300,
//             useNativeDriver: true,
//           }),
//           Animated.timing(opacity, {
//             toValue: 0,
//             duration: 300,
//             useNativeDriver: true,
//           }),
//         ]).start();
//       }, duration);

//       return () => clearTimeout(timer);
//     }
//   }, [visible, message]);

//   if (!visible && opacity._value === 0) return null;

//   return (
//     <Animated.View
//       style={[
//         styles.container,
//         {
//           backgroundColor: config.background,
//           transform: [{ translateY }],
//           opacity,
//         },
//       ]}
//       pointerEvents="none"
//     >
//       <Ionicons name={config.icon} size={20} color={config.color} />
//       <Text style={[styles.message, { color: config.color }]} numberOfLines={2}>
//         {message}
//       </Text>
//     </Animated.View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     top: SPACING.safeTopPadding + 8,
//     left: 20,
//     right: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 12,
//     gap: 10,
//     zIndex: 9999,
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//   },
//   message: {
//     ...FONTS.bodySmall,
//     fontWeight: '600',
//     flex: 1,
//   },
// });

// export default Toast;