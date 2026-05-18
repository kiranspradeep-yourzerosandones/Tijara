// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import ENV from '../config/env';
import { logError } from '../utils/errorHandler';

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
      // Check existing permissions
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

      // Android channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Tijara Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#F5C518',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Order Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#F5C518',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('payments', {
          name: 'Payment Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        });
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.expoPushToken = tokenData.data;

      if (ENV.DEBUG) {
        console.log('🔔 Expo Push Token:', this.expoPushToken);
      }

      return this.expoPushToken;
    } catch (error) {
      logError('NotificationService.register', error);
      return null;
    }
  }

  // ============================================================
  // START LISTENING TO NOTIFICATIONS
  // ============================================================
  startListening(onNotification, onResponse) {
    // Notification received while app is in foreground
    this.notificationListener =
      Notifications.addNotificationReceivedListener((notification) => {
        if (ENV.DEBUG) {
          console.log('🔔 Notification received:', notification);
        }
        onNotification?.(notification);
      });

    // User tapped on notification
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        if (ENV.DEBUG) {
          console.log('🔔 Notification tapped:', response);
        }
        this.handleNotificationResponse(response);
        onResponse?.(response);
      });
  }

  // ============================================================
  // HANDLE NOTIFICATION TAP (DEEP LINKING)
  // ============================================================
  handleNotificationResponse(response) {
    const data = response.notification.request.content.data;

    if (!this.navigationRef?.isReady()) return;

    // Navigate based on notification type
    if (data?.orderId) {
      this.navigationRef.navigate('OrderDetail', { orderId: data.orderId });
    } else if (data?.screen) {
      this.navigationRef.navigate(data.screen, data.params || {});
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
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // ============================================================
  // GET LAST NOTIFICATION (app opened from notification)
  // ============================================================
  async getLastNotificationResponse() {
    return await Notifications.getLastNotificationResponseAsync();
  }

  // ============================================================
  // SCHEDULE LOCAL NOTIFICATION (for testing)
  // ============================================================
  async scheduleLocalNotification({ title, body, data = {}, seconds = 1 }) {
    if (ENV.DEBUG) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: { seconds },
      });
    }
  }

  // ============================================================
  // CLEAR BADGE
  // ============================================================
  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }

  // Get stored token
  getToken() {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
export default notificationService;