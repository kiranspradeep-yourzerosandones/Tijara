// src/screens/profile/ProfileScreen.js
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Card, Screen, Loading } from '../../components/common';
import { useAuthStore } from '../../store';
import { paymentsAPI } from '../../api';
import { formatCurrency, getInitials } from '../../utils/helpers';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, refreshUser } = useAuthStore();
  const [creditData, setCreditData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch credit summary when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCreditData();
    }, [])
  );

  const fetchCreditData = async () => {
    try {
      // Also refresh user profile
      refreshUser();
      
      // Fetch credit summary
      const response = await paymentsAPI.getCreditSummary();
      if (response.success && response.data?.creditSummary) {
        setCreditData(response.data.creditSummary);
      }
    } catch (error) {
      console.error('Fetch credit data error:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCreditData();
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  // Use credit data from API or fallback to user object
  const availableCredit = creditData?.availableCredit ?? user?.availableCredit ?? 0;
  const creditLimit = creditData?.creditLimit ?? user?.creditLimit ?? 0;
  const pendingAmount = creditData?.pendingAmount ?? user?.pendingAmount ?? 0;
  const creditUtilization = creditData?.creditUtilization ?? user?.creditUtilization ?? 0;

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
      onPress: () => Alert.alert('Support', 'Contact: +91 98765 43210'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version 1.0.0',
      onPress: () => {},
    },
  ];

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
                <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
              </View>
            </View>
            
            <View style={styles.creditProgress}>
              <View 
                style={[
                  styles.creditProgressBar, 
                  { 
                    width: `${Math.min(creditUtilization, 100)}%`,
                    backgroundColor: creditUtilization > 80 ? COLORS.warning : COLORS.primary
                  }
                ]} 
              />
            </View>
            
            <View style={styles.creditInfo}>
              <View style={styles.creditInfoItem}>
                <Text style={styles.creditInfoLabel}>Pending</Text>
                <Text style={[
                  styles.creditInfoValue,
                  pendingAmount > 0 && { color: COLORS.warning }
                ]}>
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

            {/* Warning if credit blocked */}
            {creditData?.isCreditBlocked && (
              <View style={styles.creditWarning}>
                <Ionicons name="warning" size={16} color={COLORS.error} />
                <Text style={styles.creditWarningText}>
                  Credit blocked - Contact support
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
                index === menuItems.length - 1 && styles.menuItemLast
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={[
                  styles.menuIcon,
                  item.highlight && styles.menuIconHighlight
                ]}>
                  <Ionicons 
                    name={item.icon} 
                    size={22} 
                    color={item.highlight ? COLORS.primary : COLORS.textPrimary} 
                  />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={[
                    styles.menuItemSubtitle,
                    item.highlight && styles.menuItemSubtitleHighlight
                  ]}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: SPACING.cardRadiusLarge,
    borderBottomRightRadius: SPACING.cardRadiusLarge,
    ...SHADOWS.small,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...FONTS.h2,
    color: COLORS.black,
  },
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
  userName: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
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
  creditAmount: {
    ...FONTS.priceLarge,
    color: COLORS.white,
  },
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
  creditInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
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
  menuItemLast: {
    borderBottomWidth: 0,
  },
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
  menuItemContent: {
    flex: 1,
  },
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