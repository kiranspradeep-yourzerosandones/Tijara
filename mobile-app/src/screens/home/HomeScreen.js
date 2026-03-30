// src/screens/home/HomeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { Loading, Screen } from '../../components/common';
import TijaraLogo from '../../components/common/TijaraLogo';
import { productsAPI } from '../../api';
import { useAuthStore, useCartStore, useNotificationStore } from '../../store';
import { getImageUrl, formatCurrency, calculateDiscount } from '../../utils/helpers';

const { width } = Dimensions.get('window');

// 🎯 SIMPLE BANNER DIMENSIONS
const BANNER_HORIZONTAL_PADDING = 20;
const BANNER_WIDTH = width - (BANNER_HORIZONTAL_PADDING * 2);
const BANNER_HEIGHT = 160;

// Category & Product dimensions
const CATEGORY_HEIGHT = 114;
const PRODUCT_GAP = 10;
const PRODUCT_CARD_WIDTH = (width - (SPACING.screenPadding * 2) - (PRODUCT_GAP * 2)) / 3;

// 🎯 LOCAL CATEGORY IMAGES
const CATEGORY_IMAGES = {
  wax: require('../../../assets/wax.jpg'),
  chemicals: require('../../../assets/chemicals.jpg'),
};

// 🎯 Banner data - Simple array
const BANNER_DATA = [
  {
    id: '1',
    title: 'Godrej Vegetable Wax',
    subtitle: 'High-quality plant-based wax for industrial applications',
    backgroundColor: '#2D5A27',
  },
  {
    id: '2',
    title: 'Premium Chemicals',
    subtitle: 'Industrial grade chemicals for manufacturing',
    backgroundColor: '#1a4a6e',
  },
  {
    id: '3',
    title: 'Special Offers',
    subtitle: 'Up to 30% off on selected items',
    backgroundColor: '#8B4513',
  },
  {
    id: '4',
    title: 'New Arrivals',
    subtitle: 'Check out our latest products',
    backgroundColor: '#4a1a6e',
  },
];

// Default categories
const DEFAULT_CATEGORIES = [
  { _id: 'wax', name: 'Wax Products', localImage: CATEGORY_IMAGES.wax },
  { _id: 'chemicals', name: 'Chemical Products', localImage: CATEGORY_IMAGES.chemicals },
];

const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 🎯 SIMPLE BANNER STATE
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { user } = useAuthStore();
  const { addToCart, getItemQuantity, fetchCart } = useCartStore();
  const { fetchUnreadCount } = useNotificationStore();

  // ============================================================
  // SIMPLE AUTO-CHANGE BANNER (Every 5 seconds)
  // ============================================================
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change content
        setCurrentBannerIndex((prev) => (prev + 1) % BANNER_DATA.length);
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  // ============================================================
  // DATA LOADING
  // ============================================================
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadProducts(),
        loadCategories(),
        fetchCart(),
        fetchUnreadCount(),
      ]);
    } catch (error) {
      console.error('Load initial data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getProducts({ limit: 20 });
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Load products error:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Load categories error:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('ProductList', {
        searchQuery: searchQuery.trim(),
        title: `Search: ${searchQuery.trim()}`,
      });
    }
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const handleViewAllProducts = () => {
    navigation.navigate('ProductList', { title: 'All Products' });
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('ProductList', {
      category: category.name,
      title: category.name,
    });
  };

  const handleSupportPress = () => {
    navigation.navigate('Profile');
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product._id, 1);
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  };

  // Handle dot press
  const handleDotPress = (index) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentBannerIndex(index);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // ============================================================
  // HEADER
  // ============================================================
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <TijaraLogo width={28} height={28} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.welcomeText}>Welcome Back,</Text>
          <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.supportButton}
        onPress={handleSupportPress}
      >
        <Ionicons name="headset-outline" size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  // ============================================================
  // SEARCH BAR
  // ============================================================
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={18} color={COLORS.gray} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search your products"
        placeholderTextColor={COLORS.gray}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={18} color={COLORS.gray} />
        </TouchableOpacity>
      )}
    </View>
  );

  // ============================================================
  // SIMPLE AUTO-CHANGING BANNER
  // ============================================================
  const renderBanner = () => {
    const currentBanner = BANNER_DATA[currentBannerIndex];

    return (
      <View style={styles.bannerWrapper}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleViewAllProducts}
          style={styles.bannerContainer}
        >
          <Animated.View
            style={[
              styles.bannerCard,
              { 
                backgroundColor: currentBanner.backgroundColor,
                opacity: fadeAnim,
              },
            ]}
          >
            {/* Background Pattern */}
            <View style={styles.bannerPattern}>
              <View style={[styles.patternCircle, styles.patternCircle1]} />
              <View style={[styles.patternCircle, styles.patternCircle2]} />
            </View>

            {/* Content */}
            <View style={styles.bannerContent}>
              <View style={styles.bannerTextSection}>
                <Text style={styles.bannerTitle} numberOfLines={1}>
                  {currentBanner.title}
                </Text>
                <Text style={styles.bannerSubtitle} numberOfLines={2}>
                  {currentBanner.subtitle}
                </Text>
                <View style={styles.shopNowButton}>
                  <Text style={styles.shopNowText}>Shop Now</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.black} />
                </View>
              </View>
              
              <View style={styles.bannerImageSection}>
                <View style={styles.bannerIconContainer}>
                  <Ionicons name="cube" size={40} color="rgba(255,255,255,0.3)" />
                </View>
              </View>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {/* Dot Indicators */}
        <View style={styles.dotsContainer}>
          {BANNER_DATA.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              style={styles.dotTouchable}
            >
              <View
                style={[
                  styles.dot,
                  index === currentBannerIndex && styles.dotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // ============================================================
  // CATEGORIES
  // ============================================================
  const renderCategories = () => {
    const getCategoryWithImage = (category, index) => {
      const categoryNameLower = category.name?.toLowerCase() || '';
      
      if (categoryNameLower.includes('wax')) {
        return { ...category, localImage: CATEGORY_IMAGES.wax };
      } else if (categoryNameLower.includes('chemical')) {
        return { ...category, localImage: CATEGORY_IMAGES.chemicals };
      }
      
      if (index === 0) return { ...category, localImage: CATEGORY_IMAGES.wax };
      if (index === 1) return { ...category, localImage: CATEGORY_IMAGES.chemicals };
      
      return category;
    };

    const displayCategories = categories.length > 0 
      ? categories.slice(0, 2).map((cat, idx) => getCategoryWithImage(cat, idx))
      : DEFAULT_CATEGORIES;

    return (
      <View style={styles.categoriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.seeAllText}>See all →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoryGrid}>
          {displayCategories.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.8}
            >
              <ImageBackground
                source={category.localImage || CATEGORY_IMAGES.wax}
                style={styles.categoryImage}
                imageStyle={styles.categoryImageStyle}
              >
                <View style={styles.categoryOverlay}>
                  <Text style={styles.categoryText}>{category.name}</Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // ============================================================
  // COMPACT PRODUCT CARD
  // ============================================================
  const renderCompactProductCard = (product, index) => {
    const quantity = getItemQuantity(product._id);
    const discount = calculateDiscount(product.compareAtPrice, product.price);
    const imageUrl = product.images?.[0] ? getImageUrl(product.images[0]) : null;

    return (
      <TouchableOpacity
        key={product._id}
        style={[
          styles.compactProductCard,
          { marginRight: (index + 1) % 3 === 0 ? 0 : PRODUCT_GAP },
        ]}
        onPress={() => handleProductPress(product)}
        activeOpacity={0.8}
      >
        <View style={styles.compactImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.compactImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.compactPlaceholder}>
              <Ionicons name="image-outline" size={24} color={COLORS.gray} />
            </View>
          )}

          {discount > 0 && (
            <View style={styles.compactSaleBadge}>
              <Text style={styles.compactSaleText}>Sale</Text>
            </View>
          )}

          {!product.inStock && (
            <View style={styles.compactOutOfStock}>
              <Text style={styles.compactOutOfStockText}>Out</Text>
            </View>
          )}
        </View>

        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {product.title}
          </Text>

          <View style={styles.compactPriceRow}>
            <Text style={styles.compactPrice}>
              {formatCurrency(product.price)}
            </Text>
            {product.inStock && (
              <TouchableOpacity
                style={[
                  styles.compactAddButton,
                  quantity > 0 && styles.compactAddButtonActive,
                ]}
                onPress={() => handleAddToCart(product)}
              >
                {quantity > 0 ? (
                  <Text style={styles.compactQuantityText}>{quantity}</Text>
                ) : (
                  <Ionicons name="add" size={14} color={COLORS.white} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================================
  // PRODUCTS - 3 COLUMN GRID
  // ============================================================
  const renderProducts = () => (
    <View style={styles.productsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Our Products</Text>
        <TouchableOpacity onPress={handleViewAllProducts}>
          <Text style={styles.seeAllText}>See all →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.productsGrid}>
        {products.slice(0, 9).map((product, index) => 
          renderCompactProductCard(product, index)
        )}
      </View>

      {products.length > 9 && (
        <TouchableOpacity
          style={styles.viewMoreButton}
          onPress={handleViewAllProducts}
        >
          <Text style={styles.viewMoreText}>View More Products</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoading) {
    return (
      <Screen backgroundColor={COLORS.backgroundLight}>
        <Loading fullScreen message="Loading..." />
      </Screen>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <Screen backgroundColor={COLORS.backgroundLight}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {renderHeader()}
        {renderSearchBar()}
        {renderBanner()}
        {renderCategories()}
        {renderProducts()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </Screen>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },

  // ============================================================
  // HEADER STYLES
  // ============================================================
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  userName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  supportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============================================================
  // SEARCH BAR STYLES
  // ============================================================
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.screenPadding,
    paddingHorizontal: SPACING.md,
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },

  // ============================================================
  // SIMPLE AUTO-CHANGING BANNER STYLES
  // ============================================================
  bannerWrapper: {
    marginBottom: SPACING.lg,
    paddingHorizontal: BANNER_HORIZONTAL_PADDING,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerCard: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  patternCircle1: {
    width: 180,
    height: 180,
    top: -60,
    right: -40,
  },
  patternCircle2: {
    width: 120,
    height: 120,
    bottom: -40,
    right: 60,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    padding: SPACING.md,
  },
  bannerTextSection: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: SPACING.sm,
  },
  bannerImageSection: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: SPACING.sm,
    lineHeight: 17,
  },
  shopNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 4,
  },
  shopNowText: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: '700',
  },

  // Dot Indicators
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  dotTouchable: {
    padding: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 3,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  // ============================================================
  // CATEGORIES STYLES
  // ============================================================
  categoriesSection: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  categoryCard: {
    flex: 1,
    height: CATEGORY_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  categoryImageStyle: {
    borderRadius: 12,
  },
  categoryOverlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: SPACING.sm,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '700',
  },

  // ============================================================
  // PRODUCTS SECTION
  // ============================================================
  productsSection: {
    paddingHorizontal: SPACING.screenPadding,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: 4,
  },
  viewMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // ============================================================
  // COMPACT PRODUCT CARD STYLES
  // ============================================================
  compactProductCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: PRODUCT_GAP,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  compactImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8F8F8',
    position: 'relative',
  },
  compactImage: {
    width: '100%',
    height: '100%',
  },
  compactPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactSaleBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#0D9488',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  compactSaleText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
  },
  compactOutOfStock: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  compactOutOfStockText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '600',
  },
  compactContent: {
    padding: 8,
  },
  compactTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 14,
    height: 28,
  },
  compactPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  compactAddButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAddButtonActive: {
    backgroundColor: '#0D9488',
  },
  compactQuantityText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '700',
  },

  // ============================================================
  // BOTTOM SPACING
  // ============================================================
  bottomSpacing: {
    height: SPACING.tabBarHeight + SPACING.lg,
  },
});

export default HomeScreen;