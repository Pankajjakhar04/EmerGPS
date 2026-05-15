// Tracking Zustand store
import { create } from 'zustand';
import type { TrackingState } from '@/types/location';
import type { SessionViewer, TrackingSession } from '@/types/database';

interface TrackingStoreState extends TrackingState {
  // Session data
  activeSession: TrackingSession | null;
  viewers: SessionViewer[];

  // Duration settings
  durationMinutes: number;

  // Actions
  setTracking: (isTracking: boolean) => void;
  setEmergency: (isEmergency: boolean) => void;
  setSessionId: (sessionId: string | null) => void;
  setShareToken: (shareToken: string | null) => void;
  setCurrentLocation: (location: TrackingState['currentLocation']) => void;
  setBatteryLevel: (level: number | null) => void;
  setActivityType: (type: TrackingState['activityType']) => void;
  setLastUpdateTime: (time: number | null) => void;
  setViewerCount: (count: number) => void;
  setActiveSession: (session: TrackingSession | null) => void;
  setViewers: (viewers: SessionViewer[]) => void;
  addViewer: (viewer: SessionViewer) => void;
  removeViewer: (viewerId: string) => void;
  setDurationMinutes: (minutes: number) => void;
  resetTracking: () => void;
}

const initialState: TrackingState = {
  isTracking: false,
  isEmergency: false,
  sessionId: null,
  shareToken: null,
  currentLocation: null,
  batteryLevel: null,
  activityType: null,
  lastUpdateTime: null,
  viewerCount: 0,
};

export const useTrackingStore = create<TrackingStoreState>((set) => ({
  ...initialState,
  activeSession: null,
  viewers: [],
  durationMinutes: 480, // 8 hours default

  setTracking: (isTracking) => set({ isTracking }),
  setEmergency: (isEmergency) => set({ isEmergency }),
  setSessionId: (sessionId) => set({ sessionId }),
  setShareToken: (shareToken) => set({ shareToken }),
  setCurrentLocation: (currentLocation) =>
    set({ currentLocation, lastUpdateTime: Date.now() }),
  setBatteryLevel: (batteryLevel) => set({ batteryLevel }),
  setActivityType: (activityType) => set({ activityType }),
  setLastUpdateTime: (lastUpdateTime) => set({ lastUpdateTime }),
  setViewerCount: (viewerCount) => set({ viewerCount }),
  setActiveSession: (activeSession) => set({ activeSession }),
  setViewers: (viewers) => set({ viewers, viewerCount: viewers.length }),
  addViewer: (viewer) =>
    set((state) => ({
      viewers: [...state.viewers, viewer],
      viewerCount: state.viewers.length + 1,
    })),
  removeViewer: (viewerId) =>
    set((state) => ({
      viewers: state.viewers.filter((v) => v.id !== viewerId),
      viewerCount: Math.max(0, state.viewers.length - 1),
    })),
  setDurationMinutes: (durationMinutes) => set({ durationMinutes }),
  resetTracking: () =>
    set({
      ...initialState,
      activeSession: null,
      viewers: [],
    }),
}));

export default useTrackingStore;
