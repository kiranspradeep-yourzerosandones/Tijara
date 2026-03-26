// src/screens/products/ProductListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { ProductList } from '../../components/products';
import { productsAPI } from '../../api';
import { debounce } from '../../utils/helpers';

const ProductListScreen = ({ navigation, route }) => {
  const { 
    category, 
    searchQuery: initialSearch, 
    title = 'Products' 
  } = route.params || {};

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadProducts(true);
  }, [category]);

  useEffect(() => {
    if (initialSearch) {
      handleSearch(initialSearch);
    }
  }, [initialSearch]);

  const loadProducts = async (refresh = false) => {
    if (!refresh && !hasMore) return;

    const currentPage = refresh ? 1 : page;
    
    if (refresh) {
      setIsLoading(true);
    }

    try {
      const params = {
        page: currentPage,
        limit: 20,
      };

      if (category) params.category = category;

      let response;
      if (searchQuery) {
        response = await productsAPI.searchProducts(searchQuery, category);
        setProducts(response.products || []);
        setHasMore(false);
      } else {
        response = await productsAPI.getProducts(params);
        const newProducts = response.data?.products || [];
        
        if (refresh) {
          setProducts(newProducts);
        } else {
          setProducts(prev => [...prev, ...newProducts]);
        }
        
        setHasMore(response.data?.pagination?.pages > currentPage);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setPage(1);
        setHasMore(true);
        loadProducts(true);
        return;
      }

      setIsLoading(true);
      try {
        const response = await productsAPI.searchProducts(query.trim(), category);
        setProducts(response.products || []);
        setHasMore(false);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [category]
  );

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    handleSearch(text);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setSearchQuery('');
    setPage(1);
    setHasMore(true);
    loadProducts(true);
  };

  const handleEndReached = () => {
    if (!isLoading && hasMore && !searchQuery) {
      loadProducts(false);
    }
  };

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={COLORS.gray}
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Products */}
      <ProductList
        products={products}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        onProductPress={handleProductPress}
        emptyTitle={searchQuery ? 'No results found' : 'No products available'}
        emptyMessage={searchQuery ? 'Try a different search term' : 'Check back later for new products'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight || COLORS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card || COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.screenPadding,
    paddingHorizontal: SPACING.md,
    height: 48,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
});

export default ProductListScreen;