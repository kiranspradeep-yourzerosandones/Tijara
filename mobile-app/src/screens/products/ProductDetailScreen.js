// src/screens/products/ProductDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Button, Loading, Screen } from '../../components/common';
import Toast from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import { useCartStore } from '../../store';
import { productsAPI } from '../../api';
import { invalidateCacheByPrefix } from '../../utils/apiCache';
import {
  formatCurrency,
  calculateDiscount,
  getImageUrl,
  cleanText,
} from '../../utils/helpers';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 0.8;

const ProductDetailScreen = ({ navigation, route }) => {
  const { product: initialProduct, productId } = route.params || {};

  const [product, setProduct] = useState(initialProduct);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // ✅ Spam guard
  const addingRef = useRef(false);

  // ✅ Toast
  const { toast, showToast } = useToast();

  // ✅ Granular selectors
  const addToCart = useCartStore((state) => state.addToCart);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  const isCartLoading = useCartStore((state) => state.isLoading);

  const cartQuantity = product ? getItemQuantity(product._id) : 0;

  useEffect(() => {
    if (!initialProduct && productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const response = await productsAPI.getProduct(productId);
      setProduct(response.product || response.data?.product);
    } catch (error) {
      console.error('Load product error:', error);
      Alert.alert('Error', 'Failed to load product');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Add to cart with Toast + spam guard + cache invalidation
  const handleAddToCart = async () => {
    if (addingRef.current) return;
    addingRef.current = true;

    try {
      await addToCart(product._id, quantity);

      // ✅ Invalidate product cache so stock updates reflect
      invalidateCacheByPrefix('products:');

      showToast(
        `${quantity} × ${product.title} added to cart`,
        'cart'
      );
    } catch (error) {
      showToast(error.message || 'Failed to add to cart', 'error');
    } finally {
      addingRef.current = false;
    }
  };

  const handleQuantityChange = (delta) => {
    const min = product?.minOrderQuantity || 1;
    const max = product?.maxOrderQuantity || 99;
    const newQuantity = quantity + delta;
    if (newQuantity >= min && newQuantity <= max) {
      setQuantity(newQuantity);
    }
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={COLORS.white}>
        <Loading fullScreen message="Loading product..." />
      </Screen>
    );
  }

  if (!product) return null;

  const discount = calculateDiscount(product.compareAtPrice, product.price);
  const images = product.images || [];

  return (
    <Screen backgroundColor={COLORS.white}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons
              name="cart-outline"
              size={24}
              color={COLORS.textPrimary}
            />
            {cartQuantity > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartQuantity}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <Image
              source={{ uri: getImageUrl(images[selectedImageIndex]) }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={80} color={COLORS.gray} />
            </View>
          )}

          {discount > 0 && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleText}>{discount}% OFF</Text>
            </View>
          )}

          {!product.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailContainer}
          >
            {images.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.thumbnail,
                  selectedImageIndex === index && styles.thumbnailActive,
                ]}
                onPress={() => setSelectedImageIndex(index)}
              >
                <Image
                  source={{ uri: getImageUrl(image) }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Info */}
        <View style={styles.infoContainer}>
          {product.category && (
            <Text style={styles.category}>{product.category}</Text>
          )}

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {formatCurrency(product.price)}
            </Text>
            {product.compareAtPrice > product.price && (
              <Text style={styles.comparePrice}>
                {formatCurrency(product.compareAtPrice)}
              </Text>
            )}
            {product.unit && (
              <Text style={styles.unit}>/ {product.unit}</Text>
            )}
          </View>

          {/* Stock Status */}
          <View style={styles.stockContainer}>
            <View
              style={[
                styles.stockBadge,
                {
                  backgroundColor: product.inStock
                    ? COLORS.successLight
                    : COLORS.errorLight,
                },
              ]}
            >
              <Ionicons
                name={
                  product.inStock ? 'checkmark-circle' : 'close-circle'
                }
                size={16}
                color={product.inStock ? COLORS.success : COLORS.error}
              />
              <Text
                style={[
                  styles.stockText,
                  {
                    color: product.inStock
                      ? COLORS.success
                      : COLORS.error,
                  },
                ]}
              >
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>

            {/* Min order quantity hint */}
            {product.minOrderQuantity > 1 && (
              <Text style={styles.lowStockText}>
                Min. order: {product.minOrderQuantity}
              </Text>
            )}
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>
                {cleanText(product.description)}
              </Text>
            </View>
          )}

          {/* Short Description */}
          {product.shortDescription && !product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>
                {product.shortDescription}
              </Text>
            </View>
          )}

          {/* Applications */}
          {product.applications?.length > 0 && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Applications</Text>
              {product.applications.map((app, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{app}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Storage */}
          {product.storage && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Storage</Text>
              <Text style={styles.description}>{product.storage}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action Bar */}
      {product.inStock && (
        <View style={styles.bottomBar}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(-1)}
              disabled={quantity <= (product.minOrderQuantity || 1)}
            >
              <Ionicons
                name="remove"
                size={20}
                color={
                  quantity <= (product.minOrderQuantity || 1)
                    ? COLORS.gray
                    : COLORS.textPrimary
                }
              />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(1)}
            >
              <Ionicons name="add" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <Button
            title={
              cartQuantity > 0
                ? `Add More (${cartQuantity} in cart)`
                : 'Add to Cart'
            }
            onPress={handleAddToCart}
            loading={isCartLoading}
            style={styles.addToCartButton}
            icon={
              <Ionicons name="cart" size={20} color={COLORS.black} />
            }
          />
        </View>
      )}

      {/* ✅ Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    color: COLORS.black,
    fontWeight: '700',
  },
  imageContainer: {
    width: width,
    height: IMAGE_HEIGHT,
    backgroundColor: COLORS.card,
    position: 'relative',
  },
  mainImage: { width: '100%', height: '100%' },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
  },
  saleBadge: {
    position: 'absolute',
    top: SPACING.lg + 50,
    left: SPACING.screenPadding,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.buttonRadius,
  },
  saleText: {
    ...FONTS.labelSmall,
    color: COLORS.white,
    fontWeight: '700',
  },
  outOfStockOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  outOfStockText: {
    ...FONTS.body,
    color: COLORS.white,
    fontWeight: '600',
  },
  thumbnailContainer: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: SPACING.cardRadiusSmall,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: SPACING.sm,
  },
  thumbnailActive: { borderColor: COLORS.primary },
  thumbnailImage: { width: '100%', height: '100%' },
  infoContainer: { padding: SPACING.screenPadding },
  category: {
    ...FONTS.labelSmall,
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
  },
  price: { ...FONTS.priceLarge, color: COLORS.textPrimary },
  comparePrice: {
    ...FONTS.body,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginLeft: SPACING.sm,
  },
  unit: {
    ...FONTS.body,
    color: COLORS.gray,
    marginLeft: SPACING.xs,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.xs,
    gap: SPACING.xs,
  },
  stockText: { ...FONTS.labelSmall, fontWeight: '600' },
  lowStockText: { ...FONTS.caption, color: COLORS.warning },
  descriptionContainer: { marginBottom: SPACING.lg },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  bullet: {
    ...FONTS.body,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    fontWeight: '700',
  },
  bulletText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  bottomSpacing: { height: 100 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
    ...SHADOWS.medium,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SPACING.buttonRadius,
    paddingHorizontal: SPACING.xs,
  },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },
  addToCartButton: { flex: 1 },
});

export default ProductDetailScreen;