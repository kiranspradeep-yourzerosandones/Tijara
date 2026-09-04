import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../../theme';

const AddToCartBar = ({
  product,
  quantity = 1,
  isCartLoading = false,
  onQuantityChange,
  onAddToCart,
}) => {
  const insets = useSafeAreaInsets();

  if (!product || !product.inStock) return null;

  const min = product.minOrderQuantity || 1;
  const max = product.maxOrderQuantity || 99;

  return (
    <View
      style={[
        styles.bottomBar,
        {
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <View style={styles.addToCartRow}>

        {/* Quantity Stepper */}
        <View style={styles.localStepper}>

          {/* Minus */}
          <TouchableOpacity
            style={[
              styles.localStepperBtn,
              quantity <= min && styles.localStepperBtnDisabled,
            ]}
            onPress={() => onQuantityChange && onQuantityChange(-1)}
            disabled={quantity <= min || isCartLoading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="remove"
              size={16}
              color={
                quantity <= min
                  ? COLORS.gray
                  : COLORS.textPrimary
              }
            />
          </TouchableOpacity>

          {/* Quantity */}
          <Text style={styles.localStepperCount}>
            {quantity}
          </Text>

          {/* Plus */}
          <TouchableOpacity
            style={[
              styles.localStepperBtn,
              quantity >= max && styles.localStepperBtnDisabled,
            ]}
            onPress={() => onQuantityChange && onQuantityChange(1)}
            disabled={quantity >= max || isCartLoading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add"
              size={16}
              color={
                quantity >= max
                  ? COLORS.gray
                  : COLORS.textPrimary
              }
            />
          </TouchableOpacity>

        </View>

        {/* Add to Cart */}
        <TouchableOpacity
          style={[
            styles.addToCartBtn,
            isCartLoading && styles.addToCartBtnDisabled,
          ]}
          onPress={onAddToCart}
          disabled={isCartLoading}
          activeOpacity={0.85}
        >
          {isCartLoading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.black}
            />
          ) : (
            <>
              <Ionicons
                name="cart-outline"
                size={18}
                color={COLORS.black}
              />

              <Text style={styles.addToCartBtnText}>
                Add to Cart
              </Text>
            </>
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.sm,

    backgroundColor: COLORS.white,

    borderTopWidth: 1,
    borderTopColor: COLORS.border,

    ...SHADOWS.medium,
  },

  addToCartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    height: 52,
  },

  localStepper: {
    flexDirection: 'row',
    alignItems: 'center',

    height: 52,

    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,

    backgroundColor: COLORS.white,

    overflow: 'hidden',
  },

  localStepperBtn: {
    width: 44,
    height: '100%',

    alignItems: 'center',
    justifyContent: 'center',
  },

  localStepperBtnDisabled: {
    opacity: 0.35,
  },

  localStepperCount: {
    minWidth: 40,

    textAlign: 'center',

    fontSize: 16,
    fontWeight: '700',

    color: COLORS.textPrimary,
  },

  addToCartBtn: {
    flex: 1,

    height: 52,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: SPACING.xs,

    backgroundColor: COLORS.primary,

    borderRadius: 12,

    ...SHADOWS.small,
  },

  addToCartBtnDisabled: {
    opacity: 0.6,
  },

  addToCartBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },
});

export default AddToCartBar;