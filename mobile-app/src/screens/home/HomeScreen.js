import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { ProductCard } from '../../components/products';
import { Loading } from '../../components/common';
import { productsAPI } from '../../api';
import { useAuthStore, useCartStore, useNotificationStore } from '../../store';
import { getImageUrl } from '../../utils/helpers';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 180;

const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { user } = useAuthStore();
  const { totalItems, fetchCart } = useCartStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

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
      const params = { limit: 20 };
      if (selectedCategory) params.category = selectedCategory;
      
      const response = await productsAPI.getProducts(params);
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
        title: `Search: ${searchQuery.trim()}`
      });
    }
  };

  const handleCategoryPress = (category) => {
    if (selectedCategory === category.name) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category.name);
    }
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const handleViewAllProducts = () => {
    navigation.navigate('ProductList', { title: 'All Products' });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.welcomeText}>Welcome Back,</Text>
        <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={COLORS.gray} />
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
          <Ionicons name="close-circle" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderBanner = () => (
    <TouchableOpacity 
      style={styles.bannerContainer}
      onPress={handleViewAllProducts}
      activeOpacity={0.9}
    >
      <View style={styles.bannerContent}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Fresh Products</Text>
          <Text style={styles.bannerSubtitle}>Up to 30% off on selected items</Text>
          <View style={styles.shopNowButton}>
            <Text style={styles.shopNowText}>Shop Now</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.black} />
          </View>
        </View>
        <View style={styles.bannerImagePlaceholder}>
          <Ionicons name="basket" size={60} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategories = () => (
    <View style={styles.categoriesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item._id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryItem,
              selectedCategory === item.name && styles.categoryItemActive,
            ]}
            onPress={() => handleCategoryPress(item)}
          >
            <Text
              style={[
                styles.categoryName,
                selectedCategory === item.name && styles.categoryNameActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderProducts = () => (
    <View style={styles.productsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory || 'Popular Products'}
        </Text>
        <TouchableOpacity onPress={handleViewAllProducts}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.productsGrid}>
        {products.slice(0, 6).map((product, index) => (
          <ProductCard
            key={product._id}
            product={product}
            onPress={() => handleProductPress(product)}
            style={[
              styles.productCard,
              index % 2 === 0 ? styles.leftCard : styles.rightCard,
            ]}
          />
        ))}
      </View>
      {products.length > 6 && (
        <TouchableOpacity
          style={styles.viewMoreButton}
          onPress={handleViewAllProducts}
        >
          <Text style={styles.viewMoreText}>View More Products</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
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
        {categories.length > 0 && renderCategories()}
        {renderProducts()}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <TouchableOpacity
          style={styles.floatingCartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart" size={24} color={COLORS.black} />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{totalItems}</Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    ...FONTS.bodySmall,
    color: COLORS.gray,
  },
  userName: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...FONTS.caption,
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '700',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.screenPadding,
    paddingHorizontal: SPACING.md,
    height: 48,
    backgroundColor: COLORS.card,
    borderRadius: SPACING.buttonRadius,
    marginBottom: SPACING.lg,
  },
  searchInput: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  bannerContainer: {
    marginHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.lg,
  },
  bannerContent: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardDark,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.lg,
    height: BANNER_HEIGHT,
    overflow: 'hidden',
  },
  bannerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    ...FONTS.h2,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  bannerSubtitle: {
    ...FONTS.body,
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  shopNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.buttonRadius,
    alignSelf: 'flex-start',
    gap: SPACING.xs,
  },
  shopNowText: {
    ...FONTS.button,
    color: COLORS.black,
  },
  bannerImagePlaceholder: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesSection: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    ...FONTS.bodySmall,
    color: COLORS.primary,
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: SPACING.screenPadding,
    gap: SPACING.sm,
  },
  categoryItem: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.buttonRadius,
    backgroundColor: COLORS.card,
    marginRight: SPACING.sm,
  },
  categoryItemActive: {
    backgroundColor: COLORS.primary,
  },
  categoryName: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryNameActive: {
    color: COLORS.black,
  },
  productsSection: {
    paddingHorizontal: SPACING.screenPadding,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - SPACING.screenPadding * 2 - SPACING.productCardGap) / 2,
    marginBottom: SPACING.productCardGap,
  },
  leftCard: {
    marginRight: SPACING.productCardGap / 2,
  },
  rightCard: {
    marginLeft: SPACING.productCardGap / 2,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  viewMoreText: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: SPACING.tabBarHeight + SPACING.xl,
  },
  floatingCartButton: {
    position: 'absolute',
    bottom: SPACING.tabBarHeight + SPACING.lg,
    right: SPACING.screenPadding,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.large,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  cartBadgeText: {
    ...FONTS.caption,
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '700',
  },
});

export default HomeScreen;