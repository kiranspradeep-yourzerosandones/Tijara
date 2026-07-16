// src/screens/profile/NotificationPreferencesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SHADOWS } from '../../theme';
import { Screen } from '../../components/common';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  updatePushToken,
} from '../../api/auth';
import notificationService from '../../services/notificationService';
import { useAuthStore } from '../../store';

// ── Single preference row ──────────────────────────────────
const PrefRow = ({ icon, title, subtitle, value, onToggle, disabled = false }) => (
  <View style={[styles.prefRow, disabled && styles.prefRowDisabled]}>
    <View style={styles.prefLeft}>
      <View style={[styles.prefIcon, disabled && styles.prefIconDisabled]}>
        <Ionicons
          name={icon}
          size={20}
          color={disabled ? COLORS.gray : COLORS.textPrimary}
        />
      </View>
      <View style={styles.prefContent}>
        <Text style={[styles.prefTitle, disabled && styles.prefTitleDisabled]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.prefSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      disabled={disabled}
      trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
      thumbColor={value ? COLORS.primary : COLORS.gray}
      ios_backgroundColor={COLORS.border}
    />
  </View>
);

// ── Section header ─────────────────────────────────────────
const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

// ── Main screen ────────────────────────────────────────────
const NotificationPreferencesScreen = ({ navigation }) => {
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [prefs, setPrefs] = useState({
    pushEnabled:          true,
    inAppEnabled:         true,
    orderUpdates:         true,
    paymentNotifications: true,
    promotions:           true,
    announcements:        true,
  });

  const [isLoading,  setIsLoading]  = useState(true);
  const [isSaving,   setIsSaving]   = useState(false);
  const [saveError,  setSaveError]  = useState(null);
  const [saveSuccess,setSaveSuccess]= useState(false);

  // ── Load preferences on mount ──────────────────────────
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await getNotificationPreferences();
      if (response.success && response.data?.preferences) {
        setPrefs(response.data.preferences);
      }
    } catch (error) {
      console.error('Load preferences error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Toggle a single preference and save immediately ────
  const handleToggle = useCallback(async (key, value) => {
    // Optimistic update
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSaveError(null);
    setSaveSuccess(false);

    try {
      setIsSaving(true);

      // ── Master push toggle — update push token on backend ──
      if (key === 'pushEnabled') {
        if (!value) {
          // Turning push OFF — clear token from backend
          try {
            await updatePushToken(null);
            console.log('🔔 Push token cleared');
          } catch (err) {
            console.warn('⚠️ Failed to clear push token:', err.message);
          }
        } else {
          // Turning push ON — re-register and send token
          try {
            const token = await notificationService.registerForPushNotifications();
            if (token) {
              await updatePushToken(token);
              console.log('🔔 Push token restored');
            }
          } catch (err) {
            console.warn('⚠️ Failed to restore push token:', err.message);
          }
        }
      }

      // ── Save preference to backend ──────────────────────
      await updateNotificationPreferences({ [key]: value });

      // Refresh user in store so ProfileScreen credit card etc stay fresh
      refreshUser();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

    } catch (error) {
      console.error('Save preference error:', error);
      // Revert optimistic update
      setPrefs((prev) => ({ ...prev, [key]: !value }));
      setSaveError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Category toggles are disabled when their master is off
  const pushDisabled  = !prefs.pushEnabled;
  const inAppDisabled = !prefs.inAppEnabled;

  // A category is "effectively disabled" if BOTH channels are off
  const categoryDisabled = pushDisabled && inAppDisabled;

  if (isLoading) {
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
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={COLORS.backgroundLight}>
      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {/* Saving indicator */}
        <View style={styles.headerRight}>
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : saveSuccess ? (
            <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
          ) : null}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Error banner ─────────────────────────────── */}
        {saveError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color={COLORS.error} />
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        )}

        {/* ── Master toggles section ───────────────────── */}
        <SectionHeader title="DELIVERY CHANNELS" />
        <View style={styles.card}>
          <PrefRow
            icon="phone-portrait-outline"
            title="Push Notifications"
            subtitle="Receive alerts on your device"
            value={prefs.pushEnabled}
            onToggle={(v) => handleToggle('pushEnabled', v)}
          />
          <View style={styles.divider} />
          <PrefRow
            icon="notifications-outline"
            title="In-App Notifications"
            subtitle="Show in notification bell"
            value={prefs.inAppEnabled}
            onToggle={(v) => handleToggle('inAppEnabled', v)}
          />
        </View>

        {/* ── Info banner when everything off ─────────── */}
        {categoryDisabled && (
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.infoText}>
              All notifications are muted. Enable Push or In-App to receive
              notifications.
            </Text>
          </View>
        )}

        {/* ── Category preferences ─────────────────────── */}
        <SectionHeader title="NOTIFICATION TYPES" />
        <View style={styles.card}>
          <PrefRow
            icon="receipt-outline"
            title="Orders"
            subtitle="Confirmations, packing, shipping, delivery"
            value={prefs.orderUpdates}
            onToggle={(v) => handleToggle('orderUpdates', v)}
            disabled={categoryDisabled}
          />
          <View style={styles.divider} />
          <PrefRow
            icon="card-outline"
            title="Payments"
            subtitle="Reminders and payment confirmations"
            value={prefs.paymentNotifications}
            onToggle={(v) => handleToggle('paymentNotifications', v)}
            disabled={categoryDisabled}
          />
          <View style={styles.divider} />
          <PrefRow
            icon="megaphone-outline"
            title="Announcements"
            subtitle="Important updates from Tijara"
            value={prefs.announcements}
            onToggle={(v) => handleToggle('announcements', v)}
            disabled={categoryDisabled}
          />
          <View style={styles.divider} />
          <PrefRow
            icon="pricetag-outline"
            title="Promotions"
            subtitle="Offers, discounts and new products"
            value={prefs.promotions}
            onToggle={(v) => handleToggle('promotions', v)}
            disabled={categoryDisabled}
          />
        </View>

        {/* ── Footer note ──────────────────────────────── */}
        <Text style={styles.footerNote}>
          Changes are saved automatically. Your preferences are synced across
          all your devices.
        </Text>
      </ScrollView>
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
  backButton: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: COLORS.card,
    alignItems:      'center',
    justifyContent:  'center',
  },
  title:       { ...FONTS.h4, color: COLORS.textPrimary },
  headerRight: {
    width:          40,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // ── Loading ──────────────────────────────────────────────
  loadingContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // ── Scroll ───────────────────────────────────────────────
  scrollContent: {
    padding:       SPACING.screenPadding,
    paddingBottom: SPACING.xxxl,
  },

  // ── Section header ───────────────────────────────────────
  sectionHeader: {
    fontSize:      11,
    fontWeight:    '700',
    color:         COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom:  SPACING.sm,
    marginTop:     SPACING.lg,
    marginLeft:    SPACING.xs,
  },

  // ── Card ─────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.white,
    borderRadius:    14,
    overflow:        'hidden',
    ...SHADOWS.small,
  },

  // ── Pref row ─────────────────────────────────────────────
  prefRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACING.cardPadding,
    paddingVertical:   SPACING.md,
  },
  prefRowDisabled: { opacity: 0.45 },
  prefLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
    marginRight:   SPACING.md,
  },
  prefIcon: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: COLORS.card,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     SPACING.md,
  },
  prefIconDisabled: { backgroundColor: COLORS.backgroundLight },
  prefContent:      { flex: 1 },
  prefTitle: {
    ...FONTS.body,
    color:      COLORS.textPrimary,
    fontWeight: '500',
  },
  prefTitleDisabled: { color: COLORS.textSecondary },
  prefSubtitle: {
    ...FONTS.caption,
    color:   COLORS.gray,
    marginTop: 2,
  },

  // ── Divider ──────────────────────────────────────────────
  divider: {
    height:           1,
    backgroundColor:  COLORS.borderLight,
    marginHorizontal: SPACING.cardPadding,
  },

  // ── Banners ──────────────────────────────────────────────
  errorBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.errorLight,
    borderRadius:    10,
    padding:         SPACING.md,
    marginBottom:    SPACING.sm,
    gap:             SPACING.sm,
  },
  errorText: {
    ...FONTS.bodySmall,
    color: COLORS.error,
    flex:  1,
  },
  infoBanner: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: COLORS.backgroundLight,
    borderRadius:    10,
    padding:         SPACING.md,
    marginTop:       SPACING.sm,
    gap:             SPACING.sm,
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  infoText: {
    ...FONTS.bodySmall,
    color:      COLORS.textSecondary,
    flex:       1,
    lineHeight: 18,
  },

  // ── Footer ───────────────────────────────────────────────
  footerNote: {
    ...FONTS.caption,
    color:      COLORS.gray,
    textAlign:  'center',
    marginTop:  SPACING.xl,
    lineHeight: 18,
    paddingHorizontal: SPACING.lg,
  },
});

export default NotificationPreferencesScreen;