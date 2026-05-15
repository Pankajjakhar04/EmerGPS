// Main Tab Navigator — Home, Tracking, Settings
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import HomeScreen from '@/features/tracking/screens/HomeScreen';
import SettingsScreen from '@/features/settings/screens/SettingsScreen';
import { COLORS } from '@/config/constants';
import type { MainTabParamList, TrackingStackParamList } from '@/types/navigation';

// ── Tracking Stack ──────────────────────────────────
const TrackingStack = createNativeStackNavigator<TrackingStackParamList>();

// Placeholder screens for tracking stack
function TrackingHomeScreen() {
  return (
    <View className="flex-1 bg-dark-900 items-center justify-center">
      <Text className="text-white text-xl font-bold">Live Map</Text>
      <Text className="text-dark-100 text-sm mt-2">
        MapLibre integration coming here
      </Text>
    </View>
  );
}

function TrackingNavigator() {
  return (
    <TrackingStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#101113' },
      }}
    >
      <TrackingStack.Screen name="TrackingHome" component={TrackingHomeScreen} />
    </TrackingStack.Navigator>
  );
}

// ── Tab Navigator ───────────────────────────────────
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Tracking: '📍',
    Settings: '⚙️',
  };

  return (
    <View className="items-center justify-center py-1">
      <Text className="text-xl">{icons[name] ?? '•'}</Text>
      <Text
        className={`text-xs mt-1 ${
          focused ? 'text-tracking-400 font-bold' : 'text-dark-200'
        }`}
      >
        {name}
      </Text>
    </View>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.dark.surface,
          borderTopColor: COLORS.dark.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tracking" component={TrackingNavigator} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
