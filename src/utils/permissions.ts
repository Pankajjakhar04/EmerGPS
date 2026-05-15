// Permission utilities for React Native
import { Platform, Alert, Linking } from 'react-native';

/**
 * Show a dialog explaining why a permission is needed,
 * with an option to open settings
 */
export function showPermissionDeniedAlert(
  permissionName: string,
  reason: string,
): void {
  Alert.alert(
    `${permissionName} Permission Required`,
    `${reason}\n\nPlease enable it in your device settings.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        },
      },
    ],
  );
}

/**
 * Check if we should show rationale for a permission (Android only)
 */
export function shouldShowRationale(_permission: string): boolean {
  // This is typically handled by the permissions library
  // Placeholder for integration with react-native-permissions
  return true;
}
