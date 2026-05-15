// Auth service — wraps Supabase auth operations
import { supabase } from '@/config/supabase';
import type { Profile, ProfileInsert } from '@/types/database';

export const AuthService = {
  /**
   * Send OTP to email for passwordless login
   */
  async signInWithOTP(email: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // No emailRedirectTo — forces Supabase to send a 6-digit OTP code
        // instead of a magic link
      },
    });
    return { error: error ? new Error(error.message) : null };
  },

  /**
   * Verify OTP code entered by user
   */
  async verifyOTP(
    email: string,
    token: string,
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error: error ? new Error(error.message) : null };
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  /**
   * Get or create user profile after authentication
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (__DEV__) console.warn('[Auth] getProfile error:', error.message);
      return null;
    }
    return data as Profile;
  },

  /**
   * Create user profile on first registration
   */
  async createProfile(profile: ProfileInsert): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      if (__DEV__) console.warn('[Auth] createProfile error:', error.message);
      return null;
    }
    return data as Profile;
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<Profile>,
  ): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (__DEV__) console.warn('[Auth] updateProfile error:', error.message);
      return null;
    }
    return data as Profile;
  },

  /**
   * Update FCM token in profile
   */
  async updateFCMToken(userId: string, fcmToken: string): Promise<void> {
    await supabase
      .from('profiles')
      .update({ fcm_token: fcmToken, updated_at: new Date().toISOString() })
      .eq('id', userId);
  },

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(
    callback: (event: string, session: any) => void,
  ): { unsubscribe: () => void } {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return { unsubscribe: () => data.subscription.unsubscribe() };
  },

  /**
   * Get current session
   */
  async getSession() {
    return supabase.auth.getSession();
  },
};

export default AuthService;
