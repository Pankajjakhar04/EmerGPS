// Sharing service — generate and manage share links
import { Share } from 'react-native';
import { locationService } from '@/features/tracking/services/locationService';
import { generateOSMLink, generateMapsLink } from '@/utils/geo';
import type { Coordinates, ShareLinkData } from '@/types/location';

export const SharingService = {
  /**
   * Generate and share a live tracking link
   */
  async shareLiveLink(shareData: ShareLinkData): Promise<void> {
    const message = shareData.isEmergency
      ? `🚨 EMERGENCY — Track my live location:\n${shareData.webLink}`
      : `📍 Track my live location on EmerGPS:\n${shareData.webLink}`;

    await Share.share({
      message,
      url: shareData.webLink,
      title: 'EmerGPS Live Location',
    });
  },

  /**
   * Share current (static) location
   */
  async shareStaticLocation(location: Coordinates): Promise<void> {
    const osmLink = generateOSMLink(location);
    const mapsLink = generateMapsLink(location);

    const message = `📌 My current location:\n\n${mapsLink}\n\nOpenStreetMap: ${osmLink}\n\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n\n— Shared via EmerGPS`;

    await Share.share({
      message,
      title: 'My Location',
    });
  },

  /**
   * Get current location and share it immediately
   */
  async shareCurrentLocation(): Promise<boolean> {
    const location = await locationService.getCurrentPosition();
    if (!location) return false;

    await this.shareStaticLocation({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    return true;
  },

  /**
   * Build a share message for WhatsApp/SMS/Telegram
   */
  buildShareMessage(
    shareData: ShareLinkData,
    includeEmoji: boolean = true,
  ): string {
    const prefix = includeEmoji ? '📍 ' : '';
    if (shareData.isEmergency) {
      return `🚨 EMERGENCY\n\n${prefix}Track my live location:\n${shareData.webLink}\n\n— Sent via EmerGPS`;
    }
    return `${prefix}Track my live location:\n${shareData.webLink}\n\n— Shared via EmerGPS`;
  },
};

export default SharingService;
