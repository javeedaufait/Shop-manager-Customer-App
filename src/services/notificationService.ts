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
  async registerTokenWithBackend(lang?: 'en' | 'ml'): Promise<string | null> {
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
        lang,
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
    if (!data) return;

    const rawId = data.order_id || data.orderId;
    if (!rawId) return;

    const orderId = Number(rawId);
    const targetRole = data.target_role || data.user_type || data.userType;
    const isMerchant = targetRole === 'merchant' || data.type === 'merchant_new_order';

    if (isMerchant) {
      navigate('MerchantOrderDetails', { orderId });
    } else {
      navigate('OrderStatus', { orderId });
    }
  },

  /**
   * Foreground notification listeners list.
   */
  _foregroundListeners: new Set<(notification: Notifications.Notification) => void>(),

  /**
   * Subscribe to incoming foreground notifications.
   */
  subscribeToForegroundNotifications(callback: (notification: Notifications.Notification) => void): () => void {
    this._foregroundListeners.add(callback);
    return () => {
      this._foregroundListeners.delete(callback);
    };
  },

  /**
   * Initialize notification listeners (foreground, background tap, token refresh, cold start).
   */
  initNotificationListeners(): () => void {
    // 1. Cold start: check if app was launched directly from a notification tap
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data) {
        this.handleNotificationTap(data);
      }
    });

    // 2. Background/Killed tap: listen for notification tap response
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data) {
        this.handleNotificationTap(data);
      }
    });

    // 3. Foreground arrival: trigger foreground notification handlers
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      this._foregroundListeners.forEach((cb) => {
        try {
          cb(notification);
        } catch (e) {
          console.warn('Error in foreground notification listener:', e);
        }
      });
    });

    // 4. Token refresh listener: auto re-register if Expo rotates token
    const tokenSubscription = Notifications.addPushTokenListener((token) => {
      if (token?.data) {
        this.registerTokenWithBackend();
      }
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
      tokenSubscription.remove();
      this._foregroundListeners.clear();
    };
  },
};
