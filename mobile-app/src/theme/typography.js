// D:\yzo_ongoing\Tijara\mobile-app\src\theme\typography.js
import { Platform } from 'react-native';
import COLORS from './colors';

const fontFamily = Platform.OS === 'ios' ? 'System' : 'Roboto';

export const FONTS = {
  // Headings
  h1: {
    fontFamily,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 40,
  },
  h2: {
    fontFamily,
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 34,
  },
  h3: {
    fontFamily,
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 28,
  },
  h4: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  
  // Body
  body: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily,
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  
  // Labels
  label: {
    fontFamily,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  labelSmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  
  // Buttons
  button: {
    fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    lineHeight: 24,
  },
  buttonSmall: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    lineHeight: 20,
  },
  
  // Special
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  price: {
    fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  priceSmall: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  priceLarge: {
    fontFamily,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 32,
  },
  strikethrough: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
    lineHeight: 20,
  },
  
  // Auth Screens (Dark Theme)
  heading: {
    fontFamily,
    fontSize: 26,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: 34,
  },
  subHeading: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textDisabled,
    lineHeight: 24,
  },
  input: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
};

export default FONTS;