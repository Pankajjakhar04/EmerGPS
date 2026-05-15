-- Safe re-run: Drop existing policies and recreate them
-- Run this in Supabase SQL Editor

-- =====================================================
-- DROP EXISTING POLICIES (safe to re-run)
-- =====================================================

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Tracking Sessions
DROP POLICY IF EXISTS "Owner manages sessions" ON public.tracking_sessions;
DROP POLICY IF EXISTS "Read active sessions by token" ON public.tracking_sessions;

-- Location Updates
DROP POLICY IF EXISTS "Owner inserts locations" ON public.location_updates;
DROP POLICY IF EXISTS "Read locations for active sessions" ON public.location_updates;

-- Session Viewers
DROP POLICY IF EXISTS "Anyone can join as viewer" ON public.session_viewers;
DROP POLICY IF EXISTS "Owner sees own session viewers" ON public.session_viewers;
DROP POLICY IF EXISTS "Viewers see own entry" ON public.session_viewers;

-- Broadcast Messages
DROP POLICY IF EXISTS "Owner sends messages" ON public.broadcast_messages;
DROP POLICY IF EXISTS "Read messages for sessions" ON public.broadcast_messages;

-- Emergency Contacts
DROP POLICY IF EXISTS "Users manage own contacts" ON public.emergency_contacts;

-- Geofences
DROP POLICY IF EXISTS "Users manage own geofences" ON public.geofences;

-- Notifications
DROP POLICY IF EXISTS "Insert notifications" ON public.notifications_log;
DROP POLICY IF EXISTS "Read own notifications" ON public.notifications_log;

-- =====================================================
-- ENSURE MISSING TABLES EXIST
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'User',
  email TEXT NOT NULL DEFAULT '',
  profile_photo TEXT,
  fcm_token TEXT,
  emergency_mode BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{"enabled":true,"frequency":"normal","movement_alerts":true,"battery_alerts":true,"emergency_alerts":true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_emergency BOOLEAN DEFAULT FALSE,
  duration_minutes INT DEFAULT 480,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  stopped_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.location_updates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed REAL,
  heading REAL,
  accuracy REAL,
  battery_level REAL,
  activity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.session_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE CASCADE NOT NULL,
  viewer_name TEXT NOT NULL,
  viewer_token TEXT UNIQUE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'custom',
  include_location BOOLEAN DEFAULT FALSE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  center_latitude DOUBLE PRECISION NOT NULL,
  center_longitude DOUBLE PRECISION NOT NULL,
  radius_meters INT NOT NULL DEFAULT 200,
  notify_on_enter BOOLEAN DEFAULT TRUE,
  notify_on_exit BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID,
  session_id UUID REFERENCES public.tracking_sessions(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RECREATE POLICIES
-- =====================================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tracking Sessions
CREATE POLICY "Owner manages sessions" ON public.tracking_sessions FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Read active sessions by token" ON public.tracking_sessions FOR SELECT USING (is_active = TRUE);

-- Location Updates
CREATE POLICY "Owner inserts locations" ON public.location_updates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Read locations for active sessions" ON public.location_updates FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tracking_sessions ts WHERE ts.id = session_id AND ts.is_active = TRUE));

-- Session Viewers
CREATE POLICY "Anyone can join as viewer" ON public.session_viewers FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner sees own session viewers" ON public.session_viewers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tracking_sessions ts WHERE ts.id = session_id AND ts.owner_id = auth.uid()));
CREATE POLICY "Viewers see own entry" ON public.session_viewers FOR SELECT USING (true);

-- Broadcast Messages
CREATE POLICY "Owner sends messages" ON public.broadcast_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Read messages for sessions" ON public.broadcast_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.tracking_sessions ts WHERE ts.id = session_id AND ts.is_active = TRUE));

-- Emergency Contacts
CREATE POLICY "Users manage own contacts" ON public.emergency_contacts FOR ALL USING (auth.uid() = user_id);

-- Geofences
CREATE POLICY "Users manage own geofences" ON public.geofences FOR ALL USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Insert notifications" ON public.notifications_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Read own notifications" ON public.notifications_log FOR SELECT
  USING (recipient_id = auth.uid() OR recipient_id IS NULL);

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGNUP (recreate trigger)
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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

-- =====================================================
-- REALTIME
-- =====================================================
DO $$
BEGIN
  -- Add location_updates
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'location_updates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.location_updates;
  END IF;

  -- Add tracking_sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tracking_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_sessions;
  END IF;

  -- Add broadcast_messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'broadcast_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_messages;
  END IF;

  -- Add session_viewers
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'session_viewers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_viewers;
  END IF;
END $$;
