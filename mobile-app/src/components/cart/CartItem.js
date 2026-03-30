// Tijara\mobile-app\src\components\cart\CartItem.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import { useCartStore } from '../../store';

const CartItem = ({ item, onPress }) => {
  const { updateQuantity, removeFromCart, isLoading } = useCartStore();
  
  const product = item.product;
  const productId = product?._id || item.product;
  const imageUrl = item.productImage 
    ? getImageUrl(item.productImage) 
    : product?.images?.[0] 
      ? getImageUrl(product.images[0]) 
      : null;

  const handleIncrement = async () => {
    try {
      await updateQuantity(productId, item.quantity + 1);
    } catch (error) {
      console.error('Increment error:', error);
    }
  };

  const handleDecrement = async () => {
    try {
      if (item.quantity === 1) {
        await removeFromCart(productId);
      } else {
        await updateQuantity(productId, item.quantity - 1);
      }
    } catch (error) {
      console.error('Decrement error:', error);
    }
  };

  const handleRemove = async () => {
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Remove error:', error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={24} color={COLORS.gray} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {item.productTitle || product?.title}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatCurrency(item.priceAtAdd || product?.price)}
          </Text>
          {item.unit && (
            <Text style={styles.unit}>/{item.unit}</Text>
          )}
        </View>

        {/* Quantity Controls */}
        <View style={styles.controlsRow}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleDecrement}
              disabled={isLoading}
            >
              <Ionicons 
                name={item.quantity === 1 ? "trash-outline" : "remove"} 
                size={18} 
                color={item.quantity === 1 ? COLORS.error : COLORS.textPrimary} 
              />
            </TouchableOpacity>

            <Text style={styles.quantity}>{item.quantity}</Text>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={handleIncrement}
              disabled={isLoading}
            >
              <Ionicons name="add" size={18} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtotal}>
            {formatCurrency(item.quantity * (item.priceAtAdd || product?.price))}
          </Text>
        </View>
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={handleRemove}
        disabled={isLoading}
      >
        <Ionicons name="close" size={20} color={COLORS.gray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: SPACING.cardRadiusSmall,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  title: {
    ...FONTS.bodySmall,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: SPACING.xs,
  },
  price: {
    ...FONTS.priceSmall,
    color: COLORS.textPrimary,
  },
  unit: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginLeft: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.buttonRadius,
    padding: SPACING.xs,
  },
  quantityButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    ...FONTS.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  subtotal: {
    ...FONTS.price,
    color: COLORS.textPrimary,
  },
  removeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});

export default CartItem;