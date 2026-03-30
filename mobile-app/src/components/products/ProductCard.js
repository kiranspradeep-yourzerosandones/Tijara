// src/components/products/ProductCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
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

        {/* Sale Badge - Enhanced */}
        {discount > 0 && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleText}>Sale</Text>
          </View>
        )}

        {/* Discount Percentage Badge */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
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
                  <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  <Text style={styles.quantityText}>{quantity}</Text>
                </View>
              ) : (
                <Ionicons name="add" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
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
    backgroundColor: '#F8F8F8',
  },
  
  // Enhanced Sale Badge
  saleBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#0D9488', // Teal color
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saleText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Discount Percentage Badge
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },

  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  comparePrice: {
    fontSize: 13,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0D9488', // Teal color matching sale badge
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonActive: {
    backgroundColor: '#0D9488',
  },
  quantityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  quantityText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default ProductCard;