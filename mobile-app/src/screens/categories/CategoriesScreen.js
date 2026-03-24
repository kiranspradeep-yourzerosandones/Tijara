import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { ProductCard } from '../../components/products';
import { Loading } from '../../components/common';
import { productsAPI } from '../../api';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = 100;
const PRODUCT_WIDTH = (width - SIDEBAR_WIDTH - SPACING.screenPadding * 2 - SPACING.productCardGap) / 2;

const CategoriesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory.name);
    }
  }, [selectedCategory]);

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

  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { product });
  };

  const renderCategory = ({ item }) => {
    const isSelected = selectedCategory?._id === item._id;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isSelected && styles.categoryItemSelected,
        ]}
        onPress={() => setSelectedCategory(item)}
      >
        <View style={[
          styles.categoryIndicator,
          isSelected && styles.categoryIndicatorSelected,
        ]} />
        <Text
          style={[
            styles.categoryName,
            isSelected && styles.categoryNameSelected,
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProduct = ({ item, index }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item)}
      style={[
        styles.productCard,
        index % 2 === 0 ? styles.leftCard : styles.rightCard,
      ]}
    />
  );

  if (isLoading) {
    return <Loading fullScreen message="Loading categories..." />;
  }

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
        <Text style={styles.title}>Categories</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* Category Sidebar */}
        <View style={styles.sidebar}>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Products Grid */}
        <View style={styles.productsContainer}>
          {isLoadingProducts ? (
            <Loading message="Loading..." />
          ) : (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              contentContainerStyle={styles.productsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="cube-outline" size={48} color={COLORS.gray} />
                  <Text style={styles.emptyText}>No products in this category</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingRight: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  categoryItemSelected: {
    backgroundColor: COLORS.primaryLight + '15',
  },
  categoryIndicator: {
    width: 4,
    height: '100%',
    backgroundColor: 'transparent',
    marginRight: SPACING.sm,
  },
  categoryIndicatorSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryName: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    flex: 1,
  },
  categoryNameSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  productsContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  productsList: {
    padding: SPACING.sm,
    paddingBottom: SPACING.tabBarHeight,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  productCard: {
    width: PRODUCT_WIDTH,
  },
  leftCard: {
    marginRight: SPACING.productCardGap / 2,
  },
  rightCard: {
    marginLeft: SPACING.productCardGap / 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    ...FONTS.body,
    color: COLORS.gray,
    marginTop: SPACING.md,
  },
});

export default CategoriesScreen;