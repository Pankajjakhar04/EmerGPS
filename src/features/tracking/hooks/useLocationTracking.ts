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
  const { user } = useAuthStore();
  const battery = useBattery();
  const network = useNetwork();
  const trackingDurationMinutes = useTrackingStore((state) => state.durationMinutes);
  const isEmergency = useTrackingStore((state) => state.isEmergency);
  const isTracking = useTrackingStore((state) => state.isTracking);
  const sessionId = useTrackingStore((state) => state.sessionId);
  const shareToken = useTrackingStore((state) => state.shareToken);
  const currentLocation = useTrackingStore((state) => state.currentLocation);
  const batteryLevel = useTrackingStore((state) => state.batteryLevel);
  const activityType = useTrackingStore((state) => state.activityType);
  const lastUpdateTime = useTrackingStore((state) => state.lastUpdateTime);
  const viewerCount = useTrackingStore((state) => state.viewerCount);
  const activeSession = useTrackingStore((state) => state.activeSession);
  const setTracking = useTrackingStore((state) => state.setTracking);
  const setEmergency = useTrackingStore((state) => state.setEmergency);
  const setSessionId = useTrackingStore((state) => state.setSessionId);
  const setShareToken = useTrackingStore((state) => state.setShareToken);
  const setActiveSession = useTrackingStore((state) => state.setActiveSession);
  const setCurrentLocation = useTrackingStore((state) => state.setCurrentLocation);
  const setBatteryLevel = useTrackingStore((state) => state.setBatteryLevel);
  const setActivityType = useTrackingStore((state) => state.setActivityType);
  const resetTracking = useTrackingStore((state) => state.resetTracking);
  const lastBroadcastRef = useRef<{ lat: number; lng: number } | null>(null);

  const handleLocationUpdate = useCallback(
    async (activeSessionId: string, location: LocationPoint) => {
      if (!user) return;

      setCurrentLocation(location);
      setBatteryLevel(battery.level);

      // Check if movement is significant enough to broadcast
      const prevCoords = lastBroadcastRef.current;
      const significant = hasSignificantMovement(
        prevCoords ? { latitude: prevCoords.lat, longitude: prevCoords.lng } : null,
        { latitude: location.latitude, longitude: location.longitude },
        isEmergency ? 5 : 10,
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
          activity_type: activityType,
          is_emergency: isEmergency,
          updated_at: new Date().toISOString(),
        };

        realtimeService.broadcastLocation(activeSessionId, broadcastData);
      }

      const dbEntry: LocationUpdateInsert = {
        session_id: activeSessionId,
        user_id: user.id,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        heading: location.heading,
        accuracy: location.accuracy,
        battery_level: battery.level,
        activity_type: activityType,
      };

      if (network.isConnected) {
        await TrackingService.insertLocation(dbEntry);
      } else {
        const cached = StorageService.getJSON<LocationUpdateInsert[]>(
          STORAGE_KEYS.CACHED_LOCATIONS,
        ) ?? [];
        cached.push(dbEntry);
        StorageService.setJSON(STORAGE_KEYS.CACHED_LOCATIONS, cached);
      }
    },
    [user, battery.level, activityType, isEmergency, network.isConnected, setBatteryLevel, setCurrentLocation],
  );

  /**
   * Start a new tracking session
   */
  const startTracking = useCallback(
    async (requestedDurationMinutes?: number, isEmergency: boolean = false) => {
      console.log('[DEBUG] startTracking clicked. User:', user?.id);

      if (!user) {
        Alert.alert('Not logged in', 'Please log in to start tracking.');
        return null;
      }

      try {
        console.log('[DEBUG] Calling createSession...');
        const session = await TrackingService.createSession(
          user.id,
          requestedDurationMinutes ?? trackingDurationMinutes,
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

      setSessionId(session.id);
      setShareToken(session.share_token);
      setActiveSession(session);
      setTracking(true);
      setEmergency(isEmergency);

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
          setActivityType(activity);
        },
      });

      return session;
      } catch (err: any) {
        console.error('[HOOK_TRACKING_ERROR]', err);
        Alert.alert('Tracking Error', err?.message ?? 'An unknown error occurred.');
        return null;
      }
    },
    [user, trackingDurationMinutes, handleLocationUpdate, setActiveSession, setEmergency, setSessionId, setShareToken, setTracking, setActivityType],
  );

  /**
   * Stop the current tracking session
   */
  const stopTracking = useCallback(async () => {
    const activeSessionId = sessionId;

    // Stop GPS
    locationService.stop();

    // Stop session in DB
    const stopped = activeSessionId ? await TrackingService.stopSession(activeSessionId) : true;

    if (!stopped) {
      Alert.alert(
        'Unable to stop sharing',
        'The session could not be deactivated on the server. Your GPS has been stopped locally, but the live link may still be active until the request succeeds.',
      );
      return;
    }

    // Cleanup realtime
    if (activeSessionId) {
      realtimeService.unsubscribe(`tracking:${activeSessionId}`);
    }

    // Reset state
    resetTracking();
    StorageService.delete(STORAGE_KEYS.ACTIVE_SESSION_ID);
    lastBroadcastRef.current = null;
  }, [sessionId, resetTracking]);

  /**
   * Flush cached offline locations when connectivity returns
   */
  useEffect(() => {
    if (network.isConnected && isTracking) {
      const cached = StorageService.getJSON<LocationUpdateInsert[]>(
        STORAGE_KEYS.CACHED_LOCATIONS,
      );
      if (cached && cached.length > 0) {
        TrackingService.insertLocationBatch(cached).then(() => {
          StorageService.delete(STORAGE_KEYS.CACHED_LOCATIONS);
        });
      }
    }
  }, [network.isConnected, isTracking]);

  /**
   * Resume tracking after app restart (crash recovery)
   */
  useEffect(() => {
    const savedSessionId = StorageService.getString(
      STORAGE_KEYS.ACTIVE_SESSION_ID,
    );
    if (savedSessionId && user && !isTracking) {
      TrackingService.getActiveSession(user.id).then((session) => {
        if (session && session.is_active) {
          setSessionId(session.id);
          setShareToken(session.share_token);
          setActiveSession(session);
          setTracking(true);
          setEmergency(session.is_emergency);

          locationService.start({
            isEmergency: session.is_emergency,
            onLocation: (location) =>
              handleLocationUpdate(session.id, location),
          });
        }
      });
    }
  }, [user, isTracking, handleLocationUpdate, setActiveSession, setEmergency, setSessionId, setShareToken, setTracking]);

  return {
    // State
    isTracking,
    isEmergency,
    sessionId,
    shareToken,
    currentLocation,
    batteryLevel,
    activityType,
    lastUpdateTime,
    viewerCount,
    activeSession,

    // Actions
    startTracking,
    stopTracking,
  };
}

export default useLocationTracking;
