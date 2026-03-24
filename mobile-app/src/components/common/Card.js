import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../../theme';

const Card = ({
  children,
  onPress,
  style,
  padding = true,
  shadow = true,
  variant = 'default', // default, outlined
}) => {
  const cardStyle = [
    styles.card,
    padding && styles.cardPadding,
    shadow && styles.cardShadow,
    variant === 'outlined' && styles.cardOutlined,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.cardRadius,
  },
  cardPadding: {
    padding: SPACING.cardPadding,
  },
  cardShadow: {
    ...SHADOWS.small,
  },
  cardOutlined: {
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default Card;