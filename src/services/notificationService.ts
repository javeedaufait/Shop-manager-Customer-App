import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationApi } from '../api/notificationApi';
import { storageService } from './storageService';
import { navigate } from '../navigation/navigationRef';

const PUSH_TOKEN_STORAGE_KEY = '@nearmart_expo_push_token';
const NOTIFICATION_CHANNEL_ID = 'nearmart_orders';

// Configure default in-app foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Set up Android high-priority notification channel.
   */
  async setupNotificationChannelAsync(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
          name: 'NearMart Order Updates',
          description: 'Instant alerts for order fulfillment and pickup readiness',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16a34a',
          sound: 'default',
        });
      } catch (err) {
        console.warn('Failed to configure Android notification channel:', err);
      }
    }
  },

  /**
   * Request permissions and retrieve Expo push token.
   * Returns token string or null if unavailable/denied.
   */
  async getExpoPushTokenAsync(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications are only supported on physical devices.');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions were not granted by user.');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch (error) {
      console.warn('Error obtaining Expo push token:', error);
      return null;
    }
  },

  /**
   * Register or refresh push token against authenticated user in backend.
   */
  async registerTokenWithBackend(): Promise<string | null> {
    await this.setupNotificationChannelAsync();

    const token = await this.getExpoPushTokenAsync();
    if (!token) {
      return null;
    }

    try {
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
      const deviceId = `${Device.brand || 'Device'}_${Device.modelName || 'Model'}_${Device.osBuildId || ''}`.replace(/\s+/g, '_');

      await notificationApi.registerToken({
        token,
        platform,
        device_id: deviceId,
      });

      // Save token locally
      await storageService.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      console.log('[NotificationService] Push token successfully registered with NearMart backend.');
      return token;
    } catch (err: any) {
      console.log('[NotificationService] Push token registered locally, backend sync note:', err?.message || err);
      return token;
    }
  },

  /**
   * Deregister push token from backend upon logout.
   */
  async deregisterTokenOnLogout(): Promise<void> {
    try {
      const savedToken = await storageService.getItem(PUSH_TOKEN_STORAGE_KEY);
      if (savedToken) {
        await notificationApi.deregisterToken(savedToken);
        await storageService.removeItem(PUSH_TOKEN_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Error deregistering push token:', e);
    }
  },

  /**
   * Deep-link notification tap handler.
   */
  handleNotificationTap(data: any): void {
    if (!data || !data.order_id) {
      return;
    }

    const orderId = Number(data.order_id);
    const targetRole = data.target_role;

    if (targetRole === 'merchant' || data.type === 'merchant_new_order') {
      navigate('MerchantOrderDetails', { orderId });
    } else {
      navigate('OrderStatus', { orderId });
    }
  },

  /**
   * Initialize notification listeners (foreground and background tap response).
   */
  initNotificationListeners(): () => void {
    // 1. Check if app was launched from a notification tap
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification?.request?.content?.data) {
        this.handleNotificationTap(response.notification.request.content.data);
      }
    });

    // 2. Listen for notification taps while app is running / in background
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data) {
        this.handleNotificationTap(data);
      }
    });

    return () => {
      subscription.remove();
    };
  },
};
