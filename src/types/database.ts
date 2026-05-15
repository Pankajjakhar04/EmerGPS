// Auto-generated types mirroring Supabase database schema
// Update this file when schema changes

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      tracking_sessions: {
        Row: TrackingSession;
        Insert: TrackingSessionInsert;
        Update: TrackingSessionUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      location_updates: {
        Row: LocationUpdate;
        Insert: LocationUpdateInsert;
        Update: any;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      session_viewers: {
        Row: SessionViewer;
        Insert: SessionViewerInsert;
        Update: SessionViewerUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      broadcast_messages: {
        Row: BroadcastMessage;
        Insert: BroadcastMessageInsert;
        Update: any;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      emergency_contacts: {
        Row: EmergencyContact;
        Insert: EmergencyContactInsert;
        Update: EmergencyContactUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      geofences: {
        Row: Geofence;
        Insert: GeofenceInsert;
        Update: GeofenceUpdate;
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          isOneToOne?: boolean;
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      notifications_log: {
        Row: NotificationLog;
        Insert: NotificationLogInsert;
        Update: NotificationLogUpdate;
        Relationships: any[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ── Profiles ──────────────────────────────────────────
export interface Profile {
  id: string;
  name: string;
  email: string;
  profile_photo: string | null;
  fcm_token: string | null;
  emergency_mode: boolean;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  name: string;
  email: string;
  profile_photo?: string | null;
  fcm_token?: string | null;
  emergency_mode?: boolean;
  notification_preferences?: NotificationPreferences;
}

export interface ProfileUpdate {
  name?: string;
  email?: string;
  profile_photo?: string | null;
  fcm_token?: string | null;
  emergency_mode?: boolean;
  notification_preferences?: NotificationPreferences;
  updated_at?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  frequency: 'low' | 'normal' | 'high';
  movement_alerts: boolean;
  battery_alerts: boolean;
  emergency_alerts: boolean;
}

// ── Tracking Sessions ────────────────────────────────
export interface TrackingSession {
  id: string;
  owner_id: string;
  share_token: string;
  is_active: boolean;
  is_emergency: boolean;
  duration_minutes: number;
  expires_at: string | null;
  created_at: string;
  stopped_at: string | null;
}

export interface TrackingSessionInsert {
  owner_id: string;
  share_token: string;
  is_active?: boolean;
  is_emergency?: boolean;
  duration_minutes?: number;
  expires_at?: string | null;
}

export interface TrackingSessionUpdate {
  is_active?: boolean;
  is_emergency?: boolean;
  duration_minutes?: number;
  expires_at?: string | null;
  stopped_at?: string | null;
}

// ── Location Updates ─────────────────────────────────
export interface LocationUpdate {
  id: number;
  session_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  battery_level: number | null;
  activity_type: ActivityType | null;
  created_at: string;
}

export interface LocationUpdateInsert {
  session_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  battery_level?: number | null;
  activity_type?: ActivityType | null;
}

export type ActivityType = 'moving' | 'walking' | 'stationary' | 'running' | 'in_vehicle';

// ── Session Viewers ──────────────────────────────────
export interface SessionViewer {
  id: string;
  session_id: string;
  viewer_name: string;
  viewer_token: string;
  joined_at: string;
  last_seen_at: string;
  is_active: boolean;
}

export interface SessionViewerInsert {
  session_id: string;
  viewer_name: string;
  viewer_token: string;
}

export interface SessionViewerUpdate {
  last_seen_at?: string;
  is_active?: boolean;
}

// ── Broadcast Messages ───────────────────────────────
export interface BroadcastMessage {
  id: string;
  session_id: string;
  sender_id: string;
  message: string;
  message_type: MessageType;
  include_location: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface BroadcastMessageInsert {
  session_id: string;
  sender_id: string;
  message: string;
  message_type?: MessageType;
  include_location?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export type MessageType =
  | 'custom'
  | 'reached_safely'
  | 'battery_low'
  | 'need_help'
  | 'running_late';

// ── Emergency Contacts ───────────────────────────────
export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface EmergencyContactInsert {
  user_id: string;
  name: string;
  phone: string;
  email?: string | null;
  is_primary?: boolean;
}

export interface EmergencyContactUpdate {
  name?: string;
  phone?: string;
  email?: string | null;
  is_primary?: boolean;
}

// ── Geofences ────────────────────────────────────────
export interface Geofence {
  id: string;
  user_id: string;
  session_id: string | null;
  label: string;
  radius_meters: number;
  center_latitude: number;
  center_longitude: number;
  notify_on_enter: boolean;
  notify_on_exit: boolean;
  is_active: boolean;
  created_at: string;
}

export interface GeofenceInsert {
  user_id: string;
  session_id?: string | null;
  label: string;
  radius_meters?: number;
  center_latitude: number;
  center_longitude: number;
  notify_on_enter?: boolean;
  notify_on_exit?: boolean;
}

export interface GeofenceUpdate {
  label?: string;
  radius_meters?: number;
  notify_on_enter?: boolean;
  notify_on_exit?: boolean;
  is_active?: boolean;
}

// ── Notifications Log ────────────────────────────────
export interface NotificationLog {
  id: string;
  recipient_id: string | null;
  session_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  sent_at: string;
  delivered: boolean;
}

export interface NotificationLogInsert {
  recipient_id?: string | null;
  session_id?: string | null;
  type: NotificationType;
  title: string;
  body: string;
}

export interface NotificationLogUpdate {
  delivered?: boolean;
}

export type NotificationType =
  | 'location_update'
  | 'emergency'
  | 'battery_low'
  | 'geofence_enter'
  | 'geofence_exit'
  | 'safe_arrival'
  | 'dead_man_switch'
  | 'viewer_joined'
  | 'broadcast_message';
