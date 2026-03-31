// src/screens/orders/OrderListScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { Loading, EmptyState, Screen } from '../../components/common';
import { ordersAPI } from '../../api';
import { formatDate, getImageUrl } from '../../utils/helpers'; // ✅ Import getImageUrl

const OrderListScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadOrders(true);
  }, []);

  const loadOrders = async (refresh = false) => {
    const currentPage = refresh ? 1 : page;
    
    if (!refresh && !hasMore) return;

    if (refresh) {
      setIsLoading(true);
    }

    try {
      const params = {
        page: currentPage,
        limit: 10,
      };

      const response = await ordersAPI.getOrders(params);
      const newOrders = response.data?.orders || [];

      if (refresh) {
        setOrders(newOrders);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }

      setHasMore(response.data?.pagination?.pages > currentPage);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadOrders(true);
  };

  const handleEndReached = () => {
    if (!isLoading && hasMore) {
      loadOrders(false);
    }
  };

  const handleOrderPress = (order) => {
    navigation.navigate('OrderDetail', { orderId: order._id || order.id });
  };

  const getOrderStatusText = (status, statusText) => {
    if (statusText) return statusText;
    
    switch (status) {
      case 'delivered':
        return 'Item Delivered';
      case 'cancelled':
        return 'Order Cancelled';
      case 'shipped':
        return 'Item on the way';
      case 'packed':
        return 'Item being packed';
      case 'confirmed':
        return 'Order Confirmed';
      default:
        return 'Order Processing';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return COLORS.success;
      case 'cancelled':
        return COLORS.error;
      case 'shipped':
        return '#2196F3';
      default:
        return COLORS.primary;
    }
  };

  // ✅ Get product image using existing helper
  const getProductImage = (item) => {
    if (!item) return null;

    // Try different possible image sources from your API structure
    const imageSource = 
      item.productSnapshot?.image ||           // Your API: productSnapshot.image
      item.product?.images?.[0] ||              // Fallback: product.images array
      item.productSnapshot?.images?.[0] ||      // Another fallback
      null;

    return imageSource ? getImageUrl(imageSource) : null;
  };

  const renderOrder = ({ item }) => {
    const firstItem = item.items?.[0];
    const image = getProductImage(firstItem);
    const itemCount = item.items?.length || item.totalItems || 1;
    const productTitle = firstItem?.productSnapshot?.title || 
                        firstItem?.product?.title ||
                        'Product';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.8}
      >
        {/* Product Image */}
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.orderImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.orderImage, styles.imagePlaceholder]}>
            <Ionicons name="medkit-outline" size={28} color={COLORS.gray} />
          </View>
        )}

        <View style={styles.orderContent}>
          <Text style={styles.orderTitle} numberOfLines={1}>
            {productTitle}
          </Text>

          <Text style={styles.orderMeta}>
            Ordered on {formatDate(item.createdAt, 'date')}
          </Text>

          <Text style={styles.orderMeta}>
            quantity - {firstItem?.quantity || 1}
            {itemCount > 1 && ` (+${itemCount - 1} more item${itemCount > 2 ? 's' : ''})`}
          </Text>

          <Text 
            style={[
              styles.orderStatus,
              { color: getStatusColor(item.status) }
            ]}
          >
            {getOrderStatusText(item.status, item.statusText)}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="receipt-outline"
      title="No Orders Yet"
      message="You haven't placed any orders yet"
      actionText="Start Shopping"
      onAction={() => navigation.navigate('Home')}
    />
  );

  const renderFooter = () => {
    if (!isLoading || orders.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <Loading size="small" />
      </View>
    );
  };

  if (isLoading && orders.length === 0) {
    return (
      <Screen backgroundColor={COLORS.backgroundLight}>
        <Loading fullScreen message="Loading orders..." />
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={COLORS.backgroundLight}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Orders</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  listContent: {
    padding: SPACING.screenPadding,
    paddingBottom: SPACING.tabBarHeight + SPACING.xl,
    flexGrow: 1,
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#EDE9DD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  orderImage: {
    width: 65,
    height: 65,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: COLORS.white,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderContent: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  footerLoader: {
    paddingVertical: SPACING.md,
  },
});

export default OrderListScreen;