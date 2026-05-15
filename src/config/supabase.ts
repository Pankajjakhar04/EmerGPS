import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { createMMKV } from 'react-native-mmkv';
import ENV from './env';

// Lazy load MMKV to prevent HostFunction NullPointerException on startup
let storage: ReturnType<typeof createMMKV> | null = null;

function getStorage() {
  if (!storage) {
    storage = createMMKV({ id: 'supabase-auth' });
  }
  return storage;
}

// MMKV adapter for Supabase auth
const MMKVStorageAdapter = {
  getItem: (key: string): string | null => {
    return getStorage().getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    getStorage().set(key, value);
  },
  removeItem: (key: string): void => {
    getStorage().remove(key);
  },
};

export const supabase = createClient<any>(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: MMKVStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Critical for React Native
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Rate limit realtime events
      },
    },
  },
);

export default supabase;
