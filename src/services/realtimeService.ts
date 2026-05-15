// Supabase Realtime channel wrapper for location broadcasting
import { supabase } from '@/config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ViewerLocationData } from '@/types/location';

type LocationCallback = (data: ViewerLocationData) => void;
type ViewerCallback = (data: { name: string; action: 'joined' | 'left' }) => void;
type MessageCallback = (data: { message: string; type: string; sender: string }) => void;

/**
 * Manages Supabase Realtime channels for tracking sessions.
 * Uses broadcast (not postgres_changes) for low-latency location updates.
 * DB writes happen at a lower frequency for history.
 */
export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to location updates for a tracking session
   */
  subscribeToLocation(
    sessionId: string,
    onLocation: LocationCallback,
    onViewer?: ViewerCallback,
    onMessage?: MessageCallback,
  ): () => void {
    const channelKey = `tracking:${sessionId}`;

    // Prevent duplicate subscriptions
    if (this.channels.has(channelKey)) {
      this.unsubscribe(channelKey);
    }

    const channel = supabase.channel(channelKey, {
      config: { broadcast: { self: false } }, // Don't receive own broadcasts
    });

    // Listen for location broadcasts
    channel.on('broadcast', { event: 'location' }, (payload) => {
      onLocation(payload.payload as ViewerLocationData);
    });

    // Listen for viewer join/leave events
    if (onViewer) {
      channel.on('broadcast', { event: 'viewer' }, (payload) => {
        onViewer(payload.payload as { name: string; action: 'joined' | 'left' });
      });
    }

    // Listen for broadcast messages
    if (onMessage) {
      channel.on('broadcast', { event: 'message' }, (payload) => {
        onMessage(
          payload.payload as { message: string; type: string; sender: string },
        );
      });
    }

    channel.subscribe();
    this.channels.set(channelKey, channel);

    // Return cleanup function
    return () => this.unsubscribe(channelKey);
  }

  /**
   * Broadcast location update to all subscribers
   */
  async broadcastLocation(
    sessionId: string,
    data: ViewerLocationData,
  ): Promise<void> {
    const channelKey = `tracking:${sessionId}`;
    let channel = this.channels.get(channelKey);

    if (!channel) {
      channel = supabase.channel(channelKey);
      channel.subscribe();
      this.channels.set(channelKey, channel);
    }

    await channel.send({
      type: 'broadcast',
      event: 'location',
      payload: data,
    });
  }

  /**
   * Broadcast viewer join/leave event
   */
  async broadcastViewerEvent(
    sessionId: string,
    name: string,
    action: 'joined' | 'left',
  ): Promise<void> {
    const channelKey = `tracking:${sessionId}`;
    const channel = this.channels.get(channelKey);

    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'viewer',
        payload: { name, action },
      });
    }
  }

  /**
   * Broadcast a message to all viewers
   */
  async broadcastMessage(
    sessionId: string,
    message: string,
    type: string,
    sender: string,
  ): Promise<void> {
    const channelKey = `tracking:${sessionId}`;
    const channel = this.channels.get(channelKey);

    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'message',
        payload: { message, type, sender },
      });
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelKey: string): void {
    const channel = this.channels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelKey);
    }
  }

  /**
   * Cleanup all channels
   */
  cleanup(): void {
    for (const [key] of this.channels) {
      this.unsubscribe(key);
    }
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;
