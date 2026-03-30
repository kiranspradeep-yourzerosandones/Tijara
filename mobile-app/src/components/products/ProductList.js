// D:\yzo_ongoing\Tijara\mobile-app\src\components\products\ProductList.js
import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING } from '../../theme';
import ProductCard from './ProductCard';
import { Loading, EmptyState } from '../common';

const { width } = Dimensions.get('window');
const PRODUCT_GAP = SPACING.productCardGap;
const PRODUCT_WIDTH = (width - SPACING.screenPadding * 2 - PRODUCT_GAP) / 2;

const ProductList = ({
  products,
  isLoading,
  isRefreshing,
  onRefresh,
  onEndReached,
  onProductPress,
  ListHeaderComponent,
  ListFooterComponent,
  emptyIcon = 'cube-outline',
  emptyTitle = 'No Products Found',
  emptyMessage = 'Try adjusting your search or filters',
  numColumns = 2,
  style,
}) => {
  const renderProduct = ({ item, index }) => (
    <ProductCard
      product={item}
      onPress={() => onProductPress?.(item)}
      style={[
        styles.productCard,
        { width: PRODUCT_WIDTH },
        index % 2 === 0 ? styles.leftCard : styles.rightCard,
      ]}
    />
  );

  if (isLoading && !products?.length) {
    return <Loading fullScreen message="Loading products..." />;
  }

  return (
    <FlatList
      data={products}
      renderItem={renderProduct}
      keyExtractor={(item) => item._id}
      numColumns={numColumns}
      contentContainerStyle={[styles.container, style]}
      columnWrapperStyle={numColumns > 1 && styles.row}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        ListFooterComponent || (isLoading && products?.length > 0 ? (
          <Loading size="small" />
        ) : null)
      }
      ListEmptyComponent={
        !isLoading && (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            message={emptyMessage}
          />
        )
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: SPACING.tabBarHeight + SPACING.xl,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: PRODUCT_GAP,
  },
  productCard: {
    marginBottom: 0,
  },
  leftCard: {
    marginRight: PRODUCT_GAP / 2,
  },
  rightCard: {
    marginLeft: PRODUCT_GAP / 2,
  },
});

export default ProductList;