// Login Screen — email OTP entry
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import type { AuthScreenProps } from '@/types/navigation';

export default function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');

  const handleSignIn = useCallback(async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    const { error } = await signIn(trimmedEmail);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      navigation.navigate('VerifyOTP', { email: trimmedEmail });
    }
  }, [email, signIn, navigation]);

  return (
    <View className="flex-1 bg-dark-900">
      <StatusBar barStyle="light-content" backgroundColor="#101113" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-8"
      >
        {/* Logo & Title */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 rounded-3xl bg-emergency-600 items-center justify-center mb-6 shadow-lg">
            <Text className="text-white text-4xl font-bold">📍</Text>
          </View>
          <Text className="text-white text-4xl font-bold tracking-tight">
            EmerGPS
          </Text>
          <Text className="text-dark-100 text-base mt-2 text-center">
            Emergency GPS tracking{'\n'}when it matters most
          </Text>
        </View>

        {/* Email Input */}
        <View className="mb-6">
          <Text className="text-dark-50 text-sm font-semibold mb-2 uppercase tracking-wider">
            Email Address
          </Text>
          <TextInput
            className="bg-dark-600 text-white text-lg px-5 py-4 rounded-2xl border border-dark-400"
            placeholder="you@example.com"
            placeholderTextColor="#5C5F66"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
          />
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center justify-center ${
            isLoading ? 'bg-tracking-800' : 'bg-tracking-600'
          }`}
          onPress={handleSignIn}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white text-lg font-bold">
              Continue with Email
            </Text>
          )}
        </TouchableOpacity>

        {/* Subtitle */}
        <Text className="text-dark-200 text-xs text-center mt-6">
          We'll send you a verification code.{'\n'}No password needed.
        </Text>

        {/* Register Link */}
        <TouchableOpacity
          className="mt-8 items-center"
          onPress={() => navigation.navigate('Register', {})}
        >
          <Text className="text-tracking-400 text-sm">
            First time? <Text className="font-bold">Create Account</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}
