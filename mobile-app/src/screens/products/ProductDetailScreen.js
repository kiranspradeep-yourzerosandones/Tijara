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
import { formatCurrency, calculateDiscount, getImageUrl } from '../../utils/helpers';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ navigation, route }) => {
  const { product } = route.params;
  
  const [quantity, setQuantity] = useState(product.minOrderQuantity || 1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const flatListRef = useRef(null);

  const { addToCart, getItemQuantity, isLoading } = useCartStore();
  const cartQuantity = getItemQuantity(product._id);
  const discount = calculateDiscount(product.compareAtPrice, product.price);

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

  const renderImageItem = ({ item, index }) => (
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
          {product.shortDescription && (
            <Text style={styles.shortDescription}>
              {product.shortDescription}
            </Text>
          )}

          {/* Quantity Selector */}
          {product.inStock && (
            <View style={styles.quantitySection}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityRow}>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(-1)}
                    disabled={quantity <= (product.minOrderQuantity || 1)}
                  >
                    <Ionicons name="remove" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleQuantityChange(1)}
                    disabled={quantity >= (product.maxOrderQuantity || 100)}
                  >
                    <Ionicons name="add" size={20} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.quantityLimits}>
                  Min: {product.minOrderQuantity || 1} | Max: {product.maxOrderQuantity || 100}
                </Text>
              </View>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Applications */}
          {product.applications?.length > 0 && (
            <View style={styles.applicationsSection}>
              <Text style={styles.sectionTitle}>Applications</Text>
              <View style={styles.applicationsList}>
                {product.applications.map((app, index) => (
                  <View key={index} style={styles.applicationItem}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
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
              <Text style={styles.storageText}>{product.storage}</Text>
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
    ...FONTS.caption,
    fontSize: 10,
    color: COLORS.black,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: COLORS.card,
    position: 'relative',
  },
  productImage: {
    width: width,
    height: width,
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
    ...FONTS.caption,
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
  },
  price: {
    ...FONTS.priceLarge,
    color: COLORS.textPrimary,
  },
  unit: {
    ...FONTS.body,
    color: COLORS.gray,
    marginLeft: 4,
  },
  comparePrice: {
    ...FONTS.body,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginLeft: SPACING.sm,
  },
  shortDescription: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  quantitySection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.h4,
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
    borderRadius: SPACING.buttonRadius,
    padding: SPACING.xs,
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
    minWidth: 50,
    textAlign: 'center',
  },
  quantityLimits: {
    ...FONTS.caption,
    color: COLORS.gray,
  },
  descriptionSection: {
    marginBottom: SPACING.lg,
  },
  description: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  applicationsSection: {
    marginBottom: SPACING.lg,
  },
  applicationsList: {
    gap: SPACING.sm,
  },
  applicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  applicationText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  storageSection: {
    marginBottom: SPACING.lg,
  },
  storageText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
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
    ...FONTS.body,
    color: COLORS.gray,
  },
  totalPrice: {
    ...FONTS.priceLarge,
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