// Navigation type definitions
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// ── Auth Stack ───────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: { email?: string };
  VerifyOTP: { email: string };
};

// ── Main Tab Navigator ───────────────────────────────
export type MainTabParamList = {
  Home: undefined;
  Tracking: NavigatorScreenParams<TrackingStackParamList>;
  Settings: undefined;
};

// ── Tracking Stack ───────────────────────────────────
export type TrackingStackParamList = {
  TrackingHome: undefined;
  LiveTracking: { sessionId?: string };
  ViewerScreen: { shareToken: string; viewerName?: string };
  ViewerEntry: { shareToken: string };
  StaticShare: undefined;
  GeofenceSetup: { sessionId: string };
  BroadcastMessage: { sessionId: string };
};

// ── Root Stack (combines Auth + Main) ────────────────
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  // Modal screens accessible from anywhere
  EmergencyActive: { sessionId: string };
  NotificationSettings: undefined;
  Profile: undefined;
  EmergencyContacts: undefined;
};

// ── Screen Props ─────────────────────────────────────
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type TrackingScreenProps<T extends keyof TrackingStackParamList> =
  NativeStackScreenProps<TrackingStackParamList, T>;

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

// ── Declare for useNavigation type safety ────────────
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
