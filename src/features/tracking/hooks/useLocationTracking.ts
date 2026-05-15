// Hook for managing live location tracking
import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useTrackingStore } from '../store/trackingStore';
import { TrackingService } from '../services/trackingService';
import { locationService } from '../services/locationService';
import { realtimeService } from '@/services/realtimeService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useBattery } from '@/hooks/useBattery';
import { useNetwork } from '@/hooks/useNetwork';
import { hasSignificantMovement } from '@/utils/geo';
import StorageService, { STORAGE_KEYS } from '@/services/storageService';
import type { LocationPoint, ViewerLocationData } from '@/types/location';
import type { LocationUpdateInsert } from '@/types/database';

export function useLocationTracking() {
  const store = useTrackingStore();
  const { user } = useAuthStore();
  const battery = useBattery();
  const network = useNetwork();
  const lastBroadcastRef = useRef<{ lat: number; lng: number } | null>(null);

  /**
   * Start a new tracking session
   */
  const startTracking = useCallback(
    async (durationMinutes?: number, isEmergency: boolean = false) => {
      console.log('[DEBUG] startTracking clicked. User:', user?.id);

      if (!user) {
        Alert.alert('Not logged in', 'Please log in to start tracking.');
        return null;
      }

      try {
        console.log('[DEBUG] Calling createSession...');
        const session = await TrackingService.createSession(
          user.id,
          durationMinutes ?? store.durationMinutes,
          isEmergency,
        );

        console.log('[DEBUG] Session returned:', session?.id);

        if (!session) {
          Alert.alert(
            'Failed to start tracking',
            'Could not create a session. Please check your internet connection and make sure the database is set up.',
          );
          return null;
        }

      store.setSessionId(session.id);
      store.setShareToken(session.share_token);
      store.setActiveSession(session);
      store.setTracking(true);
      store.setEmergency(isEmergency);

      // Save session ID locally for crash recovery
      StorageService.setString(STORAGE_KEYS.ACTIVE_SESSION_ID, session.id);

      console.log('[DEBUG] Starting GPS service...');
      // Start GPS
      await locationService.start({
        isEmergency,
        onLocation: (location: LocationPoint) => {
          handleLocationUpdate(session.id, location);
        },
        onActivity: (activity) => {
          store.setActivityType(activity);
        },
      });

      return session;
      } catch (err: any) {
        console.error('[HOOK_TRACKING_ERROR]', err);
        Alert.alert('Tracking Error', err?.message ?? 'An unknown error occurred.');
        return null;
      }
    },
    [user, store.durationMinutes],
  );

  /**
   * Stop the current tracking session
   */
  const stopTracking = useCallback(async () => {
    const sessionId = store.sessionId;

    // Stop GPS
    locationService.stop();

    // Stop session in DB
    if (sessionId) {
      await TrackingService.stopSession(sessionId);
    }

    // Cleanup realtime
    if (sessionId) {
      realtimeService.unsubscribe(`tracking:${sessionId}`);
    }

    // Reset state
    store.resetTracking();
    StorageService.delete(STORAGE_KEYS.ACTIVE_SESSION_ID);
    lastBroadcastRef.current = null;
  }, [store.sessionId]);

  /**
   * Handle incoming location update from GPS
   */
  const handleLocationUpdate = useCallback(
    async (sessionId: string, location: LocationPoint) => {
      if (!user) return;

      store.setCurrentLocation(location);
      store.setBatteryLevel(battery.level);

      // Check if movement is significant enough to broadcast
      const prevCoords = lastBroadcastRef.current;
      const significant = hasSignificantMovement(
        prevCoords ? { latitude: prevCoords.lat, longitude: prevCoords.lng } : null,
        { latitude: location.latitude, longitude: location.longitude },
        store.isEmergency ? 5 : 10,
      );

      if (!significant) return;

      lastBroadcastRef.current = {
        lat: location.latitude,
        lng: location.longitude,
      };

      // Broadcast via Supabase Realtime (low-latency)
      if (network.isConnected) {
        const broadcastData: ViewerLocationData = {
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          heading: location.heading,
          accuracy: location.accuracy,
          battery_level: battery.level,
          activity_type: store.activityType,
          is_emergency: store.isEmergency,
          updated_at: new Date().toISOString(),
        };

        realtimeService.broadcastLocation(sessionId, broadcastData);
      }

      // Batch DB writes
      const dbEntry: LocationUpdateInsert = {
        session_id: sessionId,
        user_id: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        heading: location.heading,
        accuracy: location.accuracy,
        battery_level: battery.level,
        activity_type: store.activityType,
      };

      if (network.isConnected) {
        await TrackingService.insertLocation(dbEntry);
      } else {
        // Cache offline
        const cached = StorageService.getJSON<LocationUpdateInsert[]>(
          STORAGE_KEYS.CACHED_LOCATIONS,
        ) ?? [];
        cached.push(dbEntry);
        StorageService.setJSON(STORAGE_KEYS.CACHED_LOCATIONS, cached);
      }
    },
    [user, battery.level, store.isEmergency, store.activityType, network.isConnected],
  );

  /**
   * Flush cached offline locations when connectivity returns
   */
  useEffect(() => {
    if (network.isConnected && store.isTracking) {
      const cached = StorageService.getJSON<LocationUpdateInsert[]>(
        STORAGE_KEYS.CACHED_LOCATIONS,
      );
      if (cached && cached.length > 0) {
        TrackingService.insertLocationBatch(cached).then(() => {
          StorageService.delete(STORAGE_KEYS.CACHED_LOCATIONS);
        });
      }
    }
  }, [network.isConnected, store.isTracking]);

  /**
   * Resume tracking after app restart (crash recovery)
   */
  useEffect(() => {
    const savedSessionId = StorageService.getString(
      STORAGE_KEYS.ACTIVE_SESSION_ID,
    );
    if (savedSessionId && user && !store.isTracking) {
      TrackingService.getActiveSession(user.id).then((session) => {
        if (session && session.is_active) {
          store.setSessionId(session.id);
          store.setShareToken(session.share_token);
          store.setActiveSession(session);
          store.setTracking(true);
          store.setEmergency(session.is_emergency);

          locationService.start({
            isEmergency: session.is_emergency,
            onLocation: (location) =>
              handleLocationUpdate(session.id, location),
          });
        }
      });
    }
  }, [user]);

  return {
    // State
    isTracking: store.isTracking,
    isEmergency: store.isEmergency,
    sessionId: store.sessionId,
    shareToken: store.shareToken,
    currentLocation: store.currentLocation,
    batteryLevel: store.batteryLevel,
    activityType: store.activityType,
    lastUpdateTime: store.lastUpdateTime,
    viewerCount: store.viewerCount,
    activeSession: store.activeSession,

    // Actions
    startTracking,
    stopTracking,
  };
}

export default useLocationTracking;
