import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import type { RootStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();
  useAuth(); // Initialize auth state and listen to changes

  // Safety fallback — prevents infinite loading if Supabase is slow/offline
  useEffect(() => {
    const timer = setTimeout(() => {
      useAuthStore.getState().setLoading(false);
    }, 3000); // 3 seconds max loading
    return () => clearTimeout(timer);
  }, []); // Only runs once on mount

  // Branded loading splash while auth state is being restored from MMKV
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#101113', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#E03131', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 36 }}>📍</Text>
        </View>
        <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>EmerGPS</Text>
        <Text style={{ color: '#909296', fontSize: 14, marginBottom: 32 }}>Emergency GPS Tracking</Text>
        <ActivityIndicator size="large" color="#339AF0" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#101113' },
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
