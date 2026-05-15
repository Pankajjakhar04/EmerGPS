// Battery monitoring hook
import { useEffect, useCallback, useRef } from 'react';
import DeviceInfo from 'react-native-device-info';
import { BATTERY_LOW_LEVEL, BATTERY_CRITICAL_LEVEL } from '@/config/constants';

interface BatteryState {
  level: number | null;
  isCharging: boolean;
  isLow: boolean;
  isCritical: boolean;
}

export function useBattery(pollIntervalMs: number = 60000) {
  const [batteryState, setBatteryState] = React.useState<BatteryState>({
    level: null,
    isCharging: false,
    isLow: false,
    isCritical: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkBattery = useCallback(async () => {
    try {
      const level = await DeviceInfo.getBatteryLevel();
      const isCharging = await DeviceInfo.isBatteryCharging();

      setBatteryState({
        level,
        isCharging,
        isLow: level <= BATTERY_LOW_LEVEL,
        isCritical: level <= BATTERY_CRITICAL_LEVEL,
      });
    } catch (error) {
      if (__DEV__) console.warn('[Battery] Error:', error);
    }
  }, []);

  useEffect(() => {
    checkBattery();
    intervalRef.current = setInterval(checkBattery, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkBattery, pollIntervalMs]);

  return batteryState;
}

// Need to import React for useState
import React from 'react';

export default useBattery;
