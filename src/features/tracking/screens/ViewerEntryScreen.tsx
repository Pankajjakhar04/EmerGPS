// Viewer Entry Screen — name gate before tracking access
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { TrackingService } from '@/features/tracking/services/trackingService';
import { realtimeService } from '@/services/realtimeService';
import type { TrackingScreenProps } from '@/types/navigation';

export default function ViewerEntryScreen({
  route,
  navigation,
}: TrackingScreenProps<'ViewerEntry'>) {
  const { shareToken } = route.params;
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name Required', 'Please enter your name to view tracking.');
      return;
    }

    setLoading(true);
    try {
      // Find session by share token
      const session = await TrackingService.getSessionByToken(shareToken);
      if (!session) {
        Alert.alert('Invalid Link', 'This tracking session is no longer active.');
        return;
      }

      // Register as viewer
      const viewer = await TrackingService.joinAsViewer(session.id, trimmedName);
      if (!viewer) {
        Alert.alert('Error', 'Failed to join tracking session.');
        return;
      }

      // Notify owner
      await realtimeService.broadcastViewerEvent(
        session.id,
        trimmedName,
        'joined',
      );

      // Navigate to viewer screen
      navigation.replace('ViewerScreen', {
        shareToken,
        viewerName: trimmedName,
      });
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [name, shareToken, navigation]);

  return (
    <View className="flex-1 bg-dark-900">
      <StatusBar barStyle="light-content" backgroundColor="#101113" />
      <View className="flex-1 justify-center px-8">
        {/* Header */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-tracking-600 items-center justify-center mb-4">
            <Text className="text-3xl">📍</Text>
          </View>
          <Text className="text-white text-2xl font-bold text-center">
            Live Location Tracking
          </Text>
          <Text className="text-dark-100 text-sm mt-2 text-center">
            Enter your name to view the shared location
          </Text>
        </View>

        {/* Name Input */}
        <View className="mb-6">
          <Text className="text-dark-50 text-sm font-semibold mb-2 uppercase tracking-wider">
            Your Name
          </Text>
          <TextInput
            className="bg-dark-600 text-white text-lg px-5 py-4 rounded-2xl border border-dark-400"
            placeholder="Enter your name"
            placeholderTextColor="#5C5F66"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            editable={!loading}
            autoFocus
          />
        </View>

        {/* Join Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center ${
            loading ? 'bg-tracking-800' : 'bg-tracking-600'
          }`}
          onPress={handleJoin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white text-lg font-bold">
              View Location
            </Text>
          )}
        </TouchableOpacity>

        {/* Privacy note */}
        <Text className="text-dark-300 text-xs text-center mt-6">
          The tracking owner will see your name
        </Text>
      </View>
    </View>
  );
}
