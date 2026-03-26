// src/screens/products/ProductDetailScreen.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Button } from '../../components/common';
import { useCartStore } from '../../store';
import { 
  formatCurrency, 
  calculateDiscount, 
  getImageUrl, 
  stripHtml, 
  isHtml, 
  parseHtmlList 
} from '../../utils/helpers';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ navigation, route }) => {
  const { product } = route.params;
  
  const [quantity, setQuantity] = useState(product.minOrderQuantity || 1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const flatListRef = useRef(null);

  const addToCart = useCartStore((state) => state.addToCart);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  const isLoading = useCartStore((state) => state.isLoading);
  
  const cartQuantity = getItemQuantity(product._id);
  const discount = calculateDiscount(product.compareAtPrice, product.price);

  // Process description - handle HTML
  const descriptionText = isHtml(product.description) 
    ? stripHtml(product.description) 
    : product.description;

  // Process applications - handle HTML list or array
  const applicationsList = (() => {
    if (Array.isArray(product.applications) && product.applications.length > 0) {
      // Check if first item is HTML
      if (product.applications.length === 1 && isHtml(product.applications[0])) {
        return parseHtmlList(product.applications[0]);
      }
      // Clean each application text
      return product.applications.map(app => isHtml(app) ? stripHtml(app) : app);
    }
    return [];
  })();

  // Process short description
  const shortDescText = isHtml(product.shortDescription)
    ? stripHtml(product.shortDescription)
    : product.shortDescription;

  const handleQuantityChange = (change) => {
    const newQty = quantity + change;
    if (newQty >= (product.minOrderQuantity || 1) && newQty <= (product.maxOrderQuantity || 100)) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, quantity);
      Alert.alert('Success', `${product.title} added to cart`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(product._id, quantity);
      navigation.navigate('Cart');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderImageItem = ({ item }) => (
    <Image
      source={{ uri: getImageUrl(item) }}
      style={styles.productImage}
      resizeMode="cover"
    />
  );

  const renderImageIndicator = () => (
    <View style={styles.imageIndicatorContainer}>
      {product.images?.map((_, index) => (
        <View
          key={index}
          style={[
            styles.imageIndicator,
            index === activeImageIndex && styles.imageIndicatorActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {product.images?.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={product.images}
                renderItem={renderImageItem}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setActiveImageIndex(index);
                }}
              />
              {product.images.length > 1 && renderImageIndicator()}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={80} color={COLORS.gray} />
            </View>
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}

          {/* Stock Status */}
          {!product.inStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.contentContainer}>
          {/* Category */}
          {product.category && (
            <Text style={styles.category}>{product.category}</Text>
          )}

          {/* Title */}
          <Text style={styles.title}>{product.title}</Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {formatCurrency(product.price)}
            </Text>
            {product.unit && (
              <Text style={styles.unit}>/{product.unit}</Text>
            )}
            {product.compareAtPrice > product.price && (
              <Text style={styles.comparePrice}>
                {formatCurrency(product.compareAtPrice)}
              </Text>
            )}
          </View>

          {/* Short Description */}
          {shortDescText ? (
            <Text style={styles.shortDescription}>
              {shortDescText}
            </Text>
          ) : null}

          {/* Quantity Selector */}
          {product.inStock && (
            <View style={styles.quantitySection}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityRow}>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      quantity <= (product.minOrderQuantity || 1) && styles.quantityButtonDisabled,
                    ]}
                    onPress={() => handleQuantityChange(-1)}
                    disabled={quantity <= (product.minOrderQuantity || 1)}
                  >
                    <Ionicons 
                      name="remove" 
                      size={20} 
                      color={quantity <= (product.minOrderQuantity || 1) ? COLORS.gray : COLORS.textPrimary} 
                    />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      quantity >= (product.maxOrderQuantity || 100) && styles.quantityButtonDisabled,
                    ]}
                    onPress={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.maxOrderQuantity || 100)}
                  >
                    <Ionicons 
                      name="add" 
                      size={20} 
                      color={quantity >= (product.maxOrderQuantity || 100) ? COLORS.gray : COLORS.textPrimary} 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.quantityLimits}>
                  Min: {product.minOrderQuantity || 1} | Max: {product.maxOrderQuantity || 100}
                </Text>
              </View>
            </View>
          )}

          {/* Stock Info */}
          {product.trackQuantity && product.stockQuantity !== null && product.inStock && (
            <View style={styles.stockInfo}>
              <Ionicons 
                name="cube-outline" 
                size={16} 
                color={product.stockQuantity <= (product.lowStockThreshold || 10) ? COLORS.warning : COLORS.success} 
              />
              <Text style={[
                styles.stockText,
                product.stockQuantity <= (product.lowStockThreshold || 10) && styles.lowStockText
              ]}>
                {product.stockQuantity <= (product.lowStockThreshold || 10) 
                  ? `Only ${product.stockQuantity} left in stock` 
                  : `${product.stockQuantity} in stock`
                }
              </Text>
            </View>
          )}

          {/* Description */}
          {descriptionText ? (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{descriptionText}</Text>
            </View>
          ) : null}

          {/* Applications */}
          {applicationsList.length > 0 && (
            <View style={styles.applicationsSection}>
              <Text style={styles.sectionTitle}>Applications</Text>
              <View style={styles.applicationsList}>
                {applicationsList.map((app, index) => (
                  <View key={index} style={styles.applicationItem}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.applicationText}>{app}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Storage */}
          {product.storage && (
            <View style={styles.storageSection}>
              <Text style={styles.sectionTitle}>Storage</Text>
              <View style={styles.storageCard}>
                <Ionicons name="snow-outline" size={20} color={COLORS.info} />
                <Text style={styles.storageText}>
                  {isHtml(product.storage) ? stripHtml(product.storage) : product.storage}
                </Text>
              </View>
            </View>
          )}

          {/* Brand */}
          {product.brand && (
            <View style={styles.brandSection}>
              <Text style={styles.sectionTitle}>Brand</Text>
              <View style={styles.brandCard}>
                <Ionicons name="pricetag-outline" size={16} color={COLORS.primary} />
                <Text style={styles.brandText}>{product.brand}</Text>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      {product.inStock && (
        <View style={styles.bottomBar}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>
              {formatCurrency(product.price * quantity)}
            </Text>
          </View>
          <View style={styles.buttonsContainer}>
            <Button
              title="Add to Cart"
              variant="outline"
              size="medium"
              onPress={handleAddToCart}
              loading={isLoading}
              style={styles.addToCartButton}
            />
            <Button
              title="Buy Now"
              size="medium"
              onPress={handleBuyNow}
              loading={isLoading}
              style={styles.buyNowButton}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.xxl + 20,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 10,
    color: COLORS.black,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width * 0.85,
    backgroundColor: COLORS.card,
    position: 'relative',
  },
  productImage: {
    width: width,
    height: width * 0.85,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: SPACING.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: COLORS.white,
    width: 24,
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.xxxl + 60,
    left: SPACING.screenPadding,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.xs,
  },
  discountText: {
    ...FONTS.label,
    color: COLORS.white,
    fontWeight: '700',
  },
  outOfStockBadge: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.screenPadding,
    backgroundColor: COLORS.darkGray,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.xs,
  },
  outOfStockText: {
    ...FONTS.label,
    color: COLORS.white,
  },
  contentContainer: {
    padding: SPACING.screenPadding,
  },
  category: {
    fontSize: 12,
    color: COLORS.primary,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    lineHeight: 28,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  unit: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 4,
  },
  comparePrice: {
    fontSize: 16,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginLeft: SPACING.sm,
  },
  shortDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  quantitySection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 25,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    minWidth: 50,
    textAlign: 'center',
  },
  quantityLimits: {
    fontSize: 12,
    color: COLORS.gray,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: SPACING.sm,
  },
  stockText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '500',
  },
  lowStockText: {
    color: COLORS.warning,
  },
  descriptionSection: {
    marginBottom: SPACING.lg,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  applicationsSection: {
    marginBottom: SPACING.lg,
  },
  applicationsList: {
    gap: SPACING.sm,
  },
  applicationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingRight: SPACING.md,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 7,
    flexShrink: 0,
  },
  applicationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  storageSection: {
    marginBottom: SPACING.lg,
  },
  storageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info || COLORS.primary,
  },
  storageText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  brandSection: {
    marginBottom: SPACING.lg,
  },
  brandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: SPACING.sm,
  },
  brandText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 120,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOWS.medium,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  addToCartButton: {
    flex: 1,
  },
  buyNowButton: {
    flex: 1,
  },
});

export default ProductDetailScreen;