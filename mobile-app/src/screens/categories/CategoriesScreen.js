// src/screens/categories/CategoriesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Loading, Screen } from '../../components/common';
import SearchSuggestions from '../../components/search/SearchSuggestions';
import { productsAPI } from '../../api';
import { useSearch } from '../../hooks';
import { getImageUrl, formatCurrency, calculateDiscount } from '../../utils/helpers';
import { useCartStore } from '../../store';

const { width } = Dimensions.get('window');

// 🎯 FIXED DIMENSIONS - Compact layout
const SIDEBAR_WIDTH = 80;
const PRODUCT_GAP = 8;
const PRODUCTS_AREA_WIDTH = width - SIDEBAR_WIDTH;
const PRODUCT_CARD_WIDTH = (PRODUCTS_AREA_WIDTH - (PRODUCT_GAP * 3)) / 2;

// 🎯 SAME IMAGES AS HOME PAGE
const CATEGORY_IMAGES = {
  wax: require('../../../assets/wax.jpg'),
  chemicals: require('../../../assets/chemicals.jpg'),
};

const getCategoryLocalImage = (categoryName) => {
  if (!categoryName) return null;
  const name = categoryName.toLowerCase();
  if (name.includes('wax')) return CATEGORY_IMAGES.wax;
  if (name.includes('chemical')) return CATEGORY_IMAGES.chemicals;
  return null;
};

const CategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [sortOrder, setSortOrder] = useState(null);

  const { addToCart, getItemQuantity, totalItems } = useCartStore();

  // 🔍 Search hook with backend suggestions - WITH ALL REQUIRED PROPERTIES
  const {
    query: searchQuery,
    suggestions,
    isSearching,
    isLoadingSuggestions,
    showSuggestions,
    recentSearches,
    trendingSearches,          // ✅ Added
    error: searchError,
    setQuery: setSearchQuery,
    fillSearch,                // ✅ Added
    clearSearch,
    hideSuggestions,
    openSuggestions,
    selectSuggestion,
    addToRecentSearches,       // ✅ Added
    removeRecentSearch,        // ✅ Added
    clearRecentSearches,
    fetchSuggestions,
  } = useSearch({
    debounceMs: 300,
    minQueryLength: 2,
    maxSuggestions: 8,
    enableBackendSearch: true,
    localProducts: products,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory.name);
      clearSearch();
      setSortOrder(null);
    }
  }, [selectedCategory]);

  // Filter & Sort products based on local search query
  useEffect(() => {
    let result = [...products];

    // Local filtering when not using suggestions dropdown
    if (searchQuery.trim() && !showSuggestions) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) => 
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortOrder === 'low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'high') {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(result);
  }, [products, searchQuery, sortOrder, showSuggestions]);

  const loadCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      const categoryList = response.categories || [];
      setCategories(categoryList);
      if (categoryList.length > 0) {
        setSelectedCategory(categoryList[0]);
      }
    } catch (error) {
      console.error('Load categories error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async (categoryName) => {
    setIsLoadingProducts(true);
    try {
      const response = await productsAPI.getProducts({
        category: categoryName,
        limit: 50,
      });
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleProductPress = useCallback((product) => {
    hideSuggestions();
    Keyboard.dismiss();
    navigation.navigate('ProductDetail', { product });
  }, [hideSuggestions, navigation]);

  const handleAddToCart = useCallback(async (product) => {
    try {
      await addToCart(product._id, 1);
    } catch (error) {
      console.error('Add to cart error:', error);
    }
  }, [addToCart]);

  const handleSortPress = useCallback(() => {
    if (sortOrder === null) setSortOrder('low');
    else if (sortOrder === 'low') setSortOrder('high');
    else setSortOrder(null);
  }, [sortOrder]);

  // Handle search submit
  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      addToRecentSearches(searchQuery.trim());
    }
    hideSuggestions();
    Keyboard.dismiss();
  }, [searchQuery, addToRecentSearches, hideSuggestions]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion) => {
    if (typeof suggestion === 'string') {
      setSearchQuery(suggestion);
      addToRecentSearches(suggestion);
      hideSuggestions();
    } else {
      selectSuggestion(suggestion);
    }
    Keyboard.dismiss();
  }, [setSearchQuery, addToRecentSearches, hideSuggestions, selectSuggestion]);

  // Handle product selection from suggestions
  const handleSelectProductSuggestion = useCallback((product) => {
    hideSuggestions();
    Keyboard.dismiss();
    navigation.navigate('ProductDetail', { product });
  }, [hideSuggestions, navigation]);

  // Handle category selection from suggestions
  const handleSelectCategorySuggestion = useCallback((categoryName) => {
    hideSuggestions();
    Keyboard.dismiss();
    
    // Find and select the category
    const category = categories.find(
      c => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (category) {
      setSelectedCategory(category);
    } else {
      // Navigate to product list if category not in current list
      navigation.navigate('ProductList', {
        category: categoryName,
        title: categoryName,
      });
    }
  }, [hideSuggestions, categories, navigation]);

  // Handle fill search (arrow button in suggestions)
  const handleFillSearch = useCallback((text) => {
    fillSearch(text);
  }, [fillSearch]);

  // Handle remove recent search item
  const handleRemoveRecentSearch = useCallback((searchTerm) => {
    removeRecentSearch(searchTerm);
  }, [removeRecentSearch]);

  // Navigate to cart
  const handleGoToCart = useCallback(() => {
    navigation.navigate('Cart');
  }, [navigation]);

  // ============================================================
  // SIDEBAR CATEGORY - Compact Circular Image
  // ============================================================
  const renderCategory = ({ item }) => {
    const isSelected = selectedCategory?._id === item._id;
    const localImage = getCategoryLocalImage(item.name);
    const apiImage = item.image ? getImageUrl(item.image) : null;

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isSelected && styles.categoryItemActive,
        ]}
        onPress={() => setSelectedCategory(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.categoryCircle,
            isSelected && styles.categoryCircleActive,
          ]}
        >
          {localImage ? (
            <Image
              source={localImage}
              style={styles.categoryImage}
              resizeMode="cover"
            />
          ) : apiImage ? (
            <Image
              source={{ uri: apiImage }}
              style={styles.categoryImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.categoryIconFallback}>
              <Ionicons
                name="cube-outline"
                size={20}
                color={isSelected ? COLORS.primary : COLORS.gray}
              />
            </View>
          )}
        </View>

        <Text
          style={[
            styles.categoryLabel,
            isSelected && styles.categoryLabelActive,
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // ============================================================
  // SEARCH + SORT BAR WITH SUGGESTIONS
  // ============================================================
  const renderTopBar = () => (
    <View style={styles.topBarWrapper}>
      <View style={styles.topBar}>
        {/* Search Box with Suggestions */}
        <View style={styles.searchBoxWrapper}>
          <View style={styles.topSearchBox}>
            <Ionicons name="search" size={16} color={COLORS.gray} />
            <TextInput
              style={styles.topSearchInput}
              placeholder="Search in category"
              placeholderTextColor="#BBB"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={openSuggestions}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={16} color={COLORS.gray} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Suggestions Dropdown */}
          <SearchSuggestions
            suggestions={suggestions}
            query={searchQuery}
            isLoading={isLoadingSuggestions}
            recentSearches={recentSearches}
            trendingSearches={trendingSearches}
            visible={showSuggestions}
            onSelectSuggestion={handleSelectSuggestion}
            onSelectProduct={handleSelectProductSuggestion}
            onSelectCategory={handleSelectCategorySuggestion}
            onClearRecent={clearRecentSearches}
            onRemoveRecentItem={handleRemoveRecentSearch}
            onFillSearch={handleFillSearch}
          />
        </View>

        {/* Sort Button */}
        <TouchableOpacity
          style={[styles.sortButton, sortOrder && styles.sortButtonActive]}
          onPress={handleSortPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="swap-vertical"
            size={16}
            color={sortOrder ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.sortText, sortOrder && styles.sortTextActive]}>
            {sortOrder === 'low'
              ? 'Low'
              : sortOrder === 'high'
              ? 'High'
              : 'Sort'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ============================================================
  // COMPACT PRODUCT CARD
  // ============================================================
  const renderProduct = ({ item, index }) => {
    const quantity = getItemQuantity(item._id);
    const discount = calculateDiscount(item.compareAtPrice, item.price);
    const imageUrl = item.images?.[0] ? getImageUrl(item.images[0]) : null;

    return (
      <TouchableOpacity
        style={[
          styles.productCard,
          index % 2 === 0 ? styles.leftCard : styles.rightCard,
        ]}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.8}
      >
        {/* Image */}
        <View style={styles.productImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={24} color="#D0D0D0" />
            </View>
          )}

          {/* Yellow Sale Badge */}
          {discount > 0 && (
            <View style={styles.saleBadge}>
              <Text style={styles.saleText}>Sale</Text>
            </View>
          )}

          {/* Out of Stock */}
          {!item.inStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.productContent}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.productPriceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>
                {formatCurrency(item.price)}
              </Text>
              {item.compareAtPrice > item.price && (
                <Text style={styles.productComparePrice}>
                  {formatCurrency(item.compareAtPrice)}
                </Text>
              )}
            </View>

            {item.inStock && (
              <TouchableOpacity
                style={[
                  styles.addButton,
                  quantity > 0 && styles.addButtonActive,
                ]}
                onPress={() => handleAddToCart(item)}
              >
                {quantity > 0 ? (
                  <Text style={styles.addButtonQuantity}>{quantity}</Text>
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
  // FLOATING CART BUTTON
  // ============================================================
  const renderFloatingCart = () => {
    if (totalItems === 0) return null;

    return (
      <TouchableOpacity
        style={styles.floatingCartButton}
        onPress={handleGoToCart}
        activeOpacity={0.8}
      >
        <Ionicons name="cart" size={24} color={COLORS.black} />
        <View style={styles.floatingCartBadge}>
          <Text style={styles.floatingCartBadgeText}>
            {totalItems > 99 ? '99+' : totalItems}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoading) {
    return (
      <Screen backgroundColor={COLORS.white}>
        <Loading fullScreen message="Loading categories..." />
      </Screen>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <Screen backgroundColor={COLORS.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebarContent}
          />
        </View>

        {/* Divider between sidebar and products */}
        <View style={styles.sidebarDivider} />

        {/* Products Area */}
        <View style={styles.productsContainer}>
          {renderTopBar()}

          {/* Divider below search */}
          <View style={styles.divider} />

          {/* Count Bar */}
          <View style={styles.countBar}>
            <Text style={styles.countText}>
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? 's' : ''}
              {searchQuery && !showSuggestions ? ` for "${searchQuery}"` : ''}
            </Text>
            {selectedCategory && (
              <Text style={styles.categoryBreadcrumb}>
                {selectedCategory.name}
              </Text>
            )}
          </View>

          {/* Products Grid */}
          {isLoadingProducts ? (
            <Loading message="Loading..." />
          ) : (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              contentContainerStyle={styles.productsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={hideSuggestions}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="search-outline"
                    size={36}
                    color="#D0D0D0"
                  />
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? 'No results found' : 'No products'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery
                      ? 'Try a different search term'
                      : 'No products in this category yet'}
                  </Text>
                  {searchQuery && (
                    <TouchableOpacity 
                      style={styles.clearSearchButton}
                      onPress={clearSearch}
                    >
                      <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          )}
        </View>
      </View>

      {/* Floating Cart Button */}
      {renderFloatingCart()}
    </Screen>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  // ============================================================
  // HEADER - Clean white, no border
  // ============================================================
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerRight: {
    width: 36,
  },

  // ============================================================
  // LAYOUT
  // ============================================================
  content: {
    flex: 1,
    flexDirection: 'row',
  },

  // ============================================================
  // SIDEBAR - Compact
  // ============================================================
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: COLORS.white,
  },
  sidebarContent: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.tabBarHeight + SPACING.xl,
  },
  sidebarDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },

  // Category Item - Compact Circular
  categoryItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  categoryItemActive: {
    backgroundColor: COLORS.primaryLight + '15',
  },
  categoryCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  categoryCircleActive: {
    borderColor: COLORS.primary,
  },
  categoryImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  categoryIconFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 12,
    fontWeight: '500',
    paddingHorizontal: 2,
  },
  categoryLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // ============================================================
  // TOP BAR - Search + Sort with Suggestions
  // ============================================================
  topBarWrapper: {
    zIndex: 1000,
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: PRODUCT_GAP,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    gap: 8,
    backgroundColor: COLORS.white,
  },
  searchBoxWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
  },
  topSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 40,
  },
  topSearchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 40,
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primaryLight + '25',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  sortText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sortTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: PRODUCT_GAP,
  },

  // ============================================================
  // COUNT BAR
  // ============================================================
  countBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PRODUCT_GAP,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 12,
    color: '#777',
    fontWeight: '500',
    flex: 1,
  },
  categoryBreadcrumb: {
    fontSize: 12,
    color: '#E6B800',
    fontWeight: '600',
  },

  // ============================================================
  // PRODUCTS AREA - White background
  // ============================================================
  productsContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  productsList: {
    paddingHorizontal: PRODUCT_GAP,
    paddingBottom: SPACING.tabBarHeight + SPACING.xl,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: PRODUCT_GAP,
  },

  // ============================================================
  // COMPACT PRODUCT CARD
  // ============================================================
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  leftCard: {
    marginRight: PRODUCT_GAP / 2,
  },
  rightCard: {
    marginLeft: PRODUCT_GAP / 2,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 🎯 YELLOW Sale Badge
  saleBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#FFD600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  saleText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },

  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },

  // Compact content
  productContent: {
    padding: 8,
  },
  productTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 14,
    height: 28,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flex: 1,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  productComparePrice: {
    fontSize: 10,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },

  // Compact add button
  addButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonActive: {
    backgroundColor: '#0D9488',
  },
  addButtonQuantity: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '700',
  },

  // ============================================================
  // EMPTY STATE
  // ============================================================
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl * 2,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  clearSearchButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
  },

  // ============================================================
  // FLOATING CART BUTTON
  // ============================================================
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
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    zIndex: 100,
  },
  floatingCartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  floatingCartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },
});

export default CategoriesScreen;