// Hook for subscribing to realtime location updates (viewer side)
import { useEffect, useState, useCallback, useRef } from 'react';
import { realtimeService } from '@/services/realtimeService';
import { TrackingService } from '../services/trackingService';
import type { ViewerLocationData } from '@/types/location';

interface RealtimeLocationState {
  location: ViewerLocationData | null;
  isConnected: boolean;
  error: string | null;
}

export function useRealtimeLocation(sessionId: string | null) {
  const [state, setState] = useState<RealtimeLocationState>({
    location: null,
    isConnected: false,
    error: null,
  });
  const [viewers, setViewers] = useState<{ name: string; action: string }[]>([]);
  const [messages, setMessages] = useState<
    { message: string; type: string; sender: string }[]
  >([]);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to location broadcasts
    unsubRef.current = realtimeService.subscribeToLocation(
      sessionId,
      // On location update
      (data: ViewerLocationData) => {
        setState((prev) => ({
          ...prev,
          location: data,
          isConnected: true,
          error: null,
        }));
      },
      // On viewer join/leave
      (data) => {
        setViewers((prev) => [...prev.slice(-20), data]); // Keep last 20
      },
      // On broadcast message
      (data) => {
        setMessages((prev) => [...prev.slice(-50), data]); // Keep last 50
      },
    );

    setState((prev) => ({ ...prev, isConnected: true }));

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [sessionId]);

  /**
   * Fetch initial/fallback location from DB if realtime hasn't delivered yet
   */
  const fetchLatestLocation = useCallback(async () => {
    if (!sessionId) return;

    const data = await TrackingService.getLatestLocation(sessionId);
    if (data) {
      setState((prev) => ({
        ...prev,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          accuracy: data.accuracy,
          battery_level: data.battery_level,
          activity_type: data.activity_type,
          is_emergency: false,
          updated_at: data.created_at,
        },
      }));
    }
  }, [sessionId]);

  return {
    ...state,
    viewers,
    messages,
    fetchLatestLocation,
  };
}

export default useRealtimeLocation;
