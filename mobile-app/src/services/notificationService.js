// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import ENV from '../config/env';
import { logError } from '../utils/errorHandler';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    const type = data?.type || '';

    const isHighPriority =
      type === 'order_update'     ||
      type === 'payment_received' ||
      type === 'payment_reminder';

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
      priority: isHighPriority
        ? Notifications.IosNotificationPriority?.HIGH    ?? 'high'
        : Notifications.IosNotificationPriority?.DEFAULT ?? 'default',
    };
  },
});

// ── How many times to retry on transient errors ───────────────
const MAX_TOKEN_RETRIES  = 3;
const RETRY_DELAY_MS     = 30_000; // 30 seconds between retries

// ── Errors we consider transient (safe to retry silently) ─────
const isTransientError = (error) => {
  const msg = error?.message || '';
  return (
    msg.includes('503')                  ||
    msg.includes('SERVICE_UNAVAILABLE')  ||
    msg.includes('temporarily unavailable') ||
    msg.includes('high load')            ||
    msg.includes('Try again')            ||
    msg.includes('isTransient')
  );
};

// ── Errors we should never log (expected / harmless) ──────────
const isSilentError = (error) => {
  const msg = error?.message || '';
  return (
    msg.includes('projectId') ||
    msg.includes('simulat')   ||
    isTransientError(error)     // transient = log at DEBUG level only, not as ERROR
  );
};

class NotificationService {
  constructor() {
    this.expoPushToken        = null;
    this.notificationListener = null;
    this.responseListener     = null;
    this.navigationRef        = null;
    this._retryTimeout        = null; // holds the retry timer so we can cancel it
    this._retryCount          = 0;
  }

  setNavigationRef(ref) {
    this.navigationRef = ref;
  }

  // ── Public entry point ─────────────────────────────────────
  async registerForPushNotifications() {
    if (!ENV.FEATURES.PUSH_NOTIFICATIONS) return null;
    if (!Device.isDevice)                 return null;

    this._retryCount = 0;
    return this._attemptRegistration();
  }

  // ── Internal: single attempt + retry scheduling ────────────
  async _attemptRegistration() {
    try {
      // ── 1. Permissions ──────────────────────────────────────
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return null;

      // ── 2. Android notification channels ────────────────────
      if (Platform.OS === 'android') {
        await this._setupAndroidChannels();
      }

      // ── 3. Fetch push token ──────────────────────────────────
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId             ||
        null;

      const tokenOptions = projectId ? { projectId } : {};
      const tokenData    = await Notifications.getExpoPushTokenAsync(tokenOptions);

      this.expoPushToken = tokenData.data;
      this._retryCount   = 0; // success — reset counter

      return this.expoPushToken;

    } catch (error) {
      if (isTransientError(error)) {
        // ── Transient: schedule a quiet retry ──────────────────
        if (this._retryCount < MAX_TOKEN_RETRIES) {
          this._retryCount++;
          const delay = RETRY_DELAY_MS * this._retryCount; // 30s, 60s, 90s

          if (__DEV__) {
            console.debug(
              `[NotificationService] Expo token fetch failed (transient). ` +
              `Retry ${this._retryCount}/${MAX_TOKEN_RETRIES} in ${delay / 1000}s.`
            );
          }

          // Clear any existing retry timer before scheduling a new one
          if (this._retryTimeout) clearTimeout(this._retryTimeout);

          this._retryTimeout = setTimeout(() => {
            this._attemptRegistration();
          }, delay);

        } else {
          // Gave up after MAX retries — log quietly in dev only
          if (__DEV__) {
            console.debug(
              '[NotificationService] Expo push token unavailable after ' +
              `${MAX_TOKEN_RETRIES} retries (Expo server busy). ` +
              'Push notifications will not work this session.'
            );
          }
        }

        return null; // Don't propagate — not our bug
      }

      // ── Non-transient, non-silent: log properly ────────────
      if (!isSilentError(error)) {
        logError('NotificationService.register', error);
      }

      return null;
    }
  }

  // ── Android channels ───────────────────────────────────────
  async _setupAndroidChannels() {
    await Notifications.setNotificationChannelAsync('default', {
      name:             'General',
      importance:       Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#F5C518',
      sound:            'default',
      enableVibrate:    true,
      showBadge:        true,
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility?.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync('orders', {
      name:             'Order Updates',
      description:      'Notifications about your orders',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#F5C518',
      sound:            'default',
      enableVibrate:    true,
      showBadge:        true,
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility?.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync('payments', {
      name:          'Payment Reminders',
      description:   'Payment due and reminder notifications',
      importance:    Notifications.AndroidImportance.HIGH,
      sound:         'default',
      enableVibrate: true,
      showBadge:     true,
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility?.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync('promotions', {
      name:          'Offers & Promotions',
      description:   'Special offers and promotions',
      importance:    Notifications.AndroidImportance.DEFAULT,
      sound:         'default',
      enableVibrate: false,
      showBadge:     true,
    });
  }

  // ── Listeners ──────────────────────────────────────────────
  startListening(onNotification, onResponse) {
    this.notificationListener =
      Notifications.addNotificationReceivedListener((notification) => {
        this.updateBadgeCount();
        onNotification?.(notification);
      });

    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        this.handleNotificationResponse(response);
        onResponse?.(response);
      });
  }

  handleNotificationResponse(response) {
    const data = response?.notification?.request?.content?.data;
    if (!data) return;

    const navigate = () => {
      if (!this.navigationRef?.isReady()) {
        setTimeout(navigate, 500);
        return;
      }

      try {
        if (data.orderId) {
          this.navigationRef.navigate('OrderDetail', { orderId: data.orderId });
          return;
        }

        if (data.productId) {
          this.navigationRef.navigate('ProductDetail', { productId: data.productId });
          return;
        }

        if (data.actionUrl) {
          if (data.actionUrl.startsWith('order:')) {
            this.navigationRef.navigate('OrderDetail', {
              orderId: data.actionUrl.replace('order:', ''),
            });
            return;
          }
          if (data.actionUrl.startsWith('product:')) {
            this.navigationRef.navigate('ProductDetail', {
              productId: data.actionUrl.replace('product:', ''),
            });
            return;
          }
          if (data.actionUrl.startsWith('screen:')) {
            this.navigationRef.navigate(data.actionUrl.replace('screen:', ''));
            return;
          }
        }

        if (data.type === 'payment_reminder') {
          this.navigationRef.navigate('CreditSummary');
          return;
        }
        if (data.type === 'payment_received') {
          this.navigationRef.navigate('PaymentHistory');
          return;
        }
        if (data.type === 'new_product' || data.type === 'promotional') {
          this.navigationRef.navigate('ProductList', {
            title: data.type === 'new_product' ? 'New Products' : 'Offers',
          });
          return;
        }

        if (data.screen) {
          this.navigationRef.navigate(data.screen, data.params || {});
        }

      } catch {
        // Navigation failed — silently ignore
      }
    };

    setTimeout(navigate, 800);
  }

  // ── Badge ──────────────────────────────────────────────────
  async updateBadgeCount() {
    try {
      const current = await Notifications.getBadgeCountAsync();
      await Notifications.setBadgeCountAsync(current + 1);
    } catch {
      // Not supported on all devices
    }
  }

  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch {
      // Silently fail
    }
  }

  // ── Cleanup ────────────────────────────────────────────────
  stopListening() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }

    // Cancel any pending retry timer
    if (this._retryTimeout) {
      clearTimeout(this._retryTimeout);
      this._retryTimeout = null;
    }
  }

  // ── Helpers ────────────────────────────────────────────────
  async getLastNotificationResponse() {
    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch {
      return null;
    }
  }

  async scheduleLocalNotification({ title, body, data = {}, seconds = 2 }) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data, sound: 'default', badge: 1 },
        trigger: seconds === 0 ? null : { seconds },
      });
    } catch {
      // Silently fail
    }
  }

  async sendTestNotification() {
    if (!ENV.DEBUG) return;
    await this.scheduleLocalNotification({
      title:   '🎉 Tijara',
      body:    'Push notifications are working!',
      data:    { type: 'test' },
      seconds: 2,
    });
  }

  getToken() {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
export default notificationService;