// src/components/common/OptimizedImage.js
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

const OptimizedImage = ({
  uri,
  style,
  contentFit = 'cover',
  placeholder,
  fallbackIcon = 'image-outline',
  fallbackIconSize = 32,
  showFallback = true,
  transition = 300,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !uri) {
    if (!showFallback) return null;
    return (
      <View style={[styles.fallback, style]}>
        <Ionicons
          name={fallbackIcon}
          size={fallbackIconSize}
          color={COLORS.gray}
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      placeholder={placeholder || blurhash}
      transition={transition}
      onError={() => setHasError(true)}
      cachePolicy="memory-disk"
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OptimizedImage;