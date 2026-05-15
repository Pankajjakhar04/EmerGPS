// Home Screen — main hub with tracking controls and emergency slider
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Share,
} from 'react-native';
import { useLocationTracking } from '@/features/tracking/hooks/useLocationTracking';
import { useBattery } from '@/hooks/useBattery';
import { useNetwork } from '@/hooks/useNetwork';
import HelpSlider from '@/features/emergency/components/HelpSlider';
import { formatBattery, formatRelativeTime } from '@/utils/formatters';
import { EMERGENCY_MESSAGE_TEMPLATE } from '@/config/constants';
import ENV from '@/config/env';
import type { MainTabProps } from '@/types/navigation';

export default function HomeScreen({ navigation }: MainTabProps<'Home'>) {
  const {
    isTracking,
    isEmergency,
    shareToken,
    currentLocation,
    lastUpdateTime,
    viewerCount,
    startTracking,
    stopTracking,
  } = useLocationTracking();

  const battery = useBattery();
  const network = useNetwork();

  const shareLink = useMemo(() => {
    if (!shareToken) return null;
    const baseUrl =
      ENV.SHARE_BASE_URL.endsWith('/') || ENV.SHARE_BASE_URL.endsWith('=')
        ? ENV.SHARE_BASE_URL
        : `${ENV.SHARE_BASE_URL}/`;
    return `${baseUrl}${shareToken}`;
  }, [shareToken]);

  const handleStartTracking = useCallback(async () => {
    await startTracking();
  }, [startTracking]);

  const handleStopTracking = useCallback(async () => {
    await stopTracking();
  }, [stopTracking]);

  const handleShareLink = useCallback(async () => {
    if (!shareLink) return;
    try {
      await Share.share({
        message: `Track my live location on EmerGPS:\n${shareLink}`,
        url: shareLink,
      });
    } catch {
      // User cancelled
    }
  }, [shareLink]);

  const handleEmergencyActivated = useCallback(async () => {
    if (!isTracking) {
      await startTracking(undefined, true);
    }
    // Share emergency link
    if (shareLink) {
      try {
        await Share.share({
          message: EMERGENCY_MESSAGE_TEMPLATE(shareLink),
        });
      } catch {
        // User cancelled
      }
    }
  }, [isTracking, shareLink, startTracking]);

  return (
    <View className="flex-1 bg-dark-900">
      <StatusBar barStyle="light-content" backgroundColor="#101113" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-32"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-14 pb-6">
          <Text className="text-white text-3xl font-bold">EmerGPS</Text>
          <Text className="text-dark-100 text-sm mt-1">
            Emergency GPS Tracking
          </Text>
        </View>

        {/* Status Cards */}
        <View className="px-6 flex-row gap-3 mb-6">
          {/* Network Status */}
          <View
            className={`flex-1 p-4 rounded-2xl border ${
              network.isConnected
                ? 'bg-safe-900/20 border-safe-800'
                : 'bg-emergency-900/20 border-emergency-800'
            }`}
          >
            <Text className="text-dark-50 text-xs uppercase tracking-wider mb-1">
              Network
            </Text>
            <Text
              className={`text-base font-bold ${
                network.isConnected ? 'text-safe-400' : 'text-emergency-400'
              }`}
            >
              {network.isConnected ? '● Online' : '○ Offline'}
            </Text>
          </View>

          {/* Battery */}
          <View className="flex-1 p-4 rounded-2xl bg-dark-700 border border-dark-400">
            <Text className="text-dark-50 text-xs uppercase tracking-wider mb-1">
              Battery
            </Text>
            <Text
              className={`text-base font-bold ${
                battery.isLow ? 'text-warning-400' : 'text-white'
              }`}
            >
              🔋 {formatBattery(battery.level)}
            </Text>
          </View>

          {/* Viewers */}
          {isTracking && (
            <View className="flex-1 p-4 rounded-2xl bg-tracking-900/20 border border-tracking-800">
              <Text className="text-dark-50 text-xs uppercase tracking-wider mb-1">
                Viewers
              </Text>
              <Text className="text-tracking-400 text-base font-bold">
                👁 {viewerCount}
              </Text>
            </View>
          )}
        </View>

        {/* Tracking Status */}
        {isTracking && (
          <View
            className={`mx-6 p-5 rounded-2xl mb-6 border ${
              isEmergency
                ? 'bg-emergency-900/30 border-emergency-700'
                : 'bg-tracking-900/30 border-tracking-700'
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text
                  className={`text-xs uppercase tracking-wider ${
                    isEmergency ? 'text-emergency-300' : 'text-tracking-300'
                  }`}
                >
                  {isEmergency ? '🚨 EMERGENCY ACTIVE' : '📍 LIVE TRACKING'}
                </Text>
                <Text className="text-white text-lg font-bold mt-1">
                  {lastUpdateTime
                    ? `Updated ${formatRelativeTime(
                        new Date(lastUpdateTime).toISOString(),
                      )}`
                    : 'Waiting for GPS...'}
                </Text>
                {currentLocation && (
                  <Text className="text-dark-100 text-xs mt-1">
                    {currentLocation.latitude.toFixed(4)},{' '}
                    {currentLocation.longitude.toFixed(4)}
                  </Text>
                )}
              </View>
            </View>

            {/* Share Link Button */}
            {shareLink && (
              <TouchableOpacity
                className="mt-4 bg-white/10 py-3 rounded-xl items-center"
                onPress={handleShareLink}
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold">
                  📤 Share Live Link
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Start/Stop Tracking Button */}
        <View className="px-6 mb-6">
          <TouchableOpacity
            className={`py-5 rounded-2xl items-center ${
              isTracking
                ? 'bg-dark-500 border border-dark-300'
                : 'bg-tracking-600'
            }`}
            onPress={isTracking ? handleStopTracking : handleStartTracking}
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-bold">
              {isTracking ? '⏹ Stop Sharing' : '▶ Start Live Location'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-dark-50 text-sm font-semibold mb-3 uppercase tracking-wider">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-dark-600 p-4 rounded-2xl border border-dark-400 items-center"
              onPress={() =>
                navigation.navigate('Tracking', {
                  screen: 'StaticShare',
                })
              }
              activeOpacity={0.7}
            >
              <Text className="text-2xl mb-2">📌</Text>
              <Text className="text-white text-sm font-semibold">
                Share Location
              </Text>
              <Text className="text-dark-200 text-xs mt-1">One-time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-dark-600 p-4 rounded-2xl border border-dark-400 items-center"
              onPress={() =>
                navigation.navigate('Tracking', {
                  screen: 'BroadcastMessage',
                  params: { sessionId: '' },
                })
              }
              activeOpacity={0.7}
            >
              <Text className="text-2xl mb-2">💬</Text>
              <Text className="text-white text-sm font-semibold">
                Send Message
              </Text>
              <Text className="text-dark-200 text-xs mt-1">To viewers</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency HELP Slider */}
        <View className="px-6 mt-4">
          <Text className="text-dark-50 text-sm font-semibold mb-3 uppercase tracking-wider">
            Emergency
          </Text>
          <HelpSlider onActivated={handleEmergencyActivated} />
        </View>
      </ScrollView>
    </View>
  );
}
