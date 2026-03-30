// src/screens/orders/OrderListScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { Loading, EmptyState, Screen } from '../../components/common';
import { OrderCard } from '../../components/orders';
import { ordersAPI } from '../../api';

const ORDER_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const OrderListScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadOrders(true);
  }, [activeFilter]);

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

      if (activeFilter !== 'all') {
        params.status = activeFilter;
      }

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
    navigation.navigate('OrderDetail', { orderId: order._id });
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <FlatList
        horizontal
        data={ORDER_FILTERS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeFilter === item.key && styles.filterTabActive,
            ]}
            onPress={() => setActiveFilter(item.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === item.key && styles.filterTabTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderOrder = ({ item }) => (
    <OrderCard order={item} onPress={() => handleOrderPress(item)} />
  );

  const renderEmpty = () => (
    <EmptyState
      icon="receipt-outline"
      title="No Orders Yet"
      message={
        activeFilter !== 'all'
          ? `No ${activeFilter} orders found`
          : "You haven't placed any orders yet"
      }
      actionText="Start Shopping"
      onAction={() => navigation.navigate('Home')}
    />
  );

  const renderFooter = () => {
    if (!isLoading || orders.length === 0) return null;
    return <Loading size="small" />;
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
        <Text style={styles.title}>My Orders</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {/* TODO: Implement search */}}
        >
          <Ionicons name="search" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {renderFilterTabs()}

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterList: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: SPACING.buttonRadius,
    backgroundColor: COLORS.card,
    marginRight: SPACING.sm,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: COLORS.black,
  },
  listContent: {
    padding: SPACING.screenPadding,
    paddingBottom: SPACING.tabBarHeight + SPACING.xl,
  },
});

export default OrderListScreen;