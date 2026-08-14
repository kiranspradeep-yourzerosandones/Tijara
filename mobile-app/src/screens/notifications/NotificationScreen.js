// src/screens/notifications/NotificationScreen.js
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
import { EmptyState, Screen } from '../../components/common';
import { NotificationSkeleton } from '../../components/common/Skeleton';
import { useNotificationStore } from '../../store';
import { getRelativeTime } from '../../utils/helpers';

const NOTIFICATION_ICONS = {
  order_update:     'receipt-outline',
  payment_reminder: 'card-outline',
  payment_received: 'checkmark-circle-outline',
  promotional:      'pricetag-outline',
  new_product:      'cube-outline',
  announcement:     'megaphone-outline',
  system:           'information-circle-outline',
  custom:           'notifications-outline',
  default:          'notifications-outline',
};

const NotificationScreen = ({ navigation }) => {
  const notifications      = useNotificationStore((s) => s.notifications);
  const isLoading          = useNotificationStore((s) => s.isLoading);
  const hasMore            = useNotificationStore((s) => s.hasMore);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead         = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead      = useNotificationStore((s) => s.markAllAsRead);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications(true);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications(true);
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (!isLoading && hasMore) {
      fetchNotifications(false);
    }
  };

  // ── Smart navigator ────────────────────────────────────────
  // NotificationScreen lives inside HomeStack or ProfileStack.
  // Some screens (OrderDetail, CreditSummary, PaymentHistory,
  // ProductDetail) are registered at the ROOT AppNavigator level.
  // We must navigate to those via the root navigator, not the
  // nested stack navigator.
  //
  // navigation.getParent()  → TabNavigator
  // navigation.getParent()?.getParent()  → AppNavigator (root)
  const navigateToRoot = (screenName, params = {}) => {
    // Try root navigator first (AppNavigator has OrderDetail etc.)
    const rootNav = navigation.getParent()?.getParent();
    if (rootNav) {
      rootNav.navigate(screenName, params);
    } else {
      // Fallback — try current navigator
      navigation.navigate(screenName, params);
    }
  };

  // Navigate to a tab + optionally a screen inside that tab
  const navigateToTab = (tabName, screenName, params = {}) => {
    navigation.navigate(tabName, {
      screen: screenName,
      params,
    });
  };

  // ── Notification tap handler ───────────────────────────────
  const handleNotificationPress = (notification) => {
    // Mark as read first
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // ── Order update ──────────────────────────────────────────
    if (notification.type === 'order_update') {
      if (notification.actionUrl?.startsWith('order:')) {
        const orderId = notification.actionUrl.replace('order:', '');
        navigateToRoot('OrderDetail', { orderId });
        return;
      }
      if (notification.data?.orderId) {
        navigateToRoot('OrderDetail', { orderId: notification.data.orderId });
        return;
      }
      // Fallback → switch to Orders tab
      navigation.navigate('Orders');
      return;
    }

    // ── Payment reminder → CreditSummary ──────────────────────
    if (notification.type === 'payment_reminder') {
      navigateToRoot('CreditSummary');
      return;
    }

    // ── Payment received → PaymentHistory ─────────────────────
    if (notification.type === 'payment_received') {
      navigateToRoot('PaymentHistory');
      return;
    }

    // ── New product → ProductList ──────────────────────────────
    if (notification.type === 'new_product') {
      navigateToRoot('ProductList', { title: 'New Products' });
      return;
    }

    // ── Promotional → ProductList ──────────────────────────────
    if (notification.type === 'promotional') {
      navigateToRoot('ProductList', { title: 'Offers' });
      return;
    }

    // ── Generic actionUrl deep link ────────────────────────────
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('order:')) {
        const orderId = notification.actionUrl.replace('order:', '');
        navigateToRoot('OrderDetail', { orderId });
        return;
      }

      if (notification.actionUrl.startsWith('product:')) {
        const productId = notification.actionUrl.replace('product:', '');
        navigateToRoot('ProductDetail', { productId });
        return;
      }

      if (notification.actionUrl.startsWith('screen:')) {
        const screen = notification.actionUrl.replace('screen:', '');
        try {
          navigateToRoot(screen);
        } catch (e) {
          console.warn('🔔 Unknown screen:', screen);
        }
        return;
      }

      // Tab navigation — e.g. actionUrl: "tab:Orders"
      if (notification.actionUrl.startsWith('tab:')) {
        const tab = notification.actionUrl.replace('tab:', '');
        navigation.navigate(tab);
        return;
      }
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  // ── Loading skeleton ───────────────────────────────────────
  if (isLoading && notifications.length === 0) {
    return (
      <Screen backgroundColor={COLORS.backgroundLight}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 6 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </View>
      </Screen>
    );
  }

  // ── Render single notification ─────────────────────────────
  const renderNotification = ({ item }) => {
    const icon = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.default;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.notificationItemUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.notificationIcon,
            !item.isRead && styles.notificationIconUnread,
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={!item.isRead ? COLORS.primary : COLORS.gray}
          />
        </View>

        <View style={styles.notificationContent}>
          <Text
            style={[
              styles.notificationTitle,
              !item.isRead && styles.notificationTitleUnread,
            ]}
          >
            {item.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.message || item.body}
          </Text>
          <Text style={styles.notificationTime}>
            {getRelativeTime(item.createdAt)}
          </Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      icon="notifications-off-outline"
      title="No Notifications"
      message="You're all caught up! We'll notify you when something happens."
    />
  );

  const renderFooter = () => {
    if (!isLoading || notifications.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <NotificationSkeleton />
        <NotificationSkeleton />
      </View>
    );
  };

  return (
    <Screen backgroundColor={COLORS.backgroundLight}>
      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Notifications</Text>

        {hasUnread ? (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {/* ── List ────────────────────────────────────────────── */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={!isLoading && renderEmpty}
        ListFooterComponent={renderFooter}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
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
  backButton: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: COLORS.card,
    alignItems:      'center',
    justifyContent:  'center',
  },
  title:       { ...FONTS.h4, color: COLORS.textPrimary },
  headerRight: { width: 80 },
  markAllButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical:   SPACING.xs,
  },
  markAllText: {
    ...FONTS.bodySmall,
    color:      COLORS.primary,
    fontWeight: '500',
  },
  skeletonContainer: {
    paddingTop:      8,
    backgroundColor: COLORS.white,
  },
  listContent:   { paddingBottom: SPACING.xxxl, flexGrow: 1 },
  notificationItem: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: COLORS.white,
    padding:         SPACING.cardPadding,
  },
  notificationItemUnread: {
    backgroundColor: COLORS.primaryLight + '15',
  },
  notificationIcon: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: COLORS.card,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     SPACING.md,
  },
  notificationIconUnread: {
    backgroundColor: COLORS.primaryLight + '30',
  },
  notificationContent: { flex: 1 },
  notificationTitle: {
    ...FONTS.body,
    color:        COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  notificationTitleUnread: { fontWeight: '600' },
  notificationBody: {
    ...FONTS.bodySmall,
    color:        COLORS.textSecondary,
    lineHeight:   20,
    marginBottom: SPACING.xs,
  },
  notificationTime: { ...FONTS.caption, color: COLORS.gray },
  unreadDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: COLORS.primary,
    marginLeft:      SPACING.sm,
    marginTop:       SPACING.xs,
  },
  separator:    { height: 1, backgroundColor: COLORS.borderLight },
  footerLoader: { paddingVertical: SPACING.md },
});

export default NotificationScreen;
export { NotificationScreen };