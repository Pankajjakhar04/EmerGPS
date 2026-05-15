// App-wide constants for EmerGPS
export const APP_NAME = 'EmerGPS';
export const APP_SCHEME = 'emergps';
export const APP_VERSION = '1.0.0';

// Tracking defaults
export const DEFAULT_TRACKING_DURATION_MINUTES = 480; // 8 hours
export const SHARE_TOKEN_LENGTH = 32;

// Adaptive GPS intervals (milliseconds)
export const GPS_INTERVAL = {
  MOVING_FAST: 5000,    // 5 sec when moving fast
  WALKING: 8000,        // 8 sec when walking
  STATIONARY: 25000,    // 25 sec when stationary
} as const;

// Distance filter (meters) — minimum movement to trigger update
export const DISTANCE_FILTER = {
  MOVING: 10,
  WALKING: 15,
  STATIONARY: 50,
} as const;

// Battery thresholds
export const BATTERY_CRITICAL_LEVEL = 0.10; // 10%
export const BATTERY_LOW_LEVEL = 0.15;      // 15%
export const BATTERY_WARNING_LEVEL = 0.25;  // 25%

// Dead Man Switch defaults (minutes)
export const DEAD_MAN_SWITCH_DEFAULT_MINUTES = 30;

// Map defaults
export const DEFAULT_MAP_CENTER = {
  latitude: 28.6139,   // New Delhi default
  longitude: 77.2090,
};
export const DEFAULT_MAP_ZOOM = 14;

// Notification channels (Android)
export const NOTIFICATION_CHANNELS = {
  EMERGENCY: 'emergency_alerts',
  TRACKING: 'tracking_updates',
  GENERAL: 'general_notifications',
} as const;

// Emergency message template
export const EMERGENCY_MESSAGE_TEMPLATE = (link: string) =>
  `🚨 EMERGENCY — I am in Trouble. Please Help!\n\nMy live location: ${link}\n\nSent via EmerGPS`;

// Predefined broadcast messages
export const QUICK_MESSAGES = [
  { id: 'reached_safely', label: '✅ Reached safely', type: 'reached_safely' as const },
  { id: 'battery_low', label: '🔋 Battery low', type: 'battery_low' as const },
  { id: 'need_help', label: '🆘 Need urgent help', type: 'need_help' as const },
  { id: 'running_late', label: '⏰ Running late', type: 'running_late' as const },
] as const;

// Session expiry check interval
export const SESSION_CLEANUP_INTERVAL_MS = 60000; // 1 minute

// Geofence defaults
export const DEFAULT_GEOFENCE_RADIUS_METERS = 200;

// Colors
export const COLORS = {
  emergency: '#FA5252',
  emergencyDark: '#C92A2A',
  tracking: '#339AF0',
  trackingDark: '#1864AB',
  safe: '#51CF66',
  safeDark: '#2B8A3E',
  warning: '#FCC419',
  warningDark: '#E67700',
  dark: {
    bg: '#101113',
    surface: '#1A1B1E',
    card: '#25262B',
    border: '#373A40',
    text: '#C1C2C5',
    textPrimary: '#FFFFFF',
  },
  light: {
    bg: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',
    border: '#DEE2E6',
    text: '#495057',
    textPrimary: '#212529',
  },
} as const;
