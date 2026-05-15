// Location service — wraps background geolocation for adaptive GPS tracking
import { Platform } from 'react-native';
import { GPS_INTERVAL, DISTANCE_FILTER } from '@/config/constants';
import type { LocationPoint } from '@/types/location';
import type { ActivityType } from '@/types/database';

// Note: react-native-background-geolocation requires native linking
// This service provides the abstraction layer

type LocationCallback = (location: LocationPoint) => void;
type ActivityCallback = (activity: ActivityType) => void;

interface LocationServiceConfig {
  onLocation: LocationCallback;
  onActivity?: ActivityCallback;
  isEmergency?: boolean;
}

/**
 * Location service wrapping device GPS with adaptive polling.
 * Uses react-native-background-geolocation for production.
 * Falls back to react-native Geolocation API for dev/testing.
 */
export class LocationService {
  private watchId: number | null = null;
  private isRunning = false;
  private config: LocationServiceConfig | null = null;
  private currentActivity: ActivityType = 'stationary';

  /**
   * Start location tracking with adaptive intervals
   */
  async start(config: LocationServiceConfig): Promise<void> {
    if (this.isRunning) {
      if (__DEV__) console.log('[Location] Already running');
      return;
    }

    this.config = config;
    this.isRunning = true;

    try {
      // In production, use react-native-background-geolocation
      // For now, use the standard Geolocation API
      // @ts-ignore
      const { default: Geolocation } = await import(
        '@react-native-community/geolocation'
      ).catch(() => ({
        default: null,
      }));

      if (!Geolocation) {
        // Fallback: use navigator.geolocation
        this.startFallbackTracking();
        return;
      }

      // Configure based on emergency mode
      const distanceFilter = config.isEmergency
        ? DISTANCE_FILTER.MOVING
        : DISTANCE_FILTER.WALKING;

      this.watchId = Geolocation.watchPosition(
        (position: any) => {
          const location: LocationPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed,
            heading: position.coords.heading,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            timestamp: position.timestamp,
          };
          config.onLocation(location);
        },
        (error: any) => {
          if (__DEV__) console.warn('[Location] Watch error:', error.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter,
          interval: this.getIntervalForActivity(),
          fastestInterval: GPS_INTERVAL.MOVING_FAST,
          ...(Platform.OS === 'android' && {
            forceRequestLocation: true,
            showLocationDialog: true,
          }),
        },
      );
    } catch (error) {
      if (__DEV__) console.warn('[Location] Start error:', error);
      this.startFallbackTracking();
    }
  }

  /**
   * Stop location tracking
   */
  stop(): void {
    if (this.watchId !== null) {
      try {
        // @ts-ignore
        const Geolocation = require('@react-native-community/geolocation').default;
        Geolocation.clearWatch(this.watchId);
      } catch {
        // Ignore if module not available
      }
      this.watchId = null;
    }
    this.isRunning = false;
    this.config = null;
  }

  /**
   * Get current position once
   */
  async getCurrentPosition(): Promise<LocationPoint | null> {
    return new Promise((resolve) => {
      try {
        // @ts-ignore
        const Geolocation = require('@react-native-community/geolocation').default;
        Geolocation.getCurrentPosition(
          (position: any) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              speed: position.coords.speed,
              heading: position.coords.heading,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              timestamp: position.timestamp,
            });
          },
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
        );
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Update activity type for adaptive polling
   */
  setActivityType(activity: ActivityType): void {
    this.currentActivity = activity;
    this.config?.onActivity?.(activity);
  }

  /**
   * Get GPS polling interval based on current activity
   */
  private getIntervalForActivity(): number {
    switch (this.currentActivity) {
      case 'running':
      case 'in_vehicle':
      case 'moving':
        return GPS_INTERVAL.MOVING_FAST;
      case 'walking':
        return GPS_INTERVAL.WALKING;
      case 'stationary':
      default:
        return GPS_INTERVAL.STATIONARY;
    }
  }

  /**
   * Fallback tracking using navigator.geolocation
   */
  private startFallbackTracking(): void {
    if (__DEV__) console.log('[Location] Using fallback tracking');

    const tick = () => {
      if (!this.isRunning || !this.config) return;

      const nav = (globalThis as any).navigator;
      nav?.geolocation?.getCurrentPosition(
        (position: any) => {
          this.config?.onLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed,
            heading: position.coords.heading,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            timestamp: position.timestamp,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 },
      );

      setTimeout(tick, this.getIntervalForActivity());
    };

    tick();
  }

  get running(): boolean {
    return this.isRunning;
  }
}

// Singleton
export const locationService = new LocationService();
export default locationService;
