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
import { formatCurrency, calculateDiscount, getImageUrl } from '../../utils/helpers';
import { useCartStore } from '../../store';

const ProductCard = ({ product, onPress, style }) => {
  const { addToCart, getItemQuantity, isLoading } = useCartStore();
  const quantity = getItemQuantity(product._id);

  const discount = calculateDiscount(product.compareAtPrice, product.price);
  const imageUrl = product.images?.[0] 
    ? getImageUrl(product.images[0]) 
    : null;

  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, 1);
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color={COLORS.gray} />
          </View>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Category */}
        {product.category && (
          <Text style={styles.category} numberOfLines={1}>
            {product.category}
          </Text>
        )}

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {formatCurrency(product.price)}
            </Text>
            {product.unit && (
              <Text style={styles.unit}>/{product.unit}</Text>
            )}
          </View>
          {product.compareAtPrice > product.price && (
            <Text style={styles.comparePrice}>
              {formatCurrency(product.compareAtPrice)}
            </Text>
          )}
        </View>

        {/* Add to Cart Button */}
        {product.inStock && (
          <TouchableOpacity
            style={[
              styles.addButton,
              quantity > 0 && styles.addButtonActive,
            ]}
            onPress={handleAddToCart}
            disabled={isLoading}
          >
            {quantity > 0 ? (
              <View style={styles.quantityBadge}>
                <Ionicons name="checkmark" size={14} color={COLORS.black} />
                <Text style={styles.quantityText}>{quantity}</Text>
              </View>
            ) : (
              <Ionicons name="add" size={20} color={COLORS.black} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SPACING.cardRadius,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    position: 'relative',
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
  discountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.xs,
  },
  discountText: {
    ...FONTS.labelSmall,
    color: COLORS.white,
    fontWeight: '700',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    ...FONTS.label,
    color: COLORS.white,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.sm,
  },
  category: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  title: {
    ...FONTS.bodySmall,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: SPACING.sm,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    ...FONTS.price,
    color: COLORS.textPrimary,
  },
  unit: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginLeft: 2,
  },
  comparePrice: {
    ...FONTS.strikethrough,
    color: COLORS.gray,
  },
  addButton: {
    position: 'absolute',
    right: SPACING.sm,
    bottom: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonActive: {
    backgroundColor: COLORS.primary,
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  quantityText: {
    ...FONTS.labelSmall,
    color: COLORS.black,
    fontWeight: '700',
  },
});

export default ProductCard;