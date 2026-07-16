import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import ENV from '../config/env';
import { logError } from '../utils/errorHandler';
import Constants from 'expo-constants';

// ============================================================
// CONFIGURE NOTIFICATION BEHAVIOR
// ============================================================
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // ── Determine priority based on notification type ──────
    const data = notification.request.content.data;
    const type = data?.type || '';

    // High priority types — order updates, payment received
    const isHighPriority =
      type === 'order_update'     ||
      type === 'payment_received' ||
      type === 'payment_reminder';

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
      // ✅ iOS priority — ensures banner stays visible longer
      priority: isHighPriority
        ? Notifications.IosNotificationPriority?.HIGH    ?? 'high'
        : Notifications.IosNotificationPriority?.DEFAULT ?? 'default',
    };
  },
});

class NotificationService {
  constructor() {
    this.expoPushToken        = null;
    this.notificationListener = null;
    this.responseListener     = null;
    this.navigationRef        = null;
  }

  // ── Set navigation ref for deep linking ───────────────────
  setNavigationRef(ref) {
    this.navigationRef = ref;
  }

  // ============================================================
  // REGISTER FOR PUSH NOTIFICATIONS
  // ============================================================
  async registerForPushNotifications() {
    if (!ENV.FEATURES.PUSH_NOTIFICATIONS) {
      console.log('🔔 Push notifications disabled in this environment');
      return null;
    }

    if (!Device.isDevice) {
      console.log('🔔 Push notifications require a physical device');
      return null;
    }

    try {
      // ── Check existing permissions ──────────────────────────
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('🔔 Push notification permission denied');
        return null;
      }

      // ── Android notification channels ───────────────────────
      if (Platform.OS === 'android') {
        // ── Default — HIGH so banners actually appear ──────────
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

        // ── Orders — MAX so heads-up banner stays visible ──────
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

        // ── Payments — HIGH ────────────────────────────────────
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

        // ── Promotions — DEFAULT (no heads-up needed) ──────────
        await Notifications.setNotificationChannelAsync('promotions', {
          name:          'Offers & Promotions',
          description:   'Special offers and promotions',
          importance:    Notifications.AndroidImportance.DEFAULT,
          sound:         'default',
          enableVibrate: false,
          showBadge:     true,
        });

        console.log('✅ Android notification channels created');
      }

      // ── Get Expo push token ─────────────────────────────────
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId ||
        null;

      if (!projectId) {
        console.warn(
          '⚠️ No EAS projectId found in app.json. ' +
          'Push token will NOT work in production builds. ' +
          'Run: npx eas init to link your project.'
        );
      }

      const tokenOptions = projectId ? { projectId } : {};
      const tokenData    = await Notifications.getExpoPushTokenAsync(tokenOptions);

      this.expoPushToken = tokenData.data;

      console.log('🔔 Expo Push Token obtained:', this.expoPushToken);
      console.log('📋 Copy this token to test: https://expo.dev/notifications');

      return this.expoPushToken;

    } catch (error) {
      if (error.message?.includes('projectId')) {
        console.warn(
          '⚠️ Push token failed — projectId missing. ' +
          'To fix: run `npx eas init` and add projectId to app.json extra.eas.projectId'
        );
      } else if (error.message?.includes('simulat')) {
        console.log('🔔 Running on simulator — push not available');
      } else {
        logError('NotificationService.register', error);
      }
      return null;
    }
  }

  // ============================================================
  // START LISTENING TO NOTIFICATIONS
  // ============================================================
  startListening(onNotification, onResponse) {
    // ── Foreground: notification received ─────────────────────
    this.notificationListener =
      Notifications.addNotificationReceivedListener((notification) => {
        if (ENV.DEBUG) {
          console.log('🔔 Foreground notification received:');
          console.log('   Title:', notification.request.content.title);
          console.log('   Body:',  notification.request.content.body);
          console.log('   Data:',  notification.request.content.data);
        }

        this.updateBadgeCount();
        onNotification?.(notification);
      });

    // ── Background/killed: user tapped notification ───────────
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        if (ENV.DEBUG) {
          console.log('🔔 Notification tapped by user');
          console.log('   Data:', response.notification.request.content.data);
        }

        this.handleNotificationResponse(response);
        onResponse?.(response);
      });

    console.log('🔔 Notification listeners started');
  }

  // ============================================================
  // HANDLE NOTIFICATION TAP — DEEP LINKING
  // ============================================================
  handleNotificationResponse(response) {
    const data = response?.notification?.request?.content?.data;

    if (!data) return;

    const navigate = () => {
      if (!this.navigationRef?.isReady()) {
        setTimeout(navigate, 500);
        return;
      }

      try {
        // ── Order notification → OrderDetail ───────────────────
        // Push payload sends orderId = MongoDB _id (24 hex chars)
        if (data.orderId) {
          this.navigationRef.navigate('OrderDetail', {
            orderId: data.orderId,
          });
          console.log('🔔 Deep linked to OrderDetail:', data.orderId);
          return;
        }

        // ── Product notification → ProductDetail ───────────────
        // Push payload sends productId directly
        if (data.productId) {
          this.navigationRef.navigate('ProductDetail', {
            productId: data.productId,
          });
          console.log('🔔 Deep linked to ProductDetail:', data.productId);
          return;
        }

        // ── actionUrl-based deep links ─────────────────────────
        if (data.actionUrl) {
          // order:${orderId}
          if (data.actionUrl.startsWith('order:')) {
            const orderId = data.actionUrl.replace('order:', '');
            this.navigationRef.navigate('OrderDetail', { orderId });
            console.log('🔔 Deep linked to OrderDetail via actionUrl:', orderId);
            return;
          }

          // product:${productId}
          if (data.actionUrl.startsWith('product:')) {
            const productId = data.actionUrl.replace('product:', '');
            this.navigationRef.navigate('ProductDetail', { productId });
            console.log('🔔 Deep linked to ProductDetail via actionUrl:', productId);
            return;
          }

          // screen:${ScreenName}
          if (data.actionUrl.startsWith('screen:')) {
            const screen = data.actionUrl.replace('screen:', '');
            this.navigationRef.navigate(screen);
            console.log('🔔 Deep linked to screen via actionUrl:', screen);
            return;
          }
        }

        // ── Type-based fallback deep links ─────────────────────
        if (data.type === 'payment_reminder') {
          this.navigationRef.navigate('CreditSummary');
          console.log('🔔 Deep linked to CreditSummary');
          return;
        }

        if (data.type === 'payment_received') {
          this.navigationRef.navigate('PaymentHistory');
          console.log('🔔 Deep linked to PaymentHistory');
          return;
        }

        if (data.type === 'new_product' || data.type === 'promotional') {
          this.navigationRef.navigate('ProductList', {
            title: data.type === 'new_product' ? 'New Products' : 'Offers',
          });
          console.log('🔔 Deep linked to ProductList');
          return;
        }

        // ── Generic screen param ───────────────────────────────
        if (data.screen) {
          this.navigationRef.navigate(data.screen, data.params || {});
          console.log('🔔 Deep linked to screen:', data.screen);
          return;
        }

      } catch (error) {
        console.warn('🔔 Deep link navigation failed:', error.message);
      }
    };

    // Longer initial delay — ensures navigation stack is mounted
    setTimeout(navigate, 800);
  }

  // ============================================================
  // UPDATE BADGE COUNT
  // ============================================================
  async updateBadgeCount() {
    try {
      const currentBadge = await Notifications.getBadgeCountAsync();
      await Notifications.setBadgeCountAsync(currentBadge + 1);
    } catch (error) {
      // Badge not supported on all devices — silently fail
    }
  }

  // ============================================================
  // CLEAR BADGE
  // ============================================================
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log('🔔 Badge cleared');
    } catch (error) {
      // Silently fail
    }
  }

  // ============================================================
  // STOP LISTENING
  // ============================================================
  stopListening() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }

    console.log('🔔 Notification listeners stopped');
  }

  // ============================================================
  // GET LAST NOTIFICATION (app opened from notification)
  // ============================================================
  async getLastNotificationResponse() {
    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch (error) {
      return null;
    }
  }

  // ============================================================
  // SCHEDULE LOCAL NOTIFICATION (for testing)
  // ============================================================
  async scheduleLocalNotification({ title, body, data = {}, seconds = 2 }) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
        },
        trigger: seconds === 0 ? null : { seconds },
      });
      console.log('🔔 Local notification scheduled:', title);
    } catch (error) {
      console.warn('🔔 Failed to schedule local notification:', error.message);
    }
  }

  // ============================================================
  // TEST PUSH (dev helper)
  // ============================================================
  async sendTestNotification() {
    if (!ENV.DEBUG) return;

    await this.scheduleLocalNotification({
      title: '🎉 Tijara',
      body:  'Push notifications are working!',
      data:  { type: 'test' },
      seconds: 2,
    });
  }

  // ── Get stored token ───────────────────────────────────────
  getToken() {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
export default notificationService;