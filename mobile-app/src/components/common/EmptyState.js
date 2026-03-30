// D:\yzo_ongoing\Tijara\mobile-app\src\components\common\EmptyState.js
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import Button from './Button';

const EmptyState = ({
  icon,
  image,
  title,
  message,
  actionText,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {image ? (
        <Image source={image} style={styles.image} resizeMode="contain" />
      ) : icon ? (
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={64} color={COLORS.gray} />
        </View>
      ) : null}

      <Text style={styles.title}>{title}</Text>
      
      {message && <Text style={styles.message}>{message}</Text>}

      {actionText && onAction && (
        <Button
          title={actionText}
          onPress={onAction}
          variant="primary"
          size="medium"
          style={styles.button}
          fullWidth={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
    opacity: 0.5,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: SPACING.lg,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  button: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
});

export default EmptyState;