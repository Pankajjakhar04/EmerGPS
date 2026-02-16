/*
  # Emergency Alert System Database Schema

  1. New Tables
    - `emergency_contacts`
      - `id` (uuid, primary key) - Unique identifier for each contact
      - `user_id` (uuid, foreign key to auth.users) - Owner of this contact
      - `name` (text) - Contact's full name
      - `email` (text) - Contact's email address for notifications
      - `telegram_chat_id` (text, nullable) - Telegram chat ID for notifications
      - `is_active` (boolean) - Whether this contact receives alerts
      - `created_at` (timestamptz) - When the contact was added
      - `updated_at` (timestamptz) - Last update timestamp

    - `alerts`
      - `id` (uuid, primary key) - Unique identifier for each alert
      - `user_id` (uuid, foreign key to auth.users) - User who triggered the alert
      - `latitude` (double precision) - Initial GPS latitude
      - `longitude` (double precision) - Initial GPS longitude
      - `accuracy` (double precision, nullable) - GPS accuracy in meters
      - `maps_link` (text) - Generated Google Maps link
      - `status` (text) - Alert status: active, resolved, cancelled
      - `tracking_enabled` (boolean) - Whether live tracking is active
      - `tracking_end_time` (timestamptz, nullable) - When live tracking ends
      - `notes` (text, nullable) - Optional user notes
      - `created_at` (timestamptz) - When the alert was triggered
      - `resolved_at` (timestamptz, nullable) - When the alert was resolved

    - `location_tracking`
      - `id` (uuid, primary key) - Unique identifier for each location update
      - `alert_id` (uuid, foreign key to alerts) - Associated alert
      - `latitude` (double precision) - GPS latitude
      - `longitude` (double precision) - GPS longitude
      - `accuracy` (double precision, nullable) - GPS accuracy in meters
      - `speed` (double precision, nullable) - Speed in meters per second
      - `heading` (double precision, nullable) - Direction of travel in degrees
      - `created_at` (timestamptz) - When the location was recorded

  2. Security
    - Enable RLS on all tables
    - Users can only manage their own emergency contacts
    - Users can only create and view their own alerts
    - Users can only view location tracking for their own alerts
    - Emergency contacts cannot be accessed by other users
*/

-- Create emergency_contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  telegram_chat_id text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  maps_link text NOT NULL,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'resolved', 'cancelled')),
  tracking_enabled boolean DEFAULT false NOT NULL,
  tracking_end_time timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz
);

-- Create location_tracking table
CREATE TABLE IF NOT EXISTS location_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES alerts(id) ON DELETE CASCADE NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  speed double precision,
  heading double precision,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_tracking_alert_id ON location_tracking(alert_id);
CREATE INDEX IF NOT EXISTS idx_location_tracking_created_at ON location_tracking(created_at DESC);

-- Enable Row Level Security
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for emergency_contacts
CREATE POLICY "Users can view own emergency contacts"
  ON emergency_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emergency contacts"
  ON emergency_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency contacts"
  ON emergency_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emergency contacts"
  ON emergency_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for alerts
CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for location_tracking
CREATE POLICY "Users can view own location tracking"
  ON location_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM alerts
      WHERE alerts.id = location_tracking.alert_id
      AND alerts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own location tracking"
  ON location_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM alerts
      WHERE alerts.id = location_tracking.alert_id
      AND alerts.user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on emergency_contacts
CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();