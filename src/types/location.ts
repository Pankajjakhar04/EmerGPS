// Location-related types used across the app

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPoint extends Coordinates {
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  altitude: number | null;
  timestamp: number;
}

export interface TrackingState {
  isTracking: boolean;
  isEmergency: boolean;
  sessionId: string | null;
  shareToken: string | null;
  currentLocation: LocationPoint | null;
  batteryLevel: number | null;
  activityType: 'moving' | 'walking' | 'stationary' | 'running' | 'in_vehicle' | null;
  lastUpdateTime: number | null;
  viewerCount: number;
}

export interface ViewerLocationData {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  battery_level: number | null;
  activity_type: string | null;
  is_emergency: boolean;
  updated_at: string;
}

export interface ShareLinkData {
  shareToken: string;
  sessionId: string;
  deepLink: string;
  webLink: string;
  expiresAt: string | null;
  isEmergency: boolean;
}

export interface GeofenceRegion {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
}
