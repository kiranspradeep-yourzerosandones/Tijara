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
import { Loading, EmptyState, Screen } from '../../components/common';
import { useNotificationStore } from '../../store';
import { getRelativeTime } from '../../utils/helpers';

const NOTIFICATION_ICONS = {
  order: 'receipt-outline',
  payment: 'card-outline',
  delivery: 'car-outline',
  promo: 'pricetag-outline',
  system: 'information-circle-outline',
  default: 'notifications-outline',
};

const NotificationScreen = ({ navigation }) => {
  const {
    notifications,
    isLoading,
    hasMore,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

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

  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    if (notification.data?.orderId) {
      navigation.navigate('OrderDetail', { orderId: notification.data.orderId });
    }
  };

  const renderNotification = ({ item }) => {
    const icon = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.default;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.notificationItemUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[
          styles.notificationIcon,
          !item.isRead && styles.notificationIconUnread,
        ]}>
          <Ionicons 
            name={icon} 
            size={22} 
            color={!item.isRead ? COLORS.primary : COLORS.gray} 
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[
            styles.notificationTitle,
            !item.isRead && styles.notificationTitleUnread,
          ]}>
            {item.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body}
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
    return <Loading size="small" />;
  };

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <Screen backgroundColor={COLORS.backgroundLight}>
      {/* Header */}
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
    width: 80,
  },
  markAllButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  markAllText: {
    ...FONTS.bodySmall,
    color: COLORS.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: SPACING.xxxl,
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: SPACING.cardPadding,
  },
  notificationItemUnread: {
    backgroundColor: COLORS.primaryLight + '15',
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  notificationIconUnread: {
    backgroundColor: COLORS.primaryLight + '30',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  notificationBody: {
    ...FONTS.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  notificationTime: {
    ...FONTS.caption,
    color: COLORS.gray,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
    marginTop: SPACING.xs,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
});

export default NotificationScreen;