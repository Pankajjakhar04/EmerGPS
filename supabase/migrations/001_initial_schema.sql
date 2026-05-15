-- EmerGPS Database Schema Migration
-- Run this in your Supabase SQL Editor

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- User profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  profile_photo TEXT,
  fcm_token TEXT,
  emergency_mode BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{
    "enabled": true,
    "frequency": "normal",
    "movement_alerts": true,
    "battery_alerts": true,
    "emergency_alerts": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tracking sessions
CREATE TABLE IF NOT EXISTS public.tracking_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_emergency BOOLEAN DEFAULT FALSE,
  duration_minutes INT DEFAULT 480,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  stopped_at TIMESTAMPTZ
);

-- Location updates (high-volume table)
CREATE TABLE IF NOT EXISTS public.location_updates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  location GEOGRAPHY(Point, 4326),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed REAL,
  heading REAL,
  accuracy REAL,
  battery_level REAL,
  activity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session viewers
CREATE TABLE IF NOT EXISTS public.session_viewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE CASCADE NOT NULL,
  viewer_name TEXT NOT NULL,
  viewer_token TEXT UNIQUE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Broadcast messages
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'custom',
  include_location BOOLEAN DEFAULT FALSE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Emergency contacts
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Geofences
CREATE TABLE IF NOT EXISTS public.geofences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  center GEOGRAPHY(Point, 4326) NOT NULL,
  center_latitude DOUBLE PRECISION NOT NULL,
  center_longitude DOUBLE PRECISION NOT NULL,
  radius_meters INT NOT NULL DEFAULT 200,
  notify_on_enter BOOLEAN DEFAULT TRUE,
  notify_on_exit BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification log
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID,
  session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_location_updates_geo
  ON public.location_updates USING GIST (location);

-- Session + time lookup for latest location
CREATE INDEX IF NOT EXISTS idx_location_updates_session_time
  ON public.location_updates (session_id, created_at DESC);

-- Share token lookup (already unique, but explicit index)
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_token
  ON public.tracking_sessions (share_token) WHERE is_active = TRUE;

-- Active sessions by owner
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_owner_active
  ON public.tracking_sessions (owner_id) WHERE is_active = TRUE;

-- Viewer session lookup
CREATE INDEX IF NOT EXISTS idx_session_viewers_session
  ON public.session_viewers (session_id) WHERE is_active = TRUE;

-- Emergency contacts by user
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user
  ON public.emergency_contacts (user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tracking Sessions
ALTER TABLE public.tracking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages sessions"
  ON public.tracking_sessions FOR ALL
  USING (auth.uid() = owner_id);

-- Allow reading sessions by share token (for viewers via RPC/Edge Function)
CREATE POLICY "Read active sessions by token"
  ON public.tracking_sessions FOR SELECT
  USING (is_active = TRUE);

-- Location Updates
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner inserts locations"
  ON public.location_updates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Read locations for active sessions"
  ON public.location_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracking_sessions ts
      WHERE ts.id = session_id AND ts.is_active = TRUE
    )
  );

-- Session Viewers
ALTER TABLE public.session_viewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join as viewer"
  ON public.session_viewers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owner sees own session viewers"
  ON public.session_viewers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracking_sessions ts
      WHERE ts.id = session_id AND ts.owner_id = auth.uid()
    )
  );

-- Allow viewers to see their own entry
CREATE POLICY "Viewers see own entry"
  ON public.session_viewers FOR SELECT
  USING (true);

-- Broadcast Messages
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner sends messages"
  ON public.broadcast_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Read messages for sessions"
  ON public.broadcast_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tracking_sessions ts
      WHERE ts.id = session_id AND ts.is_active = TRUE
    )
  );

-- Emergency Contacts
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contacts"
  ON public.emergency_contacts FOR ALL
  USING (auth.uid() = user_id);

-- Geofences
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own geofences"
  ON public.geofences FOR ALL
  USING (auth.uid() = user_id);

-- Notification Log
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insert notifications"
  ON public.notifications_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Read own notifications"
  ON public.notifications_log FOR SELECT
  USING (recipient_id = auth.uid() OR recipient_id IS NULL);

-- =====================================================
-- REALTIME CONFIGURATION
-- =====================================================

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_viewers;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-populate location geography column from lat/lng
CREATE OR REPLACE FUNCTION public.set_location_geography()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_location_geography
  BEFORE INSERT ON public.location_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_location_geography();

-- Auto-expire sessions
CREATE OR REPLACE FUNCTION public.expire_old_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.tracking_sessions
  SET is_active = FALSE, stopped_at = now()
  WHERE is_active = TRUE
    AND is_emergency = FALSE
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Profile auto-create on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
