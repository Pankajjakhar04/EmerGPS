// MMKV-based local storage service for fast cached data
import { createMMKV } from 'react-native-mmkv';

let storage: ReturnType<typeof createMMKV> | null = null;

function getStorage() {
  if (!storage) {
    storage = createMMKV({ id: 'emergps-cache' });
  }
  return storage;
}

export const StorageService = {
  // ── String ──────────────────────────────────────
  getString(key: string): string | undefined {
    return getStorage().getString(key);
  },

  setString(key: string, value: string): void {
    getStorage().set(key, value);
  },

  // ── Number ──────────────────────────────────────
  getNumber(key: string): number | undefined {
    return getStorage().getNumber(key);
  },

  setNumber(key: string, value: number): void {
    getStorage().set(key, value);
  },

  // ── Boolean ─────────────────────────────────────
  getBoolean(key: string): boolean | undefined {
    return getStorage().getBoolean(key);
  },

  setBoolean(key: string, value: boolean): void {
    getStorage().set(key, value);
  },

  // ── JSON ────────────────────────────────────────
  getJSON<T>(key: string): T | undefined {
    const raw = getStorage().getString(key);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },

  setJSON<T>(key: string, value: T): void {
    getStorage().set(key, JSON.stringify(value));
  },

  // ── Delete / Clear ──────────────────────────────
  delete(key: string): void {
    getStorage().remove(key);
  },

  clearAll(): void {
    getStorage().clearAll();
  },

  has(key: string): boolean {
    return getStorage().contains(key);
  },

  getAllKeys(): string[] {
    return getStorage().getAllKeys();
  },
};

// Storage keys
export const STORAGE_KEYS = {
  // Auth
  USER_PROFILE: 'user_profile',
  AUTH_SESSION: 'auth_session',

  // Tracking
  ACTIVE_SESSION_ID: 'active_session_id',
  CACHED_LOCATIONS: 'cached_locations',
  LAST_KNOWN_LOCATION: 'last_known_location',

  // Settings
  THEME_MODE: 'theme_mode',
  NOTIFICATION_PREFS: 'notification_prefs',
  DEAD_MAN_SWITCH_MINUTES: 'dead_man_switch_minutes',

  // Emergency
  EMERGENCY_CONTACTS: 'emergency_contacts',
  EMERGENCY_MODE_ACTIVE: 'emergency_mode_active',

  // Onboarding
  HAS_COMPLETED_ONBOARDING: 'has_completed_onboarding',
  HAS_GRANTED_LOCATION_PERMISSION: 'has_granted_location_permission',
} as const;

export default StorageService;
