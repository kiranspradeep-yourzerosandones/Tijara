// src/screens/profile/ProfileScreen.js
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Card, Screen } from '../../components/common';
import { ProfileSkeleton } from '../../components/common/Skeleton';
import { useAuthStore } from '../../store';
import { paymentsAPI } from '../../api';
import { formatCurrency, getInitials } from '../../utils/helpers';

// ─── Reuse ConfirmDialog from CartScreen ──────────────────────
const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = COLORS.error,
  onConfirm,
  onCancel,
  icon,
  iconColor,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={dialogStyles.overlay}>
        <Animated.View
          style={[dialogStyles.card, { transform: [{ scale: scaleAnim }] }]}
        >
          {icon && (
            <View
              style={[
                dialogStyles.iconCircle,
                { backgroundColor: (iconColor || confirmColor) + '20' },
              ]}
            >
              <Ionicons
                name={icon}
                size={28}
                color={iconColor || confirmColor}
              />
            </View>
          )}
          <Text style={dialogStyles.title}>{title}</Text>
          <Text style={dialogStyles.message}>{message}</Text>
          <View style={dialogStyles.buttons}>
            {cancelText ? (
              <TouchableOpacity
                style={dialogStyles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={dialogStyles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[
                dialogStyles.confirmButton,
                { backgroundColor: confirmColor },
                !cancelText && { flex: 1 },
              ]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={dialogStyles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttons: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  confirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});

// ─── Profile Screen ───────────────────────────────────────────
const ProfileScreen = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const [creditData, setCreditData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchCreditData();
    }, [])
  );

  const fetchCreditData = async () => {
    try {
      refreshUser();
      const response = await paymentsAPI.getCreditSummary();
      if (response.success && response.data?.creditSummary) {
        setCreditData(response.data.creditSummary);
      }
    } catch (error) {
      console.error('Fetch credit data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCreditData();
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
  };

  const availableCredit =
    creditData?.availableCredit ?? user?.availableCredit ?? 0;
  const creditLimit = creditData?.creditLimit ?? user?.creditLimit ?? 0;
  const pendingAmount = creditData?.pendingAmount ?? user?.pendingAmount ?? 0;
  const creditUtilization =
    creditData?.creditUtilization ?? user?.creditUtilization ?? 0;

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Personal Information',
      subtitle: 'Edit your profile details',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'location-outline',
      title: 'My Addresses',
      subtitle: 'Manage delivery addresses',
      onPress: () => navigation.navigate('LocationList'),
    },
    {
      icon: 'receipt-outline',
      title: 'My Orders',
      subtitle: 'View order history',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      icon: 'card-outline',
      title: 'Credit & Payments',
      subtitle: `Available: ${formatCurrency(availableCredit)}`,
      onPress: () => navigation.navigate('CreditSummary'),
      highlight: pendingAmount > 0,
    },
    {
      icon: 'time-outline',
      title: 'Payment History',
      subtitle: 'View all payments',
      onPress: () => navigation.navigate('PaymentHistory'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage notifications',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help with orders',
      onPress: () => {},
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version 1.0.0',
      onPress: () => {},
    },
  ];

  // ✅ Skeleton while first load
  if (isLoading && !creditData) {
    return (
      <Screen backgroundColor={COLORS.backgroundLight}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <ProfileSkeleton />
          <View style={{ padding: SPACING.screenPadding }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i} style={skeletonMenuStyle} />
            ))}
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={COLORS.backgroundLight}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user?.name)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="pencil" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userPhone}>{user?.phone || ''}</Text>
          {user?.businessName && (
            <Text style={styles.businessName}>{user?.businessName}</Text>
          )}
        </View>

        {/* Credit Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('CreditSummary')}
        >
          <Card style={styles.creditCard}>
            <View style={styles.creditHeader}>
              <View>
                <Text style={styles.creditLabel}>Available Credit</Text>
                <Text style={styles.creditAmount}>
                  {formatCurrency(availableCredit)}
                </Text>
              </View>
              <View style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>Details</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.primary}
                />
              </View>
            </View>

            <View style={styles.creditProgress}>
              <View
                style={[
                  styles.creditProgressBar,
                  {
                    width: `${Math.min(creditUtilization, 100)}%`,
                    backgroundColor:
                      creditUtilization > 80
                        ? COLORS.warning
                        : COLORS.primary,
                  },
                ]}
              />
            </View>

            <View style={styles.creditInfo}>
              <View style={styles.creditInfoItem}>
                <Text style={styles.creditInfoLabel}>Pending</Text>
                <Text
                  style={[
                    styles.creditInfoValue,
                    pendingAmount > 0 && { color: COLORS.warning },
                  ]}
                >
                  {formatCurrency(pendingAmount)}
                </Text>
              </View>
              <View style={styles.creditInfoItem}>
                <Text style={styles.creditInfoLabel}>Limit</Text>
                <Text style={styles.creditInfoValue}>
                  {formatCurrency(creditLimit)}
                </Text>
              </View>
              <View style={styles.creditInfoItem}>
                <Text style={styles.creditInfoLabel}>Used</Text>
                <Text style={styles.creditInfoValue}>
                  {creditUtilization}%
                </Text>
              </View>
            </View>

            {creditData?.isCreditBlocked && (
              <View style={styles.creditWarning}>
                <Ionicons name="warning" size={16} color={COLORS.error} />
                <Text style={styles.creditWarningText}>
                  Credit blocked — Contact support
                </Text>
              </View>
            )}
          </Card>
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIcon,
                    item.highlight && styles.menuIconHighlight,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={
                      item.highlight ? COLORS.primary : COLORS.textPrimary
                    }
                  />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      item.highlight && styles.menuItemSubtitleHighlight,
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.gray}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutDialog(true)}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* ✅ Logout Confirmation */}
      <ConfirmDialog
        visible={showLogoutDialog}
        title="Logout?"
        message="Are you sure you want to logout from your account?"
        confirmText="Logout"
        cancelText="Stay"
        confirmColor={COLORS.error}
        icon="log-out-outline"
        iconColor={COLORS.error}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </Screen>
  );
};

const skeletonMenuStyle = {
  height: 60,
  backgroundColor: COLORS.lightGray,
  borderRadius: 12,
  marginBottom: 8,
  opacity: 0.5,
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: SPACING.cardRadiusLarge,
    borderBottomRightRadius: SPACING.cardRadiusLarge,
    ...SHADOWS.small,
  },
  avatarContainer: { position: 'relative', marginBottom: SPACING.md },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...FONTS.h2, color: COLORS.black },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userName: { ...FONTS.h3, color: COLORS.textPrimary },
  userPhone: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  businessName: {
    ...FONTS.bodySmall,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  creditCard: {
    margin: SPACING.screenPadding,
    backgroundColor: COLORS.cardDark,
  },
  creditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  creditLabel: { ...FONTS.caption, color: COLORS.gray, marginBottom: SPACING.xs },
  creditAmount: { ...FONTS.priceLarge, color: COLORS.white },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.sm,
  },
  viewDetailsText: { ...FONTS.caption, color: COLORS.primary, marginRight: 2 },
  creditProgress: {
    height: 6,
    backgroundColor: COLORS.borderDark,
    borderRadius: 3,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  creditProgressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  creditInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  creditInfoItem: { alignItems: 'center', flex: 1 },
  creditInfoLabel: { ...FONTS.caption, color: COLORS.gray, marginBottom: 2 },
  creditInfoValue: {
    ...FONTS.bodySmall,
    color: COLORS.white,
    fontWeight: '600',
  },
  creditWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.xs,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  creditWarningText: { ...FONTS.caption, color: COLORS.error, flex: 1 },
  menuContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.screenPadding,
    borderRadius: SPACING.cardRadius,
    ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuIconHighlight: { backgroundColor: COLORS.primaryLight + '30' },
  menuItemContent: { flex: 1 },
  menuItemTitle: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  menuItemSubtitle: { ...FONTS.caption, color: COLORS.gray, marginTop: 2 },
  menuItemSubtitleHighlight: { color: COLORS.primary, fontWeight: '500' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    marginHorizontal: SPACING.screenPadding,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.errorLight,
    borderRadius: SPACING.cardRadius,
    gap: SPACING.sm,
  },
  logoutText: { ...FONTS.body, color: COLORS.error, fontWeight: '600' },
  bottomSpacing: { height: SPACING.tabBarHeight + SPACING.xl },
});

export default ProfileScreen;