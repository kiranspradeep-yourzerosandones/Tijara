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

        {/* Sale Badge */}
        {discount > 0 && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleText}>Sale</Text>
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
        <Text style={styles.title} numberOfLines={1}>
          {product.title}
        </Text>

        {/* Price Row */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatCurrency(product.price)}
          </Text>
          {product.compareAtPrice > product.price && (
            <Text style={styles.comparePrice}>
              {formatCurrency(product.compareAtPrice)}
            </Text>
          )}

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
    ...SHADOWS.small,
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
    backgroundColor: COLORS.lightGray,
  },
  saleBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#0D9488',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  saleText: {
    color: COLORS.white,
    fontSize: 13,
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
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary || '#1a1a1a',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary || '#1a1a1a',
  },
  comparePrice: {
    fontSize: 14,
    color: COLORS.gray || '#999',
    textDecorationLine: 'line-through',
    marginLeft: 10,
  },
  addButton: {
    marginLeft: 'auto',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
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