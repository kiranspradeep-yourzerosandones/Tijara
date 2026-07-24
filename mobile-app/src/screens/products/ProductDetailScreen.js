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

  const [product, setProduct]               = useState(initialProduct);
  const [isLoading, setIsLoading]           = useState(!initialProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity]             = useState(1);

  // ✅ Spam guard
  const addingRef   = useRef(false);
  const removingRef = useRef(false);

  // ✅ Toast
  const { toast, showToast } = useToast();

  // ✅ Granular selectors
  const addToCart      = useCartStore((state) => state.addToCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  const isCartLoading  = useCartStore((state) => state.isLoading);

  const cartQuantity = product ? getItemQuantity(product._id) : 0;

  // ── Keep local quantity in sync with minOrderQuantity ──
  useEffect(() => {
    if (product) {
      setQuantity(product.minOrderQuantity || 1);
    }
  }, [product?._id]);

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

  // ── Add to cart ────────────────────────────────────────
  const handleAddToCart = async () => {
    if (addingRef.current) return;
    addingRef.current = true;

    try {
      await addToCart(product._id, quantity);
      invalidateCacheByPrefix('products:');
      showToast(`${quantity} × ${product.title} added to cart`, 'cart');
    } catch (error) {
      showToast(error.message || 'Failed to add to cart', 'error');
    } finally {
      addingRef.current = false;
    }
  };

  // ── Increase cart quantity by 1 ────────────────────────
  const handleCartIncrease = async () => {
    if (addingRef.current) return;
    addingRef.current = true;

    try {
      const max = product.maxOrderQuantity || 99;
      if (cartQuantity >= max) {
        showToast(`Maximum order quantity is ${max}`, 'error');
        return;
      }
      await addToCart(product._id, 1);
      showToast(`${product.title} updated in cart`, 'cart');
    } catch (error) {
      showToast(error.message || 'Failed to update cart', 'error');
    } finally {
      addingRef.current = false;
    }
  };

  // ── Decrease cart quantity by 1 (or remove if reaches 0) ─
  const handleCartDecrease = async () => {
    if (removingRef.current) return;
    removingRef.current = true;

    try {
      const min = product.minOrderQuantity || 1;

      if (cartQuantity <= min) {
        // Remove entirely from cart
        await removeFromCart(product._id);
        showToast(`${product.title} removed from cart`, 'error');
      } else {
        // Decrease by 1
        await updateQuantity(product._id, cartQuantity - 1);
        showToast(`${product.title} updated in cart`, 'cart');
      }
      invalidateCacheByPrefix('products:');
    } catch (error) {
      showToast(error.message || 'Failed to update cart', 'error');
    } finally {
      removingRef.current = false;
    }
  };

  // ── Local quantity stepper (before adding to cart) ─────
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
  const images   = product.images || [];
  const min      = product.minOrderQuantity || 1;
  const max      = product.maxOrderQuantity || 99;

  // ── Is already in cart? Show cart stepper instead ──────
  const isInCart = cartQuantity > 0;

  return (
    <Screen backgroundColor={COLORS.white}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────── */}
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
            <Ionicons name="cart-outline" size={24} color={COLORS.textPrimary} />
            {cartQuantity > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartQuantity}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Image Gallery ──────────────────────────────── */}
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

        {/* ── Thumbnail Gallery ──────────────────────────── */}
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

        {/* ── Product Info ───────────────────────────────── */}
        <View style={styles.infoContainer}>
          {product.category && (
            <Text style={styles.category}>{product.category}</Text>
          )}

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
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
                name={product.inStock ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={product.inStock ? COLORS.success : COLORS.error}
              />
              <Text
                style={[
                  styles.stockText,
                  { color: product.inStock ? COLORS.success : COLORS.error },
                ]}
              >
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>

            {min > 1 && (
              <Text style={styles.minOrderText}>
                Min. order: {min}
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

          {/* ✅ Storage — HTML stripped with cleanText */}
          {product.storage && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Storage</Text>
              <Text style={styles.description}>
                {cleanText(product.storage)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* ── Bottom Action Bar ─────────────────────────────── */}

{product.inStock && (
  <View style={styles.bottomBar}>
    {isInCart ? (
      <View style={styles.cartStepperRow}>
        {/* Cart Stepper */}
        <View style={styles.cartStepper}>
          <TouchableOpacity
            style={styles.stepperBtnMinus}
            onPress={handleCartDecrease}
            disabled={isCartLoading}
            activeOpacity={0.7}
          >
            <Ionicons
              name={cartQuantity <= min ? 'trash-outline' : 'remove'}
              size={18}
              color={COLORS.white}
            />
          </TouchableOpacity>

          <View style={styles.stepperCount}>
            <Text style={styles.stepperCountText}>{cartQuantity}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.stepperBtnPlus,
              cartQuantity >= max && styles.stepperBtnDisabled,
            ]}
            onPress={handleCartIncrease}
            disabled={isCartLoading || cartQuantity >= max}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* View Cart */}
        <TouchableOpacity
          style={styles.goToCartBtn}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.85}
        >
          <Ionicons name="cart" size={18} color={COLORS.black} />
          <Text style={styles.goToCartText}>View Cart</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View style={styles.addToCartRow}>
        {/* Quantity Stepper */}
        <View style={styles.localStepper}>
          <TouchableOpacity
            style={[
              styles.localStepperBtn,
              quantity <= min && styles.localStepperBtnDisabled,
            ]}
            onPress={() => handleQuantityChange(-1)}
            disabled={quantity <= min}
            activeOpacity={0.7}
          >
            <Ionicons
              name="remove"
              size={16}
              color={quantity <= min ? COLORS.gray : COLORS.textPrimary}
            />
          </TouchableOpacity>

          <Text style={styles.localStepperCount}>{quantity}</Text>

          <TouchableOpacity
            style={[
              styles.localStepperBtn,
              quantity >= max && styles.localStepperBtnDisabled,
            ]}
            onPress={() => handleQuantityChange(1)}
            disabled={quantity >= max}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add"
              size={16}
              color={quantity >= max ? COLORS.gray : COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Add to Cart */}
        <TouchableOpacity
          style={[
            styles.addToCartBtn,
            isCartLoading && styles.addToCartBtnDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={isCartLoading}
          activeOpacity={0.85}
        >
          {isCartLoading ? (
            <Text style={styles.addToCartBtnText}>Adding...</Text>
          ) : (
            <>
              <Ionicons name="cart-outline" size={18} color={COLORS.black} />
              <Text style={styles.addToCartBtnText}>Add to Cart</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    )}
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

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical:   SPACING.md,
    position:          'absolute',
    top:    0,
    left:   0,
    right:  0,
    zIndex: 10,
  },
  backButton: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: COLORS.white,
    alignItems:      'center',
    justifyContent:  'center',
    ...SHADOWS.small,
  },
  cartButton: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: COLORS.white,
    alignItems:      'center',
    justifyContent:  'center',
    ...SHADOWS.small,
  },
  cartBadge: {
    position:        'absolute',
    top:    -4,
    right:  -4,
    backgroundColor: COLORS.primary,
    width:           20,
    height:          20,
    borderRadius:    10,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cartBadgeText: {
    fontSize:   10,
    color:      COLORS.black,
    fontWeight: '700',
  },

  // ── Images ──────────────────────────────────────────────
  imageContainer: {
    width:    width,
    height:   IMAGE_HEIGHT,
    backgroundColor: COLORS.card,
    position: 'relative',
  },
  mainImage: { width: '100%', height: '100%' },
  placeholderImage: {
    width:          '100%',
    height:         '100%',
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
  },
  saleBadge: {
    position:          'absolute',
    top:               SPACING.lg + 50,
    left:              SPACING.screenPadding,
    backgroundColor:   COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical:   SPACING.xs,
    borderRadius:      SPACING.buttonRadius,
  },
  saleText: {
    ...FONTS.labelSmall,
    color:      COLORS.white,
    fontWeight: '700',
  },
  outOfStockOverlay: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: SPACING.md,
    alignItems:      'center',
  },
  outOfStockText: {
    ...FONTS.body,
    color:      COLORS.white,
    fontWeight: '600',
  },
  thumbnailContainer: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical:   SPACING.md,
    gap:               SPACING.sm,
  },
  thumbnail: {
    width:        60,
    height:       60,
    borderRadius: SPACING.cardRadiusSmall,
    overflow:     'hidden',
    borderWidth:  2,
    borderColor:  'transparent',
    marginRight:  SPACING.sm,
  },
  thumbnailActive: { borderColor: COLORS.primary },
  thumbnailImage:  { width: '100%', height: '100%' },

  // ── Info ────────────────────────────────────────────────
  infoContainer: { padding: SPACING.screenPadding },
  category: {
    ...FONTS.labelSmall,
    color:         COLORS.primary,
    textTransform: 'uppercase',
    marginBottom:  SPACING.xs,
  },
  title: {
    ...FONTS.h3,
    color:        COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems:    'baseline',
    marginBottom:  SPACING.md,
  },
  price:        { ...FONTS.priceLarge, color: COLORS.textPrimary },
  comparePrice: {
    ...FONTS.body,
    color:               COLORS.gray,
    textDecorationLine:  'line-through',
    marginLeft:          SPACING.sm,
  },
  unit: {
    ...FONTS.body,
    color:      COLORS.gray,
    marginLeft: SPACING.xs,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  SPACING.lg,
    gap:           SPACING.md,
  },
  stockBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical:   SPACING.xs,
    borderRadius:      SPACING.xs,
    gap:               SPACING.xs,
  },
  stockText:    { ...FONTS.labelSmall, fontWeight: '600' },
  minOrderText: { ...FONTS.caption, color: COLORS.warning },

  descriptionContainer: { marginBottom: SPACING.lg },
  sectionTitle: {
    ...FONTS.h4,
    color:        COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  description: {
    ...FONTS.body,
    color:      COLORS.textSecondary,
    lineHeight: 24,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom:  SPACING.xs,
  },
  bullet: {
    ...FONTS.body,
    color:       COLORS.primary,
    marginRight: SPACING.sm,
    fontWeight:  '700',
  },
  bulletText: {
    ...FONTS.body,
    color:      COLORS.textSecondary,
    flex:       1,
    lineHeight: 22,
  },
  bottomSpacing: { height: 110 },

    // ── Bottom Bar ──────────────────────────────────────────
  bottomBar: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop:        SPACING.sm,
    paddingBottom:     SPACING.lg,
    backgroundColor:   COLORS.white,
    borderTopWidth:    1,
    borderTopColor:    COLORS.border,
    ...SHADOWS.medium,
  },

  // ── Add to Cart Row ─────────────────────────────────────
  addToCartRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
    height:        52,
  },

  // Local quantity stepper
  localStepper: {
    flexDirection:   'row',
    alignItems:      'center',
    height:          52,
    borderRadius:    12,
    borderWidth:     1.5,
    borderColor:     COLORS.border,
    backgroundColor: COLORS.white,
    overflow:        'hidden',
  },
  localStepperBtn: {
    width:           44,
    height:          '100%',
    alignItems:      'center',
    justifyContent:  'center',
  },
  localStepperBtnDisabled: {
    opacity: 0.35,
  },
  localStepperCount: {
    minWidth:   40,
    textAlign:  'center',
    fontSize:   16,
    fontWeight: '700',
    color:      COLORS.textPrimary,
  },

  // Add to Cart button
  addToCartBtn: {
    flex:            1,
    height:          52,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius:    12,
    ...SHADOWS.small,
  },
  addToCartBtnDisabled: {
    opacity: 0.6,
  },
  addToCartBtnText: {
    fontSize:   15,
    fontWeight: '700',
    color:      COLORS.black,
  },

  // ── Cart Stepper Row ────────────────────────────────────
  cartStepperRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           SPACING.sm,
    height:        52,
  },

  // Cart stepper
  cartStepper: {
    flex:          1,
    flexDirection: 'row',
    alignItems:    'center',
    height:        52,
    borderRadius:  12,
    borderWidth:   1.5,
    borderColor:   COLORS.primary,
    overflow:      'hidden',
  },
  stepperBtnMinus: {
    width:           52,
    height:          '100%',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: COLORS.error,
  },
  stepperBtnPlus: {
    width:           52,
    height:          '100%',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: COLORS.primary,
  },
  stepperBtnDisabled: {
    backgroundColor: COLORS.gray,
    opacity:         0.4,
  },
  stepperCount: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: COLORS.white,
  },
  stepperCountText: {
    fontSize:   17,
    fontWeight: '800',
    color:      COLORS.textPrimary,
  },

  // Go to Cart button
  goToCartBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               6,
    height:            52,
    paddingHorizontal: SPACING.xl,
    backgroundColor:   COLORS.primary,
    borderRadius:      12,
    ...SHADOWS.small,
  },
  goToCartText: {
    fontSize:   14,
    fontWeight: '700',
    color:      COLORS.black,
  },
});

export default ProductDetailScreen;