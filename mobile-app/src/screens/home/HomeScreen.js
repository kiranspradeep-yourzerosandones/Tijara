// src/screens/home/HomeScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Keyboard,
  Linking,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { Screen } from '../../components/common';
import { HomeScreenSkeleton } from '../../components/common/Skeleton';
import Toast from '../../components/common/Toast';
import useToast from '../../hooks/useToast';
import SearchSuggestions from '../../components/search/SearchSuggestions';
import TijaraLogo from '../../components/common/TijaraLogo';
import { productsAPI, bannersAPI, authAPI } from '../../api';
import { useAuthStore, useCartStore, useNotificationStore } from '../../store';
import { useSearch } from '../../hooks';
import { getImageUrl, formatCurrency, calculateDiscount } from '../../utils/helpers';
import { fetchWithCache, invalidateCacheByPrefix } from '../../utils/apiCache';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BANNER_SIDE_PADDING  = 16;
const BANNER_CARD_GAP      = 10;
const BANNER_CARD_WIDTH    = SCREEN_WIDTH - BANNER_SIDE_PADDING * 2;
const BANNER_CARD_HEIGHT   = 160;
const BANNER_SNAP_INTERVAL = BANNER_CARD_WIDTH + BANNER_CARD_GAP;

const CATEGORY_HEIGHT    = 114;
const PRODUCT_GAP        = 10;

// ✅ Always 3 columns
const COLS               = 3;
const PRODUCT_CARD_WIDTH = Math.floor(
  (SCREEN_WIDTH - SPACING.screenPadding * 2 - PRODUCT_GAP * (COLS - 1)) / COLS
);;

const PRODUCTS_CACHE_TTL   = 5 * 60 * 1000;
const CATEGORIES_CACHE_TTL = 30 * 60 * 1000;
const BANNERS_CACHE_TTL    = 10 * 60 * 1000;

// ✅ How many preferred products to show (must be multiple of 3)
const MAX_PREFERRED_PRODUCTS = 9; // 3 rows × 3 cols

const FALLBACK_BANNER = {
  _id:             'fallback',
  title:           'Welcome to Tijara',
  subtitle:        'Explore our wide range of industrial products',
  backgroundColor: '#2D5A27',
  image:           null,
  actionType:      'none',
};

const CATEGORY_FALLBACK_IMAGE = require('../../../assets/wax.jpg');

const DEFAULT_CATEGORIES = [
  { _id: 'wax',       name: 'Wax Products'     },
  { _id: 'chemicals', name: 'Chemical Products' },
];

// ─────────────────────────────────────────────────────────────
// ── Industry Selector Modal ───────────────────────────────────
// ─────────────────────────────────────────────────────────────
function IndustryModal({ visible, categories, selectedCategoryName, onSelect, onClose, saving }) {
  const slideAnim     = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const allCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, friction: 10, tension: 60,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Animated.View
          style={[modalStyles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>

            <View style={modalStyles.handleBar} />

            {/* Header */}
            <View style={modalStyles.header}>
              <View style={modalStyles.headerLeft}>
                <View style={modalStyles.headerIconBg}>
                  <Ionicons name="business" size={18} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={modalStyles.headerTitle}>Industries We Serve</Text>
                  <Text style={modalStyles.headerSub}>
                    Select your industry for personalised products
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={modalStyles.divider} />

            {/* All Industries option */}
            <TouchableOpacity
              style={[modalStyles.item, !selectedCategoryName && modalStyles.itemSelected]}
              onPress={() => onSelect(null)}
              activeOpacity={0.7}
            >
              <View style={[modalStyles.itemThumb, modalStyles.clearThumb]}>
                <Ionicons
                  name="apps-outline"
                  size={20}
                  color={!selectedCategoryName ? COLORS.primary : COLORS.gray}
                />
              </View>
              <View style={modalStyles.itemContent}>
                <Text style={[modalStyles.itemName, !selectedCategoryName && modalStyles.itemNameSelected]}>
                  All Industries
                </Text>
                <Text style={modalStyles.itemDesc}>Show products from all categories</Text>
              </View>
              {!selectedCategoryName && (
                <View style={modalStyles.checkCircle}>
                  <Ionicons name="checkmark" size={14} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>

            <View style={modalStyles.divider} />

            {/* Category list */}
            <FlatList
              data={allCategories}
              keyExtractor={(item) => item._id}
              style={modalStyles.list}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: SPACING.xl }}
              renderItem={({ item, index }) => {
                const isSelected  = item.name === selectedCategoryName;
                const imageSource = item.image
                  ? { uri: getImageUrl(item.image) }
                  : CATEGORY_FALLBACK_IMAGE;
                const isLast = index === allCategories.length - 1;

                return (
                  <TouchableOpacity
                    style={[
                      modalStyles.item,
                      isSelected && modalStyles.itemSelected,
                      !isLast && modalStyles.itemBorder,
                    ]}
                    onPress={() => onSelect(item)}
                    activeOpacity={0.7}
                  >
                    <View style={modalStyles.itemThumb}>
                      <Image source={imageSource} style={modalStyles.itemThumbImg} resizeMode="cover" />
                    </View>
                    <View style={modalStyles.itemContent}>
                      <Text style={[modalStyles.itemName, isSelected && modalStyles.itemNameSelected]}>
                        {item.name}
                      </Text>
                      <Text style={modalStyles.itemDesc}>
                        {item.slug ? `/${item.slug}` : 'Browse products'}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View style={modalStyles.checkCircle}>
                        <Ionicons name="checkmark" size={14} color={COLORS.white} />
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={COLORS.lightGray} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            {saving && (
              <View style={modalStyles.savingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={modalStyles.savingText}>Saving preference…</Text>
              </View>
            )}

          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor:      COLORS.white,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    maxHeight:            SCREEN_HEIGHT * 0.75,
    shadowColor:          '#000',
    shadowOffset:         { width: 0, height: -4 },
    shadowOpacity:        0.12,
    shadowRadius:         16,
    elevation:            20,
  },
  handleBar: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding, paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1,
  },
  headerIconBg: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.black },
  headerSub:   { fontSize: 12, color: COLORS.black, marginTop: 1 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: COLORS.borderLight },
  list:    { maxHeight: SCREEN_HEIGHT * 0.45 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: SPACING.screenPadding,
    gap: 14, backgroundColor: COLORS.white,
  },
  itemSelected: { backgroundColor: COLORS.primary + '0A' },
  itemBorder:   { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  itemThumb: {
    width: 48, height: 48, borderRadius: 12,
    overflow: 'hidden', backgroundColor: '#F5F5F5', flexShrink: 0,
  },
  clearThumb: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
  },
  itemThumbImg:     { width: '100%', height: '100%' },
  itemContent:      { flex: 1 },
  itemName:         { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  itemNameSelected: { color: COLORS.primary },
  itemDesc:         { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  savingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.sm, gap: 8,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  savingText: { fontSize: 13, color: COLORS.textSecondary },
});

// ─────────────────────────────────────────────────────────────
// ── Main Screen ───────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const [products,           setProducts]           = useState([]);
  const [categories,         setCategories]         = useState([]);
  const [banners,            setBanners]            = useState([]);
  const [isLoading,          setIsLoading]          = useState(true);
  const [isRefreshing,       setIsRefreshing]       = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [preferredProducts,  setPreferredProducts]  = useState([]);
  const [isLoadingPreferred, setIsLoadingPreferred] = useState(false);
  const [savingPreference,   setSavingPreference]   = useState(false);
  const [showIndustryModal,  setShowIndustryModal]  = useState(false);

  const bannerListRef   = useRef(null);
  const autoPlayRef     = useRef(null);
  const isUserScrolling = useRef(false);
  const scrollXNative   = useRef(new Animated.Value(0)).current;
  const scrollXJS       = useRef(new Animated.Value(0)).current;
  const floatingCartScale = useRef(new Animated.Value(0)).current;
  const addingRef         = useRef({});

  const { toast, showToast } = useToast();

  const user                 = useAuthStore((s) => s.user);
  const setPreferredCategory = useAuthStore((s) => s.setPreferredCategory);
  const preferredCategory    = useAuthStore((s) => s.preferredCategory);

  const addToCart       = useCartStore((s) => s.addToCart);
  const getItemQuantity = useCartStore((s) => s.getItemQuantity);
  const fetchCart       = useCartStore((s) => s.fetchCart);
  const totalItems      = useCartStore((s) => s.totalItems);
  const cartItems       = useCartStore((s) => s.items);

  const { fetchUnreadCount } = useNotificationStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const {
    query: searchQuery,
    suggestions,
    filteredProducts,
    isSearching,
    isLoadingSuggestions,
    showSuggestions,
    recentSearches,
    trendingSearches,
    setQuery:          setSearchQuery,
    fillSearch,
    clearSearch,
    hideSuggestions,
    openSuggestions,
    selectSuggestion,
    addToRecentSearches,
    removeRecentSearch,
    clearRecentSearches,
  } = useSearch({
    debounceMs: 300, minQueryLength: 2, maxSuggestions: 8,
    enableBackendSearch: true, localProducts: products, categories,
  });

  const displayBanners = banners.length > 0 ? banners : [FALLBACK_BANNER];

  useEffect(() => {
    Animated.spring(floatingCartScale, {
      toValue: totalItems > 0 ? 1 : 0,
      useNativeDriver: true, friction: 6, tension: 40,
    }).start();
  }, [totalItems]);

  useEffect(() => {
    setCurrentBannerIndex(0);
    bannerListRef.current?.scrollToOffset({ offset: 0, animated: false });
    scrollXNative.setValue(0);
    scrollXJS.setValue(0);
  }, [banners.length]);

  useFocusEffect(
    useCallback(() => {
      if (displayBanners.length <= 1) return;
      autoPlayRef.current = setInterval(() => {
        if (isUserScrolling.current) return;
        setCurrentBannerIndex((prev) => {
          const next   = (prev + 1) % displayBanners.length;
          const offset = next * BANNER_SNAP_INTERVAL;
          bannerListRef.current?.scrollToOffset({ offset, animated: true });
          scrollXJS.setValue(offset);
          return next;
        });
      }, 4000);
      return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
    }, [displayBanners.length, scrollXJS])
  );

  useEffect(() => { loadInitialData(); }, []);

  useEffect(() => {
    if (preferredCategory) {
      loadPreferredProducts(preferredCategory);
    } else {
      setPreferredProducts([]);
    }
  }, [preferredCategory]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadProducts(), loadCategories(), loadBanners(),
        cartItems.length === 0 ? fetchCart() : Promise.resolve(),
        fetchUnreadCount(),
      ]);
    } catch {} finally { setIsLoading(false); }
  };

  const loadProducts = async () => {
    try {
      const r = await fetchWithCache(
        'products:all',
        () => productsAPI.getProducts({ limit: 50 }),
        PRODUCTS_CACHE_TTL
      );
      setProducts(r.data?.products || []);
    } catch {}
  };

  const loadCategories = async () => {
    try {
      const r = await fetchWithCache(
        'categories:all',
        () => productsAPI.getCategories(),
        CATEGORIES_CACHE_TTL
      );
      const cats = (r.categories || []).filter((c) => c.isActive !== false);
      setCategories(cats);
    } catch {}
  };

  const loadBanners = async () => {
    try {
      const r = await fetchWithCache(
        'banners:active',
        () => bannersAPI.getActiveBanners(),
        BANNERS_CACHE_TTL
      );
      setBanners(r.banners || []);
    } catch {}
  };

  const loadPreferredProducts = async (categoryName) => {
    setIsLoadingPreferred(true);
    try {
      const r = await fetchWithCache(
        `products:category:${categoryName}`,
        // ✅ Fetch more so user has multiple rows to see
        () => productsAPI.getProducts({ category: categoryName, limit: 50 }),
        PRODUCTS_CACHE_TTL
      );
      setPreferredProducts(r.data?.products || []);
    } catch {
      setPreferredProducts([]);
    } finally {
      setIsLoadingPreferred(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      invalidateCacheByPrefix('products:');
      invalidateCacheByPrefix('categories:');
      invalidateCacheByPrefix('banners:');
      await loadInitialData();
      if (preferredCategory) await loadPreferredProducts(preferredCategory);
    } catch {} finally { setIsRefreshing(false); }
  };

  const handleIndustrySelect = useCallback(async (category) => {
    const newCategoryName = category?.name || null;
    setShowIndustryModal(false);
    setPreferredCategory(newCategoryName);
    setSavingPreference(true);
    try {
      await authAPI.updatePreferredCategory(newCategoryName);
      showToast(
        newCategoryName ? `Industry set to "${newCategoryName}"` : 'Industry preference cleared',
        'success'
      );
    } catch (err) {
      setPreferredCategory(preferredCategory);
      showToast(`Failed: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setSavingPreference(false);
    }
  }, [preferredCategory, setPreferredCategory, showToast]);

  const handleBannerPress = useCallback((banner) => {
    if (!banner || banner.actionType === 'none') return;
    switch (banner.actionType) {
      case 'product': {
        const product = banner.actionProductId;
        if (product) navigation.navigate('ProductDetail', { product });
        break;
      }
      case 'category':
        if (banner.actionCategory)
          navigation.navigate('ProductList', { category: banner.actionCategory, title: banner.actionCategory });
        break;
      case 'screen':
        if (banner.actionScreen) navigation.navigate(banner.actionScreen);
        break;
      case 'url':
        if (banner.actionUrl)
          Linking.openURL(banner.actionUrl).catch(() => showToast('Could not open link', 'error'));
        break;
    }
  }, [navigation, showToast]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      hideSuggestions();
      Keyboard.dismiss();
      addToRecentSearches(searchQuery.trim());
      navigation.navigate('ProductList', { searchQuery: searchQuery.trim(), title: `Search: ${searchQuery.trim()}` });
    }
  }, [searchQuery, hideSuggestions, addToRecentSearches, navigation]);

  const handleProductPress = useCallback((product) => {
    hideSuggestions();
    Keyboard.dismiss();
    navigation.navigate('ProductDetail', { product });
  }, [hideSuggestions, navigation]);

  const handleViewAllProducts     = useCallback(() => navigation.navigate('ProductList', { title: 'All Products' }), [navigation]);
  const handleViewAllPreferred    = useCallback(() => navigation.navigate('ProductList', { category: preferredCategory, title: preferredCategory }), [navigation, preferredCategory]);
  const handleViewAllSearchResults = useCallback(() => {
    hideSuggestions();
    Keyboard.dismiss();
    navigation.navigate('ProductList', { searchQuery: searchQuery.trim(), title: `Search: ${searchQuery.trim()}` });
  }, [hideSuggestions, searchQuery, navigation]);

  const handleCategoryPress = useCallback((category) => {
    hideSuggestions();
    Keyboard.dismiss();
    navigation.navigate('ProductList', {
      category: typeof category === 'string' ? category : category.name,
      title:    typeof category === 'string' ? category : category.name,
    });
  }, [hideSuggestions, navigation]);

  const handleGoToCart = useCallback(() => navigation.navigate('Cart'), [navigation]);

  const handleAddToCart = useCallback(async (product) => {
    if (addingRef.current[product._id]) return;
    addingRef.current[product._id] = true;
    try {
      await addToCart(product._id, 1);
      showToast(`${product.title} added to cart`, 'cart');
    } catch (error) {
      showToast(error.message || 'Failed to add to cart', 'error');
    } finally {
      addingRef.current[product._id] = false;
    }
  }, [addToCart, showToast]);

  const handleSelectSuggestion = useCallback((suggestion) => {
    if (typeof suggestion === 'string') {
      setSearchQuery(suggestion);
      addToRecentSearches(suggestion);
      hideSuggestions();
      Keyboard.dismiss();
      navigation.navigate('ProductList', { searchQuery: suggestion, title: `Search: ${suggestion}` });
    } else {
      selectSuggestion(suggestion);
    }
  }, [setSearchQuery, addToRecentSearches, hideSuggestions, selectSuggestion, navigation]);

  const handleSelectProductSuggestion  = useCallback((product) => { hideSuggestions(); Keyboard.dismiss(); handleProductPress(product); }, [hideSuggestions, handleProductPress]);
  const handleSelectCategorySuggestion = useCallback((name) => { hideSuggestions(); Keyboard.dismiss(); handleCategoryPress(name); }, [hideSuggestions, handleCategoryPress]);
  const handleFillSearch   = useCallback((text) => fillSearch(text), [fillSearch]);
  const handleRemoveRecent = useCallback((term) => removeRecentSearch(term), [removeRecentSearch]);

  const handleDotPress = useCallback((index) => {
    const offset = index * BANNER_SNAP_INTERVAL;
    bannerListRef.current?.scrollToOffset({ offset, animated: true });
    scrollXJS.setValue(offset);
    setCurrentBannerIndex(index);
  }, [scrollXJS]);

  // ─────────────────────────────────────────────────────────
  // RENDERS
  // ─────────────────────────────────────────────────────────

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

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={[styles.industryPill, preferredCategory && styles.industryPillActive]}
          onPress={() => setShowIndustryModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="business-outline"
            size={12}
            color={preferredCategory ? COLORS.black : COLORS.textSecondary}
          />
          <Text
            style={[styles.industryPillText, preferredCategory && styles.industryPillTextActive]}
            numberOfLines={1}
          >
            {preferredCategory || 'Industries We Serve'}
          </Text>
          <Ionicons
            name="chevron-down"
            size={10}
            color={preferredCategory ? COLORS.black : COLORS.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchWrapper}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your products"
          placeholderTextColor={COLORS.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          onFocus={openSuggestions}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>
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
        onRemoveRecentItem={handleRemoveRecent}
        onFillSearch={handleFillSearch}
      />
    </View>
  );

  const renderSearchHeader = () => {
    if (!isSearching || showSuggestions) return null;
    return (
      <View style={styles.searchResultsHeader}>
        <View style={styles.searchResultsInfo}>
          <Ionicons name="search" size={16} color={COLORS.textSecondary} />
          <Text style={styles.searchResultsText}>
            {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for "{searchQuery}"
          </Text>
        </View>
        <TouchableOpacity onPress={clearSearch}>
          <Text style={styles.clearSearchText}>Clear</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBannerCard = useCallback(({ item: banner, index }) => {
    const hasImage     = !!banner.image;
    const isActionable = banner.actionType && banner.actionType !== 'none';

    const actionLabel = (() => {
      switch (banner.actionType) {
        case 'product':  return 'View Product';
        case 'category': return 'Browse';
        case 'screen':   return 'Go';
        case 'url':      return 'Learn More';
        default:         return null;
      }
    })();

    const inputRange = [
      (index - 1) * BANNER_SNAP_INTERVAL,
      index       * BANNER_SNAP_INTERVAL,
      (index + 1) * BANNER_SNAP_INTERVAL,
    ];
    const animatedScale   = scrollXNative.interpolate({ inputRange, outputRange: [0.94, 1, 0.94], extrapolate: 'clamp' });
    const animatedOpacity = scrollXNative.interpolate({ inputRange, outputRange: [0.7, 1, 0.7],   extrapolate: 'clamp' });

    const cardContent = (
      <>
        {hasImage && <View style={styles.bannerImageOverlay} />}
        {!hasImage && (
          <View style={styles.bannerPattern}>
            <View style={[styles.patternCircle, styles.patternCircle1]} />
            <View style={[styles.patternCircle, styles.patternCircle2]} />
          </View>
        )}
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextSection}>
            <Text style={styles.bannerTitle} numberOfLines={1}>{banner.title}</Text>
            {!!banner.subtitle && (
              <Text style={styles.bannerSubtitle} numberOfLines={2}>{banner.subtitle}</Text>
            )}
            {isActionable && actionLabel && (
              <View style={styles.shopNowButton}>
                <Text style={styles.shopNowText}>{actionLabel}</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.black} />
              </View>
            )}
          </View>
          {!hasImage && (
            <View style={styles.bannerImageSection}>
              <View style={styles.bannerIconContainer}>
                <Ionicons name="cube" size={40} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
          )}
        </View>
      </>
    );

    const cardInner = hasImage ? (
      <ImageBackground
        source={{ uri: getImageUrl(banner.image) }}
        style={styles.bannerCardInner}
        imageStyle={styles.bannerCardImageStyle}
        resizeMode="cover"
      >{cardContent}</ImageBackground>
    ) : (
      <View style={[styles.bannerCardInner, { backgroundColor: banner.backgroundColor || '#2D5A27' }]}>
        {cardContent}
      </View>
    );

    return (
      <Animated.View style={[styles.bannerCardOuter, { transform: [{ scale: animatedScale }], opacity: animatedOpacity }]}>
        <TouchableOpacity
          activeOpacity={isActionable ? 0.9 : 1}
          onPress={() => handleBannerPress(banner)}
          style={styles.bannerCardTouchable}
        >
          {cardInner}
        </TouchableOpacity>
      </Animated.View>
    );
  }, [scrollXNative, handleBannerPress]);

  const renderBanner = () => {
    if (isSearching) return null;
    return (
      <View style={styles.bannerWrapper}>
        <Animated.FlatList
          ref={bannerListRef}
          data={displayBanners}
          keyExtractor={(item) => item._id}
          renderItem={renderBannerCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={BANNER_SNAP_INTERVAL}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.bannerListContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollXNative } } }],
            { useNativeDriver: true, listener: (e) => scrollXJS.setValue(e.nativeEvent.contentOffset.x) }
          )}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => { isUserScrolling.current = true; }}
          onMomentumScrollEnd={(e) => {
            const page = Math.round(e.nativeEvent.contentOffset.x / BANNER_SNAP_INTERVAL);
            setCurrentBannerIndex(Math.max(0, Math.min(page, displayBanners.length - 1)));
            setTimeout(() => { isUserScrolling.current = false; }, 6000);
          }}
          getItemLayout={(_, index) => ({ length: BANNER_SNAP_INTERVAL, offset: BANNER_SNAP_INTERVAL * index, index })}
        />
        {displayBanners.length > 1 && (
          <View style={styles.dotsContainer}>
            {displayBanners.map((_, index) => {
              const inputRange = [
                (index - 1) * BANNER_SNAP_INTERVAL,
                index       * BANNER_SNAP_INTERVAL,
                (index + 1) * BANNER_SNAP_INTERVAL,
              ];
              const dotWidth   = scrollXJS.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
              const dotOpacity = scrollXJS.interpolate({ inputRange, outputRange: [0.35, 1, 0.35], extrapolate: 'clamp' });
              return (
                <TouchableOpacity key={index} onPress={() => handleDotPress(index)} style={styles.dotTouchable} activeOpacity={0.7}>
                  <Animated.View style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderCategories = () => {
    if (isSearching) return null;
    const allCategories  = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    const homeCategories = allCategories.slice(0, 2);
    const hasMore        = allCategories.length > 2;

    return (
      <View style={styles.categoriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Categories')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>
              {hasMore ? `See all (${allCategories.length}) →` : 'See all →'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoryGrid}>
          {homeCategories.map((category) => {
            const imageSource = category.image
              ? { uri: getImageUrl(category.image) }
              : CATEGORY_FALLBACK_IMAGE;
            return (
              <TouchableOpacity
                key={category._id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.8}
              >
                <ImageBackground
                  source={imageSource}
                  style={styles.categoryImage}
                  imageStyle={styles.categoryImageStyle}
                  defaultSource={CATEGORY_FALLBACK_IMAGE}
                >
                  <View style={styles.categoryOverlay}>
                    <Text style={styles.categoryText} numberOfLines={2}>{category.name}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };


const renderCompactProductCard = (product, index) => {
  const quantity = getItemQuantity(product._id);
  const discount = calculateDiscount(product.compareAtPrice, product.price);
  const imageUrl = product.images?.[0] ? getImageUrl(product.images[0]) : null;

  // ✅ Symmetric left+right margins so 3 cards always fit exactly
  const col         = index % COLS;
  const marginLeft  = col === 0 ? 0 : PRODUCT_GAP / 2;
  const marginRight = col === COLS - 1 ? 0 : PRODUCT_GAP / 2;

  return (
    <TouchableOpacity
      key={product._id}
      style={[
        styles.compactProductCard,
        { marginLeft, marginRight },
      ]}
      onPress={() => handleProductPress(product)}
      activeOpacity={0.8}
    >
        <View style={styles.compactImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.compactImage} resizeMode="cover" />
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
          <Text style={styles.compactTitle} numberOfLines={2}>{product.title}</Text>
          <View style={styles.compactPriceRow}>
            <Text style={styles.compactPrice}>{formatCurrency(product.price)}</Text>
            {product.inStock && (
              <TouchableOpacity
                style={[styles.compactAddButton, quantity > 0 && styles.compactAddButtonActive]}
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

  // ── Preferred products ─────────────────────────────────────
  const renderPreferredProducts = () => {
    if (isSearching || !preferredCategory) return null;

    // ✅ Show MAX_PREFERRED_PRODUCTS (multiple of 3 = always complete rows)
    const displayPreferred = preferredProducts.slice(0, MAX_PREFERRED_PRODUCTS);

    return (
      <View style={styles.preferredSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.preferredTitleRow}>
            <View style={styles.preferredAccentBar} />
            <View>
              <Text style={styles.sectionTitle}>Products of Your Choice</Text>
              <Text style={styles.preferredSubtitle}>{preferredCategory}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleViewAllPreferred} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>See all →</Text>
          </TouchableOpacity>
        </View>

        {isLoadingPreferred ? (
          <View style={styles.preferredLoader}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.preferredLoaderText}>Loading products…</Text>
          </View>
        ) : preferredProducts.length === 0 ? (
          <View style={styles.preferredEmpty}>
            <Ionicons name="cube-outline" size={32} color={COLORS.gray} />
            <Text style={styles.preferredEmptyText}>
              No products in {preferredCategory} yet
            </Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {displayPreferred.map((product, index) =>
              renderCompactProductCard(product, index)
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.changeIndustryBtn}
          onPress={() => setShowIndustryModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-horizontal" size={13} color={COLORS.primary} />
          <Text style={styles.changeIndustryText}>Change industry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProducts = () => {
    const displayProducts = isSearching ? filteredProducts : products;
    const maxProducts     = isSearching ? 12 : 9;
    const sectionTitle    = isSearching ? 'Search Results' : 'Our Products';

    return (
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          {!isSearching && (
            <TouchableOpacity onPress={handleViewAllProducts}>
              <Text style={styles.seeAllText}>See all →</Text>
            </TouchableOpacity>
          )}
          {isSearching && filteredProducts.length > maxProducts && (
            <TouchableOpacity onPress={handleViewAllSearchResults}>
              <Text style={styles.seeAllText}>View all →</Text>
            </TouchableOpacity>
          )}
        </View>

        {isSearching && filteredProducts.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.gray} />
            <Text style={styles.noResultsTitle}>No products found</Text>
            <Text style={styles.noResultsText}>Try searching with different keywords</Text>
            <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
              <Text style={styles.clearSearchButtonText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {displayProducts.length > 0 && (
          <View style={styles.productsGrid}>
            {displayProducts
              .slice(0, maxProducts)
              .map((product, index) => renderCompactProductCard(product, index))}
          </View>
        )}

        {!isSearching && products.length > 9 && (
          <TouchableOpacity style={styles.viewMoreButton} onPress={handleViewAllProducts}>
            <Text style={styles.viewMoreText}>View More Products</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {isSearching && filteredProducts.length > maxProducts && (
          <TouchableOpacity style={styles.viewMoreButton} onPress={handleViewAllSearchResults}>
            <Text style={styles.viewMoreText}>View All {filteredProducts.length} Results</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFloatingCart = () => {
    if (totalItems === 0) return null;
    return (
      <Animated.View
        style={[
          styles.floatingCartContainer,
          { transform: [{ scale: floatingCartScale }], opacity: floatingCartScale },
        ]}
      >
        <TouchableOpacity style={styles.floatingCartButton} onPress={handleGoToCart} activeOpacity={0.8}>
          <Ionicons name="cart" size={24} color={COLORS.black} />
          <View style={styles.floatingCartBadge}>
            <Text style={styles.floatingCartBadgeText}>
              {totalItems > 99 ? '99+' : totalItems}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <Screen backgroundColor={COLORS.backgroundLight}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderHeader()}
          <HomeScreenSkeleton />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={COLORS.backgroundLight}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={hideSuggestions}
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
        {renderSearchHeader()}
        {renderBanner()}
        {renderCategories()}
        {renderPreferredProducts()}
        {renderProducts()}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {renderFloatingCart()}

      <IndustryModal
        visible={showIndustryModal}
        categories={categories}
        selectedCategoryName={preferredCategory}
        onSelect={handleIndustrySelect}
        onClose={() => setShowIndustryModal(false)}
        saving={savingPreference}
      />

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </Screen>
  );
};

// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scrollView: { flex: 1 },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: SPACING.sm, paddingBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0,
  },
  logoContainer: {
    width: 40, height: 40, backgroundColor: COLORS.white,
    borderRadius: 10, marginRight: SPACING.sm,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, flexShrink: 0,
  },
  headerTextContainer: { flex: 1, minWidth: 0 },
  welcomeText:         { fontSize: 12, color: COLORS.gray },
  userName:            { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600', flexShrink: 1 },
  headerRight:         { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 },

  // ── Industry pill ─────────────────────────────────────────
  industryPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 10,
    gap: 3, maxWidth: 170, borderWidth: 1, borderColor: 'transparent',
  },
  industryPillActive: {
    backgroundColor: '#F0F0F0',
    borderColor: COLORS.black + '30',
  },
  industryPillText:       { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, flexShrink: 1 },
  industryPillTextActive: { color: COLORS.black },

  notificationButton: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  notificationBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.error,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: COLORS.white,
  },
  notificationBadgeText: { fontSize: 9, fontWeight: '700', color: COLORS.white },

  // ── Search ────────────────────────────────────────────────
  searchWrapper: {
    marginHorizontal: SPACING.screenPadding, marginBottom: SPACING.md,
    zIndex: 1000, elevation: 1000,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, height: 44,
    backgroundColor: '#F5F5F5', borderRadius: 12,
  },
  searchInput:  { flex: 1, fontSize: 14, color: COLORS.textPrimary, marginLeft: SPACING.sm },
  clearButton:  { padding: 4 },

  searchResultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card, marginHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.md, borderRadius: 8,
  },
  searchResultsInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchResultsText: { fontSize: 13, color: COLORS.textSecondary },
  clearSearchText:   { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  noResultsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxxl },
  noResultsTitle:     { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginTop: SPACING.md },
  noResultsText:      { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.xs, textAlign: 'center' },
  clearSearchButton: {
    marginTop: SPACING.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary, borderRadius: 20,
  },
  clearSearchButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.black },

  // ── Banner ────────────────────────────────────────────────
  bannerWrapper:     { marginBottom: SPACING.lg },
  bannerListContent: { paddingHorizontal: BANNER_SIDE_PADDING },
  bannerCardOuter:   { width: BANNER_CARD_WIDTH, height: BANNER_CARD_HEIGHT, marginRight: BANNER_CARD_GAP },
  bannerCardTouchable: {
    flex: 1, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 14, elevation: 10,
  },
  bannerCardInner:      { flex: 1, borderRadius: 16, overflow: 'hidden' },
  bannerCardImageStyle: { borderRadius: 16 },
  bannerImageOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  bannerPattern:        { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  patternCircle:        { position: 'absolute', borderRadius: 1000, backgroundColor: 'rgba(255,255,255,0.1)' },
  patternCircle1:       { width: 180, height: 180, top: -60,    right: -40 },
  patternCircle2:       { width: 120, height: 120, bottom: -40, right: 60  },
  bannerContent:        { flex: 1, flexDirection: 'row', padding: SPACING.md },
  bannerTextSection:    { flex: 1, justifyContent: 'center', paddingRight: SPACING.sm },
  bannerImageSection:   { width: 90, alignItems: 'center', justifyContent: 'center' },
  bannerIconContainer: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle:    { fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 6 },
  bannerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: SPACING.sm, lineHeight: 17 },
  shopNowButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, alignSelf: 'flex-start', gap: 4,
  },
  shopNowText: { fontSize: 12, color: COLORS.black, fontWeight: '700' },

  dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: SPACING.sm },
  dotTouchable:  { padding: 4 },
  dot:           { height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginHorizontal: 3 },

  // ── Categories ────────────────────────────────────────────
  categoriesSection: { marginBottom: SPACING.lg, paddingHorizontal: SPACING.screenPadding },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600' },
  seeAllText:   { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  categoryGrid: { flexDirection: 'row', gap: 10 },
  categoryCard: {
    flex: 1, height: CATEGORY_HEIGHT, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  categoryImage:      { width: '100%', height: '100%', justifyContent: 'flex-end' },
  categoryImageStyle: { borderRadius: 12 },
  categoryOverlay:    { backgroundColor: 'rgba(0,0,0,0.40)', padding: SPACING.sm },
  categoryText:       { fontSize: 13, color: COLORS.white, fontWeight: '700' },

  // ── Preferred products ─────────────────────────────────────
  preferredSection: {
    paddingHorizontal: SPACING.screenPadding,
    marginBottom: SPACING.lg,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACING.lg,
  },
  preferredTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  preferredAccentBar:  { width: 4, height: 36, borderRadius: 2, backgroundColor: COLORS.primary },
  preferredSubtitle:   { fontSize: 12, color: COLORS.primary, fontWeight: '500', marginTop: 1 },
  preferredLoader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.xl, gap: 8,
  },
  preferredLoaderText: { fontSize: 13, color: COLORS.textSecondary },
  preferredEmpty:      { alignItems: 'center', paddingVertical: SPACING.xl, gap: 8 },
  preferredEmptyText:  { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  changeIndustryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.sm, gap: 4, marginTop: SPACING.xs,
  },
  changeIndustryText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },

  // ── Products grid ─────────────────────────────────────────
  productsSection: { paddingHorizontal: SPACING.screenPadding },

  // ✅ flexWrap ensures 3-per-row wrapping
  productsGrid: {
  flexDirection: 'row',
  flexWrap:      'wrap',
  // ✅ Ensure the grid doesn't exceed screen width
  width:         COLS * PRODUCT_CARD_WIDTH + PRODUCT_GAP * (COLS - 1),
},

  viewMoreButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, gap: 4,
  },
  viewMoreText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },

  // ── Product card ──────────────────────────────────────────
  compactProductCard: {
  width:           PRODUCT_CARD_WIDTH,
  backgroundColor: COLORS.white,
  borderRadius:    12,
  marginBottom:    PRODUCT_GAP,
  overflow:        'hidden',
  shadowColor:     '#000',
  shadowOffset:    { width: 0, height: 2 },
  shadowOpacity:   0.08,
  shadowRadius:    4,
  elevation:       3,
},
  compactImageContainer: {
    width: '100%', aspectRatio: 1, backgroundColor: '#F8F8F8', position: 'relative',
  },
  compactImage:       { width: '100%', height: '100%' },
  compactPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  compactSaleBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: '#0D9488', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
  },
  compactSaleText:       { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  compactOutOfStock: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: COLORS.error, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
  },
  compactOutOfStockText: { color: COLORS.white, fontSize: 9, fontWeight: '600' },
  compactContent:        { padding: 8 },
  compactTitle: {
    fontSize: 11, fontWeight: '500', color: COLORS.textPrimary,
    marginBottom: 6, lineHeight: 14, height: 28,
  },
  compactPriceRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compactPrice:           { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  compactAddButton: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#0D9488', alignItems: 'center', justifyContent: 'center',
  },
  compactAddButtonActive: { backgroundColor: '#0D9488' },
  compactQuantityText:    { fontSize: 10, color: COLORS.white, fontWeight: '700' },

  // ── Floating cart ─────────────────────────────────────────
  floatingCartContainer: {
    position: 'absolute',
    bottom: SPACING.tabBarHeight + SPACING.lg,
    right: SPACING.screenPadding,
    zIndex: 1000,
  },
  floatingCartButton: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.large, shadowColor: COLORS.primary, shadowOpacity: 0.4,
  },
  floatingCartBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: COLORS.primary,
  },
  floatingCartBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.black },

  bottomSpacing: { height: SPACING.tabBarHeight + SPACING.lg },
});

export default HomeScreen;