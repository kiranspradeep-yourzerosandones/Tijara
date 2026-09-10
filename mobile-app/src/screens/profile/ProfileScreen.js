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
import { deleteAccount } from '../../api/auth';
import { handleApiError } from '../../api/client';
import { formatCurrency, getInitials } from '../../utils/helpers';

// ─── Custom Modal Component (Custom Styled for both Alerts & Confirmations) ───
const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmText = 'OK',
  cancelText = null,
  confirmColor = COLORS.primary,
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

  if (!visible) return null;

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
                { backgroundColor: (iconColor || confirmColor) + '15' },
              ]}
            >
              <Ionicons name={icon} size={32} color={iconColor || confirmColor} />
            </View>
          )}
          <Text style={dialogStyles.title}>{title}</Text>
          <Text style={dialogStyles.message}>{message}</Text>

          <View style={dialogStyles.buttonsRow}>
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
                !cancelText && { flex: 1, marginLeft: 0 },
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: SPACING.lg,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: COLORS.white,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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

  // Unified Custom Modal State
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: null,
    confirmColor: COLORS.primary,
    icon: null,
    iconColor: null,
    onConfirm: () => {},
    onCancel: () => {},
  });

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

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }));
  };

  // Helper: Open Confirmation Dialog (Two Buttons)
  const openConfirmDialog = ({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = COLORS.error,
    icon = 'help-circle-outline',
    iconColor = COLORS.error,
    onConfirm,
  }) => {
    setModalConfig({
      visible: true,
      title,
      message,
      confirmText,
      cancelText,
      confirmColor,
      icon,
      iconColor,
      onConfirm: () => {
        closeModal();
        if (onConfirm) onConfirm();
      },
      onCancel: closeModal,
    });
  };

  // Helper: Open Alert Notice Dialog (Single OK Button)
  const openAlertDialog = ({
    title,
    message,
    confirmText = 'OK',
    confirmColor = COLORS.primary,
    icon = 'alert-circle-outline',
    iconColor = COLORS.primary,
    onConfirm,
  }) => {
    setModalConfig({
      visible: true,
      title,
      message,
      confirmText,
      cancelText: null,
      confirmColor,
      icon,
      iconColor,
      onConfirm: () => {
        closeModal();
        if (onConfirm) onConfirm();
      },
      onCancel: closeModal,
    });
  };

  // ── Handlers ──
  const handleLogoutPrompt = () => {
    openConfirmDialog({
      title: 'Logout?',
      message: 'Are you sure you want to logout from your account?',
      confirmText: 'Logout',
      cancelText: 'Stay',
      confirmColor: COLORS.error,
      icon: 'log-out-outline',
      iconColor: COLORS.error,
      onConfirm: async () => await logout(),
    });
  };

  const handleDeletePrompt = () => {
    openConfirmDialog({
      title: 'Permanently Delete Account?',
      message:
        'This action is completely irreversible. All of your addresses, orders, and credit details will be permanently erased.',
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      confirmColor: COLORS.error,
      icon: 'trash-outline',
      iconColor: COLORS.error,
      onConfirm: processAccountDeletion,
    });
  };

  const processAccountDeletion = async () => {
    try {
      setIsLoading(true);
      const response = await deleteAccount();

      if (response.success) {
        openAlertDialog({
          title: 'Account Deleted',
          message:
            'Your account and all associated personal data have been permanently removed.',
          confirmText: 'OK',
          confirmColor: COLORS.primary,
          icon: 'checkmark-circle-outline',
          iconColor: COLORS.success,
          onConfirm: async () => await logout(),
        });
      } else {
        openAlertDialog({
          title: 'Unable to Delete',
          message:
            response.message ||
            'Something went wrong while trying to delete your account.',
          confirmText: 'OK',
          confirmColor: COLORS.error,
          icon: 'alert-circle-outline',
          iconColor: COLORS.error,
        });
      }
    } catch (error) {
      console.log('Delete account blocked:', handleApiError(error));
      openAlertDialog({
        title: 'Unable to Delete Account',
        message: handleApiError(error),
        confirmText: 'OK',
        confirmColor: COLORS.error,
        icon: 'alert-circle-outline',
        iconColor: COLORS.error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const availableCredit =
    creditData?.availableCredit ?? user?.availableCredit ?? 0;
  const creditLimit = creditData?.creditLimit ?? user?.creditLimit ?? 0;
  const pendingAmount = creditData?.pendingAmount ?? user?.pendingAmount ?? 0;
  const creditUtilization =
    creditData?.creditUtilization ?? user?.creditUtilization ?? 0;
  const creditBalance = creditData?.creditBalance ?? user?.creditBalance ?? 0;

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
      subtitle:
        creditBalance > 0
          ? `Credit: ${formatCurrency(creditBalance)}`
          : `Available: ${formatCurrency(availableCredit)}`,
      onPress: () => navigation.navigate('CreditSummary'),
      highlight: pendingAmount > 0,
      hasCredit: creditBalance > 0,
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
      subtitle: 'Manage notification settings',
      onPress: () => navigation.navigate('NotificationPreferences'),
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
    {
      icon: 'trash-outline',
      title: 'Delete Account',
      subtitle: 'Permanently delete your account and data',
      onPress: handleDeletePrompt,
      isDanger: true,
    },
  ];

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
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
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

            {creditBalance > 0 && (
              <View style={styles.creditBalanceRow}>
                <View style={styles.creditBalanceLeft}>
                  <Ionicons
                    name="wallet-outline"
                    size={14}
                    color={COLORS.success}
                  />
                  <Text style={styles.creditBalanceLabel}>Credit Balance</Text>
                </View>
                <Text style={styles.creditBalanceValue}>
                  {formatCurrency(creditBalance)}
                </Text>
              </View>
            )}

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
                    item.hasCredit && styles.menuIconCredit,
                    item.isDanger && { backgroundColor: COLORS.errorLight },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={
                      item.isDanger
                        ? COLORS.error
                        : item.hasCredit
                        ? COLORS.success
                        : item.highlight
                        ? COLORS.error
                        : COLORS.textPrimary
                    }
                  />
                </View>
                <View style={styles.menuItemContent}>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      item.isDanger && {
                        color: COLORS.error,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      item.highlight && styles.menuItemSubtitleHighlight,
                      item.hasCredit && styles.menuItemSubtitleCredit,
                      item.isDanger && { color: COLORS.error + '95' },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={item.isDanger ? COLORS.error + '80' : COLORS.gray}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPrompt}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Single Unified Custom Dialog Component */}
      <ConfirmDialog {...modalConfig} />
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
  creditLabel: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  creditAmount: { ...FONTS.priceLarge, color: COLORS.white },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: SPACING.sm,
  },
  viewDetailsText: {
    ...FONTS.caption,
    color: COLORS.primary,
    marginRight: 2,
  },
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
  creditInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  creditInfoItem: { alignItems: 'center', flex: 1 },
  creditInfoLabel: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginBottom: 2,
  },
  creditInfoValue: {
    ...FONTS.bodySmall,
    color: COLORS.white,
    fontWeight: '600',
  },
  creditBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.white + '15',
  },
  creditBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  creditBalanceLabel: {
    ...FONTS.caption,
    color: COLORS.success,
    fontWeight: '600',
  },
  creditBalanceValue: {
    ...FONTS.bodySmall,
    color: COLORS.success,
    fontWeight: '700',
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
  creditWarningText: {
    ...FONTS.caption,
    color: COLORS.error,
    flex: 1,
  },
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
  menuIconHighlight: {
    backgroundColor: COLORS.primaryLight + '30',
  },
  menuIconCredit: {
    backgroundColor: COLORS.success + '20',
  },
  menuItemContent: { flex: 1 },
  menuItemTitle: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  menuItemSubtitle: {
    ...FONTS.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  menuItemSubtitleHighlight: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  menuItemSubtitleCredit: {
    color: COLORS.success,
    fontWeight: '600',
  },
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
  logoutText: {
    ...FONTS.body,
    color: COLORS.error,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: SPACING.tabBarHeight + SPACING.xl,
  },
});

export default ProfileScreen;