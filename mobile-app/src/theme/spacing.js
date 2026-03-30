// src/theme/spacing.js
import { Platform, StatusBar } from 'react-native';

// Get status bar height
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

export const SPACING = {
  // Base spacing
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Screen padding
  screenPadding: 20,
  screenPaddingHorizontal: 20,
  screenPaddingVertical: 16,
  
  // ✅ NEW: Status bar & safe area
  statusBarHeight: STATUSBAR_HEIGHT,
  safeTopPadding: STATUSBAR_HEIGHT + 10,
  
  // Card
  cardPadding: 16,
  cardRadius: 20,
  cardRadiusLarge: 30,
  cardRadiusSmall: 12,
  
  // Input
  inputHeight: 50,
  inputRadius: 12,
  inputPadding: 16,
  
  // Button
  buttonHeight: 50,
  buttonRadius: 25,
  buttonPadding: 16,
  buttonHeightSmall: 40,
  
  // Sections
  sectionSpacing: 24,
  itemSpacing: 12,
  
  // Icons
  iconSize: 24,
  iconSizeSmall: 20,
  iconSizeLarge: 28,
  
  // Tab Bar
  tabBarHeight: 70,
  
  // Header
  headerHeight: 56,
  
  // Product Grid
  productCardGap: 12,
  
  // Border
  borderWidth: 1,
  borderWidthThick: 2,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export default SPACING;