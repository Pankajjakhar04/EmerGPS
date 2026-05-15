// Settings screen
import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useEmergencyStore } from '@/features/emergency/store/emergencyStore';

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const emergency = useEmergencyStore();

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }, [signOut]);

  return (
    <View className="flex-1 bg-dark-900">
      <StatusBar barStyle="light-content" backgroundColor="#101113" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-20"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-14 pb-6">
          <Text className="text-white text-3xl font-bold">Settings</Text>
        </View>

        {/* Profile Card */}
        <View className="mx-6 bg-dark-600 rounded-2xl p-5 border border-dark-400 mb-6">
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-full bg-tracking-600 items-center justify-center mr-4">
              <Text className="text-white text-xl font-bold">
                {profile?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">
                {profile?.name ?? 'User'}
              </Text>
              <Text className="text-dark-100 text-sm">
                {profile?.email ?? ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Safety Settings */}
        <View className="px-6 mb-6">
          <Text className="text-dark-50 text-xs font-semibold uppercase tracking-wider mb-3">
            Safety Features
          </Text>

          <View className="bg-dark-600 rounded-2xl border border-dark-400 overflow-hidden">
            {/* Dead Man Switch */}
            <View className="flex-row items-center justify-between p-4 border-b border-dark-400">
              <View className="flex-1 mr-4">
                <Text className="text-white text-base font-semibold">
                  Dead Man Switch
                </Text>
                <Text className="text-dark-200 text-xs mt-1">
                  Auto-activate HELP if inactive for{' '}
                  {emergency.deadManSwitchMinutes} min
                </Text>
              </View>
              <Switch
                value={emergency.deadManSwitchEnabled}
                onValueChange={emergency.setDeadManSwitch}
                trackColor={{ false: '#373A40', true: '#339AF0' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Notifications */}
            <View className="flex-row items-center justify-between p-4 border-b border-dark-400">
              <View className="flex-1 mr-4">
                <Text className="text-white text-base font-semibold">
                  Emergency Notifications
                </Text>
                <Text className="text-dark-200 text-xs mt-1">
                  High-priority alerts with vibration
                </Text>
              </View>
              <Switch
                value={true}
                trackColor={{ false: '#373A40', true: '#FA5252' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Battery Alerts */}
            <View className="flex-row items-center justify-between p-4">
              <View className="flex-1 mr-4">
                <Text className="text-white text-base font-semibold">
                  Low Battery Alerts
                </Text>
                <Text className="text-dark-200 text-xs mt-1">
                  Notify viewers when battery is low
                </Text>
              </View>
              <Switch
                value={true}
                trackColor={{ false: '#373A40', true: '#FCC419' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Tracking Settings */}
        <View className="px-6 mb-6">
          <Text className="text-dark-50 text-xs font-semibold uppercase tracking-wider mb-3">
            Tracking
          </Text>

          <View className="bg-dark-600 rounded-2xl border border-dark-400 overflow-hidden">
            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-dark-400">
              <Text className="text-white text-base font-semibold">
                Default Duration
              </Text>
              <Text className="text-tracking-400 text-sm">8 hours</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-dark-400">
              <Text className="text-white text-base font-semibold">
                Emergency Contacts
              </Text>
              <Text className="text-dark-200 text-sm">→</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-row items-center justify-between p-4">
              <Text className="text-white text-base font-semibold">
                Geofence Zones
              </Text>
              <Text className="text-dark-200 text-sm">→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View className="px-6 mb-6">
          <Text className="text-dark-50 text-xs font-semibold uppercase tracking-wider mb-3">
            App
          </Text>

          <View className="bg-dark-600 rounded-2xl border border-dark-400 overflow-hidden">
            <View className="flex-row items-center justify-between p-4 border-b border-dark-400">
              <Text className="text-white text-base">Version</Text>
              <Text className="text-dark-200 text-sm">1.0.0</Text>
            </View>

            <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-dark-400">
              <Text className="text-white text-base">Privacy Policy</Text>
              <Text className="text-dark-200 text-sm">→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-4"
              onPress={handleSignOut}
            >
              <Text className="text-emergency-400 text-base font-semibold text-center">
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
