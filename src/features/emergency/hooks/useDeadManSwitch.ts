// Dead Man Switch — auto-activate HELP if user is inactive
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface DeadManSwitchConfig {
  enabled: boolean;
  timeoutMinutes: number;
  onTriggered: () => void;
}

export function useDeadManSwitch(config: DeadManSwitchConfig) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const { enabled, timeoutMinutes, onTriggered } = config;

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!enabled) return;

    timerRef.current = setTimeout(() => {
      // User has been inactive for configured duration
      onTriggered();
    }, timeoutMinutes * 60 * 1000);
  }, [enabled, onTriggered, timeoutMinutes]);

  // Reset on user interaction
  const reportActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Monitor app state changes
  useEffect(() => {
    if (!enabled) return;

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // App came to foreground — check if timeout elapsed
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= timeoutMinutes * 60 * 1000) {
          onTriggered();
        } else {
          resetTimer();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    resetTimer();

    return () => {
      subscription.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, onTriggered, resetTimer, timeoutMinutes]);

  return {
    reportActivity,
    resetTimer,
  };
}

export default useDeadManSwitch;
