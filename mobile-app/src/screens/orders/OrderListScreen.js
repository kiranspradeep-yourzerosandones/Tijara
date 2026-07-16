// src/screens/orders/OrderListScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../../theme';
import { EmptyState, Screen } from '../../components/common';
import { OrderListSkeleton } from '../../components/common/Skeleton';
import { ordersAPI } from '../../api';
import { formatDate, getImageUrl } from '../../utils/helpers';

// ── Status options ─────────────────────────────────────────
const STATUS_OPTIONS = [
  { key: 'all',              label: 'All' },
  { key: 'pending',          label: 'Pending' },
  { key: 'confirmed',        label: 'Confirmed' },
  { key: 'packed',           label: 'Packed' },
  { key: 'shipped',          label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered',        label: 'Delivered' },
  { key: 'cancelled',        label: 'Cancelled' },
];

const STATUS_COLORS = {
  pending:          '#D97706',
  confirmed:        '#1D4ED8',
  packed:           '#7C3AED',
  shipped:          '#2196F3',
  out_for_delivery: '#00BCD4',
  delivered:        '#059669',
  cancelled:        '#DC2626',
};

const getStatusColor = (status) => STATUS_COLORS[status] || COLORS.primary;

const getOrderStatusText = (status, statusText) => {
  if (statusText) return statusText;
  switch (status) {
    case 'delivered':        return 'Item Delivered';
    case 'cancelled':        return 'Order Cancelled';
    case 'shipped':          return 'Item on the way';
    case 'out_for_delivery': return 'Out for Delivery';
    case 'packed':           return 'Item being packed';
    case 'confirmed':        return 'Order Confirmed';
    default:                 return 'Order Processing';
  }
};

const getProductImage = (item) => {
  if (!item) return null;
  const imageSource =
    item.productSnapshot?.image ||
    item.product?.images?.[0] ||
    item.productSnapshot?.images?.[0] ||
    null;
  return imageSource ? getImageUrl(imageSource) : null;
};

// ── Order card ─────────────────────────────────────────────
const OrderCard = ({ item, onPress }) => {
  const firstItem    = item.items?.[0];
  const image        = getProductImage(firstItem);
  const itemCount    = item.items?.length || item.totalItems || 1;
  const productTitle =
    firstItem?.productSnapshot?.title ||
    firstItem?.product?.title ||
    'Product';

  return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
    >
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
          quantity — {firstItem?.quantity || 1}
          {itemCount > 1 &&
            ` (+${itemCount - 1} more item${itemCount > 2 ? 's' : ''})`}
        </Text>
        <Text
          style={[styles.orderStatus, { color: getStatusColor(item.status) }]}
        >
          {getOrderStatusText(item.status, item.statusText)}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
    </TouchableOpacity>
  );
};

// ── Status dropdown button ─────────────────────────────────
const StatusDropdown = ({ activeStatus, onSelect }) => {
  const [visible, setVisible] = useState(false);

  const activeLabel =
    STATUS_OPTIONS.find((s) => s.key === activeStatus)?.label || 'All';

  const handleSelect = (key) => {
    setVisible(false);
    onSelect(key);
  };

  return (
    <>
      {/* Trigger button */}
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          activeStatus !== 'all' && styles.dropdownTriggerActive,
        ]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="filter"
          size={16}
          color={activeStatus !== 'all' ? COLORS.white : COLORS.textSecondary}
        />
        <Text
          style={[
            styles.dropdownTriggerText,
            activeStatus !== 'all' && styles.dropdownTriggerTextActive,
          ]}
          numberOfLines={1}
        >
          {activeLabel}
        </Text>
        <Ionicons
          name="chevron-down"
          size={14}
          color={activeStatus !== 'all' ? COLORS.white : COLORS.textSecondary}
        />
      </TouchableOpacity>

      {/* Dropdown modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdownMenu}>
            <Text style={styles.dropdownTitle}>Filter by Status</Text>

            {STATUS_OPTIONS.map((option) => {
              const isActive = activeStatus === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.dropdownOption,
                    isActive && styles.dropdownOptionActive,
                  ]}
                  onPress={() => handleSelect(option.key)}
                  activeOpacity={0.7}
                >
                  {/* Color dot for status */}
                  {option.key !== 'all' && (
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: STATUS_COLORS[option.key] || COLORS.gray },
                      ]}
                    />
                  )}
                  {option.key === 'all' && (
                    <Ionicons
                      name="apps-outline"
                      size={14}
                      color={COLORS.textSecondary}
                      style={{ marginRight: 8 }}
                    />
                  )}

                  <Text
                    style={[
                      styles.dropdownOptionText,
                      isActive && styles.dropdownOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>

                  {isActive && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={COLORS.primary}
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

// ── Main screen ────────────────────────────────────────────
const OrderListScreen = ({ navigation }) => {
  const [orders, setOrders]             = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(true);
  const [totalCount, setTotalCount]     = useState(0);

  const [searchText, setSearchText]     = useState('');
  const [activeStatus, setActiveStatus] = useState('all');

  const debounceTimer = useRef(null);
  const searchRef     = useRef('');
  const statusRef     = useRef('all');

  // ── Core load function ─────────────────────────────────
  const loadOrders = useCallback(
    async ({
      refresh = false,
      search  = searchRef.current,
      status  = statusRef.current,
      pageNum = 1,
    } = {}) => {
      if (!refresh && !hasMore && pageNum > 1) return;

      if (refresh || pageNum === 1) {
        setIsLoading(true);
      }

      try {
        const params = {
          page:  pageNum,
          limit: 10,
          ...(search.trim() && { search: search.trim() }),
          ...(status !== 'all' && { status }),
        };

        const response   = await ordersAPI.getOrders(params);
        const newOrders  = response.data?.orders || [];
        const pagination = response.data?.pagination;

        if (refresh || pageNum === 1) {
          setOrders(newOrders);
        } else {
          setOrders((prev) => [...prev, ...newOrders]);
        }

        setTotalCount(pagination?.total || 0);
        setHasMore((pagination?.pages || 1) > pageNum);
        setPage(pageNum + 1);
      } catch (error) {
        console.error('Load orders error:', error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // ── Initial load ───────────────────────────────────────
  useEffect(() => {
    loadOrders({ refresh: true });
  }, []);

  // ── Search with 500ms debounce ─────────────────────────
  const handleSearchChange = (text) => {
    setSearchText(text);
    searchRef.current = text;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      loadOrders({
        refresh: true,
        search:  text,
        status:  statusRef.current,
        pageNum: 1,
      });
    }, 500);
  };

  const handleSearchClear = () => {
    setSearchText('');
    searchRef.current = '';

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    setPage(1);
    setHasMore(true);
    loadOrders({
      refresh: true,
      search:  '',
      status:  statusRef.current,
      pageNum: 1,
    });
  };

  // ── Status filter change ───────────────────────────────
  const handleStatusChange = (status) => {
    setActiveStatus(status);
    statusRef.current = status;
    setPage(1);
    setHasMore(true);
    loadOrders({
      refresh: true,
      search:  searchRef.current,
      status,
      pageNum: 1,
    });
  };

  // ── Pull to refresh ────────────────────────────────────
  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadOrders({
      refresh: true,
      search:  searchRef.current,
      status:  statusRef.current,
      pageNum: 1,
    });
  };

  // ── Infinite scroll ────────────────────────────────────
  const handleEndReached = () => {
    if (!isLoading && hasMore) {
      loadOrders({
        refresh: false,
        search:  searchRef.current,
        status:  statusRef.current,
        pageNum: page,
      });
    }
  };

  const handleOrderPress = (order) => {
    navigation.navigate('OrderDetail', { orderId: order._id || order.id });
  };

  // ── Render helpers ─────────────────────────────────────
  const renderOrder = ({ item }) => (
    <OrderCard item={item} onPress={handleOrderPress} />
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    const hasFilters = searchText.trim() || activeStatus !== 'all';

    return (
      <EmptyState
        icon={hasFilters ? 'search-outline' : 'receipt-outline'}
        title={hasFilters ? 'No Orders Found' : 'No Orders Yet'}
        message={
          hasFilters
            ? 'Try a different search or filter'
            : "You haven't placed any orders yet"
        }
        actionText={hasFilters ? 'Clear Filters' : 'Start Shopping'}
        onAction={
          hasFilters
            ? () => {
                handleSearchClear();
                handleStatusChange('all');
              }
            : () => navigation.navigate('Home')
        }
      />
    );
  };

  const renderFooter = () => {
    if (!isLoading || orders.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <OrderListSkeleton count={2} />
      </View>
    );
  };

  // ── Skeleton on first load ─────────────────────────────
  if (
    isLoading &&
    orders.length === 0 &&
    !searchText &&
    activeStatus === 'all'
  ) {
    return (
      <Screen backgroundColor={COLORS.backgroundLight}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Orders</Text>
        </View>
        <View style={styles.filterRow}>
          <View style={[styles.searchBar, styles.searchBarSkeleton]} />
          <View style={styles.dropdownSkeleton} />
        </View>
        <OrderListSkeleton count={5} />
      </Screen>
    );
  }

  const hasFilters = searchText.trim() || activeStatus !== 'all';

  return (
    <Screen backgroundColor={COLORS.backgroundLight}>
      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Orders</Text>
        {totalCount > 0 && (
          <Text style={styles.totalCount}>{totalCount} orders</Text>
        )}
      </View>

      {/* ── Search bar + Status dropdown (same row) ─────── */}
      <View style={styles.filterRow}>
        {/* Search bar — 65% */}
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={18}
            color={COLORS.gray}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={COLORS.gray}
            value={searchText}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            clearButtonMode="never"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={handleSearchClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status dropdown — 35% */}
        <StatusDropdown
          activeStatus={activeStatus}
          onSelect={handleStatusChange}
        />
      </View>

      {/* ── Active filter indicator ─────────────────────── */}
      {hasFilters && !isLoading && (
        <View style={styles.activeFilterRow}>
          <Text style={styles.activeFilterText}>
            {totalCount} result{totalCount !== 1 ? 's' : ''}
            {searchText.trim() ? ` for "${searchText.trim()}"` : ''}
            {activeStatus !== 'all'
              ? ` · ${STATUS_OPTIONS.find((f) => f.key === activeStatus)?.label}`
              : ''}
          </Text>
          <TouchableOpacity
            onPress={() => {
              handleSearchClear();
              handleStatusChange('all');
            }}
          >
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Orders List ─────────────────────────────────── */}
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item._id || item.id}
        contentContainerStyle={[
          styles.listContent,
          orders.length === 0 && styles.listContentEmpty,
        ]}
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
  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical:   SPACING.md,
    backgroundColor:   COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title:      { ...FONTS.h3, color: COLORS.textPrimary },
  totalCount: { ...FONTS.bodySmall, color: COLORS.textSecondary },

  // ── Filter row (search + dropdown) ────────────────────
  filterRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical:   SPACING.sm + 2,
    backgroundColor:   COLORS.white,
    gap:               10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // ── Search bar ───────────────────────────────────────────
  searchBar: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   COLORS.backgroundLight,
    borderRadius:      12,
    paddingHorizontal: SPACING.md,
    paddingVertical:   10,
    borderWidth:       1,
    borderColor:       COLORS.border,
  },
  searchBarSkeleton: {
    height:          44,
    backgroundColor: COLORS.backgroundLight,
  },
  searchIcon:  { marginRight: SPACING.sm },
  searchInput: {
    flex:           1,
    ...FONTS.body,
    color:          COLORS.textPrimary,
    paddingVertical: 0,
    fontSize:       14,
  },

  // ── Dropdown trigger ─────────────────────────────────────
  dropdownTrigger: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   COLORS.backgroundLight,
    borderRadius:      12,
    paddingHorizontal: 12,
    paddingVertical:   11,
    borderWidth:       1,
    borderColor:       COLORS.border,
    gap:               5,
    minWidth:          100,
  },
  dropdownTriggerActive: {
    backgroundColor: COLORS.primary,
    borderColor:     COLORS.primary,
  },
  dropdownTriggerText: {
    fontSize:   13,
    fontWeight: '500',
    color:      COLORS.textSecondary,
    flexShrink: 1,
  },
  dropdownTriggerTextActive: {
    color: COLORS.white,
  },

  // ── Dropdown skeleton ────────────────────────────────────
  dropdownSkeleton: {
    width:           100,
    height:          44,
    borderRadius:    12,
    backgroundColor: COLORS.backgroundLight,
  },

  // ── Dropdown overlay + menu ──────────────────────────────
  dropdownOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent:  'center',
    alignItems:      'center',
    padding:         SPACING.xl,
  },
  dropdownMenu: {
    width:           '100%',
    maxWidth:        320,
    backgroundColor: COLORS.white,
    borderRadius:    16,
    paddingVertical: SPACING.sm,
    elevation:       10,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.15,
    shadowRadius:    12,
  },
  dropdownTitle: {
    ...FONTS.bodySmall,
    fontWeight:        '700',
    color:             COLORS.textSecondary,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical:   SPACING.sm,
    textTransform:     'uppercase',
    letterSpacing:     0.5,
    fontSize:          11,
  },
  dropdownOption: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: SPACING.md + 4,
    paddingVertical:   12,
  },
  dropdownOptionActive: {
    backgroundColor: COLORS.primaryLight
      ? COLORS.primaryLight + '18'
      : '#FEF3C710',
  },
  dropdownOptionText: {
    ...FONTS.body,
    color:    COLORS.textPrimary,
    fontSize: 15,
  },
  dropdownOptionTextActive: {
    fontWeight: '600',
    color:      COLORS.primary,
  },
  statusDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    marginRight:  8,
  },

  // ── Active filter indicator ──────────────────────────────
  activeFilterRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical:   SPACING.xs + 2,
    backgroundColor:   COLORS.backgroundLight,
  },
  activeFilterText: { ...FONTS.caption, color: COLORS.textSecondary },
  clearAllText:     { ...FONTS.caption, color: COLORS.primary, fontWeight: '600' },

  // ── List ─────────────────────────────────────────────────
  listContent: {
    padding:       SPACING.screenPadding,
    paddingBottom: SPACING.tabBarHeight + SPACING.xl,
  },
  listContentEmpty: { flexGrow: 1 },

  // ── Order card ───────────────────────────────────────────
  orderCard: {
    flexDirection:   'row',
    backgroundColor: '#EDE9DD',
    borderRadius:    12,
    padding:         12,
    marginBottom:    12,
    alignItems:      'center',
  },
  orderImage: {
    width:           65,
    height:          65,
    borderRadius:    8,
    marginRight:     12,
    backgroundColor: COLORS.white,
  },
  imagePlaceholder: {
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    COLORS.border,
  },
  orderContent: { flex: 1 },
  orderTitle: {
    fontSize:     14,
    fontWeight:   '600',
    color:        COLORS.textPrimary,
    marginBottom: 4,
  },
  orderMeta: {
    fontSize:  12,
    color:     '#666',
    marginTop: 2,
  },
  orderStatus: {
    fontSize:   12,
    fontWeight: '600',
    marginTop:  6,
  },

  // ── Footer ───────────────────────────────────────────────
  footerLoader: { paddingVertical: SPACING.md },
});

export default OrderListScreen;