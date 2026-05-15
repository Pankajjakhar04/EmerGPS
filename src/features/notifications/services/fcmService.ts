// FCM Notification service
import { Platform } from 'react-native';
import { supabase } from '@/config/supabase';
import { AuthService } from '@/features/auth/services/authService';
import { NOTIFICATION_CHANNELS } from '@/config/constants';

export const NotificationService = {
  /**
   * Initialize FCM and register token
   */
  async initialize(userId: string): Promise<void> {
    try {
      const messaging = require('@react-native-firebase/messaging').default;

      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        if (__DEV__) console.log('[FCM] Permission denied');
        return;
      }

      // Get FCM token
      const token = await messaging().getToken();
      if (token) {
        await AuthService.updateFCMToken(userId, token);
      }

      // Listen for token refresh
      messaging().onTokenRefresh(async (newToken: string) => {
        await AuthService.updateFCMToken(userId, newToken);
      });

      // Setup notification channels (Android)
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Handle foreground messages
      messaging().onMessage(async (remoteMessage: any) => {
        if (__DEV__) console.log('[FCM] Foreground message:', remoteMessage);
        // Display local notification
      });
    } catch (error) {
      if (__DEV__) console.warn('[FCM] Init error:', error);
    }
  },

  /**
   * Setup Android notification channels
   */
  async setupAndroidChannels(): Promise<void> {
    try {
      const notifee = require('@notifee/react-native').default;

      await notifee.createChannel({
        id: NOTIFICATION_CHANNELS.EMERGENCY,
        name: 'Emergency Alerts',
        importance: 5, // HIGH
        vibration: true,
        vibrationPattern: [0, 250, 250, 250, 250, 500],
        sound: 'default',
      });

      await notifee.createChannel({
        id: NOTIFICATION_CHANNELS.TRACKING,
        name: 'Tracking Updates',
        importance: 3, // DEFAULT
        vibration: true,
      });

      await notifee.createChannel({
        id: NOTIFICATION_CHANNELS.GENERAL,
        name: 'General Notifications',
        importance: 2, // LOW
      });
    } catch {
      // notifee may not be installed yet
    }
  },

  /**
   * Send local notification
   */
  async showLocalNotification(
    title: string,
    body: string,
    channelId: string = NOTIFICATION_CHANNELS.GENERAL,
  ): Promise<void> {
    try {
      const notifee = require('@notifee/react-native').default;
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId,
          pressAction: { id: 'default' },
        },
      });
    } catch {
      // Fallback if notifee not available
    }
  },

  /**
   * Send emergency notification via Edge Function
   */
  async sendEmergencyPush(
    sessionId: string,
    title: string,
    body: string,
  ): Promise<void> {
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          session_id: sessionId,
          type: 'emergency',
          title,
          body,
          priority: 'high',
        },
      });
    } catch (error) {
      if (__DEV__) console.warn('[FCM] Push error:', error);
    }
  },
};

export default NotificationService;
