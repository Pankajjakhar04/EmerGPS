// Supabase Edge Function: send-notification
// Deploy: supabase functions deploy send-notification

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY') || '';

interface NotificationPayload {
  session_id: string;
  type: 'emergency' | 'tracking' | 'battery_low' | 'geofence' | 'message';
  title: string;
  body: string;
  location?: { lat: number; lng: number };
  priority?: 'high' | 'normal';
}

serve(async (req: Request) => {
  try {
    const payload: NotificationPayload = await req.json();
    const { session_id, type, title, body, priority = 'normal' } = payload;

    // Initialize Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get all active viewers for this session
    const { data: viewers } = await supabase
      .from('session_viewers')
      .select('viewer_token')
      .eq('session_id', session_id)
      .eq('is_active', true);

    // Get session owner's FCM token
    const { data: session } = await supabase
      .from('tracking_sessions')
      .select('owner_id')
      .eq('id', session_id)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
      });
    }

    // Get FCM tokens of viewers who are registered users
    // For anonymous viewers, notifications go through the realtime channel
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', session.owner_id)
      .single();

    // Send FCM notification if we have tokens and FCM key
    if (FCM_SERVER_KEY && ownerProfile?.fcm_token) {
      await sendFCM(ownerProfile.fcm_token, title, body, type, priority);
    }

    // Log notification
    await supabase.from('notifications_log').insert({
      session_id,
      type,
      title,
      body,
      delivered: true,
    });

    return new Response(
      JSON.stringify({ success: true, viewers_notified: viewers?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 },
    );
  }
});

async function sendFCM(
  token: string,
  title: string,
  body: string,
  type: string,
  priority: string,
): Promise<void> {
  const message = {
    to: token,
    notification: { title, body },
    data: { type, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
    priority: priority === 'high' ? 'high' : 'normal',
    android: {
      priority: priority === 'high' ? 'high' : 'normal',
      notification: {
        channel_id:
          type === 'emergency' ? 'emergency_alerts' : 'tracking_updates',
        sound: 'default',
        ...(type === 'emergency' && {
          vibrate_timings: ['0s', '0.25s', '0.25s', '0.25s', '0.25s', '0.5s'],
        }),
      },
    },
  };

  await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${FCM_SERVER_KEY}`,
    },
    body: JSON.stringify(message),
  });
}
