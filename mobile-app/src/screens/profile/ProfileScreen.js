import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Card } from '../../components/common';
import { useAuthStore } from '../../store';
import { formatCurrency, getInitials } from '../../utils/helpers';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();

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
      subtitle: `Available Credit: ${formatCurrency(user?.availableCredit || 0)}`,
      onPress: () => navigation.navigate('CreditSummary'),
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
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
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
          {user?.businessName && (
            <Text style={styles.businessName}>{user?.businessName}</Text>
          )}
        </View>

        {/* Credit Card */}
        <Card style={styles.creditCard}>
          <View style={styles.creditHeader}>
            <View>
              <Text style={styles.creditLabel}>Available Credit</Text>
              <Text style={styles.creditAmount}>
                {formatCurrency(user?.availableCredit || 0)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => navigation.navigate('CreditSummary')}
            >
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.creditProgress}>
            <View 
              style={[
                styles.creditProgressBar, 
                { width: `${user?.creditUtilization || 0}%` }
              ]} 
            />
          </View>
          <View style={styles.creditInfo}>
            <Text style={styles.creditInfoText}>
              Pending: {formatCurrency(user?.pendingAmount || 0)}
            </Text>
            <Text style={styles.creditInfoText}>
              Limit: {formatCurrency(user?.creditLimit || 0)}
            </Text>
          </View>
        </Card>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={22} color={COLORS.textPrimary} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
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
  },
  viewDetailsText: {
    ...FONTS.bodySmall,
    color: COLORS.primary,
  },
  creditProgress: {
    height: 6,
    backgroundColor: COLORS.borderDark,
    borderRadius: 3,
    marginBottom: SPACING.sm,
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
  creditInfoText: {
    ...FONTS.caption,
    color: COLORS.gray,
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