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
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.navigationRef = null;
  }

  // Set navigation ref for deep linking
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

      // Request if not granted
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
        // Default channel
        await Notifications.setNotificationChannelAsync('default', {
          name: 'General',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#F5C518',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        // Orders channel
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Updates',
          description: 'Notifications about your orders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#F5C518',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        // Payments channel
        await Notifications.setNotificationChannelAsync('payments', {
          name: 'Payment Reminders',
          description: 'Payment due and reminder notifications',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });

        // Promotions channel
        await Notifications.setNotificationChannelAsync('promotions', {
          name: 'Offers & Promotions',
          description: 'Special offers and promotions',
          importance: Notifications.AndroidImportance.LOW,
          sound: null,
          enableVibrate: false,
          showBadge: false,
        });

        console.log('✅ Android notification channels created');
      }

      // ── Get Expo push token ─────────────────────────────────
      // Get projectId safely
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
        // In Expo Go, we can still get a token without projectId
        // but it won't work in standalone builds
      }

      const tokenOptions = projectId ? { projectId } : {};
      const tokenData = await Notifications.getExpoPushTokenAsync(tokenOptions);

      this.expoPushToken = tokenData.data;

      console.log('🔔 Expo Push Token obtained:', this.expoPushToken);
      console.log(
        '📋 Copy this token to test: https://expo.dev/notifications'
      );

      return this.expoPushToken;

    } catch (error) {
      // ── Graceful error handling ─────────────────────────────
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
          console.log('   Body:', notification.request.content.body);
          console.log('   Data:', notification.request.content.data);
        }

        // Update badge count
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

    // Wait for navigation to be ready
    const navigate = () => {
      if (!this.navigationRef?.isReady()) {
        // Retry after 500ms
        setTimeout(navigate, 500);
        return;
      }

      try {
        if (data.orderId) {
          // Deep link to order detail
          this.navigationRef.navigate('OrderDetail', {
            orderId: data.orderId,
          });
          console.log('🔔 Deep linked to OrderDetail:', data.orderId);

        } else if (data.screen) {
          // Generic screen deep link
          this.navigationRef.navigate(data.screen, data.params || {});
          console.log('🔔 Deep linked to screen:', data.screen);

        } else if (data.type === 'payment_reminder') {
          // Navigate to credit summary
          this.navigationRef.navigate('CreditSummary');
          console.log('🔔 Deep linked to CreditSummary');
        }
      } catch (error) {
        console.warn('🔔 Deep link navigation failed:', error.message);
      }
    };

    navigate();
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
      Notifications.removeNotificationSubscription(
        this.notificationListener
      );
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
      body: 'Push notifications are working!',
      data: { type: 'test' },
      seconds: 2,
    });
  }

  // Get stored token
  getToken() {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
export default notificationService;