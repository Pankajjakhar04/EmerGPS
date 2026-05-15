// Broadcast Message screen — send quick or custom messages to viewers
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { supabase } from '@/config/supabase';
import { realtimeService } from '@/services/realtimeService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTrackingStore } from '@/features/tracking/store/trackingStore';
import { QUICK_MESSAGES } from '@/config/constants';
import type { TrackingScreenProps } from '@/types/navigation';

export default function BroadcastScreen({
  navigation,
}: TrackingScreenProps<'BroadcastMessage'>) {
  const { user, profile } = useAuthStore();
  const { sessionId } = useTrackingStore();
  const [customMessage, setCustomMessage] = useState('');
  const [includeLocation, setIncludeLocation] = useState(false);
  const [sending, setSending] = useState(false);

  const sendMessage = useCallback(
    async (message: string, type: string) => {
      if (!sessionId || !user) {
        Alert.alert('Error', 'No active tracking session.');
        return;
      }

      setSending(true);
      try {
        // Save to DB
        await supabase.from('broadcast_messages').insert({
          session_id: sessionId,
          sender_id: user.id,
          message,
          message_type: type,
          include_location: includeLocation,
        });

        // Broadcast via realtime
        await realtimeService.broadcastMessage(
          sessionId,
          message,
          type,
          profile?.name ?? 'User',
        );

        Alert.alert('Sent', 'Message broadcast to all viewers.');
        navigation.goBack();
      } catch {
        Alert.alert('Error', 'Failed to send message.');
      } finally {
        setSending(false);
      }
    },
    [sessionId, user, profile, includeLocation, navigation],
  );

  return (
    <View className="flex-1 bg-dark-900">
      <StatusBar barStyle="light-content" backgroundColor="#101113" />
      <ScrollView className="flex-1" contentContainerClassName="pb-20">
        {/* Header */}
        <View className="px-6 pt-14 pb-6">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-tracking-400 text-base mb-4">← Back</Text>
          </TouchableOpacity>
          <Text className="text-white text-3xl font-bold">
            Send Message
          </Text>
          <Text className="text-dark-100 text-sm mt-1">
            Broadcast to all active viewers
          </Text>
        </View>

        {/* Quick Messages */}
        <View className="px-6 mb-6">
          <Text className="text-dark-50 text-xs font-semibold uppercase tracking-wider mb-3">
            Quick Messages
          </Text>
          <View className="gap-3">
            {QUICK_MESSAGES.map((msg) => (
              <TouchableOpacity
                key={msg.id}
                className="bg-dark-600 p-4 rounded-2xl border border-dark-400 flex-row items-center"
                onPress={() => sendMessage(msg.label, msg.type)}
                disabled={sending}
                activeOpacity={0.7}
              >
                <Text className="text-white text-base flex-1">{msg.label}</Text>
                <Text className="text-dark-200 text-xl">→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Message */}
        <View className="px-6 mb-6">
          <Text className="text-dark-50 text-xs font-semibold uppercase tracking-wider mb-3">
            Custom Message
          </Text>
          <TextInput
            className="bg-dark-600 text-white text-base px-5 py-4 rounded-2xl border border-dark-400 min-h-24"
            placeholder="Type your message..."
            placeholderTextColor="#5C5F66"
            multiline
            value={customMessage}
            onChangeText={setCustomMessage}
            editable={!sending}
          />

          {/* Include Location Toggle */}
          <TouchableOpacity
            className="flex-row items-center mt-3"
            onPress={() => setIncludeLocation(!includeLocation)}
          >
            <View
              className={`w-5 h-5 rounded-md border mr-3 items-center justify-center ${
                includeLocation
                  ? 'bg-tracking-600 border-tracking-400'
                  : 'border-dark-300'
              }`}
            >
              {includeLocation && (
                <Text className="text-white text-xs">✓</Text>
              )}
            </View>
            <Text className="text-dark-100 text-sm">
              Attach current location
            </Text>
          </TouchableOpacity>

          {/* Send Button */}
          <TouchableOpacity
            className={`mt-4 py-4 rounded-2xl items-center ${
              !customMessage.trim() || sending
                ? 'bg-dark-500'
                : 'bg-tracking-600'
            }`}
            onPress={() => sendMessage(customMessage.trim(), 'custom')}
            disabled={!customMessage.trim() || sending}
            activeOpacity={0.8}
          >
            <Text className="text-white text-lg font-bold">
              {sending ? 'Sending...' : 'Send Message'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
