// Emergency service — handles emergency mode activation and notifications
import { supabase } from '@/config/supabase';
import { TrackingService } from '@/features/tracking/services/trackingService';
import { realtimeService } from '@/services/realtimeService';
import { EMERGENCY_MESSAGE_TEMPLATE } from '@/config/constants';
import { generateOSMLink } from '@/utils/geo';
import type { Coordinates } from '@/types/location';

export const EmergencyService = {
  /**
   * Activate emergency mode
   */
  async activate(
    userId: string,
    sessionId: string,
    currentLocation: Coordinates | null,
  ): Promise<void> {
    // Update profile emergency mode
    await supabase
      .from('profiles')
      .update({ emergency_mode: true, updated_at: new Date().toISOString() })
      .eq('id', userId);

    // Update session to emergency
    await TrackingService.activateEmergency(sessionId);

    // Broadcast emergency status to all viewers
    await realtimeService.broadcastMessage(
      sessionId,
      '🚨 EMERGENCY HELP ACTIVATED',
      'emergency',
      userId,
    );

    // Log notification
    if (currentLocation) {
      await supabase.from('notifications_log').insert({
        session_id: sessionId,
        type: 'emergency',
        title: '🚨 EMERGENCY HELP',
        body: EMERGENCY_MESSAGE_TEMPLATE(
          generateOSMLink(currentLocation),
        ),
      });
    }
  },

  /**
   * Deactivate emergency mode
   */
  async deactivate(userId: string, sessionId: string): Promise<void> {
    await supabase
      .from('profiles')
      .update({ emergency_mode: false, updated_at: new Date().toISOString() })
      .eq('id', userId);

    await TrackingService.deactivateEmergency(sessionId);

    await realtimeService.broadcastMessage(
      sessionId,
      'Emergency deactivated — user is safe',
      'safe',
      userId,
    );
  },

  /**
   * Send emergency notification via FCM (through Edge Function)
   */
  async sendEmergencyNotification(
    sessionId: string,
    message: string,
    location: Coordinates | null,
  ): Promise<void> {
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          session_id: sessionId,
          type: 'emergency',
          title: '🚨 EMERGENCY HELP',
          body: message,
          location: location
            ? { lat: location.latitude, lng: location.longitude }
            : null,
          priority: 'high',
        },
      });
    } catch (error) {
      if (__DEV__) console.warn('[Emergency] FCM error:', error);
    }
  },

  /**
   * Get emergency message with location link
   */
  getEmergencyMessage(location: Coordinates | null, shareLink: string): string {
    if (location) {
      const osmLink = generateOSMLink(location);
      return `🚨 EMERGENCY — I am in Trouble. Please Help!\n\nMy live location: ${shareLink}\n\nStatic location: ${osmLink}\n\nSent via EmerGPS`;
    }
    return EMERGENCY_MESSAGE_TEMPLATE(shareLink);
  },
};

export default EmergencyService;
