// Auth hook — manages authentication flow
import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { AuthService } from '../services/authService';
import StorageService, { STORAGE_KEYS } from '@/services/storageService';
import type { Profile } from '@/types/database';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const setProfile = useAuthStore((state) => state.setProfile);
  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);
  const logout = useAuthStore((state) => state.logout);

  // Initialize auth state on mount
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);

      // ── Step 1: Instantly load cached profile from MMKV ─────────────
      // This is synchronous and shows the right screen in <100ms
      const cachedProfile = StorageService.getJSON<Profile>(STORAGE_KEYS.USER_PROFILE);
      if (cachedProfile) {
        setProfile(cachedProfile);
        // Optimistically mark as authenticated from cache
        setUser({ id: cachedProfile.id, email: cachedProfile.email } as any);
        setLoading(false); // Show UI immediately
      }

      // ── Step 2: Validate session with Supabase in background ─────────
      // If server says session is expired, we log the user out quietly
      const { data } = await AuthService.getSession();

      if (data.session) {
        setSession(data.session);
        // Refresh profile from server silently
        const serverProfile = await AuthService.getProfile(data.session.user.id);
        if (serverProfile) {
          setProfile(serverProfile);
          StorageService.setJSON(STORAGE_KEYS.USER_PROFILE, serverProfile);
        }
      } else {
        // Server says no valid session — clear stale cache and log out
        StorageService.delete(STORAGE_KEYS.USER_PROFILE);
        logout();
      }
    } catch (error) {
      if (__DEV__) console.warn('[Auth] Init error:', error);
      // On network error, keep cached state — don't log user out
    } finally {
      setLoading(false);
    }
  }, [setLoading, setProfile, setSession, setUser, logout]);

  useEffect(() => {
    initializeAuth();

    // Listen for auth state changes
    const { unsubscribe } = AuthService.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          const profile = await AuthService.getProfile(session.user.id);
          setProfile(profile);
          if (profile) {
            StorageService.setJSON(STORAGE_KEYS.USER_PROFILE, profile);
          }
        } else {
          setProfile(null);
          StorageService.delete(STORAGE_KEYS.USER_PROFILE);
        }

        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [initializeAuth, setLoading, setProfile, setSession]);

  const signIn = useCallback(async (email: string) => {
    setLoading(true);
    const result = await AuthService.signInWithOTP(email);
    setLoading(false);
    return result;
  }, [setLoading]);

  const verifyOTP = useCallback(async (email: string, code: string) => {
    setLoading(true);
    const result = await AuthService.verifyOTP(email, code);
    setLoading(false);
    return result;
  }, [setLoading]);

  const register = useCallback(
    async (name: string, email: string) => {
      if (!user) return;

      const profile = await AuthService.createProfile({
        id: user.id,
        name,
        email,
      });
      setProfile(profile);
      if (profile) {
        StorageService.setJSON(STORAGE_KEYS.USER_PROFILE, profile);
      }
    },
    [user, setProfile],
  );

  const signOut = useCallback(async () => {
    try {
      await AuthService.signOut();
    } catch {
      // Even if signOut fails, clear local state
    }
    // Clear all local cached data
    StorageService.delete(STORAGE_KEYS.USER_PROFILE);
    StorageService.delete(STORAGE_KEYS.AUTH_SESSION);
    StorageService.delete(STORAGE_KEYS.ACTIVE_SESSION_ID);
    // Force logout in store immediately (don't wait for onAuthStateChange)
    logout();
  }, [logout]);

  const updateProfile = useCallback(
    async (updates: Partial<{ name: string; email: string; profile_photo: string }>) => {
      if (!user) return;
      const updated = await AuthService.updateProfile(user.id, updates);
      if (updated) {
        setProfile(updated);
        StorageService.setJSON(STORAGE_KEYS.USER_PROFILE, updated);
      }
    },
    [user, setProfile],
  );

  return {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    signIn,
    verifyOTP,
    register,
    signOut,
    updateProfile,
  };
}

export default useAuth;
