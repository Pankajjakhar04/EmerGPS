import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  telegram_chat_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  maps_link: string;
  status: 'active' | 'resolved' | 'cancelled';
  tracking_enabled: boolean;
  tracking_end_time: string | null;
  notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface LocationTracking {
  id: string;
  alert_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  created_at: string;
}
