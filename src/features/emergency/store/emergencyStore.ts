// Emergency store
import { create } from 'zustand';

interface EmergencyState {
  isEmergencyMode: boolean;
  deadManSwitchEnabled: boolean;
  deadManSwitchMinutes: number;

  setEmergencyMode: (active: boolean) => void;
  setDeadManSwitch: (enabled: boolean) => void;
  setDeadManSwitchMinutes: (minutes: number) => void;
}

export const useEmergencyStore = create<EmergencyState>((set) => ({
  isEmergencyMode: false,
  deadManSwitchEnabled: false,
  deadManSwitchMinutes: 30,

  setEmergencyMode: (isEmergencyMode) => set({ isEmergencyMode }),
  setDeadManSwitch: (deadManSwitchEnabled) => set({ deadManSwitchEnabled }),
  setDeadManSwitchMinutes: (deadManSwitchMinutes) =>
    set({ deadManSwitchMinutes }),
}));

export default useEmergencyStore;
