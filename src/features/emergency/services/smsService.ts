// SMS fallback service for offline emergency
import { Platform, NativeModules, Linking } from 'react-native';
import { generateOSMLink } from '@/utils/geo';
import type { Coordinates } from '@/types/location';
import type { EmergencyContact } from '@/types/database';
import StorageService, { STORAGE_KEYS } from '@/services/storageService';

export const SMSService = {
  /**
   * Send emergency SMS when offline
   * On Android: sends directly via SmsManager (requires SEND_SMS permission)
   * On iOS: opens SMS composer (user must tap Send)
   */
  async sendEmergencySMS(
    contacts: EmergencyContact[],
    location: Coordinates | null,
    customMessage?: string,
  ): Promise<{ success: boolean; method: 'direct' | 'composer' | 'failed' }> {
    const message = this.buildSMSMessage(location, customMessage);

    if (Platform.OS === 'android') {
      return this.sendDirectSMS(contacts, message);
    } else {
      return this.openSMSComposer(contacts, message);
    }
  },

  /**
   * Android: Send SMS directly without user interaction
   */
  async sendDirectSMS(
    contacts: EmergencyContact[],
    message: string,
  ): Promise<{ success: boolean; method: 'direct' | 'composer' | 'failed' }> {
    try {
      // Use native module for direct SMS (custom native module needed)
      const { EmergencySMSModule } = NativeModules;

      if (EmergencySMSModule) {
        for (const contact of contacts) {
          await EmergencySMSModule.sendSMS(contact.phone, message);
        }
        return { success: true, method: 'direct' };
      }

      // Fallback to SMS composer
      return this.openSMSComposer(contacts, message);
    } catch (error) {
      if (__DEV__) console.warn('[SMS] Direct send failed:', error);
      return this.openSMSComposer(contacts, message);
    }
  },

  /**
   * iOS + Fallback: Open SMS composer pre-filled
   */
  async openSMSComposer(
    contacts: EmergencyContact[],
    message: string,
  ): Promise<{ success: boolean; method: 'direct' | 'composer' | 'failed' }> {
    try {
      const phoneNumbers = contacts.map((c) => c.phone).join(',');
      const smsUrl = Platform.select({
        ios: `sms:${phoneNumbers}&body=${encodeURIComponent(message)}`,
        android: `sms:${phoneNumbers}?body=${encodeURIComponent(message)}`,
      });

      if (smsUrl) {
        const canOpen = await Linking.canOpenURL(smsUrl);
        if (canOpen) {
          await Linking.openURL(smsUrl);
          return { success: true, method: 'composer' };
        }
      }

      return { success: false, method: 'failed' };
    } catch {
      return { success: false, method: 'failed' };
    }
  },

  /**
   * Build emergency SMS message with location data
   */
  buildSMSMessage(
    location: Coordinates | null,
    customMessage?: string,
  ): string {
    let msg = customMessage || '🚨 EMERGENCY — I am in Trouble. Please Help!';

    if (location) {
      const osmLink = generateOSMLink(location);
      msg += `\n\nMy location:\n${osmLink}`;
      msg += `\n\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }

    msg += '\n\n— Sent via EmerGPS';
    return msg;
  },

  /**
   * Get cached emergency contacts for offline use
   */
  getCachedContacts(): EmergencyContact[] {
    return StorageService.getJSON<EmergencyContact[]>(
      STORAGE_KEYS.EMERGENCY_CONTACTS,
    ) ?? [];
  },

  /**
   * Cache emergency contacts for offline access
   */
  cacheContacts(contacts: EmergencyContact[]): void {
    StorageService.setJSON(STORAGE_KEYS.EMERGENCY_CONTACTS, contacts);
  },
};

export default SMSService;
