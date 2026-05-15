// Viewer Screen — displays tracked user's live location on map
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRealtimeLocation } from '../hooks/useRealtimeLocation';
import { TrackingService } from '../services/trackingService';
import { formatRelativeTime, formatBattery, formatSpeed } from '@/utils/formatters';
import type { TrackingScreenProps } from '@/types/navigation';

export default function ViewerScreen({
  route,
}: TrackingScreenProps<'ViewerScreen'>) {
  const { shareToken, viewerName } = route.params;
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  // Resolve session from share token
  useEffect(() => {
    TrackingService.getSessionByToken(shareToken).then((session) => {
      if (session) {
        setSessionId(session.id);
      }
    });
  }, [shareToken]);

  const { location, isConnected, messages, fetchLatestLocation } =
    useRealtimeLocation(sessionId);

  // Fetch initial location on mount
  useEffect(() => {
    if (sessionId) {
      fetchLatestLocation();
    }
  }, [sessionId, fetchLatestLocation]);

  if (!sessionId) {
    return (
      <View className="flex-1 bg-dark-900 items-center justify-center">
        <ActivityIndicator size="large" color="#339AF0" />
        <Text className="text-dark-100 mt-4">Connecting...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-900">
      <StatusBar barStyle="light-content" backgroundColor="#101113" />

      {/* Map Area Placeholder — MapLibre integration */}
      <View className="flex-1 bg-dark-700 items-center justify-center">
        {location ? (
          <View className="items-center">
            <Text className="text-tracking-400 text-6xl mb-4">📍</Text>
            <Text className="text-white text-lg font-bold">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            <Text className="text-dark-100 text-sm mt-2">
              MapLibre map renders here
            </Text>
          </View>
        ) : (
          <View className="items-center">
            <ActivityIndicator size="large" color="#339AF0" />
            <Text className="text-dark-100 mt-4">
              Waiting for location data...
            </Text>
          </View>
        )}

        {/* Emergency Overlay */}
        {location?.is_emergency && (
          <View className="absolute top-0 left-0 right-0 bg-emergency-600 py-3 px-6">
            <Text className="text-white font-bold text-center">
              🚨 EMERGENCY MODE ACTIVE
            </Text>
          </View>
        )}
      </View>

      {/* Info Panel */}
      <View className="bg-dark-800 border-t border-dark-400 px-6 py-5 pb-8">
        <View className="flex-row justify-between mb-4">
          <View>
            <Text className="text-dark-200 text-xs uppercase tracking-wider">
              Last Updated
            </Text>
            <Text className="text-white text-base font-semibold mt-1">
              {location
                ? formatRelativeTime(location.updated_at)
                : '—'}
            </Text>
          </View>

          <View className="items-center">
            <Text className="text-dark-200 text-xs uppercase tracking-wider">
              Battery
            </Text>
            <Text className="text-white text-base font-semibold mt-1">
              🔋 {formatBattery(location?.battery_level ?? null)}
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-dark-200 text-xs uppercase tracking-wider">
              Speed
            </Text>
            <Text className="text-white text-base font-semibold mt-1">
              {formatSpeed(location?.speed ?? null)}
            </Text>
          </View>
        </View>

        {/* Status */}
        <View className="flex-row items-center justify-between">
          <View
            className={`px-3 py-1 rounded-full ${
              isConnected ? 'bg-safe-900/30' : 'bg-warning-900/30'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isConnected ? 'text-safe-400' : 'text-warning-400'
              }`}
            >
              {isConnected ? '● Live' : '○ Reconnecting...'}
            </Text>
          </View>

          <Text className="text-dark-300 text-xs">
            Viewing as {viewerName ?? 'Anonymous'}
          </Text>
        </View>

        {/* Latest Broadcast Message */}
        {messages.length > 0 && (
          <View className="mt-4 bg-dark-600 p-3 rounded-xl border border-dark-400">
            <Text className="text-dark-200 text-xs mb-1">
              Message from {messages[messages.length - 1].sender}
            </Text>
            <Text className="text-white text-sm">
              {messages[messages.length - 1].message}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
