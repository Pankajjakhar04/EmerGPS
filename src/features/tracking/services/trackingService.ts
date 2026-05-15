// Tracking service — manages sessions, location DB writes, sharing
import { supabase } from '@/config/supabase';
import { generateSecureToken } from '@/utils/formatters';
import ENV from '@/config/env';
import type {
  TrackingSession,
  TrackingSessionInsert,
  LocationUpdateInsert,
  SessionViewer,
} from '@/types/database';
import type { ShareLinkData } from '@/types/location';

export const TrackingService = {
  /**
   * Create a new tracking session
   */
  async createSession(
    ownerId: string,
    durationMinutes: number = 480,
    isEmergency: boolean = false,
  ): Promise<TrackingSession | null> {
    const shareToken = generateSecureToken(32);
    const expiresAt = isEmergency
      ? null
      : new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    const insert: TrackingSessionInsert = {
      owner_id: ownerId,
      share_token: shareToken,
      is_active: true,
      is_emergency: isEmergency,
      duration_minutes: durationMinutes,
      expires_at: expiresAt,
    };

    // Get token directly from MMKV to bypass Supabase auth lock bugs
    let accessToken = ENV.SUPABASE_ANON_KEY;
    try {
      const storageAdapter = require('react-native-mmkv').createMMKV({ id: 'supabase-auth' });
      const keys = storageAdapter.getAllKeys();
      const authKey = keys.find((k: string) => k.endsWith('-auth-token'));
      
      if (authKey) {
        const authStr = storageAdapter.getString(authKey);
        if (authStr) {
          const authObj = JSON.parse(authStr);
          if (authObj.access_token) {
            accessToken = authObj.access_token;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse token from MMKV', e);
    }
    console.log('[DEBUG] Token found in MMKV:', accessToken !== ENV.SUPABASE_ANON_KEY);

    const insertPromise = fetch(`${ENV.SUPABASE_URL}/rest/v1/tracking_sessions?select=*`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ENV.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(insert)
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      return { data: data[0], error: null };
    }).catch(err => ({ data: null, error: err }));

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out after 10s')), 10000)
    );

    try {
      const { data, error } = (await Promise.race([
        insertPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error('[TRACKING_ERROR]', error);
        return null;
      }
      return data as TrackingSession;
    } catch (err) {
      console.error('[TRACKING_TIMEOUT_ERROR]', err);
      return null;
    }
  },

  /**
   * Stop a tracking session
   */
  async stopSession(sessionId: string): Promise<boolean> {
    let accessToken = ENV.SUPABASE_ANON_KEY;
    try {
      const storageAdapter = require('react-native-mmkv').createMMKV({ id: 'supabase-auth' });
      const keys = storageAdapter.getAllKeys();
      const authKey = keys.find((k: string) => k.endsWith('-auth-token'));

      if (authKey) {
        const authStr = storageAdapter.getString(authKey);
        if (authStr) {
          const authObj = JSON.parse(authStr);
          if (authObj.access_token) {
            accessToken = authObj.access_token;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to read auth token for stopSession', e);
    }

    try {
      const res = await fetch(
        `${ENV.SUPABASE_URL}/rest/v1/tracking_sessions?id=eq.${sessionId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: ENV.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${accessToken}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify({
            is_active: false,
            is_emergency: false,
            stopped_at: new Date().toISOString(),
          }),
        },
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return true;
    } catch (error) {
      console.error('[TRACKING_STOP_ERROR]', error);
      return false;
    }
  },

  /**
   * Activate emergency mode on a session
   */
  async activateEmergency(sessionId: string): Promise<void> {
    await supabase
      .from('tracking_sessions')
      .update({
        is_emergency: true,
        expires_at: null, // No expiry in emergency
      })
      .eq('id', sessionId);
  },

  /**
   * Deactivate emergency mode
   */
  async deactivateEmergency(sessionId: string): Promise<void> {
    await supabase
      .from('tracking_sessions')
      .update({ is_emergency: false })
      .eq('id', sessionId);
  },

  /**
   * Get session by share token (for viewers)
   */
  async getSessionByToken(shareToken: string): Promise<TrackingSession | null> {
    const { data, error } = await supabase
      .from('tracking_sessions')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data as TrackingSession;
  },

  /**
   * Get active session for user
   */
  async getActiveSession(userId: string): Promise<TrackingSession | null> {
    let accessToken = ENV.SUPABASE_ANON_KEY;
    try {
      const storageAdapter = require('react-native-mmkv').createMMKV({ id: 'supabase-auth' });
      const keys = storageAdapter.getAllKeys();
      const authKey = keys.find((k: string) => k.endsWith('-auth-token'));
      if (authKey) {
        const authStr = storageAdapter.getString(authKey);
        if (authStr) {
          const authObj = JSON.parse(authStr);
          if (authObj.access_token) accessToken = authObj.access_token;
        }
      }
    } catch {
      // Ignore auth token parsing issues and fall back to anon key.
    }

    try {
      const res = await fetch(`${ENV.SUPABASE_URL}/rest/v1/tracking_sessions?owner_id=eq.${userId}&is_active=eq.true&order=created_at.desc&limit=1`, {
        headers: {
          'apikey': ENV.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.length > 0 ? data[0] : null;
    } catch {
      return null;
    }
  },

  /**
   * Insert a batch of location updates
   */
  async insertLocationBatch(
    locations: LocationUpdateInsert[],
  ): Promise<void> {
    if (locations.length === 0) return;

    const { error } = await supabase
      .from('location_updates')
      .insert(locations);

    if (error && __DEV__) {
      console.warn('[Tracking] insertLocationBatch error:', error.message);
    }
  },

  /**
   * Insert single location update
   */
  async insertLocation(location: LocationUpdateInsert): Promise<void> {
    const { error } = await supabase
      .from('location_updates')
      .insert(location);

    if (error && __DEV__) {
      console.warn('[Tracking] insertLocation error:', error.message);
    }
  },

  /**
   * Get latest location for a session
   */
  async getLatestLocation(sessionId: string) {
    const { data } = await supabase
      .from('location_updates')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data;
  },

  /**
   * Register a viewer for a session
   */
  async joinAsViewer(
    sessionId: string,
    viewerName: string,
  ): Promise<SessionViewer | null> {
    const viewerToken = generateSecureToken(16);

    const { data, error } = await supabase
      .from('session_viewers')
      .insert({
        session_id: sessionId,
        viewer_name: viewerName,
        viewer_token: viewerToken,
      })
      .select()
      .single();

    if (error) return null;
    return data as SessionViewer;
  },

  /**
   * Get active viewers for a session
   */
  async getViewers(sessionId: string): Promise<SessionViewer[]> {
    const { data } = await supabase
      .from('session_viewers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .order('joined_at', { ascending: false });

    return (data ?? []) as SessionViewer[];
  },

  /**
   * Generate share link data
   */
  generateShareLinks(
    shareToken: string,
    sessionId: string,
    isEmergency: boolean,
    expiresAt: string | null,
  ): ShareLinkData {
    const baseUrl =
      ENV.SHARE_BASE_URL.endsWith('=') || ENV.SHARE_BASE_URL.endsWith('/')
        ? ENV.SHARE_BASE_URL
        : `${ENV.SHARE_BASE_URL}/`;

    return {
      shareToken,
      sessionId,
      deepLink: `${ENV.APP_SCHEME}://track/${shareToken}`,
      webLink: `${baseUrl}${shareToken}`,
      expiresAt,
      isEmergency,
    };
  },
};

export default TrackingService;
